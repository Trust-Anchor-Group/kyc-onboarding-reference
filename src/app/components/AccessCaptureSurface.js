'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CameraOff,
  Check,
  RefreshCw,
  SwitchCamera,
  X,
} from 'lucide-react'

import {
  CAPTURE_GUIDE,
  CAPTURE_MODE,
  CAPTURE_STATE,
  analyzeLumaFrame,
  classifyDocumentFrame,
  copyForInstruction,
  createStabilityTracker,
  findDocumentRegion,
  shouldAutoCapture,
} from '../lib/accessCapture.mjs'

const ANALYSIS_CANVAS =
  typeof document !== 'undefined'
    ? document.createElement('canvas')
    : null

const DOCUMENT_ANALYSIS_W = 288
const DOCUMENT_ANALYSIS_H = 216
const DOCUMENT_ANALYSIS_INTERVAL_MS = 180

const FIXTURE_STATES = Object.freeze({
  preparing: { state: CAPTURE_STATE.PREPARING_CAMERA },
  'permission-denied': { state: CAPTURE_STATE.PERMISSION_REQUIRED },
  'not-found': { state: CAPTURE_STATE.COACHING, instruction: 'document_not_found' },
  'too-small': { state: CAPTURE_STATE.COACHING, instruction: 'document_too_small' },
  clipped: { state: CAPTURE_STATE.COACHING, instruction: 'document_clipped' },
  'too-dark': { state: CAPTURE_STATE.COACHING, instruction: 'too_dark' },
  blurred: { state: CAPTURE_STATE.COACHING, instruction: 'blur' },
  'no-face': { state: CAPTURE_STATE.COACHING, instruction: 'face_not_found' },
  'too-far': { state: CAPTURE_STATE.COACHING, instruction: 'face_too_far' },
  'too-close': { state: CAPTURE_STATE.COACHING, instruction: 'face_too_close' },
  'off-center': { state: CAPTURE_STATE.COACHING, instruction: 'face_center' },
  multiple: { state: CAPTURE_STATE.COACHING, instruction: 'multiple_faces' },
  dark: { state: CAPTURE_STATE.COACHING, instruction: 'too_dark' },
  ready: { state: CAPTURE_STATE.READY_TO_CAPTURE },
  captured: { state: CAPTURE_STATE.CAPTURED },
  saving: { state: CAPTURE_STATE.SAVING },
  durable: { state: CAPTURE_STATE.DURABLE },
  'save-failure': { state: CAPTURE_STATE.ERROR },
})

/**
 * Choose ideal, non-fragile constraints for a mode + facing preference.
 *
 * We use "ideal" dimensions so browsers can negotiate the closest supported
 * camera resolution instead of failing because one exact resolution is not
 * available.
 */
function buildConstraints(mode, facingMode) {
  const isDocument = mode === CAPTURE_MODE.DOCUMENT

  return {
    audio: false,
    video: {
      facingMode: { ideal: facingMode },
      width: {
        ideal: isDocument ? 1600 : 640,
      },
      height: {
        ideal: isDocument ? 1200 : 480,
      },
    },
  }
}

async function requestCameraStream(mode, facingMode, onAttempt) {
  const candidates = [
    buildConstraints(mode, facingMode),
    { audio: false, video: { facingMode: { ideal: facingMode } } },
    { audio: false, video: true },
  ]
  let lastError

  for (let attempt = 0; attempt < candidates.length; attempt += 1) {
    const constraints = candidates[attempt]
    try {
      onAttempt?.(attempt + 1)
      return { stream: await navigator.mediaDevices.getUserMedia(constraints), attempt: attempt + 1 }
    } catch (error) {
      lastError = error
      // Permission cannot be improved by relaxing dimensions or facing mode.
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') throw error
    }
  }

  throw lastError || new Error('CAMERA_UNAVAILABLE')
}

const cameraDebugEnabled = () =>
  process.env.NODE_ENV !== 'production' ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('__captureDebug'))

const cameraErrorCode = (error) => {
  if (!window.isSecureContext) return 'INSECURE_CONTEXT'
  return error?.name || 'CAMERA_UNAVAILABLE'
}

const waitForVideoReady = (video) => {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve()
  return new Promise((resolve) => {
    const complete = () => {
      video.removeEventListener('loadeddata', complete)
      resolve()
    }
    video.addEventListener('loadeddata', complete, { once: true })
    // Some Android browsers expose a playable stream before firing loadeddata.
    window.setTimeout(complete, 1500)
  })
}

/**
 * Extract a luminance plane from RGBA data.
 */
function lumaFromRgba(data, width, height) {
  const luma = new Float32Array(width * height)

  for (let i = 0, p = 0; i < width * height; i += 1, p += 4) {
    luma[i] =
      0.299 * data[p] +
      0.587 * data[p + 1] +
      0.114 * data[p + 2]
  }

  return luma
}

/**
 * Downscale a live frame for lightweight analysis.
 *
 * The accepted/captured image still comes from the native video resolution or
 * ImageCapture. This canvas is analysis-only.
 */
function sampleFrame(video) {
  if (
    !ANALYSIS_CANVAS ||
    !video ||
    !video.videoWidth ||
    !video.videoHeight
  ) {
    return null
  }

  const ctx = ANALYSIS_CANVAS.getContext('2d', {
    willReadFrequently: true,
  })

  if (!ctx) return null

  const width = DOCUMENT_ANALYSIS_W
  const height = DOCUMENT_ANALYSIS_H

  ANALYSIS_CANVAS.width = width
  ANALYSIS_CANVAS.height = height

  ctx.drawImage(
    video,
    0,
    0,
    width,
    height,
  )

  const image = ctx.getImageData(
    0,
    0,
    width,
    height,
  )

  return {
    luma: lumaFromRgba(
      image.data,
      width,
      height,
    ),
    rgba: image.data,
    width,
    height,
  }
}

export default function AccessCaptureSurface({
  mode,
  language = 'en',
  aspect = 1.586,
  autoCapture = false,
  onCapture,
  onCancel,
  onChoosePhoto,
  copyOverride,
  fixture = null,
  showCloseControl = true,
}) {
  const [state, setState] = useState(
    CAPTURE_STATE.PREPARING_CAMERA,
  )

  const [coachAvailable, setCoachAvailable] =
    useState(true)

  const [instruction, setInstruction] =
    useState(null)

  const [capturedUrl, setCapturedUrl] =
    useState(null)

  const [flash, setFlash] = useState(false)
  const [canSwitchCamera, setCanSwitchCamera] = useState(false)
  const [cameraDiagnostic, setCameraDiagnostic] = useState(null)

  const [facing, setFacing] = useState(
    mode === CAPTURE_MODE.SELFIE
      ? 'user'
      : 'environment',
  )

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const trackerRef = useRef(
    createStabilityTracker({
      requiredFrames: 4,
    }),
  )

  const coachTimerRef = useRef(null)
  const coachFrameRef = useRef(null)
  const analysisInFlightRef = useRef(false)
  const instructionCandidateRef = useRef({ key: null, count: 0 })

  /**
   * Prevent:
   * - double shutter clicks
   * - repeated auto-capture while the quality window stays stable
   */
  const captureInFlightRef = useRef(false)

  const mirror =
    mode === CAPTURE_MODE.SELFIE

  useEffect(() => {
    if (!fixture) return
    const next = FIXTURE_STATES[fixture]
    if (!next) return
    setState(next.state)
    setInstruction(next.instruction || (fixture === 'ready'
      ? (mode === CAPTURE_MODE.SELFIE ? 'selfie_good' : 'good_document')
      : null))
    setCapturedUrl(null)
  }, [fixture, mode])

  const copy = useMemo(() => copyOverride || {}, [copyOverride])

  const t = useCallback(
    (key) =>
      copyForInstruction(
        language,
        key,
        copy[key] || '',
      ),
    [language, copy],
  )

  /**
   * Stop the current camera and analysis timer.
   */
  const cleanupStream = useCallback(() => {
    if (coachTimerRef.current) {
      clearInterval(coachTimerRef.current)
      coachTimerRef.current = null
    }

    if (coachFrameRef.current && videoRef.current?.cancelVideoFrameCallback) {
      videoRef.current.cancelVideoFrameCallback(coachFrameRef.current)
      coachFrameRef.current = null
    }

    streamRef.current
      ?.getTracks?.()
      ?.forEach((track) => track.stop())

    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  /**
   * Start or restart the camera.
   */
  const startCamera = useCallback(
    async (nextFacing) => {
      setState(
        CAPTURE_STATE.PREPARING_CAMERA,
      )

      setInstruction(null)
      setCameraDiagnostic({ stage: 'starting' })
      instructionCandidateRef.current = { key: null, count: 0 }
      setCoachAvailable(true)

      captureInFlightRef.current = false
      trackerRef.current.reset()

      cleanupStream()

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraDiagnostic({ stage: 'failed', code: 'MEDIA_DEVICES_UNAVAILABLE' })
        setState(
          CAPTURE_STATE.PERMISSION_REQUIRED,
        )
        return
      }

      try {
        if (!window.isSecureContext) {
          throw new Error('INSECURE_CONTEXT')
        }

        const { stream, attempt } = await requestCameraStream(mode, nextFacing, (nextAttempt) => {
          setCameraDiagnostic({ stage: 'requesting', attempt: nextAttempt })
        })

        streamRef.current = stream

        const video = videoRef.current

        if (!video) {
          stream
            .getTracks()
            .forEach((track) => track.stop())

          streamRef.current = null
          return
        }

        video.srcObject = stream
        video.muted = true
        video.playsInline = true
        await video.play()
        await waitForVideoReady(video)

        setCameraDiagnostic({ stage: 'ready', attempt })
        console.info('[Access capture] camera ready', { mode, facing: nextFacing, attempt })

        setFacing(nextFacing)

        navigator.mediaDevices.enumerateDevices?.().then((devices) => {
          setCanSwitchCamera(devices.filter((device) => device.kind === 'videoinput').length > 1)
        }).catch(() => setCanSwitchCamera(false))

        setState(
          CAPTURE_STATE.COACHING,
        )
      } catch (error) {
        const name = error?.name || ''
        const code = error?.message === 'INSECURE_CONTEXT' ? 'INSECURE_CONTEXT' : cameraErrorCode(error)
        setCameraDiagnostic({ stage: 'failed', code })
        console.warn('[Access capture] camera start failed', { mode, facing: nextFacing, code })

        if (
          name === 'NotAllowedError' ||
          name === 'PermissionDeniedError'
        ) {
          setState(
            CAPTURE_STATE.PERMISSION_REQUIRED,
          )
          return
        }

        setState(CAPTURE_STATE.ERROR)
      }
    },
    [mode, cleanupStream],
  )

  /**
   * Capture a high-quality still.
   *
   * Preferred path:
   * ImageCapture.takePhoto()
   *
   * Fallback:
   * native-resolution canvas capture.
   *
   * The resulting File is handed to the existing caller/persistence flow.
   */
  const handleCapture = useCallback(
    async () => {
      if (captureInFlightRef.current) {
        return
      }

      const video = videoRef.current

      if (
        !video ||
        !video.videoWidth ||
        !video.videoHeight
      ) {
        return
      }

      captureInFlightRef.current = true

        setState(
          CAPTURE_STATE.AUTO_CAPTURING,
        )

        setFlash(true)
        window.setTimeout(() => setFlash(false), 130)
        navigator.vibrate?.(18)

      try {
        const track =
          streamRef.current
            ?.getVideoTracks?.()[0]

        let blob = null

        /**
         * Use ImageCapture where supported.
         */
        if (
          track &&
          typeof window !== 'undefined' &&
          'ImageCapture' in window
        ) {
          try {
            const imageCapture =
              new window.ImageCapture(track)

            const shot =
              await imageCapture.takePhoto()

            if (
              shot &&
              shot.size > 0
            ) {
              blob = shot
            }
          } catch {
            /**
             * ImageCapture is enhancement-only.
             * Fall through to the canvas path.
             */
            blob = null
          }
        }

        /**
         * Browser-safe fallback at the actual video resolution.
         */
        if (!blob) {
          const canvas =
            document.createElement('canvas')

          canvas.width =
            video.videoWidth

          canvas.height =
            video.videoHeight

          const ctx =
            canvas.getContext('2d')

          if (!ctx) {
            throw new Error(
              'capture_canvas_unavailable',
            )
          }

          ctx.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height,
          )

          blob = await new Promise(
            (resolve) => {
              canvas.toBlob(
                resolve,
                'image/jpeg',
                0.92,
              )
            },
          )
        }

        if (
          !blob ||
          blob.size === 0
        ) {
          throw new Error(
            'capture_blob_empty',
          )
        }

        const ext =
          blob.type === 'image/png'
            ? 'png'
            : 'jpg'

        const fileName =
          mode === CAPTURE_MODE.SELFIE
            ? `selfie.${ext}`
            : `document.${ext}`

        const file = new File(
          [blob],
          fileName,
          {
            type:
              blob.type ||
              'image/jpeg',
          },
        )

        /**
         * Stop the camera while previewing.
         * Retake will start it again.
         */
        cleanupStream()

        setCapturedUrl((previousUrl) => {
          if (previousUrl) {
            URL.revokeObjectURL(
              previousUrl,
            )
          }

          return URL.createObjectURL(
            file,
          )
        })

        setState(CAPTURE_STATE.CAPTURED)

        // Start persistence immediately; the short captured state is only a
        // perceptible acknowledgement and never delays the actual write.
        const persistence = Promise.resolve(onCapture?.(file))
        window.setTimeout(() => {
          setState((current) => current === CAPTURE_STATE.CAPTURED ? CAPTURE_STATE.SAVING : current)
        }, 180)
        const durable = await persistence
        if (durable === false) throw new Error('capture_not_durable')
        setState(CAPTURE_STATE.DURABLE)
      } catch {
        captureInFlightRef.current = false

        setState(
          CAPTURE_STATE.ERROR,
        )
      }
    },
    [
      mode,
      onCapture,
      cleanupStream,
    ],
  )

  /**
   * Lightweight live coaching loop.
   *
   * Important:
   * - analysis happens on the downscaled analysis canvas
   * - no analysis frames are persisted
   * - capture still uses full/native camera resolution
   */
  const runCoach = useCallback(async () => {
    // Selfies use a manual shutter so live analysis cannot delay capture.
    if (mode === CAPTURE_MODE.SELFIE) return

    if (captureInFlightRef.current || analysisInFlightRef.current) {
      return
    }

    analysisInFlightRef.current = true

    const video = videoRef.current

    if (!video || video.readyState < 2) {
      analysisInFlightRef.current = false
      return
    }

    const frame = sampleFrame(video)

    if (!frame) {
      analysisInFlightRef.current = false
      return
    }

    let verdict

    try {
      const metrics =
        analyzeLumaFrame(frame)

      const region =
        findDocumentRegion(frame)

      verdict =
        classifyDocumentFrame({
          metrics,
          region,
        })
    } catch {
      /**
       * CV guidance is enhancement-only.
       * Manual camera must remain usable.
       */
      setCoachAvailable(false)

      setInstruction(null)
      instructionCandidateRef.current = { key: null, count: 0 }

      trackerRef.current.reset()

      setState((currentState) => {
        if (
          currentState ===
          CAPTURE_STATE.COACHING ||
          currentState ===
          CAPTURE_STATE.READY_TO_CAPTURE
        ) {
          return CAPTURE_STATE.COACHING
        }

        return currentState
      })

      return
    } finally {
      analysisInFlightRef.current = false
    }

    const good =
      verdict.grade ===
      CAPTURE_GUIDE.GOOD

    trackerRef.current.push(good)

    const primaryInstruction =
      Array.isArray(
        verdict.primaryInstruction,
      )
        ? verdict.primaryInstruction[0]
        : verdict.primaryInstruction

    const candidate = instructionCandidateRef.current
    if (candidate.key === primaryInstruction) {
      candidate.count += 1
    } else {
      instructionCandidateRef.current = { key: primaryInstruction, count: 1 }
    }
    // Real-device testing showed that frame-by-frame instruction changes made
    // the coach harder to follow. Require two agreeing samples (~360 ms).
    if (instructionCandidateRef.current.count >= 2) {
      setInstruction(primaryInstruction || null)
    }

    /**
     * READY must be reversible.
     *
     * If quality gets worse again we return to COACHING rather than leaving
     * the UI permanently green after one good frame.
     */
    const stable =
      trackerRef.current.value.stable

    setState((currentState) => {
      if (
        currentState !==
        CAPTURE_STATE.COACHING &&
        currentState !==
        CAPTURE_STATE.READY_TO_CAPTURE
      ) {
        return currentState
      }

      if (
        good &&
        stable
      ) {
        return CAPTURE_STATE.READY_TO_CAPTURE
      }

      return CAPTURE_STATE.COACHING
    })

    /**
     * Optional auto-capture.
     *
     * captureInFlightRef prevents a stable analysis window from firing several
     * captures before React has time to update state.
     */
    if (
      autoCapture &&
      good &&
      stable &&
      !captureInFlightRef.current
    ) {
      const decision =
        shouldAutoCapture({
          mode,
          tracker:
            trackerRef.current,
          verdict,
        })

      if (
        decision.shouldCapture
      ) {
        handleCapture()
      }
    }
  }, [
    mode,
    autoCapture,
    handleCapture,
  ])

  /**
  * Start the preferred camera whenever capture mode changes.
  */
  useEffect(() => {
    if (fixture) return undefined
    const preferredFacing =
      mode === CAPTURE_MODE.SELFIE
        ? 'user'
        : 'environment'

    setFacing(
      preferredFacing,
    )

    trackerRef.current.reset()

    setInstruction(null)
    instructionCandidateRef.current = { key: null, count: 0 }

    startCamera(
      preferredFacing,
    )

    return () => {
      cleanupStream()
    }
  }, [
    mode,
    startCamera,
    cleanupStream,
    fixture,
  ])

  /**
  * Start/stop live frame analysis with camera state.
  */
  useEffect(() => {
    if (fixture || mode === CAPTURE_MODE.SELFIE) return undefined
    if (
      state !==
      CAPTURE_STATE.COACHING &&
      state !==
      CAPTURE_STATE.READY_TO_CAPTURE
    ) {
      return undefined
    }

    const video = videoRef.current
    let cancelled = false
    let lastSampleAt = 0
    const analysisInterval = DOCUMENT_ANALYSIS_INTERVAL_MS

    if (video?.requestVideoFrameCallback) {
      const schedule = (now) => {
        if (cancelled) return
        if (now - lastSampleAt >= analysisInterval) {
          lastSampleAt = now
          runCoach()
        }
        coachFrameRef.current = video.requestVideoFrameCallback(schedule)
      }
      coachFrameRef.current = video.requestVideoFrameCallback(schedule)
    } else {
      coachTimerRef.current = setInterval(runCoach, analysisInterval)
    }

    return () => {
      cancelled = true
      if (
        coachTimerRef.current
      ) {
        clearInterval(
          coachTimerRef.current,
        )

        coachTimerRef.current =
          null
      }
      if (coachFrameRef.current && video?.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(coachFrameRef.current)
        coachFrameRef.current = null
      }
    }
  }, [
    state,
    runCoach,
    fixture,
    mode,
  ])

  /**
   * Revoke preview object URL on unmount or replacement.
   */
  useEffect(() => {
    return () => {
      if (capturedUrl) {
        URL.revokeObjectURL(
          capturedUrl,
        )
      }
    }
  }, [capturedUrl])

  const handleSwitchCamera =
    useCallback(() => {
      const next =
        facing === 'environment'
          ? 'user'
          : 'environment'

      trackerRef.current.reset()

      setInstruction(null)
      instructionCandidateRef.current = { key: null, count: 0 }

      captureInFlightRef.current =
        false

      startCamera(next)
    }, [
      facing,
      startCamera,
    ])

  const handleRetake =
    useCallback(() => {
      if (capturedUrl) {
        URL.revokeObjectURL(
          capturedUrl,
        )
      }

      setCapturedUrl(null)

      trackerRef.current.reset()

      setInstruction(null)
      instructionCandidateRef.current = { key: null, count: 0 }

      captureInFlightRef.current =
        false

      startCamera(facing)
    }, [
      capturedUrl,
      facing,
      startCamera,
    ])

  const handleClose =
    useCallback(() => {
      cleanupStream()

      onCancel?.()
    }, [
      cleanupStream,
      onCancel,
    ])

  /**
   * Accessible live-status text.
   */
  const announce =
    state ===
      CAPTURE_STATE.PREPARING_CAMERA
      ? (copy.preparing || 'Preparing camera')
      : state ===
        CAPTURE_STATE.PERMISSION_REQUIRED
        ? (copy.permission || 'Camera access required')
        : state ===
          CAPTURE_STATE.AUTO_CAPTURING
          ? (copy.taking || 'Taking photo')
            : state === CAPTURE_STATE.CAPTURED
              ? (copy.photoCaptured || 'Photo captured')
              : state === CAPTURE_STATE.SAVING
                ? (copy.saving || 'Saving securely')
                : state === CAPTURE_STATE.DURABLE
                  ? (copy.saved || 'Photo saved securely')
            : instruction &&
              coachAvailable !== false
              ? t(instruction)
              : coachAvailable === false
                ? (copy.coachUnavailable || 'Automatic guidance unavailable. Manual capture is available.')
                : (copy.ready || 'Camera ready')

  const readyForShutter =
    state ===
    CAPTURE_STATE.READY_TO_CAPTURE

  const cameraVisible =
    state ===
    CAPTURE_STATE.PREPARING_CAMERA ||
    state ===
    CAPTURE_STATE.COACHING ||
    state ===
    CAPTURE_STATE.READY_TO_CAPTURE ||
    state ===
    CAPTURE_STATE.AUTO_CAPTURING

  return (
    <div className="w-full">
      <div
        aria-live="polite"
        className="sr-only"
      >
        {announce}
      </div>

      {/* Camera permission failure */}
      {state ===
        CAPTURE_STATE.PERMISSION_REQUIRED && (
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center"
            role="alert"
          >
            <CameraOff className="mx-auto h-8 w-8 text-[#F25567]" />

            <h3 className="mt-3 text-base font-semibold text-white">
              {copy.cameraDenied ||
                'Camera access is off'}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-[#7DA9B8]">
              {copy.cameraDeniedHint ||
                'Allow camera access for your browser, then try again. You can also choose a photo instead.'}
            </p>

            {cameraDebugEnabled() && cameraDiagnostic && (
              <details className="mx-auto mt-3 max-w-sm rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-[#A8C5D0]">
                <summary className="cursor-pointer font-medium text-white/85">Camera diagnostics</summary>
                <p className="mt-2">Stage: {cameraDiagnostic.stage}</p>
                <p>Reason: {cameraDiagnostic.code || 'none'}</p>
                <p>Secure context: {typeof window !== 'undefined' && window.isSecureContext ? 'yes' : 'no'}</p>
                <p>Origin: {typeof window !== 'undefined' ? window.location.origin : 'unknown'}</p>
              </details>
            )}

            <button
              type="button"
              onClick={() =>
                startCamera(facing)
              }
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[#FBB040] px-4 text-sm font-semibold text-[#001F2D] transition hover:bg-[#e09c33]"
            >
              <RefreshCw className="h-4 w-4" />

              {copy.tryAgain ||
                'Try again'}
            </button>
            {onChoosePhoto && <button type="button" onClick={onChoosePhoto} className="ml-2 mt-4 inline-flex h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10">{copy.choosePhoto || 'Choose a photo'}</button>}
          </div>
        )}

      {/* General camera failure */}
      {state ===
        CAPTURE_STATE.ERROR && !capturedUrl && (
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center"
            role="alert"
          >
            <CameraOff className="mx-auto h-8 w-8 text-[#F25567]" />

            <h3 className="mt-3 text-base font-semibold text-white">
              {copy.cameraUnavailable ||
                'Camera unavailable'}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-sm text-[#7DA9B8]">
              {copy.cameraErrorHint ||
                'We could not start the camera. Try again or choose a photo instead.'}
            </p>

            {cameraDebugEnabled() && cameraDiagnostic && (
              <details className="mx-auto mt-3 max-w-sm rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-[#A8C5D0]">
                <summary className="cursor-pointer font-medium text-white/85">Camera diagnostics</summary>
                <p className="mt-2">Stage: {cameraDiagnostic.stage}</p>
                <p>Reason: {cameraDiagnostic.code || 'none'}</p>
                <p>Secure context: {typeof window !== 'undefined' && window.isSecureContext ? 'yes' : 'no'}</p>
                <p>Origin: {typeof window !== 'undefined' ? window.location.origin : 'unknown'}</p>
              </details>
            )}

            <button
              type="button"
              onClick={() =>
                startCamera(facing)
              }
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[#FBB040] px-4 text-sm font-semibold text-[#001F2D] transition hover:bg-[#e09c33]"
            >
              <RefreshCw className="h-4 w-4" />

              {copy.tryAgain ||
                'Try again'}
            </button>
            {onChoosePhoto && <button type="button" onClick={onChoosePhoto} className="ml-2 mt-4 inline-flex h-11 items-center rounded-xl border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10">{copy.choosePhoto || 'Choose a photo'}</button>}
          </div>
        )}

      {/* Live camera */}
      {cameraVisible && (
        <div className="relative h-full min-h-[min(72dvh,680px)] overflow-hidden rounded-[1.35rem] border border-white/10 bg-black shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:min-h-[min(70dvh,720px)]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 h-full w-full ${mirror
                ? '-scale-x-100'
                : ''
              } object-cover ${fixture ? 'opacity-0' : ''}`}
          />

          {fixture && <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_38%,#47636b_0%,#17343d_42%,#071a20_100%)]" aria-hidden="true" />}

          <div className={`pointer-events-none absolute inset-0 z-30 bg-white transition-opacity duration-100 ${flash ? 'opacity-80' : 'opacity-0'}`} aria-hidden="true" />

          {/* Real-device feedback rejected moving/separated corner graphics.
              Detection still drives one instruction, while the visual target
              stays calm and predictable. */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {mode ===
              CAPTURE_MODE.DOCUMENT ? (
              <svg className="h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <rect
                  x="11"
                  y={50 - (78 / aspect) / 2}
                  width="78"
                  height={78 / aspect}
                  rx="3"
                  fill="none"
                  stroke={readyForShutter ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.34)'}
                  strokeWidth={readyForShutter ? '0.55' : '0.35'}
                  className="transition duration-300"
                />
              </svg>
            ) : (
              <div
                className={`w-[54%] max-w-[320px] rounded-[48%] border transition duration-300 ${readyForShutter
                    ? 'scale-[1.015] border-white/90 shadow-[0_0_42px_rgba(223,248,236,0.28)]'
                    : 'border-white/45 shadow-[0_0_24px_rgba(255,255,255,0.08)]'
                  }`}
                style={{
                  aspectRatio:
                    '0.75',
                }}
              />
            )}
          </div>

          {/* Coaching message */}
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center px-14">
            {instruction &&
              coachAvailable !==
              false && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${readyForShutter
                      ? 'bg-[#29BF86]/20 text-[#29BF86]'
                      : 'bg-black/50 text-white'
                    }`}
                >
                  {t(instruction)}
                </span>
              )}

            {coachAvailable ===
              false &&
              state !==
              CAPTURE_STATE.PREPARING_CAMERA && (
                <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  {copy.coachUnavailable ||
                    'Automatic guidance is unavailable. You can still take the photo.'}
                </span>
              )}
          </div>

          {!instruction && state !== CAPTURE_STATE.PREPARING_CAMERA && (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-16">
              <span className="rounded-full bg-black/45 px-3 py-1.5 text-center text-[11px] font-medium text-white/90 backdrop-blur">
                {mode === CAPTURE_MODE.SELFIE
                  ? (copy.faceFrame || 'Keep your face inside the oval')
                  : (copy.idFrame || 'Keep all four edges of your ID inside the frame')}
              </span>
            </div>
          )}

          {cameraDebugEnabled() && cameraDiagnostic && (
            <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-[calc(100%-6rem)] rounded-lg bg-black/65 px-2.5 py-2 text-[10px] leading-4 text-white/85 backdrop-blur">
              <span className="font-semibold text-[#FBB040]">Camera debug</span>
              {' · '}{cameraDiagnostic.stage}
              {cameraDiagnostic.attempt ? ` · attempt ${cameraDiagnostic.attempt}` : ''}
              {cameraDiagnostic.code ? ` · ${cameraDiagnostic.code}` : ''}
              {' · secure='}{typeof window !== 'undefined' && window.isSecureContext ? 'yes' : 'no'}
            </div>
          )}

          {/* Close camera */}
          {showCloseControl && <button
            type="button"
            onClick={handleClose}
            aria-label={
              copy.closeCamera ||
              'Close camera'
            }
            className="absolute left-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/50 text-white transition hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>}

          {/* Working controls must NOT depend on coach availability */}
          {state !==
            CAPTURE_STATE.PREPARING_CAMERA && (
              <>
                {canSwitchCamera && (
                <button
                  type="button"
                  onClick={
                    handleSwitchCamera
                  }
                  aria-label={
                    copy.switchCamera ||
                    'Switch camera'
                  }
                  className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/50 text-white transition hover:bg-black/70"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
                  <span className="rounded-full bg-black/45 px-3 py-1 text-center text-[10px] font-medium text-white/85 backdrop-blur">
                    {mode === CAPTURE_MODE.SELFIE
                      ? (copy.selfieQuality || 'Good light · no filters · you stay in control')
                      : (copy.documentQuality || 'Good light · no glare · every detail visible')}
                  </span>
                  <button
                    type="button"
                    onClick={
                      handleCapture
                    }
                    disabled={
                      captureInFlightRef.current
                    }
                    aria-label={
                      copy.shutter ||
                      'Capture photo'
                    }
                    className={`pointer-events-auto grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border-[3px] transition ${readyForShutter
                        ? 'scale-105 border-white bg-white/25 shadow-[0_0_0_8px_rgba(223,248,236,0.12)]'
                        : 'border-white/90 bg-black/20'
                      } disabled:cursor-wait disabled:opacity-70`}
                  >
                    <span className="h-14 w-14 rounded-full bg-white shadow-inner" />
                  </button>

                  <span className="min-h-4 text-[11px] font-medium text-white/75">
                    {readyForShutter
                      ? (copy.ready || copyForInstruction(language, 'ready', 'Ready to capture'))
                      : (copy.tapAnytime || 'Tap anytime')}
                  </span>
                </div>
              </>
            )}
        </div>
      )}

      {/* Captured preview */}
      {[CAPTURE_STATE.CAPTURED, CAPTURE_STATE.SAVING, CAPTURE_STATE.DURABLE, CAPTURE_STATE.ERROR].includes(state) &&
        capturedUrl && (
          <div className={`relative h-full min-h-[min(72dvh,680px)] overflow-hidden rounded-[1.35rem] border bg-black ${state === CAPTURE_STATE.ERROR ? 'border-[#F25567]/40' : 'border-[#29BF86]/40'}`}>
            {/* Blob URLs are transient local previews, not production content. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedUrl}
              alt={
                copy.previewAlt ||
                'Captured preview'
              }
              className="absolute inset-0 h-full w-full object-contain"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" aria-hidden="true" />

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
              <span className={`flex items-center gap-2 text-sm ${state === CAPTURE_STATE.ERROR ? 'text-[#F25567]' : 'text-[#29BF86]'}`} aria-live="polite">
                <Check className="h-4 w-4" />

                {state === CAPTURE_STATE.ERROR
                  ? (copy.saveFailed || "We couldn't save this photo. Try again.")
                  : state === CAPTURE_STATE.SAVING
                  ? (copy.saving || 'Saving securely…')
                  : state === CAPTURE_STATE.DURABLE
                    ? (copy.saved || 'Saved securely')
                    : (copy.captured || 'Got it')}
              </span>

              <div className="flex gap-2">
                {state !== CAPTURE_STATE.SAVING && <button
                  type="button"
                  onClick={
                    handleRetake
                  }
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  {copy.retake ||
                    'Retake'}
                </button>}

                {state !== CAPTURE_STATE.SAVING && <button
                  type="button"
                  onClick={
                    handleClose
                  }
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  {copy.done ||
                    'Done'}
                </button>}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
