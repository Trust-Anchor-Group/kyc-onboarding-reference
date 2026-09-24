"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { canAccessVerificationStep, getEarliestUnlockedStep } from './stepperLocks'
import { useAgentAPI } from './AgentAPIProvider'
import {
  AGENT_CONTENT,
  AgentKycPersistence,
  AgentKycSaveQueue,
  EPHEMERAL_PRE_AGENT,
  RESTORE_RESULT,
  createAgentApplication,
} from '../lib/agentKycPersistence.mjs'
import { AgentKycDocuments, canPersistDocuments, sanitizeDocumentDescriptor, shouldUseAgentDocuments } from '../lib/agentKycDocuments.mjs'
import {
  ACCOUNT_CREATED_DISABLED,
  ACCOUNT_ENABLED,
  PRE_ACCOUNT,
  canProbeAccountInfo,
  verificationStateFor,
} from '../lib/accountVerificationState.mjs'
import { createKycWriterCoordinator } from '../lib/kycWriterCoordinator.mjs'
import { getUxAcceptanceScenario } from '../lib/uxAcceptanceHarness.mjs'
import { passwordDigestForAccount } from '../lib/agentAccountCredentials.mjs'
import { content, useLanguage } from './LanguageContext'
import {
  PENDING_HINT_KEY,
  accountVerificationFromInfo,
  createPendingHint,
  parsePendingHint,
  pendingStepFromVerification,
} from '../lib/pendingAccountRecovery.mjs'

const TOTAL_STEPS = 18
const INITIAL_PERSISTENCE_MODE = EPHEMERAL_PRE_AGENT
const AGENT_PERSISTENCE_ENABLED = true
const clampStepIndex = (value) => Math.max(0, Math.min(value, TOTAL_STEPS - 1))

const initialFormData = {
  fullName: '',
  documentNumber: '',
  email: '',
  phone: '',
  birthDate: '',
  documentType: '',
  addressStreet: '',
  addressZip: '',
  addressCity: '',
  addressCountry: '',
  agreedToTerms: false,
  phoneVerified: false,
  emailVerified: false,
  legalId: '',
}

const StepperContext = createContext(null)

export const StepperProvider = ({ children }) => {
  const { language } = useLanguage()
  const chrome = content[language].access.chrome
  const pathname = usePathname()
  const AgentAPI = useAgentAPI()
  useEffect(() => {
    sessionStorage.removeItem('kycPassword')
    sessionStorage.removeItem('kycSessionData')
    sessionStorage.removeItem('kycDocuments')
  }, [])
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState(initialFormData)

  const [sessionData, setSessionData] = useState(null)
  const [documents, setDocuments] = useState({ backPhoto: null, frontPhoto: null, selfie: null })
  const [password, setPassword] = useState('')

  const [hydrated, setHydrated] = useState(false)
  const [restored, setRestored] = useState(false)
  const [restoreStatus, setRestoreStatus] = useState(RESTORE_RESULT.LOADING)

  const [accountDetectedVisible, setAccountDetectedVisible] = useState(false)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [stepRetryCounters, setStepRetryCounters] = useState({})
  const [syncStatus, setSyncStatus] = useState('idle')
  const [persistenceMode, setPersistenceMode] = useState(INITIAL_PERSISTENCE_MODE)
  const [vaultApplication, setVaultApplication] = useState(null)
  const [accountVerificationState, setAccountVerificationState] = useState(PRE_ACCOUNT)
  const [phoneVerificationRequired, setPhoneVerificationRequired] = useState(false)
  const [isWriter, setIsWriter] = useState(true)
  const [writerReason, setWriterReason] = useState('initializing')
  const [uxScenario, setUxScenario] = useState(null)
  const [documentRetakeReturnStep, setDocumentRetakeReturnStep] = useState(null)
  const prevStepRef = useRef(0)
  const syncResetRef = useRef(null)
  const localStepRef = useRef(0)
  const formRef = useRef(formData)
  const documentsRef = useRef(documents)
  const modeRef = useRef(INITIAL_PERSISTENCE_MODE)
  const vaultRef = useRef(null)
  const saveQueueRef = useRef(null)
  const bootstrapStartedRef = useRef(false)
  const cutoverPromiseRef = useRef(null)
  const persistenceSuspendedRef = useRef(false)
  const restoreStatusRef = useRef(RESTORE_RESULT.LOADING)
  const skipRestoredStepSyncRef = useRef(false)
  const skipRestoredFormSyncRef = useRef(false)
  const historyNavigationStepRef = useRef(null)

  const persistence = useMemo(() => new AgentKycPersistence(AgentAPI, {
    log: (event, details) => console.info(`[KYC] ${event}`, details),
  }), [AgentAPI])
  const agentDocuments = useMemo(() => new AgentKycDocuments(AgentAPI, persistence, {
    log: (event, details) => console.info(`[KYC] ${event}`, details),
  }), [AgentAPI, persistence])

  useEffect(() => { formRef.current = formData }, [formData])
  useEffect(() => { documentsRef.current = documents }, [documents])
  useEffect(() => { modeRef.current = persistenceMode }, [persistenceMode])
  useEffect(() => { vaultRef.current = vaultApplication }, [vaultApplication])
  useEffect(() => { restoreStatusRef.current = restoreStatus }, [restoreStatus])

  const markSaved = useCallback(() => {
    setSyncStatus('saved')
    if (syncResetRef.current) clearTimeout(syncResetRef.current)
    syncResetRef.current = setTimeout(() => setSyncStatus('idle'), 1400)
  }, [])

  const getSnapshot = useCallback((overrides = {}) => ({
    // Submission state is durable application state. Authentication capability
    // deliberately is not: it depends on memory-only credentials.
    state: overrides.state ?? vaultRef.current?.application?.state ?? 'FORM_IN_PROGRESS',
    currentStep: overrides.step ?? localStepRef.current,
    form: { ...formRef.current, ...(overrides.form || {}) },
    documents: documentsRef.current,
  }), [])

  const saveVaultSnapshot = useCallback(async (snapshot) => {
    const current = vaultRef.current
    if (!current?.vaultId || !current.application) throw new Error('VAULT_APPLICATION_UNAVAILABLE')
    setSyncStatus('saving')
    try {
      const application = await persistence.updateApplication(current.vaultId, current.application, snapshot)
      const next = { ...current, application }
      vaultRef.current = next
      setVaultApplication(next)
      markSaved()
      return next
    } catch (error) {
      setSyncStatus('offline')
      persistence.diagnostic('KYC_AGENT_SAVE_FAILED', {
        code: error?.code || 'VAULT_SAVE_FAILED',
      })
      throw error
    }
  }, [markSaved, persistence])

  useEffect(() => {
    saveQueueRef.current = new AgentKycSaveQueue(saveVaultSnapshot)
  }, [saveVaultSnapshot])

  const queueVaultSave = useCallback(async (overrides = {}) => {
    if (persistenceSuspendedRef.current || restoreStatusRef.current !== RESTORE_RESULT.FOUND || modeRef.current !== AGENT_CONTENT || !vaultRef.current || !isWriter) return false
    try {
      await saveQueueRef.current.enqueue(getSnapshot(overrides))
      return true
    } catch {
      return false
    }
  }, [getSnapshot, isWriter])

  const syncNow = useCallback(async (overrides = {}) => {
    if (persistenceSuspendedRef.current || !hydrated || !restored || !isWriter) return false
    if (modeRef.current === AGENT_CONTENT) {
      console.info('[KYC] KYC_AGENT_FORM_SAVE', { mode: AGENT_CONTENT })
      return queueVaultSave(overrides)
    }
    return false
  }, [hydrated, restored, isWriter, queueVaultSave])

  const applyVaultRestore = useCallback((restoredApplication) => {
    const { application } = restoredApplication
    // Applying durable state changes React state. Those changes are a restore,
    // not user edits, and must never write the restored record back.
    skipRestoredStepSyncRef.current = true
    skipRestoredFormSyncRef.current = true
    vaultRef.current = restoredApplication
    persistenceSuspendedRef.current = false
    restoreStatusRef.current = RESTORE_RESULT.FOUND
    setRestoreStatus(RESTORE_RESULT.FOUND)
    setVaultApplication(restoredApplication)
    modeRef.current = AGENT_CONTENT
    setPersistenceMode(AGENT_CONTENT)
    formRef.current = application.form
    setFormData({ ...initialFormData, ...application.form })
    documentsRef.current = { ...documentsRef.current, ...application.documents }
    setDocuments(documentsRef.current)
    localStepRef.current = application.currentStep
    setStep(application.currentStep)
    sessionStorage.setItem('kycPersistenceMode', AGENT_CONTENT)
    sessionStorage.setItem('kycApplicationId', application.applicationId)
    sessionStorage.setItem('kycVaultId', restoredApplication.vaultId)
    sessionStorage.setItem('kycStep', String(application.currentStep))
    sessionStorage.removeItem('kycFormData')
    console.info('[KYC] KYC_PERSISTENCE_MODE', {
      mode: AGENT_CONTENT,
      revision: application.revision,
      currentStep: application.currentStep,
    })
    return restoredApplication
  }, [])

  const recoverAgentApplication = useCallback(async () => {
    if (!AGENT_PERSISTENCE_ENABLED || !sessionStorage.getItem('AgentAPI.Token')) {
      return { status: RESTORE_RESULT.AUTH_REQUIRED }
    }
    const cachedVaultId = sessionStorage.getItem('kycVaultId')
    const cachedApplicationId = sessionStorage.getItem('kycApplicationId')
    if (cachedApplicationId) {
      const result = await persistence.restoreApplication(cachedApplicationId, cachedVaultId)
      if (result.status === RESTORE_RESULT.FOUND) {
        return { status: RESTORE_RESULT.FOUND, restored: applyVaultRestore(result.restored) }
      }
      return result
    }
    const result = await persistence.findActiveApplicationForRestore()
    if (result.status === RESTORE_RESULT.FOUND) {
      return { status: RESTORE_RESULT.FOUND, restored: applyVaultRestore(result.restored) }
    }
    return result
  }, [applyVaultRestore, persistence])

  const retryDurableRestore = useCallback(async () => {
    persistenceSuspendedRef.current = true
    restoreStatusRef.current = RESTORE_RESULT.LOADING
    setRestoreStatus(RESTORE_RESULT.LOADING)
    setRestored(false)
    const result = await recoverAgentApplication()
    if (result.status === RESTORE_RESULT.FOUND) {
      setRestored(true)
      return true
    }
    restoreStatusRef.current = result.status
    setRestoreStatus(result.status)
    setSyncStatus('offline')
    return false
  }, [recoverAgentApplication])

  const cutoverToAgentVault = useCallback(async (overrides = {}) => {
    if (!AGENT_PERSISTENCE_ENABLED) return false
    if (modeRef.current === AGENT_CONTENT) return queueVaultSave(overrides)
    if (![RESTORE_RESULT.NOT_FOUND, RESTORE_RESULT.FOUND].includes(restoreStatusRef.current)) return false
    if (!isWriter || !sessionStorage.getItem('AgentAPI.Token')) return false
    if (cutoverPromiseRef.current) return cutoverPromiseRef.current

    cutoverPromiseRef.current = (async () => {
      setSyncStatus('saving')
      try {
        const existing = await recoverAgentApplication()
        if (existing.status === RESTORE_RESULT.FOUND) {
          markSaved()
          return true
        }
        const verified = await createAgentApplication(persistence, getSnapshot(overrides))
        applyVaultRestore(verified)
        markSaved()
        return true
      } catch {
        setSyncStatus('offline')
        return false
      } finally {
        cutoverPromiseRef.current = null
      }
    })()
    return cutoverPromiseRef.current
  }, [applyVaultRestore, getSnapshot, isWriter, markSaved, persistence, queueVaultSave, recoverAgentApplication])

  const beginAccountVerification = useCallback(({ phoneRequired }) => {
    setPhoneVerificationRequired(Boolean(phoneRequired))
    setAccountVerificationState(ACCOUNT_CREATED_DISABLED)
    setAccountVerificationState(verificationStateFor({ phoneRequired: Boolean(phoneRequired) }))
  }, [])

  const updateAccountVerificationState = useCallback(({ emailVerified, phoneVerified, phoneRequired = phoneVerificationRequired }) => {
    const next = verificationStateFor({ emailVerified, phoneVerified, phoneRequired })
    setPhoneVerificationRequired(Boolean(phoneRequired))
    setAccountVerificationState(next)
    return next
  }, [phoneVerificationRequired])

  const applyPendingAccountInfo = useCallback((info) => {
    const verification = accountVerificationFromInfo(info)
    const target = pendingStepFromVerification(verification)
    const accountHandle = String(info?.userName ?? info?.UserName ?? '').trim()
    if (target < 3 && accountHandle) {
      localStorage.setItem(PENDING_HINT_KEY, JSON.stringify(createPendingHint({
        accountHandle,
        activeChannel: target === 1 ? 'phone' : 'email',
      })))
    }
    let recoveredContacts = {}
    try {
      const raw = sessionStorage.getItem('kycOtpRecovery')
      if (raw) recoveredContacts = JSON.parse(raw)
    } catch {}
    formRef.current = { ...initialFormData, ...recoveredContacts, phoneVerified: verification.phoneVerified, emailVerified: verification.emailVerified }
    setFormData(formRef.current)
    updateAccountVerificationState({ ...verification, phoneRequired: true })
    if (target < 3) {
      localStepRef.current = target
      setStep(target)
      setSyncStatus('ephemeral')
      return true
    }
    return false
  }, [updateAccountVerificationState])

  const resumePendingAccount = useCallback(async ({ accountHandle, password: enteredPassword }) => {
    const domain = process.env.NEXT_PUBLIC_AGENT_API_URL || ''
    const digest = passwordDigestForAccount(accountHandle, domain, enteredPassword)
    const session = await AgentAPI.Account.Login(accountHandle, digest, 3600)
    if (session?.jwt) AgentAPI.Account.SaveSessionToken(session.jwt, 3600, 1800)
    const info = await AgentAPI.Account.Info()
    const pending = applyPendingAccountInfo(info)
    if (!pending) {
      const restoredApplication = await recoverAgentApplication()
      if (restoredApplication.status !== RESTORE_RESULT.FOUND) throw new Error('DURABLE_APPLICATION_UNAVAILABLE')
    }
    return true
  }, [AgentAPI, applyPendingAccountInfo, recoverAgentApplication])

  const verifyAccountEnabled = useCallback(async ({ emailVerified, phoneVerified, phoneRequired = phoneVerificationRequired }) => {
    const next = updateAccountVerificationState({ emailVerified, phoneVerified, phoneRequired })
    if (!canProbeAccountInfo(next)) return false
    try {
      const info = await AgentAPI.Account.Info()
      const authoritative = accountVerificationFromInfo(info)
      if (!authoritative.enabled && (!authoritative.emailVerified || (phoneRequired && !authoritative.phoneVerified))) return false
      setAccountVerificationState(ACCOUNT_ENABLED)
      persistence.diagnostic('KYC_ACCOUNT_ENABLED', { state: ACCOUNT_ENABLED })
      return true
    } catch (error) {
      persistence.diagnostic('KYC_ACCOUNT_INFO_FAILED', {
        state: next,
        code: error?.statusCode || error?.code || 'UNKNOWN',
      })
      return false
    }
  }, [AgentAPI, phoneVerificationRequired, persistence, updateAccountVerificationState])

  const forceSync = useCallback(async (overrides = {}) => {
    if (modeRef.current === EPHEMERAL_PRE_AGENT && formRef.current.emailVerified && formRef.current.phoneVerified) {
      return cutoverToAgentVault(overrides)
    }
    return syncNow(overrides)
  }, [cutoverToAgentVault, syncNow])

  useEffect(() => {
    if (!pathname?.startsWith('/onboarding')) return
    if (hydrated) {
      if (historyNavigationStepRef.current === step) {
        historyNavigationStepRef.current = null
        return
      }
      historyNavigationStepRef.current = null
      const params = new URLSearchParams(window.location.search)
      params.set('step', String(step))
      window.history.pushState({ step }, '', `?${params.toString()}`)
    }
  }, [step, hydrated, pathname]);

  // Track forward navigation to mark steps as completed when user advances
  useEffect(() => {
    if (!hydrated) return
    if (modeRef.current === EPHEMERAL_PRE_AGENT) return
    if (step > prevStepRef.current) {
      const from = prevStepRef.current
      setCompletedSteps(prev => {
        const next = new Set(prev)
        for (let i = from; i < step; i++) {
          next.add(i)
        }
        try { sessionStorage.setItem('kycCompletedSteps', JSON.stringify([...next])) } catch {}
        return next
      })
    }
    prevStepRef.current = step
  }, [step, hydrated])

  // Hydrate completed steps
  useEffect(() => {
    if (!hydrated) return
    if (modeRef.current === EPHEMERAL_PRE_AGENT) return
    try {
      const raw = sessionStorage.getItem('kycCompletedSteps')
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setCompletedSteps(new Set(arr))
      }
    } catch {}
  }, [hydrated])

  useEffect(() => {
    if (!pathname?.startsWith('/onboarding')) {
      setIsWriter(true)
      setWriterReason('not-onboarding')
      return
    }
    if (persistenceMode === EPHEMERAL_PRE_AGENT) {
      setIsWriter(true)
      setWriterReason('ephemeral-pre-agent')
      setSyncStatus('ephemeral')
      return
    }

    setIsWriter(false)
    setWriterReason('acquiring')
    const coordinator = createKycWriterCoordinator({
      onChange: ({ isOwner, reason }) => {
        setIsWriter(isOwner)
        setWriterReason(reason)
      },
    })
    coordinator.start()
    return () => coordinator.stop()
  }, [pathname, persistenceMode])

  // --- HISTORY API: Listen for browser back/forward and update step ---
  useEffect(() => {
    const onPopState = (e) => {
      if (e.state && typeof e.state.step === 'number') {
        const requested = e.state.step
        setStep(prev => {
          const earliestAllowed = getEarliestUnlockedStep(prev, completedSteps)
          const wantsEarlier = requested < earliestAllowed
          const isVerificationRetry = canAccessVerificationStep(requested, prev, completedSteps)
          if (wantsEarlier && !isVerificationRetry) {
            window.history.pushState({ step: prev }, '', `?step=${prev}`)
            historyNavigationStepRef.current = null
            return prev
          }
          historyNavigationStepRef.current = requested
          return requested
        })
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [completedSteps]);
  // ---- BOOTSTRAP ----
  useEffect(() => {
    if (bootstrapStartedRef.current) return
    bootstrapStartedRef.current = true
    const params = new URLSearchParams(window.location.search)
    const acceptanceScenario = getUxAcceptanceScenario(params.get('__ux'), process.env.NODE_ENV)
    if (acceptanceScenario) {
      const syntheticForm = {
        ...initialFormData,
        fullName: 'SYNTHETIC APPLICANT',
        documentNumber: '111.444.777-35',
        email: 'synthetic@example.test',
        phone: '+46700004567',
        birthDate: acceptanceScenario.step >= 10 ? '1990-01-15' : '',
        documentType: acceptanceScenario.step >= 11 ? 'IDCard' : '',
        addressStreet: acceptanceScenario.step >= 16 ? 'Verification Street' : '',
        addressNumber: acceptanceScenario.step >= 16 ? '12' : '',
        addressZip: acceptanceScenario.step >= 16 ? '12345-678' : '',
        addressNeighborhood: acceptanceScenario.step >= 16 ? 'Central' : '',
        addressCity: acceptanceScenario.step >= 16 ? 'Test City' : '',
        addressCountry: acceptanceScenario.step >= 16 ? 'BR' : '',
        phoneVerified: Boolean(acceptanceScenario.phoneVerified || acceptanceScenario.step > 6),
        emailVerified: Boolean(acceptanceScenario.emailVerified || acceptanceScenario.step > 8),
      }
      const descriptor = (slot, mimeType = 'image/png') => ({ status: 'uploaded', slot, contentId: `kyc/applications/00000000-0000-4000-8000-000000000000/documents/${slot}-r1.png`, mimeType, size: 1024, etag: 'ux', sha256: 'a'.repeat(64), documentRevision: 1, updatedAt: new Date().toISOString() })
      const syntheticDocuments = {
        frontPhoto: acceptanceScenario.frontPhoto || acceptanceScenario.allDocuments ? descriptor('frontPhoto') : null,
        backPhoto: acceptanceScenario.backPhoto || acceptanceScenario.allDocuments ? descriptor('backPhoto') : null,
        selfie: acceptanceScenario.allDocuments ? descriptor('selfie', 'image/jpeg') : null,
      }
      persistenceSuspendedRef.current = true
      restoreStatusRef.current = RESTORE_RESULT.FOUND
      setRestoreStatus(RESTORE_RESULT.FOUND)
      setUxScenario(acceptanceScenario)
      setStep(acceptanceScenario.step)
      localStepRef.current = acceptanceScenario.step
      setFormData(syntheticForm)
      formRef.current = syntheticForm
      if (acceptanceScenario.step >= 1) {
        setAccountVerificationState(verificationStateFor({
          phoneRequired: true,
          phoneVerified: syntheticForm.phoneVerified,
          emailVerified: syntheticForm.emailVerified,
        }))
      }
      setDocuments(syntheticDocuments)
      documentsRef.current = syntheticDocuments
      if (acceptanceScenario.step >= 6) setPassword('Synthetic-acceptance-1')
      if (acceptanceScenario.durable) {
        modeRef.current = AGENT_CONTENT
        setPersistenceMode(AGENT_CONTENT)
      }
      setSyncStatus(acceptanceScenario.ui === 'saving' || acceptanceScenario.ui === 'submitting' ? 'saving' : acceptanceScenario.ui?.includes('error') ? 'offline' : 'saved')
      setHydrated(true)
      setRestored(true)
      return
    }
    const stepFromUrl = Number(params.get('step') ?? '0') || 0
    let otpRecovery = null
    try {
      const raw = sessionStorage.getItem('kycOtpRecovery')
      if (raw && sessionStorage.getItem('AgentAPI.Token')) otpRecovery = JSON.parse(raw)
    } catch {}
    const localStep = otpRecovery?.step === 2 ? 2 : otpRecovery?.step === 1 ? 1 : 0
    const storedMode = sessionStorage.getItem('kycPersistenceMode')
    modeRef.current = EPHEMERAL_PRE_AGENT
    setPersistenceMode(EPHEMERAL_PRE_AGENT)
    if (storedMode === AGENT_CONTENT) sessionStorage.removeItem('kycFormData')
    const localFormDataRaw = storedMode === AGENT_CONTENT ? null : sessionStorage.getItem('kycFormData')
    let localFormDataParsed = null
    try { if (localFormDataRaw) localFormDataParsed = JSON.parse(localFormDataRaw) } catch {}

    if (storedMode === AGENT_CONTENT) {
      modeRef.current = AGENT_CONTENT
      setPersistenceMode(AGENT_CONTENT)
      if (localFormDataParsed) {
        formRef.current = { ...initialFormData, ...localFormDataParsed }
        setFormData(formRef.current)
      }
    } else {
      modeRef.current = EPHEMERAL_PRE_AGENT
      setPersistenceMode(EPHEMERAL_PRE_AGENT)
      if (otpRecovery?.phone || otpRecovery?.email) {
        formRef.current = { ...initialFormData, ...otpRecovery }
        setFormData(formRef.current)
      }
      sessionStorage.removeItem('kycFormData')
      sessionStorage.removeItem('kycStep')
      sessionStorage.removeItem('kycCompletedSteps')
    }

    localStepRef.current = localStep
    setStep(prev => Math.max(prev, localStep)) // start from local if any

    const finishHydrate = (didRestore = true) => {
      setHydrated(true)
      setRestored(didRestore)
    }

    const enterEphemeralPreAgent = () => {
      // `start=1` is a public journey marker, not an internal step index.
      // Secure-first always begins at the Secure workspace (step 0).
      const requestedStart = otpRecovery?.step === 2 ? 2 : otpRecovery?.step === 1 ? 1 : 0
      modeRef.current = EPHEMERAL_PRE_AGENT
      setPersistenceMode(EPHEMERAL_PRE_AGENT)
      setSyncStatus('ephemeral')
      localStepRef.current = requestedStart
      setStep(requestedStart)
      sessionStorage.removeItem('kycFormData')
      sessionStorage.removeItem('kycStep')
      sessionStorage.removeItem('kycCompletedSteps')
      const nextParams = new URLSearchParams(window.location.search)
      nextParams.delete('step')
      nextParams.delete('new')
      window.history.replaceState({ step: requestedStart }, '', `${window.location.pathname}${nextParams.toString() ? `?${nextParams}` : ''}`)
    }

    ; (async () => {
      try {
        const requestedNewJourney = new URLSearchParams(window.location.search).get('new') === '1'
        if (requestedNewJourney) {
          // An explicit Start action must never inherit a stale continuation
          // hint or the previous browser session's pre-account state.
          localStorage.removeItem(PENDING_HINT_KEY)
          sessionStorage.removeItem('AgentAPI.Token')
          sessionStorage.removeItem('AgentAPI.UserName')
          sessionStorage.removeItem('kycFormData')
          sessionStorage.removeItem('kycStep')
          sessionStorage.removeItem('kycCompletedSteps')
          sessionStorage.removeItem('kycOtpRecovery')
          otpRecovery = null
        }
        restoreStatusRef.current = RESTORE_RESULT.LOADING
        setRestoreStatus(RESTORE_RESULT.LOADING)
        if (!requestedNewJourney && sessionStorage.getItem('AgentAPI.Token')) {
          try {
            const info = await AgentAPI.Account.Info()
            if (applyPendingAccountInfo(info)) {
              restoreStatusRef.current = RESTORE_RESULT.NOT_FOUND
              setRestoreStatus(RESTORE_RESULT.NOT_FOUND)
              finishHydrate(true)
              return
            }
          } catch {
            // Durable restore and minimal reauthentication hint are evaluated next.
          }
        }
        const result = requestedNewJourney
          ? { status: RESTORE_RESULT.NOT_FOUND }
          : await recoverAgentApplication()
        if (result.status === RESTORE_RESULT.FOUND) {
          finishHydrate(true)
          return
        }

        if (storedMode === AGENT_CONTENT && result.status !== RESTORE_RESULT.NOT_FOUND) {
          persistenceSuspendedRef.current = true
          restoreStatusRef.current = result.status
          setRestoreStatus(result.status)
          setSyncStatus('offline')
          console.warn('[KYC] Durable restore paused', { result: result.status })
          finishHydrate(false)
          return
        }

        restoreStatusRef.current = RESTORE_RESULT.NOT_FOUND
        setRestoreStatus(RESTORE_RESULT.NOT_FOUND)
        const hint = requestedNewJourney ? null : parsePendingHint(localStorage.getItem(PENDING_HINT_KEY))
        enterEphemeralPreAgent()
        if (hint && !otpRecovery) {
          localStepRef.current = 0
          setStep(0)
        }
        finishHydrate(true)
      } catch (error) {
        // If an existing durable journey was selected, an unexpected bootstrap
        // error is also a read failure and must remain fail-closed.
        if (storedMode === AGENT_CONTENT) {
          persistenceSuspendedRef.current = true
          restoreStatusRef.current = RESTORE_RESULT.TRANSIENT_FAILURE
          setRestoreStatus(RESTORE_RESULT.TRANSIENT_FAILURE)
          setSyncStatus('offline')
          finishHydrate(false)
          return
        }
        restoreStatusRef.current = RESTORE_RESULT.NOT_FOUND
        setRestoreStatus(RESTORE_RESULT.NOT_FOUND)
        enterEphemeralPreAgent()
        finishHydrate(true)
      }
    })()
  }, [AgentAPI, applyPendingAccountInfo, recoverAgentApplication])

  // ---- SYNC: STEP (immediate, non-debounced) — always send both ----
  useEffect(() => {
    if (!hydrated || !restored) return
    if (persistenceSuspendedRef.current) return
    if (skipRestoredStepSyncRef.current) {
      skipRestoredStepSyncRef.current = false
      return
    }
    localStepRef.current = step
    if (modeRef.current === AGENT_CONTENT) {
      sessionStorage.setItem('kycStep', String(step))
      console.info('[KYC] KYC_AGENT_FORM_SAVE', { mode: AGENT_CONTENT })
      queueVaultSave({ step })
      return
    }
  }, [step, hydrated, restored, persistenceMode, queueVaultSave])

  // ---- SYNC: FORM DATA (debounced) — always send both ----
  useEffect(() => {
    if (!hydrated || !restored) return
    if (persistenceSuspendedRef.current) return
    if (skipRestoredFormSyncRef.current) {
      skipRestoredFormSyncRef.current = false
      return
    }
    const timeout = setTimeout(() => {
      if (modeRef.current === AGENT_CONTENT) {
        console.info('[KYC] KYC_AGENT_FORM_SAVE', { mode: AGENT_CONTENT })
        queueVaultSave({ form: formData })
        return
      }
    }, 800)
    return () => clearTimeout(timeout)
  }, [formData, hydrated, restored, persistenceMode, queueVaultSave])

  // Mobile browsers can suspend or recreate the page while the applicant
  // switches to Messages or Mail. Before the durable Agent application exists,
  // retain only the contact fields and verification flags needed to resume the
  // OTP screen. Never persist the OTP itself, password, or document data.
  useEffect(() => {
    if (!hydrated || persistenceMode === AGENT_CONTENT) return
    try {
      if ((step === 1 || step === 2) && sessionStorage.getItem('AgentAPI.Token')) {
        sessionStorage.setItem('kycOtpRecovery', JSON.stringify({
          step,
          phone: formData.phone || '',
          email: formData.email || '',
          phoneVerified: Boolean(formData.phoneVerified),
          emailVerified: Boolean(formData.emailVerified),
        }))
      } else if (step >= 3 || step === 0) {
        sessionStorage.removeItem('kycOtpRecovery')
      }
    } catch {}
  }, [formData.phone, formData.email, formData.phoneVerified, formData.emailVerified, hydrated, persistenceMode, step])

  useEffect(() => {
    return () => {
      if (syncResetRef.current) clearTimeout(syncResetRef.current)
    }
  }, [])

  useEffect(() => {
    const onOnline = () => {
      if (syncStatus === 'offline') syncNow()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [syncStatus, syncNow])

  // ---- MOBILE-FRIENDLY FLUSH ON HIDE (sendBeacon with Blob) ----
  useEffect(() => {
    const flush = () => {
      if (persistenceSuspendedRef.current) return
      if (modeRef.current === AGENT_CONTENT) {
        console.info('[KYC] KYC_AGENT_FORM_SAVE', { mode: AGENT_CONTENT })
        queueVaultSave()
        return
      }
      return
    }

    const onPageHide = () => flush()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }

    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [queueVaultSave])

  // ---- MUTATORS ----
  const updateField = async (name, value) => {
    if (['backPhoto', 'frontPhoto', 'selfie'].includes(name)) {
      // Physical-device acceptance sessions must exercise the real step gate,
      // while keeping the image itself out of Agent Content, Legal, and storage.
      if (uxScenario?.deviceTest) {
        const completed = {
          status: 'uploaded',
          slot: name,
          fileName: value?.name || `${name}.jpg`,
          contentType: value?.type || 'image/jpeg',
          source: 'device-test-memory',
        }
        const updatedDocs = { ...documentsRef.current, [name]: completed }
        documentsRef.current = updatedDocs
        setDocuments(updatedDocs)
        return true
      }
      if (!isWriter) return false
      if (!canPersistDocuments(modeRef.current)) return false
      if (shouldUseAgentDocuments(modeRef.current)) {
        try {
          await saveQueueRef.current.enqueue(getSnapshot())
          const current = vaultRef.current
          if (!current) throw new Error('VAULT_APPLICATION_UNAVAILABLE')
          const saved = await agentDocuments.upload(current, name, value)
          const previewUrl = URL.createObjectURL(new Blob([saved.bytes], { type: saved.descriptor.mimeType }))
          const updatedDocs = { ...documentsRef.current, [name]: { ...saved.descriptor, previewUrl } }
          const next = { ...current, application: saved.application }
          vaultRef.current = next
          setVaultApplication(next)
          documentsRef.current = updatedDocs
          setDocuments(updatedDocs)
          markSaved()
          return true
        } catch (error) {
          setSyncStatus('offline')
          persistence.diagnostic('AGENT_DOC_UPLOAD_FAILED', { slot: name, code: error?.code || 'UNKNOWN' })
          return false
        }
      }
      return false
    } else {
      if (!isWriter) return false
      const next = { ...formRef.current, [name]: value }
      formRef.current = next
      setFormData(next)
    }
    return true
  }

  const getAgentDocumentFile = useCallback(async (slot) => {
    const descriptor = sanitizeDocumentDescriptor(documentsRef.current?.[slot])
    if (!descriptor || modeRef.current !== AGENT_CONTENT) return null
    const restored = await agentDocuments.get(descriptor)
    return new File([restored.blob], `${slot}.${descriptor.mimeType.split('/')[1]}`, { type: descriptor.mimeType })
  }, [agentDocuments])

  const getLegalDocumentAttachment = useCallback(async (slot) => {
    const descriptor = sanitizeDocumentDescriptor(documentsRef.current?.[slot])
    if (!descriptor || modeRef.current !== AGENT_CONTENT) return null
    return agentDocuments.legalAttachment(descriptor)
  }, [agentDocuments])

  const saveSession = (data) => {
    setSessionData(data)
  }

  const clearLocalSession = () => {
    persistenceSuspendedRef.current = true
    setSessionData(null)
    setPassword('')
    setFormData(initialFormData)
    formRef.current = initialFormData
    setDocuments({ backPhoto: null, frontPhoto: null, selfie: null })
    documentsRef.current = { backPhoto: null, frontPhoto: null, selfie: null }
    setVaultApplication(null)
    vaultRef.current = null
    sessionStorage.removeItem('kycFormData')
    sessionStorage.removeItem('kycStep')
    sessionStorage.removeItem('kycCompletedSteps')
    sessionStorage.removeItem('kycOtpRecovery')
  }

  const resetStepper = () => {
    persistenceSuspendedRef.current = true
    if (vaultRef.current?.vaultId) {
      persistence.deleteApplication(
        vaultRef.current.vaultId,
        vaultRef.current.application.applicationId,
      ).catch(() => console.warn('[KYC] Vault application deletion failed'))
    }
    setStep(0)
    setFormData(initialFormData)
    setSessionData(null)
    setDocuments({ backPhoto: null, frontPhoto: null, selfie: null })
    setPassword('')
    setPersistenceMode(EPHEMERAL_PRE_AGENT)
    setVaultApplication(null)
    modeRef.current = EPHEMERAL_PRE_AGENT
    vaultRef.current = null
    sessionStorage.removeItem('kycPassword')
    sessionStorage.removeItem('kycSessionData')
    sessionStorage.removeItem('kycDocuments')
    sessionStorage.removeItem('kycStep')
    sessionStorage.removeItem('kycCompletedSteps')
    sessionStorage.removeItem('kycFormData')
    sessionStorage.removeItem('kycOtpRecovery')
    sessionStorage.removeItem('kycPersistenceMode')
    sessionStorage.removeItem('kycApplicationId')
    sessionStorage.removeItem('kycVaultId')
    localStorage.removeItem(PENDING_HINT_KEY)
    localStepRef.current = 0
    setCompletedSteps(new Set())
    setStepRetryCounters({})
    persistenceSuspendedRef.current = false
  }

  // ---- NAV HELPERS ----
  const nextStep = () => {
    if (!isWriter) return
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1))
  }
  const prevStep = () => {
    if (!isWriter) return
    setStep(prev => Math.max(prev - 1, 0))
  }

  const bumpRetryCounter = (target) => {
    setStepRetryCounters(prev => {
      const next = { ...prev }
      next[target] = (next[target] || 0) + 1
      return next
    })
  }

  const retryStep = (index = step) => {
    const target = clampStepIndex(typeof index === 'number' ? index : step)
    bumpRetryCounter(target)
  }
  const goToStep = (index) => {
    if (!isWriter) return
    setStep(prev => {
      const target = clampStepIndex(index)
      if (target === prev) {
        bumpRetryCounter(target)
        return prev
      }

      const earliestAllowed = getEarliestUnlockedStep(prev, completedSteps)
      if (target < earliestAllowed && !canAccessVerificationStep(target, prev, completedSteps)) {
        return prev
      }
      return target
    })
  }

  const beginDocumentRetake = (targetStep) => {
    if (!isWriter) return
    setDocumentRetakeReturnStep(16)
    setStep(clampStepIndex(targetStep))
  }

  const finishDocumentCapture = (defaultStep) => {
    if (!isWriter) return
    if (documentRetakeReturnStep !== null) {
      setStep(documentRetakeReturnStep)
      setDocumentRetakeReturnStep(null)
      return
    }
    setStep(clampStepIndex(defaultStep))
  }

  const showAccountDetected = () => setAccountDetectedVisible(true)
  const hideAccountDetected = () => setAccountDetectedVisible(false)
  const restoreBlocked = [
    RESTORE_RESULT.LOADING,
    RESTORE_RESULT.AUTH_REQUIRED,
    RESTORE_RESULT.AUTH_FAILED,
    RESTORE_RESULT.TRANSIENT_FAILURE,
    RESTORE_RESULT.INVALID_STATE,
  ].includes(restoreStatus)

  const restoreMessage = restoreStatus === RESTORE_RESULT.AUTH_REQUIRED || restoreStatus === RESTORE_RESULT.AUTH_FAILED
    ? 'Your saved verification needs a refreshed session before it can be opened.'
    : 'We couldn’t load your saved progress. Try again when your connection is available.'

  return (
    <StepperContext.Provider value={{
      step,
      setStep: (value) => { if (isWriter) setStep(value) },
      nextStep,
      prevStep,
      goToStep,
      beginDocumentRetake,
      finishDocumentCapture,
      retryStep,
      stepRetryCounters,
      formData,
      updateField,
      resetStepper,
      clearLocalSession,
      sessionData,
      setSessionData,
      saveSession,
      password,
      setPassword,
      documents,
      getAgentDocumentFile,
      getLegalDocumentAttachment,
      hydrated,
      accountDetectedVisible,
      showAccountDetected,
      hideAccountDetected,
      completedSteps,
      syncStatus,
      restoreStatus,
      retryDurableRestore,
      forceSyncNow: forceSync,
      persistenceMode,
      accountVerificationState,
      beginAccountVerification,
      updateAccountVerificationState,
      verifyAccountEnabled,
      vaultApplication,
      cutoverToAgentVault,
      recoverAgentApplication,
      resumePendingAccount,
      isWriter,
      writerReason,
      uxScenario,
    }}>
      {hydrated ? (
        restoreBlocked ? (
          <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#001D29] px-6 text-white">
            <div className="glass-surface premium-shadow relative z-10 w-full max-w-sm rounded-2xl p-6 text-center">
              <h2 className="text-lg font-semibold">{chrome.restoreTitle}</h2>
              <p className="mt-2 text-sm text-[#7DA9B8]">{restoreMessage}</p>
              <button
                type="button"
                onClick={retryDurableRestore}
                disabled={restoreStatus === RESTORE_RESULT.LOADING}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#FBB040] px-5 text-sm font-semibold text-[#002B3A] transition hover:bg-[#e6a43a] disabled:cursor-wait disabled:opacity-70"
              >
                {restoreStatus === RESTORE_RESULT.LOADING ? chrome.trying : chrome.tryAgain}
              </button>
            </div>
          </div>
        ) : <>
          {children}
          {pathname?.startsWith('/onboarding') && !isWriter && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001D29]/95 px-6 text-white">
              <div className="max-w-md rounded-lg border border-[#FBB040]/50 bg-[#002533] p-6 text-center shadow-xl">
                <h2 className="text-xl font-semibold text-[#FBB040]">{chrome.duplicateTitle}</h2>
                <p className="mt-3 text-sm text-white/75">{chrome.duplicateBody}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#001D29] px-6 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#005375]/35 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#FBB040]/10 blur-3xl" />
          </div>
          <div className="glass-surface premium-shadow relative z-10 w-full max-w-sm rounded-2xl p-6 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#FBB040]/30 border-t-[#FBB040]" />
            <h2 className="text-lg font-semibold">{chrome.preparingTitle}</h2>
            <p className="mt-2 text-sm text-[#7DA9B8]">{chrome.preparingBody}</p>
          </div>
        </div>
      )}
    </StepperContext.Provider>
  )
}

export const useStepper = () => {
  const context = useContext(StepperContext)
  if (!context) throw new Error('useStepper must be used within a StepperProvider')
  return context
}
