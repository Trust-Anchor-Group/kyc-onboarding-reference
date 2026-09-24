'use client'
import './globals.css'

import Script from 'next/script'
import { StepperProvider } from './context/StepperContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from '@/components/ui/use-toast'
import { AgentAPIProvider } from './context/AgentAPIProvider'
import SideMenu from './components/SideMenu'
import AccountInfoProbe from './components/AccountInfoProbe'
import { usePathname } from 'next/navigation'

const themeInitScript = `(() => {
  try {
    const stored = window.localStorage.getItem('access-theme') || window.sessionStorage.getItem('access-theme')
    const theme = stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  } catch {
    document.documentElement.dataset.theme = 'dark'
    document.documentElement.style.colorScheme = 'dark'
  }
})()`

export const dynamic = 'force-dynamic'

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const isOnboarding = pathname?.startsWith('/onboarding')
  const isHome = pathname === '/'
  const isLogin = pathname === '/login'
  const isDashboard = pathname?.startsWith('/dashboard')
  const showDesktopSidebar = !isOnboarding && !isHome && !isLogin && !isDashboard
  const baseUrl = process.env.NEXT_PUBLIC_AGENT_API_URL?.replace(/\/$/, '')
  const baseURI = process.env.NEXT_PUBLIC_AGENT_API_URI || (baseUrl ? new URL(baseUrl).host : '')

  return (
    <html lang="en" className="text-base antialiased" suppressHydrationWarning>
      <head>
        <title>Access by Neuro — Secure identity verification</title>
        <meta name="description" content="Verify your identity securely with Access by Neuro. Complete a guided identity check, track your application, and transfer your approved identity to Neuro Access." />
        <meta name="application-name" content="Access by Neuro" />
        <meta property="og:title" content="Access by Neuro — Secure identity verification" />
        <meta property="og:description" content="A private, guided identity verification experience with secure application tracking and Neuro Access transfer." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Access by Neuro" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Access by Neuro — Secure identity verification" />
        <meta name="twitter:description" content="Complete a private, guided identity verification and track your application securely." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {baseURI && <meta name="NEURON" content={baseURI} />}
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <link rel="icon" href="/favicon.ico?v=3" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/access-favicon-32.png?v=3" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/access-favicon-48.png?v=3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/access-favicon.png?v=3" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/access-favicon.png?v=3" />
        <Script id="access-theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        {baseUrl && <Script src={`${baseUrl}/Events.js`} strategy="beforeInteractive" />}
      </head>
      <body className="min-h-screen">
        <LanguageProvider>
          {isHome ? children : (
            <AgentAPIProvider>
              <ToastProvider>
                <StepperProvider>
                  <AccountInfoProbe />
                  {showDesktopSidebar && <SideMenu renderMobile={false} renderDesktop />}
                  {isOnboarding ? children : (
                    <div className={`relative min-h-screen w-full ${showDesktopSidebar ? 'lg:ml-[33.3333%] lg:w-2/3' : ''}`}>
                      {children}
                    </div>
                  )}
                </StepperProvider>
              </ToastProvider>
            </AgentAPIProvider>
          )}
        </LanguageProvider>
      </body>
    </html>
  )
}
