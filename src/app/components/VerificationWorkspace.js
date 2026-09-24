'use client'

import { CheckCircle2, Mail, Phone } from 'lucide-react'
import { content, useLanguage } from '../context/LanguageContext'

const maskEmail = (value) => {
  const [name = '', domain = ''] = String(value || '').split('@')
  return domain ? `${name.slice(0, 1)}•••@${domain}` : value
}

const maskPhone = (value) => value?.length > 4 ? `•••• ${value.slice(-4)}` : value

const StatusRow = ({ Icon, label, value, complete, active, copy }) => (
  <div className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${active ? 'bg-[#FBB040]/10 ring-1 ring-[#FBB040]/35' : complete ? 'opacity-55' : 'opacity-45'}`}>
    <div className={`grid h-8 w-8 flex-none place-items-center rounded-full ${complete ? 'bg-[#29BF86]/12 text-[#29BF86]' : active ? 'bg-[#FBB040] text-[#003043]' : 'bg-white/[0.06] text-[#91B5C2]'}`}>
      {complete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="truncate text-xs text-[#9FC0CA]">{value}</div>
    </div>
    <span className={`text-xs font-semibold ${complete ? 'text-[#29BF86]' : active ? 'text-[#FBB040]' : 'text-[#91B5C2]'}`}>{complete ? copy.verified : active ? copy.enterCode : copy.waiting}</span>
  </div>
)

export default function VerificationWorkspace({ active, formData, children }) {
  const { language } = useLanguage()
  const copy = content[language].access.verification
  const phoneComplete = Boolean(formData.phoneVerified)
  const emailComplete = Boolean(formData.emailVerified)
  return (
    <div className="access-verification-layout lg:grid lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-12 xl:gap-20">
      <aside className="mb-8 hidden border-l border-[var(--access-border)] pl-6 lg:block" aria-label={copy.eyebrow}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--access-accent)]">{copy.eyebrow}</p>
        <h2 className="mt-4 max-w-[15rem] text-2xl font-medium leading-tight tracking-[-0.025em]">{copy.title}</h2>
        <p className="mt-10 text-xs text-[var(--access-text-muted)]">{copy.durable}</p>
      </aside>
      <div className="space-y-5 sm:space-y-6">
        <div className="border-y border-white/10 py-3 sm:py-4">
          <p className="mb-3 px-1 text-sm font-semibold text-white">{copy.confirmCode}</p>
          <div className="space-y-1">
            <StatusRow Icon={Phone} label={copy.phone} value={maskPhone(formData.phone)} complete={phoneComplete} active={active === 'phone'} copy={copy} />
            <StatusRow Icon={Mail} label={copy.email} value={maskEmail(formData.email)} complete={emailComplete} active={active === 'email'} copy={copy} />
          </div>
        </div>
        <div className="pt-2">
          {children}
        </div>
      </div>
    </div>
  )
}
