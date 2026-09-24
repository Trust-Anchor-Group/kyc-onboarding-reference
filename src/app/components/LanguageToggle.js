'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { content, useLanguage } from '../context/LanguageContext'
import ThemeToggle from './ThemeToggle'

const LANGUAGE_META = {
  en: { flag: '🇬🇧', short: 'EN' },
  sv: { flag: '🇸🇪', short: 'SV' },
  fr: { flag: '🇫🇷', short: 'FR' },
  es: { flag: '🇪🇸', short: 'ES' },
  pt: { flag: '🇵🇹', short: 'PT' },
  ar: { flag: '🇸🇦', short: 'AR' },
}

export default function LanguageToggle({ className = '' }) {
  const { language, setLanguage, languages } = useLanguage()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const current = LANGUAGE_META[language] || LANGUAGE_META.en
  const copy = content[language].access.navigation

  useEffect(() => {
    const closeOnOutsideInteraction = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const chooseLanguage = (code) => {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div className={`access-language-controls flex shrink-0 items-center gap-2 ${className}`}>
      <ThemeToggle />
      <div ref={menuRef} className="relative z-50">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={copy.selectLanguage}
          aria-haspopup="menu"
          aria-expanded={open}
          className={`access-language-toggle interactive-lift group flex min-h-9 items-center gap-2 rounded-full px-2.5 text-xs font-semibold tracking-wide transition ${open ? 'border-[var(--access-accent)]/70 bg-[var(--access-surface-subtle)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--access-accent)_12%,transparent)]' : ''}`}
        >
          <span className="grid h-5 w-5 place-items-center rounded-full bg-black/10 text-sm leading-none shadow-inner" aria-hidden="true">{current.flag}</span>
          <span className="hidden sm:inline">{current.short}</span>
          <Languages className="h-3.5 w-3.5 text-[var(--access-accent)] sm:hidden" aria-hidden="true" />
          <ChevronDown className={`h-3.5 w-3.5 text-[var(--access-text-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {open && (
          <div
            role="menu"
            aria-label={copy.chooseLanguage}
            className="access-language-menu absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-[var(--access-border)] p-1.5 shadow-[0_20px_56px_rgba(0,0,0,0.28)]"
          >
            <p className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--access-text-muted)]">{copy.language}</p>
            {languages.map(({ code, label }) => {
              const item = LANGUAGE_META[code] || LANGUAGE_META.en
              const selected = code === language
              return (
                <button
                  key={code}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => chooseLanguage(code)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-2.5 text-left text-sm transition ${selected ? 'bg-[var(--access-accent)]/14 text-[var(--access-text)]' : 'text-[var(--access-text-muted)] hover:bg-white/8 hover:text-[var(--access-text)]'}`}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-black/10 text-base shadow-inner" aria-hidden="true">{item.flag}</span>
                  <span className="flex-1 font-medium">{label}</span>
                  <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--access-accent)]">{item.short}</span>
                  {selected && <Check className="h-4 w-4 text-[var(--access-success)]" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
