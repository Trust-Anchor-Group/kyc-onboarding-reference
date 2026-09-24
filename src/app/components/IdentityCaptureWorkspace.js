'use client'

import { CheckCircle2 } from 'lucide-react'
import { content, useLanguage } from '../context/LanguageContext'

export const captureTasks = [
  { key: 'frontPhoto', label: 'Front of ID' },
  { key: 'backPhoto', label: 'Back of ID' },
  { key: 'selfie', label: 'Selfie' },
]

export function CaptureTaskRail({ active, documents, compact = false }) {
  const { language } = useLanguage()
  const copy = content[language].access.capture
  const localizedTasks = [
    { key: 'frontPhoto', label: copy.frontShort },
    { key: 'backPhoto', label: copy.backShort },
    { key: 'selfie', label: copy.selfie },
  ]
  const activeIndex = localizedTasks.findIndex((task) => task.key === active)
  return (
    <div className={compact ? 'grid grid-cols-3 border-t border-white/10' : 'grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.025] p-1.5'} aria-label={copy.progress}>
          {localizedTasks.map(({ key, label }, index) => {
            const complete = documents?.[key]?.status === 'uploaded'
            const isActive = key === active
            return (
              <div key={key} className={`relative flex min-h-11 items-center justify-center gap-1.5 px-2 text-center text-xs ${isActive ? 'font-semibold text-white' : complete ? 'text-white/70' : 'text-white/38'}`}>
                {complete ? <CheckCircle2 className="h-3.5 w-3.5 text-[#5ED6A8]" /> : <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#FBB040]' : 'bg-white/20'}`} />}
                <span>{label}</span>
                {isActive && <span className="absolute inset-x-4 bottom-0 h-px bg-[#FBB040]" />}
                <span className="sr-only">{complete ? copy.saved : isActive ? copy.current : index > activeIndex ? copy.next : copy.available}</span>
              </div>
            )
          })}
    </div>
  )
}

export default function IdentityCaptureWorkspace({ active, documents, children }) {
  return (
    <div className="space-y-4">
      <CaptureTaskRail active={active} documents={documents} />
      {children}
    </div>
  )
}
