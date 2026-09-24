const windows = globalThis.__kycRateLimitWindows || new Map()
globalThis.__kycRateLimitWindows = windows

export const getClientIp = (request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
  request.headers.get('cf-connecting-ip') ||
  request.headers.get('x-real-ip') ||
  'unknown'

export const applyRateLimit = ({ scope, identifier, max, windowMs }) => {
  const key = `${scope}:${identifier}`
  const now = Date.now()
  const recent = (windows.get(key) || []).filter((timestamp) => now - timestamp < windowMs)
  if (recent.length >= max) return { ok: false }
  recent.push(now)
  windows.set(key, recent)
  return { ok: true }
}