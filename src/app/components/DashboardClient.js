'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useStepper } from '../context/StepperContext'
import { useLanguage, content } from '@/app/context/LanguageContext'
import HeaderBar from '../components/Header'
import IdentityStatusScreen from '../components/IdentityStatusScreen'
import DashboardSideMenu from '../components/DashboardSideMenu'
import { useAgentAPI } from '../context/AgentAPIProvider'
import { AccessMark } from './AccessBrand'
import LanguageToggle from './LanguageToggle'

export default function DashboardClient() {
  const AgentAPI = useAgentAPI()
  const { session, resetStepper } = useStepper()

  const { show } = useToast()
  const router = useRouter()
  const { language } = useLanguage()
  const t = content[language]?.dashboards || {}
  const chrome = content[language].access.chrome

  const [accountInfo, setAccountInfo] = useState(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const agentToken = window.sessionStorage.getItem('AgentAPI.Token')
    if (!agentToken) {
      router.push('/login')
    } else {
      AgentAPI.Account.Info()
        .then(setAccountInfo)
        .catch(() => console.error('Failed to fetch account info'))
    }
  }, [session, router, AgentAPI])

  const handleLogout = async () => {
    show({
      title: t.logout || 'Loggat ut',
      description: t.logoutSuccess || 'Du har loggats ut.',
      variant: 'success',
    });
    router.push('/login');
    try {
      await AgentAPI.Account.Logout();
      resetStepper();
    } catch {
      console.error('Account logout failed')
    }
  };

  return (
    <div className="access-dashboard min-h-screen flex flex-col bg-[var(--access-page)] text-[var(--access-text)]">
      <div className="block lg:hidden">
        <HeaderBar showBack={false} onMenuClick={() => setMenuOpen(true)} />
      </div>
      <DashboardSideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
        renderMobile={true}
        renderDesktop={false}
      />
      <header className="access-dashboard-topbar hidden border-b lg:block">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-10 xl:px-14">
          <div className="flex items-center gap-8"><AccessMark /><span className="h-6 w-px bg-[var(--access-border)]" aria-hidden="true" /><p className="text-sm font-medium text-[var(--access-text-muted)]">{chrome.workspace}</p></div>
          <div className="flex items-center gap-4"><LanguageToggle /><button type="button" onClick={handleLogout} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--access-border)] px-4 text-sm font-semibold text-[var(--access-text-secondary)] transition hover:border-[var(--access-accent)]/50 hover:text-[var(--access-text)]"><LogOut className="h-4 w-4" />{t.logout || chrome.logout}</button></div>
        </div>
      </header>
      <main
        className={`flex-1 w-full px-4 py-6 sm:px-8 lg:px-10 lg:py-10 xl:px-14 ${loginOpen ? 'blur-sm pointer-events-none' : ''}`}
      >
        <IdentityStatusScreen />
      </main>
    </div>
  )
}
