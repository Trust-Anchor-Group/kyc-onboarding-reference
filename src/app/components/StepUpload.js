'use client'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useStepper } from '@/app/context/StepperContext'
import StepperLayout from '@/app/components/StepperLayout'
import { useLanguage, content } from '@/app/context/LanguageContext'
import { ImageIcon, Camera, CheckCircle2, X, Smartphone, Copy, Share2, TriangleAlert } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { AGENT_CONTENT } from '@/app/lib/agentKycPersistence.mjs'
import IdentityCaptureWorkspace, { CaptureTaskRail } from './IdentityCaptureWorkspace'
import AccessCaptureSurface from './AccessCaptureSurface'
import { CAPTURE_MODE } from '../lib/accessCapture.mjs'
import { prepareEvidenceImage } from '../lib/prepareEvidenceImage.mjs'

const MOBILE_HANDOFF_ENABLED = false

/* -------------------- Helpers -------------------- */

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

// Map doc type -> default aspect(s)
const aspectPresets = (docType) => {
  const presets = {
    Passport: [1.41, 0.71],      // landscape, portrait
    IDCard: [1.58, 0.63],        // landscape, portrait-ish
    DriverLicense: [1.58, 0.63], // landscape, portrait-ish
    Default: [1.58, 1.41]
  }
  return presets[docType] || presets.Default
}

// Decide filename based on docType + field
const pickFileName = (docType, fieldKey) => {
  if (fieldKey === 'frontPhoto') {
    if (docType === 'Passport') return 'Passport.jpeg'
    if (docType === 'IDCard') return 'IdCardFront.jpg'
    if (docType === 'DriverLicense') return 'DriverLicenseFront.jpg'
  } else if (fieldKey === 'backPhoto') {
    if (docType === 'IDCard') return 'IdCardBack.jpg'
    if (docType === 'DriverLicense') return 'DriverLicenseBack.jpg'
  }
  return `scan-${Date.now()}.jpeg`
}

/* -------------------- Component -------------------- */

const StepUpload = ({ stepKey, fieldKey, titleKey, title, description }) => {
  const { updateField, formData, documents, step, persistenceMode, getAgentDocumentFile, uxScenario, finishDocumentCapture } = useStepper()
  const { language } = useLanguage()
  const t = content[language]
  const captureCopy = t.access.capture
  const commonCopy = t.access.launch.common
  const { show } = useToast()

  const [file, setFile] = useState(null)
  const [isSaving, setIsSaving] = useState(uxScenario?.ui === 'saving')
  const [error, setError] = useState(uxScenario?.ui === 'capture-error' ? captureCopy.saveFailed : '')
  const [showCamera, setShowCamera] = useState(uxScenario?.capture?.mode === 'document')
  const [cameraFallbackVisible, setCameraFallbackVisible] = useState(false)
  const [qualityWarning, setQualityWarning] = useState('')
  const fileInputRef = useRef(null)
  const nativeCameraInputRef = useRef(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const [mobileHandoffUrl, setMobileHandoffUrl] = useState('')
  const [showHandoffModal, setShowHandoffModal] = useState(false)

  const docType = formData.documentType
  const initialAspects = useMemo(() => aspectPresets(docType), [docType])
  const [aspectIndex, setAspectIndex] = useState(0)
  const aspect = initialAspects[aspectIndex % initialAspects.length] || 1.58

  useEffect(() => {
    setAspectIndex(0)
  }, [docType])

  useEffect(() => {
    const evaluateViewport = () => {
      const desktopLike =
        window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
        window.matchMedia('(min-width: 1024px)').matches
      setIsDesktop(desktopLike)

      if (!MOBILE_HANDOFF_ENABLED) return
      const url = new URL(window.location.href)
      url.searchParams.set('step', String(step))
      setMobileHandoffUrl(url.toString())
    }
    evaluateViewport()
    window.addEventListener('resize', evaluateViewport)
    return () => window.removeEventListener('resize', evaluateViewport)
  }, [step])

  // Restore legacy data URLs or fetch an Agent-backed preview only into component memory.
  useEffect(() => {
    let previewUrl = null
    let cancelled = false
    const saved = ['frontPhoto', 'backPhoto', 'selfie'].includes(fieldKey)
      ? documents[fieldKey]
      : formData[fieldKey]
    if (!saved) {
      setFile(null)
    } else if (!saved.preview && saved.base64) {
      setFile({ ...saved, preview: `data:${saved.contentType || 'image/jpeg'};base64,${saved.base64}` })
    } else if (persistenceMode === AGENT_CONTENT && !saved.previewUrl) {
      getAgentDocumentFile(fieldKey)
        .then((restored) => {
          if (!restored || cancelled) return
          previewUrl = URL.createObjectURL(restored)
          setFile({ fileName: restored.name, contentType: restored.type, preview: previewUrl })
        })
        .catch(() => { if (!cancelled) setFile(null) })
    } else {
      setFile({ ...saved, preview: saved.previewUrl || saved.preview })
    }
    return () => { cancelled = true; if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [formData, documents, fieldKey, persistenceMode, getAgentDocumentFile])

  const assessImageQuality = async (dataUrl) => {
    const image = new window.Image()
    image.src = dataUrl
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
    })

    const maxWidth = 640
    const scale = Math.min(maxWidth / image.width, 1)
    const width = Math.max(1, Math.floor(image.width * scale))
    const height = Math.max(1, Math.floor(image.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(image, 0, 0, width, height)
    const { data } = ctx.getImageData(0, 0, width, height)

    let luminanceSum = 0
    let edgeEnergy = 0
    const rowStride = width * 4
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * rowStride + x * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        luminanceSum += lum

        if (x > 0) {
          const li = i - 4
          const lr = data[li]
          const lg = data[li + 1]
          const lb = data[li + 2]
          const ll = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
          edgeEnergy += Math.abs(lum - ll)
        }
        if (y > 0) {
          const ui = i - rowStride
          const ur = data[ui]
          const ug = data[ui + 1]
          const ub = data[ui + 2]
          const ul = 0.2126 * ur + 0.7152 * ug + 0.0722 * ub
          edgeEnergy += Math.abs(lum - ul)
        }
      }
    }

    const pixels = width * height
    const avgLuminance = luminanceSum / pixels
    const edgeScore = edgeEnergy / pixels

    if (avgLuminance < 55) return t.errors?.imageTooDark || 'The photo looks too dark. Increase lighting and retake for best verification accuracy.'
    if (edgeScore < 18) return t.errors?.imageBlurry || 'The photo may be blurry. Hold steady and retake for best verification accuracy.'
    return ''
  }

  const handleFileChange = async (e) => {
    const inputEl = e.target
    const selectedFile = e.target.files[0]
    if (!selectedFile) {
      inputEl.value = ''
      return
    }
    if (!selectedFile.type.startsWith('image/')) {
      setError(t.errors?.fileType || 'Ogiltig filtyp.')
      return
    }
    let uploaded
    try {
      uploaded = await prepareEvidenceImage(selectedFile, pickFileName(docType, fieldKey))
    } catch {
      setError(t.errors?.fileSize || 'This photo is too large to save. Please choose a smaller image.')
      inputEl.value = ''
      return
    }
    if (uploaded.size > 5 * 1024 * 1024) {
      setError(t.errors?.fileSize || 'Filen är för stor (max 5 MB).')
      return
    }

    const fileName = pickFileName(docType, fieldKey)
    if (persistenceMode === AGENT_CONTENT) {
      const preview = URL.createObjectURL(uploaded)
      setIsSaving(true)
      updateField(fieldKey, uploaded).then((saved) => {
        if (!saved) {
          URL.revokeObjectURL(preview)
          setError(t.errors?.uploadFailed || 'Could not save the image. Please try again.')
          return
        }
        setFile({ fileName, contentType: uploaded.type, preview })
        setCameraFallbackVisible(false)
        setError('')
        advanceAfterSave()
      }).finally(() => setIsSaving(false))
      inputEl.value = ''
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1]
      const result = { fileName, contentType: uploaded.type, base64 }
      updateField(fieldKey, result)
      setFile({ ...result, preview: reader.result })
      setCameraFallbackVisible(false)
      setError('')
      advanceAfterSave()
      try {
        const warning = await assessImageQuality(reader.result)
        setQualityWarning(warning)
      } catch {
        setQualityWarning('')
      }
      inputEl.value = ''
    }
    reader.readAsDataURL(uploaded)
  }

  const openCamera = () => {
    setCameraFallbackVisible(false)
    const hasWebCameraApi = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
    if (!hasWebCameraApi) {
      nativeCameraInputRef.current?.click()
      return
    }
    setShowCamera(true)
  }

  // AccessCaptureSurface returns the original high-resolution evidence file.
  // Do not crop, rotate, or perspective-transform it before Agent persistence.
  const handleAccessCapture = async (captured) => {
    if (!captured) return
    const fileName = pickFileName(docType, fieldKey)
    let fileToPersist
    try {
      fileToPersist = await prepareEvidenceImage(
        new File([captured], fileName, { type: captured.type || 'image/jpeg' }),
        fileName,
      )
    } catch {
      setError(t.errors?.fileSize || 'This photo is too large to save. Please retake it a little closer.')
      return false
    }

    // Development acceptance sessions deliberately have no real Agent vault.
    // Keep physical camera test evidence only in component memory so device QA
    // can preview and retake without touching Agent Content or Legal. Record
    // only a completion marker so the normal onboarding gate can advance.
    if (uxScenario?.deviceTest) {
      const preview = URL.createObjectURL(fileToPersist)
      const saved = await updateField(fieldKey, fileToPersist)
      if (!saved) {
        URL.revokeObjectURL(preview)
        setError(t.errors?.uploadFailed || 'Could not save the image. Please try again.')
        return false
      }
      setFile((previous) => {
        if (previous?.preview?.startsWith?.('blob:')) URL.revokeObjectURL(previous.preview)
        return { fileName, contentType: fileToPersist.type, preview }
      })
      setError('')
      advanceAfterSave()
      return true
    }

    if (persistenceMode === AGENT_CONTENT) {
      const preview = URL.createObjectURL(fileToPersist)
      setIsSaving(true)
      const saved = await updateField(fieldKey, fileToPersist)
      setIsSaving(false)
      if (!saved) {
        URL.revokeObjectURL(preview)
        setError(t.errors?.uploadFailed || 'Could not save the image. Please try again.')
        return
      }
      setFile({ fileName, contentType: fileToPersist.type, preview })
      setError('')
      advanceAfterSave()
      return true
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = String(reader.result || '')
      const base64 = dataUrl.split(',')[1]
      if (!base64) return
      updateField(fieldKey, { fileName, contentType: fileToPersist.type, base64 })
      setFile({ fileName, contentType: fileToPersist.type, base64, preview: dataUrl })
      setError('')
      advanceAfterSave()
      assessImageQuality(dataUrl).then(setQualityWarning).catch(() => setQualityWarning(''))
    }
    reader.readAsDataURL(fileToPersist)
    return true
  }

  const handleNext = () => {
    if (!file) {
      setError(t.errors?.fileRequired || 'Please upload a photo.')
      return
    }
    finishDocumentCapture(step + 1)
  }

  const advanceAfterSave = () => {
    // Keep the applicant on the saved preview. This avoids an abrupt step
    // transition on mobile and gives them a clear chance to confirm or retake
    // the image before using Continue.
  }

  // Crop exactly what’s inside the center guideline box (no detection).
  const handleCapture = async () => {
    const video = webcamRef.current?.video
    if (!video || video.readyState < 2) {
      setError('Kameran är inte redo ännu.')
      return
    }

    const { w: vw, h: vh } = capDimensions(video.videoWidth, video.videoHeight)
    const frame = document.createElement('canvas')
    frame.width = vw
    frame.height = vh
    const fctx = frame.getContext('2d', { willReadFrequently: true })
    fctx.drawImage(video, 0, 0, vw, vh)

    // Compute guideline box (centered)
    let gw = Math.floor(vw * GUIDE_WIDTH_FRAC)
    let gh = Math.floor(gw / aspect)
    if (gh > vh * 0.9) {
      gh = Math.floor(vh * 0.9)
      gw = Math.floor(gh * aspect)
    }
    const gx = Math.floor((vw - gw) / 2)
    const gy = Math.floor((vh - gh) / 2)

    // Crop ROI
    const roi = fctx.getImageData(gx, gy, gw, gh)
    const out = document.createElement('canvas')
    out.width = gw
    out.height = gh
    const octx = out.getContext('2d')
    octx.putImageData(roi, 0, 0)

    // Optional rescale to a friendly width
    const TARGET_MAX_W = 1200
    let exportCanvas = out
    if (gw > TARGET_MAX_W) {
      const scale = TARGET_MAX_W / gw
      const rw = Math.floor(gw * scale)
      const rh = Math.floor(gh * scale)
      const res = document.createElement('canvas')
      res.width = rw
      res.height = rh
      const rctx = res.getContext('2d')
      rctx.imageSmoothingQuality = 'high'
      rctx.drawImage(out, 0, 0, rw, rh)
      exportCanvas = res
    }

    const base64Image = exportCanvas.toDataURL('image/jpeg', 0.92)
    const base64 = base64Image.split(',')[1]

    if (persistenceMode === AGENT_CONTENT) {
      const blob = await new Promise((resolve) => exportCanvas.toBlob(resolve, 'image/jpeg', 0.92))
      if (!blob) {
        setError(t.errors?.uploadFailed || 'Could not capture the image.')
        return
      }
      const captured = new File([blob], pickFileName(docType, fieldKey), { type: 'image/jpeg' })
      const preview = URL.createObjectURL(captured)
      setIsSaving(true)
      const saved = await updateField(fieldKey, captured)
      setIsSaving(false)
      if (!saved) {
        URL.revokeObjectURL(preview)
        setError(t.errors?.uploadFailed || 'Could not save the image. Please try again.')
        return
      }
      setFile({ fileName: captured.name, contentType: captured.type, preview })
      setShowCamera(false)
      setError('')
      advanceAfterSave()
      assessImageQuality(base64Image).then(setQualityWarning).catch(() => setQualityWarning(''))
      return
    }

    const result = {
      fileName: pickFileName(docType, fieldKey),
      contentType: 'image/jpeg',
      base64,
    }

    updateField(fieldKey, result)
    setFile({ ...result, preview: base64Image })
    setShowCamera(false)
    setError('')
    advanceAfterSave()

    assessImageQuality(base64Image)
      .then(setQualityWarning)
      .catch(() => setQualityWarning(''))
  }

  const cycleAspect = () => {
    setAspectIndex((i) => (i + 1) % initialAspects.length)
  }

  const copyHandoffLink = async () => {
    if (!mobileHandoffUrl) return
    try {
      await navigator.clipboard.writeText(mobileHandoffUrl)
      show({ title: t.labels?.mobileLinkCopied || 'Mobile link copied. Open it on your phone.', variant: 'success' })
    } catch {
      show({ title: t.errors?.copyFailed || 'Could not copy link. Please copy manually.', variant: 'error' })
    }
  }

  const shareToPhone = async () => {
    if (!mobileHandoffUrl) return
    try {
      if (navigator.share) {
        await navigator.share({ title: t.labels?.openOnPhone || 'Open on your phone', url: mobileHandoffUrl })
        return
      }
      await copyHandoffLink()
    } catch {}
  }

  const openHandoffModal = () => {
    if (!MOBILE_HANDOFF_ENABLED) return
    if (!mobileHandoffUrl) {
      const url = new URL(window.location.href)
      url.searchParams.set('step', String(step))
      setMobileHandoffUrl(url.toString())
    }
    setShowHandoffModal(true)
  }

  return (
    <StepperLayout titleKey={titleKey} title={title} description={description} onNext={handleNext} isNextDisabled={!file}>
      <div className="space-y-5">
        <IdentityCaptureWorkspace active={fieldKey} documents={documents}>
        <div>
          <div className="grid gap-3 sm:grid-cols-[1.25fr,1fr]">
            <button
              type="button"
              onClick={openCamera}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FBB040] font-semibold text-[#001F2D] transition hover:bg-[#e09c33]"
            >
              <Camera className="h-5 w-5" />
              {t.buttons?.camera || 'Use camera'}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 font-semibold text-white transition hover:bg-white/10"
            >
              <ImageIcon className="h-5 w-5" />
              {t.buttons?.upload || 'Choose a photo'}
            </button>

          </div>
        </div>

        {isDesktop && mobileHandoffUrl && (
          <div className="rounded-2xl border border-[#FBB040]/30 bg-[#0B2C3D]/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#FBB040]">
              <Smartphone className="h-4 w-4" />
              {t.labels?.openOnPhone || 'Take this photo on your phone'}
            </div>
            <p className="mb-3 text-xs text-[#7DA9B8]">
              {t.labels?.openOnPhoneHint || 'Scan the QR code or send the link to your phone. You will continue in the same secure session.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=132x132&data=${encodeURIComponent(mobileHandoffUrl)}`}
                alt="Open onboarding on mobile"
                width={132}
                height={132}
                unoptimized
                className="h-[132px] w-[132px] rounded-xl border border-white/15 bg-white p-2"
              />
              <div className="flex flex-1 gap-2 sm:flex-col">
                <button
                  type="button"
                  onClick={copyHandoffLink}
                  className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white/10"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t.buttons?.copyLink || 'Copy link'}
                </button>
                <button
                  type="button"
                  onClick={shareToPhone}
                  className="flex h-10 flex-1 items-center justify-center gap-1 rounded-xl bg-[#FBB040] text-xs font-semibold text-[#003043] hover:bg-[#e09c33]"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t.buttons?.shareToPhone || 'Share to phone'}
                </button>
              </div>
            </div>
          </div>
        )}

        {cameraFallbackVisible && (
          <div className="rounded-xl border border-[#F25567]/35 bg-[#F25567]/10 p-3 text-xs text-[#F25567]">
            <p className="mb-2 flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>{t.errors?.cameraUnavailable || 'Camera access was denied or unavailable. Use your device camera instead.'}</span>
            </p>
            <button
              type="button"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#F25567]/45 bg-[#F25567]/15 px-3 text-xs font-semibold text-[#F25567] hover:bg-[#F25567]/20"
            >
              {t.buttons?.camera || 'Open camera'}
            </button>
          </div>
        )}

        {file?.preview && (
          <div className="relative overflow-hidden rounded-2xl border border-[#FBB040]/30 bg-[#0B2C3D]/60 p-3 shadow-xl">
            <Image
              src={file.preview}
              alt="Preview"
              width={960}
              height={600}
              unoptimized
              className="h-auto max-h-[280px] w-full rounded-xl object-contain transition duration-300 ease-in-out"
            />
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-[#D5E8EE]" aria-live="polite">
                <CheckCircle2 className="h-4 w-4 text-[#29BF86]" />
                <span>{isSaving ? commonCopy.saving : commonCopy.saved}</span>
              </div>
              <button
                type="button"
                onClick={openCamera}
                disabled={isSaving}
                className="rounded-lg border border-[#FBB040]/40 px-3 py-1 text-xs font-semibold text-[#FBB040] transition hover:bg-[#FBB040]/10"
              >
                {t.actions?.retake || 'Retake Photo'}
              </button>
            </div>
          </div>
        )}

        {qualityWarning && (
          <div className="rounded-xl border border-[#FBB040]/35 bg-[#FBB040]/10 p-3 text-xs text-[#FBB040]">
            <p className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
              <span>{qualityWarning}</span>
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {showCamera && createPortal((
          <div className="fixed inset-0 z-[100] bg-[#001D29] px-3 py-3 sm:px-6 sm:py-6">
            <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
              <div className="mb-3 flex items-center justify-between text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FBB040]">Access</p>
                  <h3 className="mt-1 text-base font-semibold">{fieldKey === 'frontPhoto' ? captureCopy.front : captureCopy.back}</h3>
                </div>
                <button type="button" onClick={() => setShowCamera(false)} className="rounded-xl px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10" aria-label={captureCopy.closeCamera}>{commonCopy.close}</button>
              </div>
              <CaptureTaskRail active={fieldKey} documents={documents} compact />
              <div className="min-h-0 flex-1">
                {/* Real-device testing rejected document auto-trigger until
                    boundary detection is reliably calm on physical phones. */}
                <AccessCaptureSurface
                  mode={CAPTURE_MODE.DOCUMENT}
                  language={language}
                  copyOverride={captureCopy}
                  aspect={aspect}
                  autoCapture={false}
                  showCloseControl={false}
                  fixture={uxScenario?.capture?.mode === 'document' ? uxScenario.capture.state : null}
                  onCapture={handleAccessCapture}
                  onCancel={() => setShowCamera(false)}
                  onChoosePhoto={() => {
                    setShowCamera(false)
                    fileInputRef.current?.click()
                  }}
                />
              </div>
            </div>
          </div>
        ), document.body)}

        {showHandoffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
            <div className="w-full max-w-md rounded-2xl border border-[#FBB040]/35 bg-[#001D29] p-5 text-white shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#FBB040]">
                  {t.labels?.openOnPhone || 'Take this step on your phone'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowHandoffModal(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5"
                  aria-label={t.buttons?.close || 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-4 text-sm text-[#D5E8EE]">
                {t.labels?.openOnPhoneHint || 'Scan the QR code or share this secure link to continue this exact step on your phone.'}
              </p>

              <div className="mb-4 flex items-center justify-center">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mobileHandoffUrl)}`}
                  alt="Open onboarding on mobile"
                  width={220}
                  height={220}
                  unoptimized
                  className="rounded-xl border border-white/20 bg-white p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={copyHandoffLink}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <Copy className="h-4 w-4" />
                  {t.buttons?.copyLink || 'Copy link'}
                </button>
                <button
                  type="button"
                  onClick={shareToPhone}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FBB040] text-sm font-semibold text-[#003043] hover:bg-[#e09c33]"
                >
                  <Share2 className="h-4 w-4" />
                  {t.buttons?.shareToPhone || 'Share to phone'}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

        </IdentityCaptureWorkspace>
      </div>
    </StepperLayout>
  )
}

export default StepUpload
