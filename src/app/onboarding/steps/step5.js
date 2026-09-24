"use client";

import React, { useState, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useStepper } from '@/app/context/StepperContext'
import StepperLayout from '@/app/components/StepperLayout'
import { useLanguage, content } from '@/app/context/LanguageContext'
import { CircleAlert } from 'lucide-react'
import { useAgentAPI } from '@/app/context/AgentAPIProvider'
import VerificationWorkspace from '@/app/components/VerificationWorkspace'
import dynamic from 'next/dynamic'
import 'react-phone-input-2/lib/style.css'

const PhoneInput = dynamic(() => import('react-phone-input-2').then((module) => module.default), { ssr: false })

const withTimeout = (promise, ms = 12000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ])

const maskPhone = (value) => value?.length > 4 ? `•••• ${value.slice(-4)}` : value

const Step5VerifyPhone = () => {
  const { formData, updateField, step, sessionId, goToStep, cutoverToAgentVault, updateAccountVerificationState, verifyAccountEnabled, uxScenario } = useStepper()
  const { language } = useLanguage()
  const t = content[language]
  const { show } = useToast()
  const AgentAPI = useAgentAPI()
  const maskedPhone = maskPhone(formData.phone)

  const RESEND_INTERVAL = 20;
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(RESEND_INTERVAL)
  const [error, setError] = useState(uxScenario?.ui === 'otp-error')
  const [hasUsedRetry, setHasUsedRetry] = useState(false)
  const [retryHint, setRetryHint] = useState('')
  const timerRef = useRef(null)
  const codeInputRef = useRef(null)
  const submittedCodeRef = useRef('')
  const verifyRef = useRef(null)
  const [resendCooldown, setResendCooldown] = useState(false)
  const [recoveryCountry, setRecoveryCountry] = useState('se')

  const isCodeValid = code.length === 6
  const verifyDisabled = !isCodeValid || loading || error


  useEffect(() => {
    const lastSent = Number(sessionStorage.getItem('phoneResendTimestamp') || '0');
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - lastSent) / 1000);
      const remaining = Math.max(RESEND_INTERVAL - elapsed, 0);
      setResendSeconds(remaining);
    }
  }, []);

  useEffect(() => {
    if (resendSeconds > 0) {
      timerRef.current = setTimeout(() => setResendSeconds(s => s - 1), 1000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [resendSeconds]);

  // Auto-skip if phone (or entire account) already verified after a refresh
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (step !== 1) return
      try {
        const info = await AgentAPI.Account.Info()
        const enabled = !!info?.enabled
        let phoneValidated = !!(info?.phoneValidatedAt || info?.phoneNrVerified || info?.phoneVerified || info?.phoneConfirmedAt)
        let emailValidated = !!(info?.emailValidatedAt || info?.eMailVerified || info?.emailVerified || info?.emailConfirmedAt)
        if (enabled) { phoneValidated = true; emailValidated = true }
        if (cancelled) return
        if (phoneValidated) {
          if (!formData.phoneVerified) updateField('phoneVerified', true)
          if (emailValidated) {
            const saved = await cutoverToAgentVault({ step: 3, form: { ...formData, phoneVerified: true, emailVerified: true } })
            if (saved) goToStep(3)
          } else {
            goToStep(2)
          }
        }
      } catch (e) {}
    }
    run()
    return () => { cancelled = true }
  }, [AgentAPI.Account, step, formData, updateField, goToStep, cutoverToAgentVault])

  // Persist retry usage across reloads (one extra attempt per code send)
  useEffect(() => {
    const key = `phoneRetryUsed:${sessionId || 'default'}`
    const stored = sessionStorage.getItem(key)
    if (stored === '1') setHasUsedRetry(true)
  }, [sessionId])
  const handleVerify = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      show({ title: t.errors?.offlineAction || t.errors?.networkTimeout || 'You are offline. Reconnect and try again.', variant: 'error' })
      return
    }
    let verificationStage = 'starting'
    try {
      setLoading(true)
      verificationStage = 'verifying-phone-code'
      console.info('[KYC verification] phone: submitting code')
      await withTimeout(AgentAPI.Account.VerifyPhoneNr(formData.phone || '', parseInt(code, 10)))
      console.info('[KYC verification] phone: code accepted by API')

      // mark verified in local state (prevents backward restore)
      verificationStage = 'saving-phone-verification-state'
      const phoneStateSaved = await updateField('phoneVerified', true)
      console.info('[KYC verification] phone: local state updated', { saved: phoneStateSaved })
      const nextForm = { ...formData, phoneVerified: true }
      const targetStep = formData.emailVerified ? 3 : 2
      const phoneRequired = true
      verificationStage = 'updating-account-verification-state'
      updateAccountVerificationState({
        emailVerified: Boolean(formData.emailVerified),
        phoneVerified: true,
        phoneRequired,
      })
      verificationStage = 'checking-account-enabled'
      const accountEnabled = formData.emailVerified
        ? await verifyAccountEnabled({ emailVerified: true, phoneVerified: true, phoneRequired })
        : false
      console.info('[KYC verification] phone: account enabled check complete', {
        accountEnabled,
        emailWasAlreadyVerified: Boolean(formData.emailVerified),
      })
      if (formData.emailVerified && !accountEnabled) throw new Error('ACCOUNT_NOT_ENABLED')
      verificationStage = 'saving-verified-application'
      const cutoverComplete = accountEnabled
        ? await cutoverToAgentVault({ step: targetStep, form: nextForm })
        : false
      console.info('[KYC verification] phone: verified flow complete', { cutoverComplete })

      show({ title: t.labels?.phoneVerified || '✅ Phone verified.', variant: 'success' })
      setError(false)
      setHasUsedRetry(false)
      setRetryHint('')
      setCode('')
      try { sessionStorage.removeItem(`phoneRetryUsed:${sessionId || 'default'}`) } catch {}
      if (formData.emailVerified) goToStep(3)
      else goToStep(2)
    } catch (err) {
      console.error('[KYC verification] phone: flow failed', {
        stage: verificationStage,
        message: err?.message || String(err),
        statusCode: err?.statusCode,
        statusMessage: err?.statusMessage,
      })
      const isTimeout = String(err?.message || '').includes('TIMEOUT')
      const isServiceFailure = Number(err?.statusCode) >= 500
      const retryableFailure = isTimeout || isServiceFailure
      const serviceMessage = t.errors?.verificationUnavailable || content.en.errors.verificationUnavailable
      const failureMessage = isTimeout
        ? (t.errors?.networkTimeout || serviceMessage)
        : isServiceFailure
          ? serviceMessage
          : (t.errors?.invalidPhoneCode || 'Invalid code or already verified.')
      show({
        title: failureMessage,
        variant: 'error',
      })
      if (retryableFailure) {
        setRetryHint(serviceMessage)
        setCode('')
        submittedCodeRef.current = ''
        return
      }
      if (!hasUsedRetry) {
        setHasUsedRetry(true)
        setRetryHint(t.errors?.oneMoreAttempt || 'Incorrect code. You have one more try before resending.')
        setCode('')
        try { sessionStorage.setItem(`phoneRetryUsed:${sessionId || 'default'}`, '1') } catch {}
        setTimeout(() => { try { codeInputRef.current && codeInputRef.current.focus() } catch {} }, 0)
        return
      }
      setRetryHint('')
      setError(true)
    } finally {
      setLoading(false)
    }
  }
  verifyRef.current = handleVerify

  const handleResend = async (e) => {
    e.preventDefault()
    if (resendSeconds > 0 || resendCooldown) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      show({ title: t.errors?.offlineAction || t.errors?.networkTimeout || 'You are offline. Reconnect and try again.', variant: 'error' })
      return
    }
    try {
      setResendCooldown(true)
      await withTimeout(AgentAPI.Account.ResendVerificationCodes('', formData.phone || '', language));
      setResendSeconds(RESEND_INTERVAL);
      sessionStorage.setItem('phoneResendTimestamp', String(Date.now()));
      setCode('')
      submittedCodeRef.current = ''
      setError(false)
  setHasUsedRetry(false)
  try { sessionStorage.removeItem(`phoneRetryUsed:${sessionId || 'default'}`) } catch {}
      setRetryHint('')
  // Refocus input after clearing
    try { codeInputRef.current && codeInputRef.current.focus() } catch {}
      show({ title: t.labels?.resent || 'Verification code resent!', variant: 'success' });
      setTimeout(() => setResendCooldown(false), 3000)
    } catch (err) {
      console.error(err);
      const isTimeout = String(err?.message || '').includes('TIMEOUT')
      setResendCooldown(false)
      show({
        title: isTimeout
          ? (t.errors?.networkTimeout || 'Network is taking longer than expected. Please try again.')
          : (t.errors?.invalidPhoneCode || 'Invalid code or already verified.'),
        variant: 'error',
      });
    }
  }

  useEffect(() => {
    if (code.length !== 6 || loading || error || submittedCodeRef.current === code) return
    submittedCodeRef.current = code
    verifyRef.current?.()
  }, [code, loading, error])

  return (
    <StepperLayout
      titleKey="step5"
      title={t.steps?.step5 || 'Confirm your phone'}
      showBack={false}
      customButton={
        <Button
          type="button"
          onClick={handleVerify}
          disabled={verifyDisabled}
          className={`h-[48px] w-full rounded-xl py-2 text-[18px] font-semibold transition ${loading
            ? 'bg-[#FBB040] text-[#003043] cursor-wait'
            : (!isCodeValid
              ? 'bg-[#003043] text-[#7DA9B8] cursor-not-allowed'
              : 'bg-[#FBB040] text-[#003043] hover:bg-[#e09c33]')} `}
        >
          {loading ? (t.buttons?.verifying || t.buttons?.submitting || 'Verifying...') : (t.buttons?.verify || 'Verify')}
        </Button>
      }
      wide
      actionClassName="lg:ml-auto lg:flex-none lg:w-[min(100%,680px)]"
    >
      <VerificationWorkspace active="phone" formData={formData}>
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-[#B7D0DA]">{t.descriptions?.step5}</p>
        {!formData.phone && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <Label htmlFor="recovery-phone" className="text-sm text-[var(--access-text)]">{t.labels?.phone}</Label>
            <p className="mb-2 mt-1 text-xs text-[var(--access-text-muted)]">{t.access.verification.recoveryHint}</p>
            <PhoneInput
              country={recoveryCountry}
              value={formData.phone.replace(/^\+/, '')}
              onChange={(value, country) => {
                if (country?.countryCode) setRecoveryCountry(country.countryCode)
                updateField('phone', value ? `+${String(value).replace(/\D/g, '')}` : '')
              }}
              countryCodeEditable={false}
              enableSearch
              containerClass="access-phone-input mt-2"
              inputClass="access-phone-control !h-12 !w-full !rounded-xl !text-base"
              buttonClass="access-phone-country !rounded-l-xl"
              dropdownClass="access-phone-dropdown"
              inputProps={{
                id: 'recovery-phone',
                name: 'phone',
                required: true,
                autoComplete: 'tel',
                inputMode: 'tel',
                'aria-label': t.labels?.phone,
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-white !text-base">
            {t.step5Subtitle || 'Code was sent to'}
          </Label>
          <Label className="text-white !text-base font-semibold">
            {maskedPhone || 'your saved phone number'}
          </Label>
        </div>

        <Label htmlFor="phone-code" className="text-white text-base sm:text-lg">
          {t.labels?.enterVerificationCode || 'Enter verification code'}
        </Label>

          <Input
            id="phone-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            pattern="\d*"
            maxLength={6}
            value={code}
            ref={codeInputRef}
            disabled={error}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6)
              setCode(v)
              if (v.length < 6) submittedCodeRef.current = ''
              if (error) setError(false) // reset error while user edits after resend
              if (retryHint) setRetryHint('')
            }}
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault() }}
            aria-invalid={error ? "true" : "false"}
            className={`mx-auto block h-12 w-52 rounded-xl text-center text-xl tracking-[0.35em] bg-white/10 placeholder:text-white/40
              border ${error ? "text-[#F25567]" : "text-white border-transparent"} focus:outline-none focus:ring-0`}
            style={error ? { borderColor: "#F25567", color: "#F25567" } : undefined}
            placeholder="••••••"
          />

          {!error && retryHint && (
            <p className="mt-2 text-xs text-[#FBB040] text-center flex items-center justify-center ">
              <CircleAlert className="h-5 w-5 flex-shrink-0" />
              {retryHint}
            </p>
          )}

          {error && (
            <p className="mt-2 rounded-xl border border-[#F25567]/30 bg-[#F25567]/10 p-2 text-xs text-[#F25567] text-center flex items-center justify-center gap-1.5">
              <CircleAlert className="h-5 w-5 flex-shrink-0" />
              {t.errors?.outOfAttempts || 'Out of attempts! Please resend to receive a new code'}
            </p>
          )}

        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={handleResend}
            className={`text-[#FBB040] font-semibold underline underline-offset-4 transition-opacity duration-200 ${resendSeconds > 0 || resendCooldown ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:opacity-80'}`}
            tabIndex={resendSeconds > 0 || resendCooldown ? -1 : 0}
            aria-disabled={resendSeconds > 0 || resendCooldown}
            disabled={resendSeconds > 0 || resendCooldown || !formData.phone}
          >
            {resendCooldown
              ? (t.labels?.resendInProgress || 'Requesting a new code…')
              : resendSeconds > 0
              ? `${t.labels?.resendIn || 'Resend in'} ${resendSeconds}s`
              : t.labels?.resend || 'Resend code'}
          </button>
        </div>
      </div>
      </VerificationWorkspace>
    </StepperLayout>
  )
}

export default Step5VerifyPhone
