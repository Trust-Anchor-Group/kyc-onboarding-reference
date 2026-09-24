'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Eye, EyeOff } from 'lucide-react'
import StepperLayout from '@/app/components/StepperLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStepper } from '@/app/context/StepperContext'
import { useAgentAPI } from '@/app/context/AgentAPIProvider'
import { content, useLanguage } from '@/app/context/LanguageContext'
import { PENDING_HINT_KEY, createPendingHint, parsePendingHint } from '@/app/lib/pendingAccountRecovery.mjs'
import { emailAccountNameFor, normalizeAccountEmail, passwordDigestForAccount } from '@/app/lib/agentAccountCredentials.mjs'
import 'react-phone-input-2/lib/style.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+[1-9]\d{7,14}$/
const validPassword = (value) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
const digestFor = (handle, password) => passwordDigestForAccount(handle, process.env.NEXT_PUBLIC_AGENT_API_URL || '', password)
const PhoneInput = dynamic(() => import('react-phone-input-2').then((module) => module.default), { ssr: false })

const initialCountryFor = (phone) => {
  if (phone?.startsWith('+46')) return 'se'
  if (phone?.startsWith('+55')) return 'br'
  return 'se'
}

export default function SecureVerificationWorkspace() {
  const AgentAPI = useAgentAPI()
  const { language } = useLanguage()
  const copy = content[language]?.access?.secure || content.en.access.secure
  const launch = content[language].access.launch
  const { formData, updateField, password, setPassword, beginAccountVerification, goToStep, resumePendingAccount } = useStepper()
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState('email')
  const [selectedCountry, setSelectedCountry] = useState(() => initialCountryFor(formData.phone))
  const [hint] = useState(() => typeof localStorage === 'undefined' ? null : parsePendingHint(localStorage.getItem(PENDING_HINT_KEY)))
  const reauth = Boolean(hint)
  const emailReady = emailPattern.test(formData.email)
  const phoneReady = phonePattern.test(formData.phone)
  const passwordReady = validPassword(password)
  const valid = useMemo(() => reauth
    ? validPassword(password)
    : emailPattern.test(formData.email) && phonePattern.test(formData.phone) && validPassword(password) && password === confirm,
  [reauth, formData.email, formData.phone, password, confirm])
  const nextLabel = busy
    ? launch.secureJourney.securing
    : reauth
      ? copy.resume
      : !emailReady
        ? copy.email
        : !phoneReady
          ? copy.phone
          : !passwordReady
            ? copy.password
            : password !== confirm
              ? copy.confirmPassword
              : copy.send

  const secure = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError('')
    try {
      if (reauth) {
        await resumePendingAccount({ accountHandle: hint.accountHandle, password })
        return
      }
      const apiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || ''
      const normalizedEmail = normalizeAccountEmail(formData.email)
      const accountHandle = emailAccountNameFor(normalizedEmail, apiUrl)
      const response = await fetch('/api/agent/account/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: accountHandle,
          email: normalizedEmail,
          phone: formData.phone.trim(),
          passwordDigest: digestFor(accountHandle, password),
          seconds: 3600,
          language,
        }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.jwt) throw new Error('ACCOUNT_CREATE_FAILED')
      const duration = Math.max(60, Math.round((new Date(payload.expires).getTime() - Date.now()) / 1000))
      AgentAPI.Account.SetSessionString?.('AgentAPI.UserName', accountHandle)
      AgentAPI.Account.SaveSessionToken(payload.jwt, duration, Math.floor(duration / 2))
      localStorage.setItem(PENDING_HINT_KEY, JSON.stringify(createPendingHint({ accountHandle })))
      beginAccountVerification({ phoneRequired: true })
      goToStep(1)
    } catch {
      setError(reauth ? copy.restoreError : copy.error)
    } finally {
      setBusy(false)
    }
  }

  const fieldClass = (field, complete = false) => {
    if (focusedField === field) return 'border-[var(--access-accent)] bg-[var(--access-input)] ring-2 ring-[var(--access-accent)]/20'
    if (complete) return 'border-[var(--access-success)]/35 bg-[color-mix(in_srgb,var(--access-success)_5%,var(--access-input))]'
    return 'border-[var(--access-border)] bg-[var(--access-input)]'
  }

  const handlePhoneChange = (value, country) => {
    if (country?.countryCode) setSelectedCountry(country.countryCode)
    // react-phone-input-2 returns digits including the selected dialling code.
    // Persist the canonical E.164 value used by verification and the API.
    updateField('phone', value ? `+${String(value).replace(/\D/g, '')}` : '')
  }

  return (
    <StepperLayout
      title={copy.title}
      description={reauth ? copy.description : null}
      showBack={false}
      onNext={secure}
      isNextDisabled={!valid || busy}
      nextLabel={busy ? nextLabel : reauth ? copy.resume : content[language]?.buttons?.continue || 'Continue'}
      wide
      showProgress={false}
      actionClassName="lg:ml-auto lg:flex-none lg:w-[min(100%,653px)]"
    >
      <div className="access-verification-layout lg:grid lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-12 xl:gap-20">
        <div className="mb-8 lg:mb-0">
          <div className="mb-6 flex items-center gap-2 lg:hidden" aria-label={launch.secureJourney.progress}>
            <span className="h-1.5 w-8 rounded-full bg-[var(--access-accent)]" /><span className="h-1.5 w-1.5 rounded-full bg-[var(--access-border)]" /><span className="h-1.5 w-1.5 rounded-full bg-[var(--access-border)]" />
          </div>
          <aside className="hidden border-l border-[var(--access-border)] pl-6 lg:block" aria-label={launch.secureJourney.orientation}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--access-accent)]">{copy.title}</p>
            <h2 className="mt-4 max-w-[15rem] text-2xl font-medium leading-tight tracking-[-0.025em]">{copy.description}</h2>
            <div className="mt-10 space-y-4 border-t border-[var(--access-border)] pt-5 text-sm">
              <div className="flex items-center gap-3 font-semibold text-[var(--access-text)]"><span className="h-2 w-2 rounded-full bg-[var(--access-accent)]" />{launch.secureJourney.contact}</div>
              <div className="flex items-center gap-3 text-[var(--access-text-muted)]"><span className="h-2 w-2 rounded-full border border-[var(--access-border)]" />{launch.secureJourney.identity}</div>
              <div className="flex items-center gap-3 text-[var(--access-text-muted)]"><span className="h-2 w-2 rounded-full border border-[var(--access-border)]" />{launch.secureJourney.review}</div>
            </div>
            <p className="mt-10 text-xs text-[var(--access-text-muted)]">{launch.secureJourney.autoSave}</p>
          </aside>
        </div>

        <div className="space-y-8">
        {!reauth && <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--access-text-muted)]">{copy.contact}</p>
          <div>
            <Label htmlFor="secure-email">{copy.email}</Label>
            <Input id="secure-email" type="email" autoComplete="email" inputMode="email" value={formData.email} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(emailReady ? 'phone' : '')} onChange={(e) => updateField('email', e.target.value)} placeholder="you@example.com" className={`mt-2 h-14 text-base ${fieldClass('email', emailReady)}`} />
          </div>
          <div>
            <Label htmlFor="secure-phone">{copy.phone}</Label>
            <PhoneInput
              country={selectedCountry}
              value={formData.phone.replace(/^\+/, '')}
              onChange={handlePhoneChange}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(phoneReady ? 'password' : '')}
              countryCodeEditable={false}
              enableSearch
              containerClass="access-phone-input mt-2"
              inputClass={`access-phone-control !h-14 !w-full !rounded-xl !text-base ${fieldClass('phone', phoneReady)}`}
              buttonClass="access-phone-country !rounded-l-xl"
              dropdownClass="access-phone-dropdown"
              inputProps={{
                id: 'secure-phone',
                name: 'phone',
                required: true,
                autoComplete: 'tel',
                inputMode: 'tel',
                'aria-label': copy.phone,
              }}
            />
          </div>
        </div>}
        <fieldset className="space-y-4 border-t border-[var(--access-border)] pt-6">
          <legend className="px-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--access-text-muted)]">{copy.security}</legend>
          <div>
            <Label htmlFor="secure-password">{copy.password}</Label>
            <div className="relative mt-2"><Input id="secure-password" type={showPassword ? 'text' : 'password'} autoComplete={reauth ? 'current-password' : 'new-password'} value={password} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(passwordReady ? 'confirm' : '')} onChange={(e) => setPassword(e.target.value)} className={`access-login-password h-14 text-base ${fieldClass('password', passwordReady)}`} /><button type="button" aria-label={showPassword ? launch.common.hidePassword : launch.common.showPassword} onClick={() => setShowPassword((value) => !value)} className="access-password-toggle absolute top-1/2 -translate-y-1/2 text-[var(--access-text-muted)]">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
            {!reauth && focusedField === 'password' && !passwordReady && <p className="mt-2 text-xs text-[var(--access-text-muted)]">{copy.passwordHint}</p>}
          </div>
          {!reauth && <div><Label htmlFor="secure-confirm">{copy.confirmPassword}</Label><Input id="secure-confirm" type="password" autoComplete="new-password" value={confirm} onFocus={() => setFocusedField('confirm')} onBlur={() => setFocusedField('')} onChange={(e) => setConfirm(e.target.value)} className={`mt-2 h-14 text-base ${fieldClass('confirm', Boolean(confirm) && password === confirm)}`} /></div>}
        </fieldset>
        {error && <p role="alert" className="rounded-xl border border-[#F25567]/30 bg-[#F25567]/10 p-3 text-sm text-[#F25567]">{error}</p>}
        </div>
      </div>
    </StepperLayout>
  )
}
