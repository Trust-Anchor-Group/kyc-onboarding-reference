'use client'
import React, { useEffect } from 'react'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { useStepper } from '@/app/context/StepperContext'
import { useLanguage, content } from '@/app/context/LanguageContext'

const AUTO_DISMISS_MS = 3400

export default function AccountDetectedOverlay({ onContinue }) {
  const { language } = useLanguage()
  const t = content[language]
  useEffect(() => {
    const id = setTimeout(() => { onContinue && onContinue() }, AUTO_DISMISS_MS)
    return () => clearTimeout(id)
  }, [onContinue])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001d29]/95 px-6 text-white backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <div className="mx-auto flex w-fit items-center justify-center rounded-full bg-green-900/30 p-6">
          <ShieldCheck className="h-14 w-14 text-[#29BF86]" />
        </div>
        <h2 className="text-2xl font-semibold text-[#29BF86]">
          {t.accountDetected?.title || 'Account detected!'}
        </h2>
        <p className="text-[#7DA9B8] leading-snug text-base">
          {t.accountDetected?.subtitle || 'We logged you back in. Continue your application.'}
        </p>
        <p className="text-xs text-[#D5E8EE] inline-flex items-center gap-2 justify-center"><Sparkles className="h-3.5 w-3.5 text-[#FBB040]" />{t.accountDetected?.hint || 'Session restored securely.'}</p>
        <button
          onClick={onContinue}
          className="h-12 w-full rounded-xl bg-[#FBB040] text-lg font-semibold text-[#003043] transition active:scale-[0.97]"
        >
          {t.buttons?.continue || 'Continue'}
        </button>
      </div>
    </div>
  )
}
