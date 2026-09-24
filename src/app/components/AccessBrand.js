'use client'

import { Check, Circle } from 'lucide-react'
import Image from 'next/image'
import { content, useLanguage } from '../context/LanguageContext'

export function AccessMark({ compact = false, inverse = true }) {
  return (
    <div className={`access-brand-lockup inline-flex shrink-0 items-end gap-2 ${inverse ? 'text-[var(--access-text)]' : 'text-[#032B35]'}`} aria-label="Access by Neuro">
      <Image
        src="/Access.avif"
        alt=""
        aria-hidden="true"
        width={500}
        height={500}
        sizes={compact ? '24px' : '32px'}
        className={`${compact ? 'h-6 w-6' : 'h-8 w-8'} access-logo object-contain`}
      />
      <span className={`${compact ? 'text-xl' : 'text-2xl'} font-semibold leading-none`}>Access</span>
      <span className="mb-0.5 text-[10px] font-semibold uppercase text-current/55">by Neuro</span>
    </div>
  )
}

export function PartnerContext({ partner, className = '' }) {
  const { language } = useLanguage()
  const copy = content[language].access.brand
  if (!partner) return null
  const isAthletesAndYou = partner.trim().toLowerCase() === 'athletes and you'

  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm text-[var(--access-text-secondary)] ${className}`}>
      <span>{copy.requestedBy}</span>
      {isAthletesAndYou ? (
        <span className="access-partner-logo inline-flex h-8 items-center rounded-md px-2" aria-label="Athletes and You">
          <Image src="/AUWhite.png" alt="Athletes and You" width={256} height={91} sizes="96px" className="h-5 w-auto object-contain" />
        </span>
      ) : (
        <span className="font-semibold text-[var(--access-text)]">{partner}</span>
      )}
    </div>
  )
}

export function AccessIdentity({ state = 'ready', className = '' }) {
  const { language } = useLanguage()
  const copy = content[language].access.brand
  const complete = state === 'submitted'
  const progress = state === 'progress'
  const label = complete ? copy.submitted : progress ? copy.progress : copy.ready
  return (
    <div className={`access-identity relative overflow-hidden rounded-lg border border-[var(--access-border)] bg-[var(--access-surface-strong)]/80 p-5 text-[var(--access-text)] shadow-[0_24px_80px_var(--access-shadow)] backdrop-blur-xl ${className}`} aria-label={`Access identity: ${label}`}>
      <div className="flex items-start justify-between gap-6">
        <AccessMark compact />
        <div className={`grid h-8 w-8 place-items-center rounded-full border ${complete ? 'border-[#5ED6A8] bg-[#5ED6A8]/15 text-[#5ED6A8]' : 'border-white/20 text-white/55'}`}>
          {complete ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
        </div>
      </div>
      <div className="mt-12">
        <p className="text-[10px] font-semibold uppercase text-white/45">{copy.identity}</p>
        <p className="mt-1 text-lg font-medium">{label}</p>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span key={index} className={`h-1 rounded-full ${complete || (progress && index < 2) ? 'bg-[#5ED6A8]' : index === 0 ? 'bg-[#F7B64A]' : 'bg-white/12'}`} />
        ))}
      </div>
    </div>
  )
}
