'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, Archive, Check, Clock3, Copy, Hourglass, QrCode, RefreshCw, ScanLine, ShieldCheck, Smartphone, XCircle } from 'lucide-react'
import { useIdentityStatus } from '../hooks/useIdentityStatus'
import { useStepper } from '../context/StepperContext'
import { useAgentAPI } from '../context/AgentAPIProvider'
import { generateQrLink, generateTransferPin } from '../utils/generateQrLink'
import StoreButtons from './DownloadButtons'
import { content, useLanguage } from '../context/LanguageContext'

const STATUS = {
  Approved: { label: 'Approved', title: 'Your identity is ready.', description: 'Transfer it securely to the Neuro Access app to start using it.', Icon: ShieldCheck, accent: 'text-[var(--access-success)]', surface: 'border-[var(--access-success)]/25 bg-[var(--access-success)]/8' },
  Created: { label: 'Under review', title: 'Your application is being reviewed.', description: 'We’ll email you when there is an update. You can return here at any time to check its status.', Icon: Hourglass, accent: 'text-[var(--access-warning)]', surface: 'border-[var(--access-warning)]/25 bg-[var(--access-warning)]/8' },
  Rejected: { label: 'Action needed', title: 'Your application needs attention.', description: 'Please review the update sent to your email, then contact support or submit a new application if requested.', Icon: XCircle, accent: 'text-[#F25567]', surface: 'border-[#F25567]/25 bg-[#F25567]/8' },
  Obsoleted: { label: 'Expired', title: 'This application has expired.', description: 'Start a new verification to continue creating your digital identity.', Icon: Archive, accent: 'text-[#7DA9B8]', surface: 'border-white/10 bg-white/[0.03]' },
  Compromised: { label: 'Security alert', title: 'Your identity needs protection.', description: 'Contact support immediately. Do not share account details or transfer codes.', Icon: AlertTriangle, accent: 'text-[#FBB040]', surface: 'border-[#FBB040]/30 bg-[#FBB040]/8' },
}

const copyToClipboard = async (value) => {
  try { await navigator.clipboard.writeText(value) } catch {
    const field = document.createElement('textarea')
    field.value = value
    document.body.appendChild(field)
    field.select()
    document.execCommand('copy')
    document.body.removeChild(field)
  }
}

function StatusTimeline({ approved }) {
  const steps = approved ? ['Application submitted', 'Identity approved', 'Transfer to Neuro Access'] : ['Application submitted', 'Review in progress', 'Approval and app transfer']
  return <ol className="grid gap-3 sm:grid-cols-3" aria-label="Application progress">
    {steps.map((step, index) => {
      const complete = approved ? index < 2 : index === 0
      const current = approved ? index === 2 : index === 1
      return <li key={step} className={`rounded-xl border p-3 ${current ? 'border-[var(--access-accent)]/45 bg-[var(--access-accent)]/8' : 'border-[var(--access-border)] bg-white/[0.02]'}`}>
        <div className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${complete ? 'bg-[var(--access-success)] text-[#001F2D]' : current ? 'border border-[var(--access-accent)] text-[var(--access-accent)]' : 'border border-[var(--access-border)] text-[var(--access-text-muted)]'}`}>{complete ? <Check className="h-3 w-3" /> : index + 1}</span><span className={`text-xs font-semibold ${current ? 'text-[var(--access-text)]' : 'text-[var(--access-text-muted)]'}`}>{step}</span></div>
      </li>
    })}
  </ol>
}

export default function IdentityStatusScreen() {
  const status = useIdentityStatus()
  const AgentAPI = useAgentAPI()
  const { sessionData } = useStepper()
  const { language } = useLanguage()
  const copy = content[language]?.access?.dashboard || content.en.access.dashboard
  const [transfer, setTransfer] = useState(null)
  const [loadingTransfer, setLoadingTransfer] = useState(false)
  const [transferError, setTransferError] = useState(false)
  const [copied, setCopied] = useState(false)
  const isApproved = String(status || '').toLowerCase() === 'approved'
  const statusView = STATUS[status] || { label: status ? 'Status update' : 'Checking status', title: copy.checking, description: 'This normally takes only a moment. You can safely refresh this page if needed.', Icon: Clock3, accent: 'text-[var(--access-accent)]', surface: 'border-[var(--access-border)] bg-white/[0.03]' }
  if (status === 'Approved') { statusView.title = copy.approved; statusView.description = copy.scan }
  if (status === 'Created') { statusView.title = copy.pending }
  const StatusIcon = statusView.Icon

  const createTransfer = useCallback(async () => {
    if (loadingTransfer) return
    if (!sessionData?.keyPassword || !sessionData?.accountPassword) {
      setTransferError('SESSION_CREDENTIALS_UNAVAILABLE')
      return
    }
    setLoadingTransfer(true)
    setTransferError(false)
    try {
      const pin = generateTransferPin()
      const result = await generateQrLink(sessionData, pin, AgentAPI)
      if (!result?.qrCodeUrl || !result?.onboardingUri) throw new Error('TRANSFER_UNAVAILABLE')
      setTransfer({ ...result, pin })
    } catch {
      setTransferError('TRANSFER_UNAVAILABLE')
      setTransfer(null)
    } finally { setLoadingTransfer(false) }
  }, [AgentAPI, loadingTransfer, sessionData])

  useEffect(() => {
    if (isApproved && !transfer && !loadingTransfer && !transferError) createTransfer()
  }, [createTransfer, isApproved, loadingTransfer, transfer, transferError])

  const copyTransferLink = async () => {
    if (!transfer?.onboardingUri) return
    await copyToClipboard(transfer.onboardingUri)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return <section className="access-status-workspace mx-auto w-full max-w-6xl space-y-5 pb-8">
    <header className="access-status-hero rounded-3xl border border-[var(--access-border)] p-5 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4"><div className={`grid h-12 w-12 flex-none place-items-center rounded-2xl border ${statusView.surface} ${statusView.accent}`}><StatusIcon className="h-6 w-6" /></div><div><p className={`text-xs font-bold uppercase tracking-[0.18em] ${statusView.accent}`}>{statusView.label}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{statusView.title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--access-text-muted)]">{statusView.description}</p></div></div>
        <div className="rounded-full border border-[var(--access-border)] bg-black/10 px-3 py-1.5 text-xs font-medium text-[var(--access-text-muted)]">{copy.account}</div>
      </div>
      <div className="mt-7"><StatusTimeline approved={isApproved} /></div>
    </header>

    {isApproved && <section className="access-transfer-card overflow-hidden rounded-3xl border p-5 sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,380px)] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-[var(--access-success)]"><ScanLine className="h-5 w-5" /><p className="text-xs font-bold uppercase tracking-[0.18em]">{copy.ready}</p></div>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{copy.transfer}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">{copy.scan}</p>
          <ol className="mt-6 space-y-3 text-sm text-white/80"><li className="flex gap-3"><span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-[#FBB040] text-xs font-bold text-[#002533]">1</span><span>{copy.openApp}</span></li><li className="flex gap-3"><span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-[#FBB040] text-xs font-bold text-[#002533]">2</span><span>{copy.selectTransfer}</span></li><li className="flex gap-3"><span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-[#FBB040] text-xs font-bold text-[#002533]">3</span><span>{copy.scanPin}</span></li></ol>
          <div className="mt-7 max-w-sm"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">{copy.needApp}</p><StoreButtons /></div>
        </div>
        <div className="access-qr-panel rounded-3xl border p-4 text-center sm:p-5">
          <div className="mx-auto grid aspect-square max-w-[264px] place-items-center rounded-2xl bg-white p-3">
            {transfer?.qrCodeUrl ? <Image src={transfer.qrCodeUrl} alt={copy.scan} width={transfer.width || 300} height={transfer.height || 300} className="h-full w-full rounded-xl object-contain" priority /> : loadingTransfer ? <div className="flex flex-col items-center gap-3 text-sm text-[#31505a]"><RefreshCw className="h-7 w-7 animate-spin" /><span>{copy.creating}</span></div> : <div className="flex flex-col items-center gap-3 px-5 text-sm text-[#31505a]"><QrCode className="h-8 w-8" /><span>{copy.unavailable}</span></div>}
          </div>
          {transfer?.pin && <div className="mt-4 rounded-2xl border border-[#FBB040]/30 bg-[#FBB040]/10 px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FBB040]">{copy.pin}</p><p className="mt-1 font-mono text-2xl font-bold tracking-[0.22em] text-white">{transfer.pin}</p></div>}
          {transferError && <div className="mt-4"><button type="button" onClick={createTransfer} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white"><RefreshCw className="h-4 w-4" />{copy.retry}</button><p className="mt-2 text-xs text-white/60">{transferError === 'SESSION_CREDENTIALS_UNAVAILABLE' ? copy.refreshSession : copy.qrFailed}</p></div>}
          {!transferError && transfer?.onboardingUri && <button type="button" onClick={copyTransferLink} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10"><Copy className="h-4 w-4" />{copied ? copy.copied : copy.copy}</button>}
          <p className="mt-3 text-xs leading-relaxed text-white/50">{copy.security}</p>
        </div>
      </div>
    </section>}

    {!isApproved && <section className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-[var(--access-border)] bg-[var(--access-surface)] p-5"><Clock3 className="h-5 w-5 text-[var(--access-warning)]" /><h2 className="mt-4 font-semibold">{copy.underReview}</h2><p className="mt-2 text-sm leading-relaxed text-[var(--access-text-muted)]">{copy.reviewInfo}</p></div><div className="rounded-2xl border border-[var(--access-border)] bg-[var(--access-surface)] p-5"><Smartphone className="h-5 w-5 text-[var(--access-accent)]" /><h2 className="mt-4 font-semibold">{copy.afterApproval}</h2><p className="mt-2 text-sm leading-relaxed text-[var(--access-text-muted)]">{copy.transferInfo}</p></div></section>}
  </section>
}
