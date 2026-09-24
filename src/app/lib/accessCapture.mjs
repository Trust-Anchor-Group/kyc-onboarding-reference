/**
 * AccessCaptureEngine — local capture quality/coaching foundation.
 *
 * This module owns:
 *   - the capture state model
 *   - pure frame analysis (quality, document region, selfie framing)
 *   - stability / hysteresis helpers
 *   - capture microcopy mapping
 *
 * It does NOT own: Agent persistence, Legal, state.json, navigation, camera hardware.
 * Camera lifecycle lives in the React surface (AccessCaptureSurface) — these functions
 * are pure so they can be unit-tested and reused off the main thread.
 *
 * IMPORTANT: this is CAPTURE-QUALITY COACHING. It is not biometric verification,
 * identity matching, presentation-attack detection, liveness certification, or
 * fraud detection. None of those terms are used for these heuristics.
 */

export const CAPTURE_MODE = Object.freeze({
  DOCUMENT: 'DOCUMENT',
  SELFIE: 'SELFIE',
})

export const CAPTURE_STATE = Object.freeze({
  PREPARING_CAMERA: 'PREPARING_CAMERA',
  PERMISSION_REQUIRED: 'PERMISSION_REQUIRED',
  CAMERA_READY: 'CAMERA_READY',
  COACHING: 'COACHING',
  READY_TO_CAPTURE: 'READY_TO_CAPTURE',
  AUTO_CAPTURING: 'AUTO_CAPTURING',
  CAPTURED: 'CAPTURED',
  REVIEWING: 'REVIEWING',
  SAVING: 'SAVING',
  DURABLE: 'DURABLE',
  ERROR: 'ERROR',
})

export const CAPTURE_GUIDE = Object.freeze({
  GOOD: 'GOOD',
  NEEDS_ADJUSTMENT: 'NEEDS_ADJUSTMENT',
  UNUSABLE: 'UNUSABLE',
})

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value))

/* ------------------------------------------------------------------ *
 * Luma frame metrics
 * ------------------------------------------------------------------ */

/**
 * Analyze a grayscale (luma) frame.
 * luma: Float32Array/Uint8Array length width*height in row-major order.
 * Returns brightness, exposure ratios, and a Laplacian-variance blur estimate.
 */
export function analyzeLumaFrame({ width, height, luma }) {
  const count = width * height
  if (!count || !luma || luma.length < count) {
    return { meanLuma: 0, darkRatio: 0, brightRatio: 0, clippedRatio: 0, blurScore: 0, sharp: 0, empty: true }
  }

  let sum = 0
  let darkRatio = 0
  let brightRatio = 0
  let clippedRatio = 0
  for (let i = 0; i < count; i++) {
    const v = luma[i]
    sum += v
    if (v < 40) darkRatio += 1
    if (v > 205) brightRatio += 1
    if (v > 250) clippedRatio += 1
  }
  const meanLuma = sum / count
  darkRatio /= count
  brightRatio /= count
  clippedRatio /= count

  // Blur: variance of the Laplacian, sampled at stride for cost.
  let lapSum = 0
  let lapSq = 0
  let lapCount = 0
  for (let y = 2; y < height - 2; y += 2) {
    const row = y * width
    for (let x = 2; x < width - 2; x += 2) {
      const center = luma[row + x] * 4
      const neighbors =
        luma[row + x - 1] + luma[row + x + 1] + luma[row - width + x] + luma[row + width + x]
      const lap = center - neighbors
      lapSum += lap
      lapSq += lap * lap
      lapCount += 1
    }
  }
  let blurScore = 0
  if (lapCount > 0) {
    const mean = lapSum / lapCount
    blurScore = Math.max(0, lapSq / lapCount - mean * mean)
  }
  // Normalized sharpness estimate; lower = blurrier.
  const varianceLowWatermark = 8
  const sharp = blurScore > varianceLowWatermark ? 1 : clamp(blurScore / varianceLowWatermark)
  return {
    meanLuma,
    darkRatio,
    brightRatio,
    clippedRatio,
    blurScore,
    sharp,
    empty: darkRatio > 0.995 || brightRatio > 0.995,
  }
}
/* ------------------------------------------------------------------ *
 * Otsu threshold (bright object vs background)
 * ------------------------------------------------------------------ */

function buildHistogram(luma, count, bins = 64) {
  const histogram = new Float64Array(bins)
  for (let i = 0; i < count; i++) {
    const bin = Math.min(bins - 1, Math.floor((luma[i] / 256) * bins))
    histogram[bin] += 1
  }
  return histogram
}

function findDominantPeaks(histogram, bins, minGap = 6) {
  let globalMax = 0
  let globalMaxI = -1
  for (let i = 0; i < bins; i++) {
    if (histogram[i] > globalMax) {
      globalMax = histogram[i]
      globalMaxI = i
    }
  }
  if (globalMaxI < 0) return null

  let second = -1
  let secondI = -1
  for (let i = 0; i < bins; i++) {
    if (Math.abs(i - globalMaxI) < minGap) continue
    if (histogram[i] > second) {
      second = histogram[i]
      secondI = i
    }
  }
  if (secondI < 0) return null
  return {
    peakA: Math.min(globalMaxI, secondI),
    peakB: Math.max(globalMaxI, secondI),
  }
}

export function otsuThreshold({ width, height, luma }) {
  const count = width * height
  if (!count) return 128
  const bins = 64
  const histogram = buildHistogram(luma, count, bins)
  const peaks = findDominantPeaks(histogram, bins)
  if (!peaks) return 128
  const weightA = histogram[peaks.peakA]
  const weightB = histogram[peaks.peakB]
  const weightedMid = (peaks.peakA * weightA + peaks.peakB * weightB) / (weightA + weightB)
  return clamp(Math.round((weightedMid / bins) * 256), 0, 255)
}

/* ------------------------------------------------------------------ *
 * Document region
 * ------------------------------------------------------------------ */

/**
 * Find a bright connected region (candidate document) and its boundary.
 * Returns coverage, aspect, corner visibility, and edge clipping. This is a
 * framing/quality heuristic — it does NOT identify document type or OCR text.
 * `quadrilateral` is ephemeral guide geometry only; it is never evidence.
 */
export function findDocumentRegion({ width, height, luma }) {
  const count = width * height
  const threshold = otsuThreshold({ width, height, luma })
  const binary = new Uint8Array(count)
  let brightCount = 0
  for (let i = 0; i < count; i++) {
    const v = luma[i] >= threshold ? 1 : 0
    binary[i] = v
    brightCount += v
  }
  const coverage = brightCount / count

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    const row = y * width
    for (let x = 0; x < width; x++) {
      if (binary[row + x]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { coverage, bbox: null, brightCount, threshold }
  }

  const bbox = { x0: minX, y0: minY, x1: maxX, y1: maxY, w: maxX - minX + 1, h: maxY - minY + 1 }
  const aspect = bbox.w / bbox.h
  const cellW = bbox.w / 3
  const cellH = bbox.h / 3
  const cornerCells = [
    { x0: minX, x1: minX + cellW, y0: minY, y1: minY + cellH },
    { x0: maxX - cellW, x1: maxX, y0: minY, y1: minY + cellH },
    { x0: minX, x1: minX + cellW, y0: maxY - cellH, y1: maxY },
    { x0: maxX - cellW, x1: maxX, y0: maxY - cellH, y1: maxY },
  ]
  const cornersVisible = cornerCells.map(({ x0, x1, y0, y1 }) => {
    const cx0 = Math.max(0, Math.ceil(x0))
    const cx1 = Math.min(width, Math.floor(x1))
    const cy0 = Math.max(0, Math.ceil(y0))
    const cy1 = Math.min(height, Math.floor(y1))
    let found = 0
    let total = 0
    for (let y = cy0; y < cy1; y += 1) {
      const row = y * width
      for (let x = cx0; x < cx1; x += 1) {
        total += 1
        if (binary[row + x]) found += 1
      }
    }
    return total > 0 ? found / total : 0
  })

  const marginX = width * 0.025
  const marginY = height * 0.025
  const clippedEdges = {
    left: minX <= marginX,
    right: maxX >= width - 1 - marginX,
    top: minY <= marginY,
    bottom: maxY >= height - 1 - marginY,
  }
  const clippedEdgesCount = [clippedEdges.left, clippedEdges.right, clippedEdges.top, clippedEdges.bottom]
    .filter(Boolean).length

  // Use object pixels in each quadrant to estimate the four physical corners.
  // This is deliberately low-cost so it can run on-device at 5–8 samples/sec.
  const cornerPoint = (xStart, xEnd, yStart, yEnd, chooseX, chooseY) => {
    let best = null
    for (let y = Math.max(0, Math.floor(yStart)); y <= Math.min(height - 1, Math.ceil(yEnd)); y += 1) {
      const row = y * width
      for (let x = Math.max(0, Math.floor(xStart)); x <= Math.min(width - 1, Math.ceil(xEnd)); x += 1) {
        if (!binary[row + x]) continue
        if (!best || chooseX(x, best.x) || (x === best.x && chooseY(y, best.y))) best = { x, y }
      }
    }
    return best
  }
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  const quadrilateral = [
    cornerPoint(minX, midX, minY, midY, (x, current) => x < current, (y, current) => y < current),
    cornerPoint(midX, maxX, minY, midY, (x, current) => x > current, (y, current) => y < current),
    cornerPoint(midX, maxX, midY, maxY, (x, current) => x > current, (y, current) => y > current),
    cornerPoint(minX, midX, midY, maxY, (x, current) => x < current, (y, current) => y > current),
  ]

  return { coverage, bbox, quadrilateral: quadrilateral.every(Boolean) ? quadrilateral : null, aspect, cornersVisible, clippedEdges, clippedEdgesCount, brightCount, threshold }
}
/* ------------------------------------------------------------------ *
 * Document verdict
 * ------------------------------------------------------------------ */

const DOCUMENT_ASPECT_RANGE = [0.55, 2.1]
const COVERAGE_TOO_SMALL = 0.18
const COVERAGE_FILLS_FRAME = 0.94
const BRIGHT_OBJECT_MIN = 0.03
const CORNER_VISIBLE_MIN = 0.14

export function classifyDocumentFrame({ metrics, region }) {
  if (metrics.darkRatio > 0.85 || (metrics.meanLuma < 32 && metrics.darkRatio > 0.5)) {
    return { grade: CAPTURE_GUIDE.UNUSABLE, primaryInstruction: 'too_dark', reasons: ['frame_too_dark'], hard: true }
  }
  if (metrics.brightRatio > 0.85) {
    return { grade: CAPTURE_GUIDE.UNUSABLE, primaryInstruction: 'too_bright', reasons: ['frame_overexposed'], hard: true }
  }
  if (!region || !region.bbox || region.coverage < BRIGHT_OBJECT_MIN) {
    return { grade: CAPTURE_GUIDE.UNUSABLE, primaryInstruction: 'document_not_found', reasons: ['no_document'], hard: false }
  }

  const { coverage, aspect, cornersVisible, clippedEdgesCount } = region
  if (coverage < COVERAGE_TOO_SMALL) {
    return { grade: CAPTURE_GUIDE.NEEDS_ADJUSTMENT, primaryInstruction: 'document_too_small', reasons: ['document_too_small'], hard: false }
  }
  if (coverage > COVERAGE_FILLS_FRAME) {
    return { grade: CAPTURE_GUIDE.NEEDS_ADJUSTMENT, primaryInstruction: 'document_too_close', reasons: ['document_too_close'], hard: false }
  }
  if (clippedEdgesCount >= 2) {
    return { grade: CAPTURE_GUIDE.NEEDS_ADJUSTMENT, primaryInstruction: 'document_clipped', reasons: ['document_clipped'], hard: false }
  }
  if (cornersVisible.some((ratio) => ratio < CORNER_VISIBLE_MIN)) {
    return { grade: CAPTURE_GUIDE.NEEDS_ADJUSTMENT, primaryInstruction: 'document_corners', reasons: ['document_corners'], hard: false }
  }
  if (aspect < DOCUMENT_ASPECT_RANGE[0] || aspect > DOCUMENT_ASPECT_RANGE[1]) {
    return { grade: CAPTURE_GUIDE.NEEDS_ADJUSTMENT, primaryInstruction: 'document_angle', reasons: ['document_angle'], hard: false }
  }
  if (metrics.sharp < 0.28) {
    return { grade: CAPTURE_GUIDE.NEEDS_ADJUSTMENT, primaryInstruction: 'blur', reasons: ['blur'], hard: false }
  }
  return { grade: CAPTURE_GUIDE.GOOD, primaryInstruction: 'good_document', reasons: ['document_visible'], hard: false }
}

/* ------------------------------------------------------------------ *
 * Stability (rolling window, hysteresis)
 * ------------------------------------------------------------------ */

export function createStabilityTracker({ requiredFrames = 4, resetOnBad = false } = {}) {
  let consecutive = 0
  const value = { consecutive: 0, stable: false }

  return {
    get value() {
      return { ...value }
    },
    push(ok) {
      if (ok) {
        consecutive += 1
      } else {
        consecutive = 0
      }
      value.consecutive = consecutive
      value.stable = consecutive >= requiredFrames
      return { ...value }
    },
    reset() {
      consecutive = 0
      value.consecutive = 0
      value.stable = false
    },
  }
}

/**
 * Policy-level auto-capture decision. Auto-capture is a UX affordance only;
 * it never replaces manual capture and never claims any security property.
 */
export function shouldAutoCapture({ mode, tracker, verdict, enabled = true }) {
  if (!enabled) return { shouldCapture: false, reason: 'disabled' }
  if (!tracker || !tracker.value) return { shouldCapture: false, reason: 'coach_unavailable' }
  if (verdict.grade !== CAPTURE_GUIDE.GOOD) return { shouldCapture: false, reason: 'not_good' }
  if (!tracker.value.stable) return { shouldCapture: false, reason: 'not_stable' }
  return { shouldCapture: true, reason: 'stable_good', mode }
}

/* ------------------------------------------------------------------ *
 * Microcopy
 * ------------------------------------------------------------------ */

export const CAPTURE_COPY = Object.freeze({
  en: {
    ready: 'Ready to capture',
    document_not_found: 'Place your document inside the frame',
    document_too_small: 'Move a little closer',
    document_too_close: 'Move back a little',
    document_clipped: 'Show all four corners',
    document_corners: 'Show all four corners',
    document_angle: 'Hold your document flat and straight',
    too_dark: 'Find a little more light',
    too_bright: 'Move out of direct light',
    blur: 'Hold still',
    face_not_found: 'Position your face in the frame',
    face_too_far: 'Move a little closer',
    face_too_close: 'Move back a little',
    face_center: 'Center your face',
    multiple_faces: 'Make sure only you are in the frame',
    selfie_good: 'Great — hold still',
    good_document: 'Ready to capture',
    coach_unavailable: "Automatic photo guidance isn't available. You can still take the photo.",
  },
  pt: {
    ready: 'Pronto para capturar',
    document_not_found: 'Coloque seu documento dentro do quadro',
    document_too_small: 'Aproxime um pouco',
    document_too_close: 'Afaste um pouco',
    document_clipped: 'Mostre todos os quatro cantos',
    document_corners: 'Mostre todos os quatro cantos',
    document_angle: 'Mantenha seu documento reto e nivelado',
    too_dark: 'Procure um pouco mais de luz',
    too_bright: 'Saia da luz direta',
    blur: 'Fique parado',
    face_not_found: 'Posicione seu rosto no quadro',
    face_too_far: 'Aproxime um pouco',
    face_too_close: 'Afaste um pouco',
    face_center: 'Centralize seu rosto',
    multiple_faces: 'Certifique-se de que apenas você está no quadro',
    selfie_good: 'Ótimo — fique parado',
    good_document: 'Pronto para capturar',
    coach_unavailable: 'O guia automático de foto não está disponível. Você ainda pode tirar a foto.',
  },
  sv: {
    ready: 'Redo att fotografera', document_not_found: 'Placera dokumentet i ramen', document_too_small: 'Flytta lite närmare', document_too_close: 'Flytta lite bakåt', document_clipped: 'Visa alla fyra hörn', document_corners: 'Visa alla fyra hörn', document_angle: 'Håll dokumentet plant och rakt', too_dark: 'Hitta lite mer ljus', too_bright: 'Flytta bort från direkt ljus', blur: 'Håll stilla', face_not_found: 'Placera ansiktet i ramen', face_too_far: 'Flytta lite närmare', face_too_close: 'Flytta lite bakåt', face_center: 'Centrera ansiktet', multiple_faces: 'Se till att bara du syns i ramen', selfie_good: 'Bra — håll stilla', good_document: 'Redo att fotografera', coach_unavailable: 'Automatisk fotovägledning är inte tillgänglig. Du kan fortfarande ta bilden.',
  },
  fr: {
    ready: 'Prêt à capturer', document_not_found: 'Placez votre document dans le cadre', document_too_small: 'Rapprochez-vous légèrement', document_too_close: 'Reculez légèrement', document_clipped: 'Montrez les quatre coins', document_corners: 'Montrez les quatre coins', document_angle: 'Gardez le document à plat et bien droit', too_dark: 'Trouvez un endroit plus éclairé', too_bright: 'Éloignez-vous de la lumière directe', blur: 'Ne bougez plus', face_not_found: 'Placez votre visage dans le cadre', face_too_far: 'Rapprochez-vous légèrement', face_too_close: 'Reculez légèrement', face_center: 'Centrez votre visage', multiple_faces: 'Assurez-vous d’être seul dans le cadre', selfie_good: 'Parfait — ne bougez plus', good_document: 'Prêt à capturer', coach_unavailable: 'Le guidage photo automatique n’est pas disponible. Vous pouvez tout de même prendre la photo.',
  },
  es: {
    ready: 'Listo para capturar', document_not_found: 'Coloca el documento dentro del marco', document_too_small: 'Acércate un poco', document_too_close: 'Aléjate un poco', document_clipped: 'Muestra las cuatro esquinas', document_corners: 'Muestra las cuatro esquinas', document_angle: 'Mantén el documento plano y recto', too_dark: 'Busca un lugar con más luz', too_bright: 'Evita la luz directa', blur: 'No te muevas', face_not_found: 'Coloca el rostro dentro del marco', face_too_far: 'Acércate un poco', face_too_close: 'Aléjate un poco', face_center: 'Centra el rostro', multiple_faces: 'Asegúrate de ser la única persona en el encuadre', selfie_good: 'Perfecto — no te muevas', good_document: 'Listo para capturar', coach_unavailable: 'La guía automática no está disponible. Aun así puedes tomar la foto.',
  },
  ar: {
    ready: 'جاهز للالتقاط', document_not_found: 'ضع الوثيقة داخل الإطار', document_too_small: 'اقترب قليلاً', document_too_close: 'ابتعد قليلاً', document_clipped: 'أظهر الزوايا الأربع', document_corners: 'أظهر الزوايا الأربع', document_angle: 'أبقِ الوثيقة مسطحة ومستقيمة', too_dark: 'انتقل إلى مكان أكثر إضاءة', too_bright: 'ابتعد عن الضوء المباشر', blur: 'اثبت دون حركة', face_not_found: 'ضع وجهك داخل الإطار', face_too_far: 'اقترب قليلاً', face_too_close: 'ابتعد قليلاً', face_center: 'ضع وجهك في المنتصف', multiple_faces: 'تأكد من وجودك وحدك في الإطار', selfie_good: 'رائع — اثبت دون حركة', good_document: 'جاهز للالتقاط', coach_unavailable: 'الإرشاد التلقائي للصور غير متاح. لا يزال بإمكانك التقاط الصورة.',
  },
})

export function copyForInstruction(language, key, fallback = 'Hold still') {
  const table = CAPTURE_COPY[language] || CAPTURE_COPY.en
  return table[key] || fallback
}
