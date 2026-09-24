'use client'

import React, { useEffect, useState } from 'react'
import { useStepper } from '../context/StepperContext'
import { Button } from '@/components/ui/button'
import LanguageToggle from './LanguageToggle'
import { useLanguage, content } from '@/app/context/LanguageContext'
import { useRouter } from 'next/navigation'
import { Space_Grotesk } from 'next/font/google'
import { ChevronLeft, CheckCircle2, Circle, Loader2, WifiOff, RefreshCw } from 'lucide-react'
import { getOnboardingPhase, getOnboardingPhaseIndex, getPrimaryActionLabel, ONBOARDING_PHASES } from './onboardingJourney.mjs'
import { AccessMark } from './AccessBrand'

const totalSteps = 18
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'], display: 'swap' })

export default function StepperLayout({
  titleKey,
  title,
  description,
  children,
  showBack = true,
  showNext = true,
  onNext,
  isNextDisabled = false,
  customButton = null,
  contentClassName = '',
  headerIcon = null,
  descriptionClassName = '',
  hideMobileActions = false,
  nextLabel = null,
  wide = false,
  showProgress = true,
  actionClassName = '',
}) {
  const { step, setStep, syncStatus, forceSyncNow } = useStepper()
  const { language } = useLanguage()
  const router = useRouter()
  const t = content[language]
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  const phase = getOnboardingPhase(step)
  const phaseIndex = getOnboardingPhaseIndex(step)

  const syncMeta = {
    ephemeral: { label: '', icon: Circle, className: 'text-[#7DA9B8]' },
    idle: { label: 'Saved securely', icon: CheckCircle2, className: 'text-[#7DA9B8]' },
    saving: { label: 'Saving securely', icon: Loader2, className: 'text-[#FBB040]' },
    saved: { label: 'Saved securely', icon: CheckCircle2, className: 'text-[#29BF86]' },
    offline: { label: 'Your progress needs attention', icon: WifiOff, className: 'text-[#F25567]' },
  }
  const status = syncMeta[syncStatus] || syncMeta.idle
  const StatusIcon = status.icon

  const handleLogoClick = (e) => {
    if (step >= 0 && step < totalSteps - 1) {
      e.preventDefault();
      setShowLeaveModal(true);
    } else {
      router.push('/')
    }
  }

  const confirmLeave = () => {
    setShowLeaveModal(false)
    router.push('/')
  }

  const cancelLeave = () => {
    setShowLeaveModal(false)
  }

  const handleNext = (e) => {
    e?.preventDefault?.()
    if (onNext) return onNext(e)
    setStep((prev) => Math.min(prev + 1, totalSteps - 1))
  }

  const handleBack = () => {
    // Progressive lock gates: once a gate is reached, user cannot navigate back before it.
    const GATES = [1, 2, 3, 10]
    setStep(prev => {
      const next = prev - 1
      // Determine highest gate reached
      const highestGate = GATES.reduce((acc, g) => (prev >= g ? g : acc), -1)
      if (highestGate !== -1 && next < highestGate) return prev
      return Math.max(next, 0)
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const onMediaChange = () => setIsMobileViewport(mediaQuery.matches)
    onMediaChange()

    const visualViewport = window.visualViewport

    const isTextEntryElement = (target) => {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
    }

    const syncKeyboardState = () => {
      const active = document.activeElement
      if (!isTextEntryElement(active) || !isMobileViewport) {
        setIsKeyboardOpen(false)
        return
      }

      if (!visualViewport) {
        setIsKeyboardOpen(true)
        return
      }

      const keyboardLikelyOpen = window.innerHeight - visualViewport.height > 140
      setIsKeyboardOpen(keyboardLikelyOpen)
    }

    const onFocusIn = (event) => {
      const target = event.target
      if (!isMobileViewport || !isTextEntryElement(target)) return
      setTimeout(() => {
        if (target instanceof HTMLElement) {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      }, 220)
      syncKeyboardState()
    }

    const onFocusOut = () => {
      setTimeout(syncKeyboardState, 140)
    }

    mediaQuery.addEventListener('change', onMediaChange)
    window.addEventListener('focusin', onFocusIn)
    window.addEventListener('focusout', onFocusOut)
    visualViewport?.addEventListener('resize', syncKeyboardState)

    return () => {
      mediaQuery.removeEventListener('change', onMediaChange)
      window.removeEventListener('focusin', onFocusIn)
      window.removeEventListener('focusout', onFocusOut)
      visualViewport?.removeEventListener('resize', syncKeyboardState)
    }
  }, [isMobileViewport])

  const actionButton = customButton
    ? React.cloneElement(customButton, {
        children: customButton.props.children || t.buttons?.continue || 'Continue',
      })
    : showNext && (
        <Button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`h-12 w-full rounded-xl text-base font-semibold transition-all duration-200 ${
            isNextDisabled
              ? 'border border-[var(--access-border)] bg-[color-mix(in_srgb,var(--access-accent)_14%,var(--access-surface))] text-[var(--access-text-muted)] cursor-not-allowed'
              : 'bg-[#FBB040] text-[#003043] hover:bg-[#e09c33]'
          }`}
        >
          {nextLabel || t.access?.navigation?.actions?.[step] || getPrimaryActionLabel(step, t.buttons?.continue || 'Continue')}
        </Button>
      )

  return (
    <div className="access-shell relative min-h-[100dvh] overflow-x-hidden">
      <div className={`relative z-10 mx-auto flex min-h-[100dvh] w-full ${wide ? 'max-w-[1180px]' : 'max-w-[760px]'} flex-col px-5 pt-4 sm:px-10 lg:pb-14 lg:pt-7 ${isKeyboardOpen ? 'pb-8' : 'pb-[calc(7rem+env(safe-area-inset-bottom))]'}`}>
        <header className="access-header sticky top-0 z-20 mb-8 px-0 py-2 backdrop-blur-xl sm:mb-12">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {showBack ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="interactive-lift inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white hover:bg-white/10"
                  aria-label={t.buttons?.back || 'Back'}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <span className="inline-flex h-9 w-9" aria-hidden="true" />
              )}

              <button
                onClick={handleLogoClick}
                aria-label="Go to home page"
                className="focus:outline-none"
              >
                <AccessMark compact />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className={`hidden items-center gap-1.5 text-[11px] font-medium ${status.className} sm:inline-flex ${status.label ? '' : 'invisible'}`} aria-live="polite">
                <StatusIcon className={`h-3.5 w-3.5 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
                <span>{status.label}</span>
              </div>
              {syncStatus === 'offline' && (
                <button
                  type="button"
                  onClick={forceSyncNow}
                  className="hidden items-center gap-1 rounded-full border border-[#F25567]/40 bg-[#F25567]/10 px-2.5 py-1 text-[11px] font-semibold text-[#F25567] transition hover:bg-[#F25567]/20 sm:inline-flex"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t.buttons?.retrySync || 'Retry sync'}
                </button>
              )}
              <div>
                <LanguageToggle />
              </div>
            </div>
          </div>

          {showProgress && <div className="mt-4 flex justify-end" aria-label={`${t.access?.navigation?.phases?.[phase.key] || phase.label}, ${phaseIndex + 1} ${t.access?.navigation?.of || 'of'} ${ONBOARDING_PHASES.length}`}>
            <div className="flex gap-1.5" aria-hidden="true">
              {ONBOARDING_PHASES.map((item, index) => <span key={item.key} className={`h-1.5 rounded-full transition-all duration-300 ${index === phaseIndex ? 'w-6 bg-[var(--access-accent)]' : index < phaseIndex ? 'w-1.5 bg-[var(--access-success)]' : 'w-1.5 bg-[var(--access-border)]'}`} />)}
            </div>
          </div>}
        </header>

        <main className="flex-1">
          <section>
            {headerIcon && <div className="mb-5">{headerIcon}</div>}

            <h1 className={`${spaceGrotesk.className} max-w-2xl text-[2rem] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-5xl`}>
              {title || (titleKey ? t.steps?.[titleKey] : '')}
            </h1>

            {description && (
              <p className={`access-copy mt-3 max-w-xl text-base leading-relaxed sm:mt-4 sm:text-lg ${descriptionClassName}`}>
                {description}
              </p>
            )}

            <div className={`mt-7 sm:mt-10 ${contentClassName || ''}`}>
              {children}
            </div>

            <div className="access-step-actions mt-10 hidden items-center gap-3 lg:flex">
              {showBack && (
                <Button
                  type="button"
                  onClick={handleBack}
                  className="interactive-lift h-12 rounded-xl border border-white/15 bg-white/5 px-5 text-white hover:bg-white/10"
                >
                  {t.buttons?.back || 'Back'}
                </Button>
              )}
              <div className={`flex-1 ${actionClassName}`}>{actionButton}</div>
            </div>
          </section>
        </main>
      </div>

      <footer className={`access-footer fixed bottom-0 left-0 z-20 w-full border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-2xl lg:hidden ${isKeyboardOpen || hideMobileActions ? 'hidden' : ''}`}>
        <div className="mx-auto flex w-full max-w-xl items-center gap-3">
          {showBack && (
            <Button
              type="button"
              onClick={handleBack}
              className="interactive-lift h-12 min-w-20 rounded-xl border border-white/15 bg-white/5 px-4 text-white hover:bg-white/10"
            >
              {t.buttons?.back || 'Back'}
            </Button>
          )}
          <div className="flex-1">{actionButton}</div>
        </div>
        {status.label && <div className={`mt-2 flex items-center justify-center gap-1.5 text-[11px] ${status.className}`}>
          <StatusIcon className={`h-3.5 w-3.5 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
          <span>{status.label}</span>
          {syncStatus === 'offline' && (
            <button
              type="button"
              onClick={forceSyncNow}
              className="ml-2 inline-flex items-center gap-1 rounded-full border border-[#F25567]/40 bg-[#F25567]/10 px-2 py-0.5 text-[10px] font-semibold text-[#F25567]"
            >
              <RefreshCw className="h-3 w-3" />
              {t.buttons?.retrySync || 'Retry sync'}
            </button>
          )}
        </div>}
      </footer>

      {/* Leave modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#FBB040]/40 bg-[#001D29] p-6 text-center shadow-2xl">
            <h2 className="mb-2 text-xl font-bold">{t.labels?.leaveTitle || 'Leave onboarding?'}</h2>
            <p className="mb-5 text-[#7DA9B8]">{t.labels?.leaveWarning || 'If you leave now, your onboarding progress will be lost.'}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={cancelLeave}
                className="rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white"
              >
                {t.buttons?.cancel || 'Cancel'}
              </button>
              <button
                onClick={confirmLeave}
                className="rounded-lg bg-[#FBB040] px-4 py-2 font-semibold text-black"
              >
                {t.buttons?.leave || 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
