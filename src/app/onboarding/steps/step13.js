'use client'
export const dynamic = 'force-dynamic'

import React, { useRef, useState } from 'react'
import { useStepper } from '@/app/context/StepperContext'
import StepperLayout from '@/app/components/StepperLayout'
import { useStepNavigation } from '@/app/components/useStepNavigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useLanguage, content } from '@/app/context/LanguageContext'
import { hash } from 'bcryptjs'
import Loader from '@/components/ui/Loader'
import { AccessMark } from '@/app/components/AccessBrand'
import { CheckCircle2, Clock3, Hourglass, ShieldCheck } from 'lucide-react'
import { useAgentAPI } from '@/app/context/AgentAPIProvider'
import { buildAccountLoginCandidates, passwordDigestForAccount } from '@/app/lib/agentAccountCredentials.mjs'
import { AGENT_CONTENT } from '@/app/lib/agentKycPersistence.mjs'
import { submitLegalEvidence } from '@/app/lib/legalSubmission.mjs'
import { REAUTH, SUBMISSION, maySubmit, submissionStateFromDurableState } from '@/app/lib/submissionContinuity.mjs'
import {
  buildLegalProperties,
  classifyLegalApplyPreflightFailure,
  evaluateLegalApplyPreflight,
  isLegalApplyPreflightReady,
  isLegalRefererUsable,
} from '@/app/lib/legalApplyPreflight.mjs'

const KEY_ID = 'user-key-id'
const KEY_LOCAL_NAME = 'ed448'
const KEY_NAMESPACE = 'urn:nf:iot:e2e:1.0'

const readyCopy = {
  en: { label: 'Ready to submit', title: 'Your verification is ready.', body: 'You have reviewed your information and accepted the terms. Submit when you are ready and we will begin the verification review.' },
  sv: { label: 'Redo att skicka in', title: 'Din verifiering är klar.', body: 'Du har granskat dina uppgifter och godkänt villkoren. Skicka in när du är redo så startar granskningen.' },
  fr: { label: 'Prête à être envoyée', title: 'Votre vérification est prête.', body: 'Vous avez vérifié vos informations et accepté les conditions. Envoyez votre demande quand vous êtes prêt pour lancer l’examen.' },
  es: { label: 'Lista para enviar', title: 'Tu verificación está lista.', body: 'Has revisado tus datos y aceptado las condiciones. Envíala cuando estés listo para iniciar la revisión.' },
  pt: { label: 'Pronto para enviar', title: 'Sua verificação está pronta.', body: 'Você revisou seus dados e aceitou os termos. Envie quando estiver pronto para iniciar a análise.' },
  ar: { label: 'جاهز للإرسال', title: 'عملية التحقق جاهزة.', body: 'لقد راجعت معلوماتك ووافقت على الشروط. أرسل طلبك عندما تكون جاهزًا لبدء المراجعة.' },
}

const submittedCopy = {
  en: { label: 'Submitted for review', title: 'Your application is submitted.' },
  sv: { label: 'Insickad för granskning', title: 'Din ansökan är inskickad.' },
  fr: { label: 'Envoyée pour examen', title: 'Votre demande a été envoyée.' },
  es: { label: 'Enviada para revisión', title: 'Tu solicitud ha sido enviada.' },
  pt: { label: 'Enviada para análise', title: 'Sua solicitação foi enviada.' },
  ar: { label: 'أُرسل للمراجعة', title: 'تم إرسال طلبك.' },
}

const extractKeyPassword = (value) => {
  if (typeof value === 'string') {
    if (!value.includes('<')) return value
    return new DOMParser().parseFromString(value, 'application/xml').documentElement?.textContent || null
  }
  return value?.KeyPassword?.value || value?.KeyPassword || value?.Xml?.value || value?.Xml || value?.value || value?.xml
    ? extractKeyPassword(value?.KeyPassword?.value || value?.KeyPassword || value?.Xml?.value || value?.Xml || value?.value || value?.xml)
    : null
}

const Step13Terms = () => {
  const { formData, step, documents, password, setPassword, setSessionData, sessionData, updateField, forceSyncNow, persistenceMode, getLegalDocumentAttachment, uxScenario, vaultApplication } = useStepper()
  const [accepted, setAccepted] = useState(Boolean(formData?.consent))
  const recoveredState = vaultApplication?.application?.state
  const [isSubmitting, setIsSubmitting] = useState(uxScenario?.ui === 'submitting')
  const [showRedirectNotice, setShowRedirectNotice] = useState(uxScenario?.ui === 'completion' || submissionStateFromDurableState(recoveredState) === SUBMISSION.SUBMITTED)
  const [submissionFailed, setSubmissionFailed] = useState(uxScenario?.ui === 'submit-error' || submissionStateFromDurableState(recoveredState) === SUBMISSION.FAILED_RETRYABLE)
  const [submissionFailureCode, setSubmissionFailureCode] = useState(null)
  const [reauthState, setReauthState] = useState(REAUTH.REQUIRED)
  const [reauthPassword, setReauthPassword] = useState('')
  const [reauthPasswordDigest, setReauthPasswordDigest] = useState('')
  const submitLock = useRef(false)

  const { goToStep } = useStepNavigation(step)
  const { language } = useLanguage()
  const t = content[language]
  const copy = t.access.launch
  const ready = readyCopy[language] || readyCopy.en
  const submitted = submittedCopy[language] || submittedCopy.en
  const readyToSubmit = Boolean(formData?.consent && reauthState === REAUTH.AUTHENTICATED)
  const { show } = useToast()
  const AgentAPI = useAgentAPI()

  const handleReauthenticate = async (event) => {
    event.preventDefault()
    if (!reauthPassword || reauthState === REAUTH.AUTHENTICATING) return
    setReauthState(REAUTH.AUTHENTICATING)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || ''
      const accountHandle = AgentAPI.Account.GetSessionString?.('AgentAPI.UserName') || sessionStorage.getItem('AgentAPI.UserName')
      const candidates = buildAccountLoginCandidates({ accountHandle, email: formData.email, apiUrl, password: reauthPassword })
      let authenticated = null
      let session = null
      for (const candidate of candidates) {
        try {
          session = await AgentAPI.Account.Login(candidate.accountName, candidate.passwordDigest, 3600)
          if (session?.jwt) { authenticated = candidate; break }
        } catch {}
      }
      if (!session?.jwt) throw new Error('ACCOUNT_LOGIN_FAILED')
      AgentAPI.Account.SetSessionString?.('AgentAPI.UserName', authenticated.accountName)
      AgentAPI.Account.SaveSessionToken?.(session.jwt, 3600, 1800)
      setSessionData({ jwt: session.jwt, duration: 3600 })
      // Credential remains memory-only and is set only after Login succeeds.
      setPassword(reauthPassword)
      setReauthPasswordDigest(authenticated.passwordDigest)
      setReauthPassword('')
      setReauthState(REAUTH.AUTHENTICATED)
    } catch {
      setReauthPassword('')
      setReauthState(REAUTH.FAILED)
    }
  }

  const handleFinish = async () => {
    if (!maySubmit({ accepted, reauthState, submissionState: isSubmitting ? SUBMISSION.SUBMITTING : showRedirectNotice ? SUBMISSION.SUBMITTED : submissionFailed ? SUBMISSION.FAILED_RETRYABLE : SUBMISSION.READY }) || submitLock.current) return
    submitLock.current = true
    setIsSubmitting(true)
    setSubmissionFailed(false)
    try { await forceSyncNow({ state: 'SUBMITTING', step: 17, form: { consent: true } }) } catch {}
    let stage = 'initial'

    try {
      const generateSalt = (length = 16) => {
        const array = new Uint8Array(length)
        crypto.getRandomValues(array)
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
      }

      if (!password || !formData.fullName) {
        throw new Error('Password or full name is missing!');
      }

      // Derive password digest H1 = SHA3-256(UserName:Domain:Password)
      const apiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || ''

      const rawUserName = String(formData.documentNumber || '').trim()
      const accountHandle = AgentAPI.Account.GetSessionString?.('AgentAPI.UserName') || sessionStorage.getItem('AgentAPI.UserName')
      const passwordDigest = reauthPasswordDigest || passwordDigestForAccount(accountHandle, apiUrl, password)

      stage = 'key-recovery'
      let publicKey = null
      try {
        publicKey = await AgentAPI.Crypto.GetPublicKey(KEY_ID)
      } catch {}
      let keyPassword = extractKeyPassword(sessionData?.keyPassword)
      if (publicKey && !keyPassword) {
        const privateXml = await AgentAPI.Storage.LoadPrivateXml('KeyPassword', 'http://www.w3.org/2001/XMLSchema')
        keyPassword = extractKeyPassword(privateXml)
      }
      if (!publicKey) {
        stage = 'key-create'
        const salt = generateSalt()
        keyPassword = await hash(`${KEY_ID}:${formData.fullName}:${passwordDigest}:${salt}`, 10)
        await AgentAPI.Crypto.CreateKey(KEY_LOCAL_NAME, KEY_NAMESPACE, KEY_ID, keyPassword, passwordDigest)
        const xml = `<KeyPassword xmlns="http://www.w3.org/2001/XMLSchema">${keyPassword}</KeyPassword>`
        await AgentAPI.Storage.SavePrivateXml(xml)
        publicKey = await AgentAPI.Crypto.GetPublicKey(KEY_ID)
      }
      if (!keyPassword) throw new Error('Legal signing key password is unavailable.')

      stage = 'preflight-readonly'
      const [accountInfo, algorithms, applicationAttributes, identities] = await Promise.all([
        AgentAPI.Account.Info(),
        AgentAPI.Crypto.GetAlgorithms(),
        AgentAPI.Legal.GetApplicationAttributes(),
        AgentAPI.Legal.GetIdentities(),
      ])
      const properties = buildLegalProperties(formData)
      const existingIdentities = identities?.Identities || []
      const keyAlgorithm = publicKey?.Algorithm
      const matchingAlgorithm = (algorithms?.Algorithms || []).some((algorithm) =>
        algorithm.localName === KEY_LOCAL_NAME && algorithm.namespace === KEY_NAMESPACE)
      const preflight = evaluateLegalApplyPreflight({
        accountEnabled: Boolean(accountInfo),
        keyExists: Boolean(publicKey?.key),
        keyAlgorithmMatches: matchingAlgorithm && keyAlgorithm?.localName === KEY_LOCAL_NAME && keyAlgorithm?.namespace === KEY_NAMESPACE,
        applicationAttributesLoaded: Boolean(applicationAttributes),
        properties,
        applicationAttributes: applicationAttributes?.Required || [],
        personalNumberValid: Boolean(rawUserName),
        accountPasswordAvailable: Boolean(passwordDigest),
        keyPasswordAvailable: Boolean(keyPassword),
        refererPresent: isLegalRefererUsable(window.location.origin),
        requestHostMatchesSignatureHost: AgentAPI.IO.GetHost?.() === new URL(apiUrl).host,
        existingLegalApplicationAbsent: existingIdentities.length === 0 || Boolean(
          formData.legalId && existingIdentities.some((identity) =>
            (identity?.id || identity?.Identity?.id) === formData.legalId)
        ),
      })
      console.info('[KYC] LEGAL_APPLY_PREFLIGHT', {
        ...preflight,
        propertyNames: Object.keys(properties),
        propertyCount: Object.keys(properties).length,
        keyAlgorithm: keyAlgorithm?.localName,
        legalOrigin: window.location.origin,
      })
      if (!isLegalApplyPreflightReady(preflight)) {
        const preflightError = new Error(classifyLegalApplyPreflightFailure(preflight))
        preflightError.code = preflightError.message
        throw preflightError
      }

      let currentLegalId = formData.legalId
      if (!currentLegalId) {
        stage = 'apply-id'
        const legalIdResult = await AgentAPI.Legal.ApplyId(
          KEY_LOCAL_NAME,
          KEY_NAMESPACE,
          KEY_ID,
          keyPassword,
          passwordDigest,
          properties
        )
        currentLegalId = legalIdResult?.Identity?.id || legalIdResult?.id
        if (!currentLegalId) throw new Error('Agent API did not return a legal identity ID.')
        await updateField('legalId', currentLegalId)
        const persisted = await forceSyncNow()
        if (!persisted) throw new Error('Could not persist the legal identity ID.')
      }

      stage = 'submit-evidence'
      await submitLegalEvidence({
        legalId: currentLegalId,
        getIdentity: (legalId) => AgentAPI.Legal.GetIdentity(legalId),
        uploadAttachments: async () => {
          const legacyAttachment = (document) => document?.base64
            ? { base64: document.base64, fileName: document.fileName, mimeType: document.contentType }
            : null
          const attachmentFor = async (slot) => persistenceMode === AGENT_CONTENT
            ? await getLegalDocumentAttachment(slot)
            : legacyAttachment(documents[slot])
          const attachments = await Promise.all(['frontPhoto', 'backPhoto', 'selfie'].map(attachmentFor))
          if (attachments.some((attachment) => !attachment)) throw new Error('Required document is missing or invalid!')
          for (const attachment of attachments) {
            await AgentAPI.Legal.AddIdAttachment(
              KEY_LOCAL_NAME,
              KEY_NAMESPACE,
              KEY_ID,
              keyPassword,
              passwordDigest,
              currentLegalId,
              attachment.base64, attachment.fileName, attachment.mimeType
            )
          }
        },
        readyForApproval: () => AgentAPI.Legal.ReadyForApproval(
          KEY_LOCAL_NAME, KEY_NAMESPACE, KEY_ID, keyPassword, passwordDigest, currentLegalId
        ),
      })
      try { await forceSyncNow({ state: 'SUBMITTED', step: 17, form: { consent: true } }) } catch {}
      setPassword('')

      show({
        title: t.toasts?.submissionCompleteTitle || 'Verification submitted',
        description: t.toasts?.submissionCompleteDesc || 'Your verification is complete. You can safely close this page.',
        variant: 'success'
      })

      // Stop the loader and show the definitive completion state.
      setIsSubmitting(false);
      setShowRedirectNotice(true);

    } catch (error) {
      console.error('Identity submission failed', {
        stage,
        code: error?.code || error?.statusCode || error?.message || 'UNKNOWN',
      })
      try { await forceSyncNow({ state: 'FAILED_RETRYABLE', step: 17, form: { consent: true } }) } catch {}
      setIsSubmitting(false)
      setSubmissionFailed(true)
      setSubmissionFailureCode(error?.code || error?.statusCode || error?.message || 'UNKNOWN')
      show({
        title: t.toasts?.submissionErrorTitle || 'Error submitting identity',
        description: t.toasts?.submissionErrorDesc || 'Your details and photos are still saved. Please try again.',
        variant: 'destructive'
      })
    } finally { submitLock.current = false }
  }

  if (showRedirectNotice && !isSubmitting) {
    return (
      <main className="access-submission flex min-h-[100dvh] items-center justify-center px-5 py-8 sm:px-8 sm:py-12">
        <section className="w-full max-w-2xl">
          <div className="flex justify-center"><AccessMark /></div>
          <div className="mt-12 sm:mt-20">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color-mix(in_srgb,var(--access-warning)_14%,transparent)] text-[var(--access-warning)]">
              <Hourglass className="h-9 w-9" aria-hidden="true" />
            </div>
            <p className="mt-7 text-center text-xs font-bold uppercase tracking-[0.18em] text-[var(--access-warning)]">{submitted.label}</p>
            <h1 className="mt-3 text-center text-4xl font-semibold tracking-tight sm:text-5xl">{submitted.title}</h1>
            <p className="access-copy mx-auto mt-5 max-w-lg text-center text-base leading-relaxed sm:text-lg">{copy.submission.body}</p>

            <div className="mx-auto mt-12 max-w-lg border-y border-[var(--access-border)] py-6">
              <div className="flex gap-4"><Clock3 className="mt-0.5 h-5 w-5 flex-none text-[var(--access-warning)]" /><div><p className="font-semibold">{copy.submission.next}</p><p className="access-copy mt-1 text-sm leading-relaxed">{copy.submission.nextBody}</p></div></div>
              <div className="mt-5 flex gap-4"><ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[var(--access-success)]" /><div><p className="font-semibold">{copy.submission.track}</p><p className="access-copy mt-1 text-sm leading-relaxed">{copy.submission.trackBody}</p></div></div>
            </div>

            <div className="mx-auto mt-8 max-w-lg text-center">
              <a
                href="/login"
                className="access-primary inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold"
              >
                {copy.submission.login}
              </a>
              <p className="access-copy mt-3 text-sm">{copy.submission.loginHint}</p>
            </div>

          </div>
        </section>
      </main>
    )
  }

  return (
    <StepperLayout
      titleKey="step13"
      title={readyToSubmit ? ready.title : t.steps?.step13 || 'Submit your verification'}
      description={readyToSubmit ? ready.body : t.descriptions?.step13}
      onNext={handleFinish}
      isNextDisabled={!maySubmit({ accepted, reauthState, submissionState: isSubmitting ? SUBMISSION.SUBMITTING : showRedirectNotice ? SUBMISSION.SUBMITTED : submissionFailed ? SUBMISSION.FAILED_RETRYABLE : SUBMISSION.READY })}
      nextLabel={
        isSubmitting
          ? (t.buttons?.submitting || 'Submitting...')
          : submissionFailed
            ? copy.submission.retry
            : (t.buttons?.submit || 'Submit')
      }
      contentClassName="pt-0 -mt-1 pb-24"
    >
      {isSubmitting && <Loader text={copy.submission.submitting} />}
      {!isSubmitting && !showRedirectNotice && !readyToSubmit && (
        <div className="space-y-6">
          {submissionFailed && (
            <div className="rounded-xl border border-[#F25567]/35 bg-[#F25567]/10 p-4 text-sm text-[#F6C4CA]" role="alert">
              <p className="font-semibold text-white">{copy.submission.failed}</p>
              {submissionFailureCode === 'LEGAL_ORIGIN_UNSUPPORTED' ? (
                <p className="mt-1">
                  {copy.submission.savedSecureLink}
                  {process.env.NODE_ENV !== 'production' && ' For local testing, use http://localhost without a port.'}
                </p>
              ) : (
                <p className="mt-1">{copy.submission.savedRetry}</p>
              )}
            </div>
          )}
          {!formData.consent && <div className="max-h-[320px] space-y-4 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-[#D5E8EE]">
            <p>
              {t.terms?.p1 || 'By continuing, you confirm that the information and files submitted are truthful, complete, and belong to you.'}
            </p>
            <p>
              {t.terms?.p2 || 'Your data is processed for compliance, anti-fraud checks, and legal identity verification in accordance with applicable regulation.'}
            </p>
            <p>
              {t.terms?.p3 || 'Submitting this form initiates a review workflow. Providing false or misleading information may result in account restrictions.'}
            </p>
          </div>}

          {!formData.consent && <div className="mt-6 flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex-none">
              <Checkbox
                id="accept"
                className="!w-5 !h-5 ml-1 border-2 border-[#FBB040] focus:ring-2 focus:ring-[#FBB040] focus:ring-offset-2 transition-all duration-150"
                checked={accepted}
                onCheckedChange={setAccepted}
              />
            </div>
            <div className="ml-3 flex-1">
              <Label
                htmlFor="accept"
                className="text-white text-base font-medium cursor-pointer select-none leading-snug"
              >
                {t.buttons?.terms?.acceptLabel || 'I have read and agree to the terms and conditions.'}
              </Label>
            </div>
          </div>}

          {reauthState !== REAUTH.AUTHENTICATED && (
            <form onSubmit={handleReauthenticate} noValidate className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="font-semibold text-white">{copy.submission.reauthTitle}</h2>
              <p className="mt-1 text-sm text-[#D5E8EE]">{copy.submission.reauthBody}</p>
              <Label htmlFor="submission-password" className="mt-4 block">{copy.common.password}</Label>
              <Input
                id="submission-password"
                type="password"
                autoComplete="current-password"
                enterKeyHint="go"
                value={reauthPassword}
                onChange={(event) => { setReauthPassword(event.target.value); if (reauthState === REAUTH.FAILED) setReauthState(REAUTH.REQUIRED) }}
                className="mt-2 h-12 bg-white/10 text-white"
              />
              {reauthState === REAUTH.FAILED && <p className="mt-2 text-sm text-[#F6C4CA]" role="alert">{copy.submission.passwordRejected}</p>}
              <button type="submit" disabled={!reauthPassword || reauthState === REAUTH.AUTHENTICATING} className="access-primary mt-4 min-h-12 w-full rounded-xl px-4 font-semibold disabled:cursor-wait disabled:opacity-60">
                {reauthState === REAUTH.AUTHENTICATING ? copy.submission.confirming : copy.common.continue}
              </button>
            </form>
          )}

        </div>
      )}
      {!isSubmitting && !showRedirectNotice && readyToSubmit && (
        <section className="access-review-ready rounded-2xl border border-[color-mix(in_srgb,var(--access-success)_38%,var(--access-border))] bg-[color-mix(in_srgb,var(--access-success)_9%,var(--access-surface))] p-5 sm:p-7" aria-live="polite">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[color-mix(in_srgb,var(--access-success)_18%,transparent)] text-[var(--access-success)]">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--access-success)]">{ready.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--access-text-secondary)]">{copy.submission.trackBody}</p>
            </div>
          </div>
        </section>
      )}
    </StepperLayout>
  )
}

export default Step13Terms
