'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, X } from 'lucide-react'
import { useStepper } from '@/app/context/StepperContext'
import { AccessMark } from './AccessBrand'

export default function SideMenu({ open, onClose, onLogout, renderMobile = true, renderDesktop = false }) {
  const router = useRouter()
  const { resetStepper, setStep } = useStepper()
  const agentToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('AgentAPI.Token') : null

  useEffect(() => {
    if (!renderMobile) return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open, renderMobile])

  const start = () => {
    resetStepper()
    setStep(1)
    router.push('/onboarding?start=1&new=1')
  }

  const actions = (
    <nav className="flex flex-col gap-3" aria-label="Access actions">
      <button type="button" onClick={start} className="min-h-12 rounded-lg bg-[#F7B64A] px-4 font-semibold text-[#062B34]">Start verification</button>
      <button type="button" onClick={() => router.push('/login')} className="min-h-12 rounded-lg border border-white/15 px-4 font-semibold text-white">Continue verification</button>
      {agentToken && onLogout ? <button type="button" onClick={onLogout} className="mt-4 flex min-h-11 items-center justify-center gap-2 text-sm text-white/70"><LogOut className="h-4 w-4" />Log out</button> : null}
    </nav>
  )

  return (
    <>
      {renderMobile && <aside className={`fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm bg-[#062B34] p-6 text-white transition-transform lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-hidden={!open}>
        <div className="mb-16 flex items-center justify-between"><AccessMark /><button type="button" onClick={onClose} aria-label="Close menu" className="grid h-11 w-11 place-items-center"><X /></button></div>
        {actions}
      </aside>}
      {renderDesktop && <aside className="fixed inset-y-0 left-0 z-40 hidden w-1/3 bg-[#062B34] p-8 text-white lg:flex lg:flex-col"><AccessMark /><div className="my-auto">{actions}</div></aside>}
    </>
  )
}
