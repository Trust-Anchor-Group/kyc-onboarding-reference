'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Clock3, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react'
import LanguageToggle from './components/LanguageToggle'
import { AccessMark, PartnerContext } from './components/AccessBrand'
import { getAccessBrand, resolveEntryBrand } from './lib/accessBrand.mjs'
import { content, useLanguage } from './context/LanguageContext'

export default function Home() {
  const router = useRouter()
  const { language } = useLanguage()
  const copy = content[language]?.access?.home || content.en.access.home
  const experience = content[language].access.entry
  const [brand, setBrand] = useState(() => getAccessBrand())

  useEffect(() => {
    setBrand(resolveEntryBrand({ search: window.location.search }))
  }, [])

  const startVerification = () => {
    const entry = brand.partner ? '&__entry=partner' : '&__entry=generic'
    router.push(`/onboarding?start=1&new=1${entry}`)
  }

  return (
    <main className="access-landing relative min-h-[100dvh] overflow-hidden">
      <div className="access-hero-overlay absolute inset-0" />
      <div className="access-hero-vignette pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1560px] flex-col px-5 pb-5 pt-5 sm:px-8 lg:px-14 lg:pb-8 lg:pt-7">
        <header className="access-entry-header flex items-center justify-between border-b pb-5">
          <AccessMark />
          <LanguageToggle />
        </header>

        <div className="flex flex-1 items-center py-10 sm:py-12">
          <section className="access-entry-copy max-w-[650px]" aria-labelledby="access-entry-title">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--access-accent)]"><ShieldCheck className="h-4 w-4" />{copy.eyebrow}</p>
              <span className="access-secure-pill inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"><LockKeyhole className="h-3.5 w-3.5" />{experience.secureSession}</span>
            </div>
            <PartnerContext partner={brand.partner} className="mb-4" />
            <h1 id="access-entry-title" className="access-hero-title max-w-[650px] text-[3.15rem] font-semibold leading-[0.94] tracking-[-0.045em] sm:text-7xl lg:text-[5.35rem]">
              {copy.title}
            </h1>
            <p className="access-hero-copy mt-5 max-w-xl text-base leading-relaxed sm:text-xl sm:leading-8">
              {brand.partner
                ? `${brand.partner} ${copy.partnerDescription}`
                : copy.description}
            </p>

            <div className="mt-7 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={startVerification}
                className="access-primary access-entry-primary group flex min-h-14 flex-1 items-center justify-between rounded-xl px-5 text-base font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--access-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--access-page)]"
              >
                {copy.start}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => router.push(brand.partner ? '/login?__entry=partner' : '/login?__entry=generic')}
                className="access-entry-secondary min-h-14 rounded-xl border px-5 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--access-focus)]"
              >
                {copy.continue}
              </button>
            </div>

            <div className="access-hero-rule mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-5 text-xs sm:text-sm">
              <span className="access-hero-copy inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[var(--access-accent)]" />{copy.duration}</span>
              <span className="access-hero-copy inline-flex items-center gap-2"><CreditCard className="h-4 w-4 text-[var(--access-accent)]" />{copy.idReady}</span>
              <span className="access-hero-copy inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--access-success)]" />{experience.guided}</span>
            </div>
          </section>
        </div>

        <footer className="access-entry-trust grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-3">
          {[
            [ShieldCheck, experience.privacy, experience.privacyBody],
            [CheckCircle2, experience.guided, experience.guidedBody],
            [LockKeyhole, experience.tracking, experience.trackingBody],
          ].map(([Icon, title, body]) => (
            <div key={title} className="access-entry-trust-item flex gap-3 p-4 sm:p-5">
              <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-xl"><Icon className="h-4 w-4" /></span>
              <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5">{body}</p></div>
            </div>
          ))}
        </footer>
      </div>
    </main>
  )
}
