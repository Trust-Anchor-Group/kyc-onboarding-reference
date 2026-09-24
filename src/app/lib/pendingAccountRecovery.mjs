const PENDING_HINT_KEY = 'access.pendingVerification.v1'
const PENDING_HINT_TTL_MS = 24 * 60 * 60 * 1000

const accountVerificationFromInfo = (info = {}) => {
  const enabled = Boolean(info.enabled ?? info.Enabled)
  return {
    emailVerified: enabled || Boolean(info.eMailVerified ?? info.emailVerified ?? info.EMailVerified),
    phoneVerified: enabled || Boolean(info.phoneNrVerified ?? info.phoneVerified ?? info.PhoneNrVerified),
    enabled,
  }
}

const pendingStepFromVerification = ({ phoneVerified, emailVerified }) => {
  if (!phoneVerified) return 1
  if (!emailVerified) return 2
  return 3
}

const createPendingHint = ({ accountHandle, activeChannel = 'phone', now = Date.now() }) => ({
  schemaVersion: 1,
  journey: 'access',
  accountHandle,
  activeChannel,
  otpExpiresAt: now + PENDING_HINT_TTL_MS,
})

const parsePendingHint = (raw, now = Date.now()) => {
  try {
    const hint = JSON.parse(raw)
    if (hint?.schemaVersion !== 1 || hint?.journey !== 'access') return null
    if (!['phone', 'email'].includes(hint.activeChannel)) return null
    if (!hint.accountHandle || typeof hint.accountHandle !== 'string') return null
    if (!Number.isFinite(hint.otpExpiresAt) || hint.otpExpiresAt <= now) return null
    return hint
  } catch {
    return null
  }
}

export {
  PENDING_HINT_KEY,
  PENDING_HINT_TTL_MS,
  accountVerificationFromInfo,
  createPendingHint,
  parsePendingHint,
  pendingStepFromVerification,
}
