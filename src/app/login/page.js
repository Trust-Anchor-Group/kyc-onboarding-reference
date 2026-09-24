'use client'

import React, { useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { useStepper } from '../context/StepperContext'
import { useToast } from '@/components/ui/use-toast'
import { useLanguage, content } from '@/app/context/LanguageContext'
import { useAgentAPI } from '../context/AgentAPIProvider'
import { buildAccountLoginCandidates, normalizeAccountEmail } from '../lib/agentAccountCredentials.mjs'
import { useAgentHost } from '../hooks/useAgentHost'
import LanguageToggle from '../components/LanguageToggle'
import { AccessIdentity, AccessMark, PartnerContext } from '../components/AccessBrand'
import { getAccessBrand } from '../lib/accessBrand.mjs'

const KEY_ID = 'user-key-id'
const KEY_PASSWORD_NAMESPACE = 'http://www.w3.org/2001/XMLSchema'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function extractKeyPassword(value) {
  if (typeof value === 'string') {
    if (!value.includes('<')) return value
    return new DOMParser().parseFromString(value, 'application/xml').documentElement?.textContent || null
  }

  return value?.KeyPassword?.value || value?.KeyPassword || value?.Xml?.value || value?.Xml || value?.value || value?.xml
    ? extractKeyPassword(value?.KeyPassword?.value || value?.KeyPassword || value?.Xml?.value || value?.Xml || value?.value || value?.xml)
    : null
}

export default function LoginPage() {
  const AgentAPI = useAgentAPI()
  useAgentHost()
  const brand = getAccessBrand()

  const router = useRouter()
  const { show } = useToast()
  const { saveSession, formData, recoverAgentApplication } = useStepper()
  const { language } = useLanguage()
  const t = content[language]?.login || content.en.login
  const experience = content[language].access.entry
  const chrome = content[language].access.chrome
  const common = content[language].access.launch.common

  const [username, setUsername] = useState(() => formData?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      show({ title: t.missing.title, description: t.missing.message, variant: 'error' })
      return
    }
    try {
      setLoading(true)
      const domainUrl = process.env.NEXT_PUBLIC_AGENT_API_URL || ''
      const email = normalizeAccountEmail(username)
      if (!emailPattern.test(email)) throw new Error('INVALID_EMAIL')
      const [candidate] = buildAccountLoginCandidates({ email, apiUrl: domainUrl, password })
      if (!candidate) throw new Error('INVALID_EMAIL')
      const session = await AgentAPI.Account.Login(candidate.accountName, candidate.passwordDigest, 3600)
      AgentAPI.Account.SetSessionString?.('AgentAPI.UserName', candidate.accountName)

      let keyPassword = null
      try {
        const privateXml = await AgentAPI.Storage.LoadPrivateXml('KeyPassword', KEY_PASSWORD_NAMESPACE)
        keyPassword = extractKeyPassword(privateXml)
      } catch {
        keyPassword = null
      }
      const jwt = session?.jwt

      saveSession({
        jwt,
        username: candidate.accountName,
        accountPassword: candidate.passwordDigest,
        cryptoKeyId: KEY_ID,
        keyPassword,
      })

      const recovered = await recoverAgentApplication()
      router.push(recovered?.application?.currentStep < 17 ? '/onboarding' : '/dashboard')

    } catch (error) {
      console.error('Agent login failed')
      let description = t.failed?.invalid || 'Invalid credentials';
      if (error && typeof error === 'object') {
        if (error.message) description = error.message;
        if (error.statusCode === 403 && error.message) description = t.failed?.userNameOrPassword;
      }
      show({
        title: t.failed?.title || 'Login failed',
        description,
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="access-auth access-login min-h-[100dvh] overflow-hidden">
      <div className="access-login-orb pointer-events-none fixed inset-0" aria-hidden="true" />
      <div className="access-grid pointer-events-none fixed inset-0 opacity-25" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1380px] flex-col px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
        <header className="access-entry-header flex items-center justify-between border-b pb-5">
          <button type="button" onClick={() => router.push('/')} aria-label={chrome.home} className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F7B64A]">
            <AccessMark />
          </button>
          <LanguageToggle />
        </header>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:gap-20 lg:py-12 xl:gap-28">
          <section className="access-login-panel rounded-[1.75rem] border p-6 sm:p-9 lg:p-10" aria-labelledby="login-title">
            <PartnerContext partner={brand.partner} className="mb-4" />
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--access-accent)]"><ShieldCheck className="h-4 w-4" />{experience.loginEyebrow}</p>
            <h1 id="login-title" className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{experience.loginTitle}</h1>
            <p className="access-copy mt-4 max-w-md text-base leading-7">{experience.loginBody}</p>

            <form onSubmit={(event) => { event.preventDefault(); handleLogin() }} className="mt-8 space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="username" className="!text-[var(--access-text-secondary)]">{t.username}</Label>
                <Input id="username" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={320} className="access-login-input h-14 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="!text-[var(--access-text-secondary)]">{t.password}</Label>
                <div className="relative">
                  <Input id="password" placeholder={t.password} type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="access-login-input access-login-password h-14 text-base" />
                  <button type="button" aria-label={showPassword ? common.hidePassword : common.showPassword} onClick={() => setShowPassword((v) => !v)} className="access-password-toggle absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[var(--access-text-secondary)] transition hover:bg-[var(--access-surface-subtle)] hover:text-[var(--access-text)] focus:outline-none" tabIndex={-1}>
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="access-primary access-entry-primary group mt-1 h-14 w-full rounded-xl px-5 font-semibold">
                <span>{loading ? t.loading : t.button}</span><ArrowRight className="ml-auto h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </form>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[var(--access-border)] bg-[var(--access-surface-subtle)]/45 p-3.5">
              <LockKeyhole className="mt-0.5 h-4 w-4 flex-none text-[var(--access-success)]" />
              <div><p className="text-xs font-semibold">{experience.protected}</p><p className="access-copy mt-1 text-xs leading-5">{experience.protectedBody}</p></div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-2 text-sm">
              <span className="access-copy">{experience.newApplication}</span>
              <button type="button" onClick={() => router.push('/')} className="min-h-10 font-semibold text-[var(--access-accent)] underline decoration-[var(--access-border)] underline-offset-4 hover:text-[var(--access-accent-hover)]">{content[language].access.home.start}</button>
            </div>
          </section>

          <aside className="access-login-story hidden lg:block" aria-label={experience.progressTitle}>
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--access-success)]">{experience.accountHint}</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] xl:text-5xl">{experience.progressTitle}</h2>
              <p className="access-copy mt-4 max-w-lg text-lg leading-8">{experience.progressBody}</p>
            </div>

            <div className="access-login-timeline mt-9 grid grid-cols-3 gap-3" aria-hidden="true">
              {[experience.stepSubmitted, experience.stepReview, experience.stepTransfer].map((label, index) => (
                <div key={label} className={`rounded-xl border p-3 ${index < 2 ? 'is-complete' : 'is-next'}`}>
                  <span className="grid h-7 w-7 place-items-center rounded-full">{index < 2 ? <Check className="h-4 w-4" /> : index + 1}</span>
                  <p className="mt-3 text-xs font-semibold leading-5">{label}</p>
                </div>
              ))}
            </div>

            <AccessIdentity state="progress" className="mt-6 w-full max-w-[520px] rounded-2xl p-6" />
          </aside>
        </div>
      </div>
    </main>
  )
}
