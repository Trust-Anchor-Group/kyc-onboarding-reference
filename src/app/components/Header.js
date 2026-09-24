'use client'

import { useRouter } from 'next/navigation'
import { Menu } from 'lucide-react'
import LanguageToggle from './LanguageToggle'
import { AccessMark } from './AccessBrand'

export default function HeaderBar({
  showBack = true,
  onBackClick,
  onMenuClick,
}) {
  const router = useRouter()

  const handleBack = () => {
    if (onBackClick) return onBackClick()
    router.back()
  }

  return (
    <header className="access-mobile-header relative flex items-center justify-between gap-2 px-4 pt-6">
      {showBack ? (
        <button onClick={handleBack} className="text-white text-xl">
          &larr;
        </button>
      ) : (
        <button
          onClick={onMenuClick}
          className="p-2 bg-[#002B3F] rounded-md lg:hidden"
        >
          <Menu className="text-white w-5 h-5" />
        </button>
      )}

        <button
          onClick={() => router.push('/')}
          aria-label="Go to home page"
          className="access-mobile-brand absolute left-1/2 top-[70%] z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none lg:static lg:transform-none lg:top-auto lg:left-auto lg:translate-x-0 lg:translate-y-0"
        >
        <AccessMark compact />
      </button>

      <div className="access-mobile-controls lg:ml-auto">
        <LanguageToggle />
      </div>
    </header>
  )
}
