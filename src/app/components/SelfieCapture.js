'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, ImageIcon, ScanFace, ShieldCheck } from 'lucide-react'
import AccessCaptureSurface from './AccessCaptureSurface'
import { CAPTURE_MODE } from '../lib/accessCapture.mjs'
import { CaptureTaskRail } from './IdentityCaptureWorkspace'
import { useStepper } from '../context/StepperContext'
import { prepareEvidenceImage } from '../lib/prepareEvidenceImage.mjs'
import { content, useLanguage } from '../context/LanguageContext'

export default function SelfieCapture({ onCapture, fixture = null }) {
  const { documents } = useStepper()
  const { language } = useLanguage()
  const copy = content[language].access.capture
  const [cameraOpen, setCameraOpen] = useState(Boolean(fixture))
  const liveHarness = fixture === 'live'
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  const acceptFile = async (file) => {
    if (!file?.type?.startsWith('image/')) {
      setMessage(copy.imageOnly)
      return
    }
    let prepared
    try {
      prepared = await prepareEvidenceImage(file, file.name)
    } catch {
      setMessage(copy.tooLarge)
      return
    }
    setMessage('')
    return onCapture?.(prepared)
  }

  return (
    <div className="space-y-3">
      {!cameraOpen && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(25,83,102,0.55),rgba(5,29,40,0.9))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
          <div className="mb-4 flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#29BF86]/15 text-[#5EE4B2]">
              <ScanFace className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{copy.clearSelfie}</p>
              <p className="mt-0.5 text-xs leading-5 text-[#9BC1CC]">{copy.selfieHint}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setCameraOpen(true)} className="group flex min-h-[78px] items-center gap-3 rounded-xl bg-[#FBB040] px-4 text-left text-[#002B3A] transition hover:-translate-y-0.5 hover:bg-[#ffc15c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBB040]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#002B3A]/10"><Camera className="h-5 w-5" /></span>
              <span><span className="block text-sm font-bold">{copy.useCamera}</span><span className="mt-0.5 block text-xs font-medium opacity-75">{copy.bestQuality}</span></span>
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex min-h-[78px] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-left text-white transition hover:-translate-y-0.5 hover:bg-white/[0.11] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10"><ImageIcon className="h-5 w-5" /></span>
              <span><span className="block text-sm font-bold">{copy.choosePhoto}</span><span className="mt-0.5 block text-xs text-white/60">{copy.formats}</span></span>
            </button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#9BC1CC]"><ShieldCheck className="h-3.5 w-3.5 text-[#5EE4B2]" /> {copy.encrypted}</p>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (event) => {
        await acceptFile(event.target.files?.[0])
        event.target.value = ''
      }} />

      {cameraOpen && createPortal((
        <div className="fixed inset-0 z-[100] bg-[#001D29] px-3 py-3 sm:px-6 sm:py-6">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
            <div className="mb-3 flex items-center justify-between text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FBB040]">Access</p>
                <h3 className="mt-1 text-base font-semibold">{copy.takeSelfie}</h3>
              </div>
              <button type="button" onClick={() => setCameraOpen(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">{content[language].access.launch.common.close}</button>
            </div>
            <CaptureTaskRail active="selfie" documents={documents} compact />
            <div className="min-h-0 flex-1">
              <AccessCaptureSurface
                mode={CAPTURE_MODE.SELFIE}
                language={language}
                copyOverride={copy}
                // A manual shutter is more reliable on real devices. The
                // coach remains advisory and cannot seize a photo while the
                // user is composing themselves.
                autoCapture={false}
                showCloseControl={false}
                fixture={liveHarness ? null : fixture}
                onCancel={() => setCameraOpen(false)}
                onChoosePhoto={() => {
                  setCameraOpen(false)
                  fileInputRef.current?.click()
                }}
                onCapture={async (file) => {
                  return acceptFile(file)
                }}
              />
            </div>
          </div>
        </div>
      ), document.body)}

      {message && <p className="text-sm text-[#F25567]" role="alert">{message}</p>}
    </div>
  )
}
