import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CAPTURE_COPY,
  CAPTURE_GUIDE,
  CAPTURE_MODE,
  CAPTURE_STATE,
  analyzeLumaFrame,
  classifyDocumentFrame,
  copyForInstruction,
  createStabilityTracker,
  findDocumentRegion,
  otsuThreshold,
  shouldAutoCapture,
} from '../../src/app/lib/accessCapture.mjs'

const makeLumaFrame = (width, height, fill = () => 128) => {
  const luma = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) luma[y * width + x] = fill(x, y)
  return luma
}

const documentFrame = (w = 320, h = 240, rect = { x0: 60, y0: 30, x1: 260, y1: 210 }, bg = 30) =>
  makeLumaFrame(w, h, (x, y) => {
    const inDoc = x >= rect.x0 && x <= rect.x1 && y >= rect.y0 && y <= rect.y1
    // Texture inside the document (edges/text) so the blur heuristic sees
    // realistic structure rather than a flat rectangle.
    return inDoc ? (x + y) % 3 === 0 ? 236 : 196 : bg
  })

test('capture state model exposes the full explicit lifecycle', () => {
  const keys = Object.keys(CAPTURE_STATE)
  for (const key of [
    'PREPARING_CAMERA', 'PERMISSION_REQUIRED', 'CAMERA_READY', 'COACHING',
    'READY_TO_CAPTURE', 'AUTO_CAPTURING', 'CAPTURED', 'REVIEWING', 'SAVING', 'DURABLE', 'ERROR',
  ]) assert.ok(keys.includes(key), `missing state ${key}`)
  assert.equal(new Set(keys).size, keys.length, 'states must be unique')
})

test('capture mode distinguishes document from selfie', () => {
  assert.equal(CAPTURE_MODE.DOCUMENT, 'DOCUMENT')
  assert.equal(CAPTURE_MODE.SELFIE, 'SELFIE')
  assert.notEqual(CAPTURE_MODE.DOCUMENT, CAPTURE_MODE.SELFIE)
})

test('analyzeLumaFrame rejects empty or corrupt frames', () => {
  const empty = analyzeLumaFrame({ width: 16, height: 16, luma: new Uint8Array(0) })
  assert.equal(empty.empty, true)
  assert.equal(empty.meanLuma, 0)
})

test('analyzeLumaFrame flags extreme underexposure', () => {
  const m = analyzeLumaFrame({ width: 40, height: 40, luma: makeLumaFrame(40, 40, () => 8) })
  assert.equal(m.empty, true)
  assert.ok(m.darkRatio > 0.9)
})

test('analyzeLumaFrame computes sharpness from structure', () => {
  const uniform = analyzeLumaFrame({ width: 40, height: 40, luma: makeLumaFrame(40, 40, () => 128) })
  const textured = analyzeLumaFrame({ width: 40, height: 40, luma: makeLumaFrame(40, 40, (x) => (x % 4 === 0 ? 240 : 16)) })
  assert.ok(textured.sharp > uniform.sharp, 'structured frame should look sharper')
})

test('otsuThreshold separates bright object from dark background', () => {
  const luma = documentFrame()
  const t = otsuThreshold({ width: 320, height: 240, luma })
  assert.ok(t > 60 && t < 200, `threshold ${t} should sit between modes`)
})
/* ------------------------------------------------------------------ *
 * Document region + quality classification
 * ------------------------------------------------------------------ */

test('classifyDocumentFrame grades a centered document GOOD', () => {
  const w = 320
  const h = 240
  const luma = documentFrame(w, h)
  const metrics = analyzeLumaFrame({ width: w, height: h, luma })
  const region = findDocumentRegion({ width: w, height: h, luma })
  assert.ok(region.bbox, 'document region should be found')
  assert.ok(region.coverage > 0.3 && region.coverage < 0.8, `coverage ${region.coverage}`)
  const verdict = classifyDocumentFrame({ metrics, region })
  assert.equal(verdict.grade, CAPTURE_GUIDE.GOOD)
  assert.equal(verdict.primaryInstruction, 'good_document')
})

test('document detector exposes four ephemeral guide corners, not evidence data', () => {
  const luma = documentFrame()
  const region = findDocumentRegion({ width: 320, height: 240, luma })
  assert.equal(region.quadrilateral?.length, 4)
  assert.ok(region.quadrilateral.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)))
  assert.equal('image' in region, false)
  assert.equal('data' in region, false)
})

test('classifyDocumentFrame reports a too-small document', () => {
  const w = 320
  const h = 240
  // Coverage ~8% (above the 3% "no document" floor, below the 18% too-small gate).
  // Mid-tone background keeps this a "small document" rather than a "dark frame".
  const luma = documentFrame(w, h, { x0: 110, y0: 80, x1: 200, y1: 150 }, 120)
  const metrics = analyzeLumaFrame({ width: w, height: h, luma })
  const region = findDocumentRegion({ width: w, height: h, luma })
  assert.ok(region.coverage > 0.03 && region.coverage < 0.18, `coverage ${region.coverage}`)
  const verdict = classifyDocumentFrame({ metrics, region })
  assert.equal(verdict.grade, CAPTURE_GUIDE.NEEDS_ADJUSTMENT)
  assert.equal(verdict.primaryInstruction, 'document_too_small')
})

test('classifyDocumentFrame reports clipped edges when the document touches the frame', () => {
  const luma = documentFrame(320, 240, { x0: 0, y0: 0, x1: 240, y1: 190 })
  const metrics = analyzeLumaFrame({ width: 320, height: 240, luma })
  const region = findDocumentRegion({ width: 320, height: 240, luma })
  const verdict = classifyDocumentFrame({ metrics, region })
  assert.ok(['document_clipped', 'document_corners'].includes(verdict.primaryInstruction))
  assert.notEqual(verdict.grade, CAPTURE_GUIDE.GOOD)
})

test('classifyDocumentFrame treats a fully dark frame as UNUSABLE', () => {
  const metrics = analyzeLumaFrame({ width: 40, height: 40, luma: makeLumaFrame(40, 40, () => 6) })
  const verdict = classifyDocumentFrame({ metrics, region: null })
  assert.equal(verdict.grade, CAPTURE_GUIDE.UNUSABLE)
  assert.equal(verdict.primaryInstruction, 'too_dark')
  assert.equal(verdict.hard, true)
})

test('classifyDocumentFrame treats an overexposed frame as UNUSABLE', () => {
  const metrics = analyzeLumaFrame({ width: 40, height: 40, luma: makeLumaFrame(40, 40, () => 252) })
  const verdict = classifyDocumentFrame({ metrics, region: null })
  assert.equal(verdict.grade, CAPTURE_GUIDE.UNUSABLE)
  assert.equal(verdict.primaryInstruction, 'too_bright')
  assert.equal(verdict.hard, true)
})

test('a good-quality verdict never claims durability', () => {
  const w = 320
  const h = 240
  const luma = documentFrame(w, h)
  const metrics = analyzeLumaFrame({ width: w, height: h, luma })
  const region = findDocumentRegion({ width: w, height: h, luma })
  const verdict = classifyDocumentFrame({ metrics, region })
  assert.equal('durable' in verdict, false, 'capture quality must stay separate from persistence ACK')
  assert.equal('saved' in verdict, false)
})

/* ------------------------------------------------------------------ *
 * Stability / debounce (hysteresis)
 * ------------------------------------------------------------------ */

test('stability requires a short consistent window', () => {
  const tracker = createStabilityTracker({ requiredFrames: 3 })
  assert.equal(tracker.push(true).stable, false)
  assert.equal(tracker.push(true).stable, false)
  assert.equal(tracker.push(true).stable, true)
  assert.equal(tracker.push(true).stable, true)
})

test('stability resets on a bad frame preventing ready/not-ready flicker', () => {
  const tracker = createStabilityTracker({ requiredFrames: 3 })
  tracker.push(true); tracker.push(true); tracker.push(true)
  const afterBad = tracker.push(false)
  assert.equal(afterBad.consecutive, 0)
  assert.equal(afterBad.stable, false)
  tracker.push(true)
  assert.equal(tracker.value.stable, false, 'a single good frame must not instantly re-arm')
})

test('stability can hard-reset on bad frames', () => {
  const tracker = createStabilityTracker({ requiredFrames: 3, resetOnBad: true })
  tracker.push(true); tracker.push(true); tracker.push(true)
  assert.equal(tracker.push(false).stable, false)
  tracker.push(true)
  assert.equal(tracker.value.stable, false)
})
/* ------------------------------------------------------------------ *
 * Auto-capture policy
 * ------------------------------------------------------------------ */

test('auto-capture requires a stable GOOD verdict and can be disabled', () => {
  const tracker = createStabilityTracker({ requiredFrames: 3 })
  tracker.push(true); tracker.push(true); tracker.push(true)
  const goodVerdict = { grade: CAPTURE_GUIDE.GOOD }
  assert.equal(shouldAutoCapture({ mode: CAPTURE_MODE.DOCUMENT, tracker, verdict: goodVerdict }).shouldCapture, true)
  assert.equal(shouldAutoCapture({ mode: CAPTURE_MODE.DOCUMENT, tracker, verdict: goodVerdict, enabled: false }).shouldCapture, false)
})

test('auto-capture never fires while the coach is unavailable', () => {
  const verdict = { grade: CAPTURE_GUIDE.GOOD }
  assert.deepEqual(shouldAutoCapture({ mode: CAPTURE_MODE.SELFIE, tracker: null, verdict }), {
    shouldCapture: false,
    reason: 'coach_unavailable',
  })
})

test('auto-capture sits behind the manual shutter', () => {
  const tracker = createStabilityTracker({ requiredFrames: 3 })
  tracker.push(true); tracker.push(true); tracker.push(true)
  const decision = shouldAutoCapture({
    mode: CAPTURE_MODE.SELFIE,
    tracker,
    verdict: { grade: CAPTURE_GUIDE.NEEDS_ADJUSTMENT },
  })
  assert.equal(decision.shouldCapture, false)
  assert.equal(decision.reason, 'not_good')
})

/* ------------------------------------------------------------------ *
 * Microcopy
 * ------------------------------------------------------------------ */

test('microcopy stays human and translatable', () => {
  assert.ok(CAPTURE_COPY.en.document_clipped.includes('corners'))
  assert.equal(copyForInstruction('pt', 'face_center'), 'Centralize seu rosto')
  assert.equal(copyForInstruction('xx', 'blur'), CAPTURE_COPY.en.blur)
  assert.equal(copyForInstruction('en', 'unknown_key', 'Hold still'), 'Hold still')
})

/* ------------------------------------------------------------------ *
 * Privacy: no frame persistence
 * ------------------------------------------------------------------ */

test('analysis is stateless and never retains frames', () => {
  const w = 320
  const h = 240
  const luma = documentFrame(w, h)
  const a = analyzeLumaFrame({ width: w, height: h, luma })
  const b = analyzeLumaFrame({ width: w, height: h, luma })
  assert.deepEqual(a, b, 'pure function must not mutate state')
  assert.equal('frames' in findDocumentRegion({ width: w, height: h, luma }), false)
  assert.equal('frames' in CAPTURE_COPY, false)
})
