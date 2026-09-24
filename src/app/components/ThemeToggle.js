'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { content, useLanguage } from '../context/LanguageContext'

const STORAGE_KEY = 'access-theme'

function readTheme() {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function applyStoredTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(STORAGE_KEY)
  const next = stored === 'light' || stored === 'dark' ? stored : readTheme()
  document.documentElement.dataset.theme = next
  document.documentElement.style.colorScheme = next
  return next
}

export default function ThemeToggle() {
  const { language } = useLanguage()
  const copy = content[language].access.theme
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    setTheme(applyStoredTheme())
    const onVisible = () => {
      if (document.visibilityState === 'visible') setTheme(applyStoredTheme())
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onVisible)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = readTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    document.documentElement.style.colorScheme = nextTheme
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
    window.sessionStorage.setItem(STORAGE_KEY, nextTheme)
    setTheme(nextTheme)
  }

  const useLightTheme = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="access-theme-toggle interactive-lift inline-flex h-9 w-9 items-center justify-center rounded-full"
      aria-label={useLightTheme ? copy.light : copy.dark}
      title={useLightTheme ? copy.light : copy.dark}
    >
      {useLightTheme ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}
