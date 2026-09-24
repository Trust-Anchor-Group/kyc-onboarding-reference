'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, X } from 'lucide-react'
import LanguageToggle from './LanguageToggle'
import { AccessMark } from './AccessBrand'
import { content, useLanguage } from '../context/LanguageContext'

export default function DashboardSideMenu({ open, onClose, onLogout, renderMobile = true, renderDesktop = false }) {
  const router = useRouter()
  const { language } = useLanguage()
  const copy = content[language].access.chrome
  const agentToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('AgentAPI.Token') : null

  useEffect(() => {
    if (!renderMobile) return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open, renderMobile])

  const logout = agentToken ? <button type="button" onClick={onLogout} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-white/75"><LogOut className="h-4 w-4" />{copy.logout}</button> : null

  return (
    <>
      {renderMobile && <aside className={`fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm bg-[#062B34] p-6 text-white transition-transform lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`} aria-hidden={!open}>
        <div className="flex items-center justify-between"><button type="button" onClick={() => router.push('/')} aria-label={copy.home}><AccessMark compact /></button><button type="button" onClick={onClose} aria-label={copy.closeMenu} className="grid h-11 w-11 place-items-center"><X /></button></div>
        <div className="mt-12">{logout}</div>
      </aside>}
      {renderDesktop && <aside className="access-dashboard-rail fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r p-6 lg:flex lg:flex-col">
        <div className="flex flex-col gap-7"><div className="flex items-center justify-between gap-3"><button type="button" onClick={() => router.push('/')} aria-label={copy.home}><AccessMark compact /></button><LanguageToggle /></div><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--access-accent)]">{copy.workspace}</p><p className="mt-2 text-sm leading-relaxed text-white/65">{copy.workspaceBody}</p></div></div>
        <div className="mt-auto border-t border-white/10 pt-5">{logout}</div>
      </aside>}
    </>
  )
}
