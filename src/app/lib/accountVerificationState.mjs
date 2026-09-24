const PRE_ACCOUNT = 'PRE_ACCOUNT'
const ACCOUNT_CREATING = 'ACCOUNT_CREATING'
const ACCOUNT_CREATED_DISABLED = 'ACCOUNT_CREATED_DISABLED'
const EMAIL_VERIFICATION_PENDING = 'EMAIL_VERIFICATION_PENDING'
const PHONE_VERIFICATION_PENDING = 'PHONE_VERIFICATION_PENDING'
const ACCOUNT_ENABLED = 'ACCOUNT_ENABLED'

const verificationStateFor = ({ emailVerified = false, phoneVerified = false, phoneRequired = true }) => {
  if (!emailVerified) return EMAIL_VERIFICATION_PENDING
  if (phoneRequired && !phoneVerified) return PHONE_VERIFICATION_PENDING
  return ACCOUNT_ENABLED
}

const canProbeAccountInfo = (state) => state === ACCOUNT_ENABLED

export {
  ACCOUNT_CREATED_DISABLED,
  ACCOUNT_CREATING,
  ACCOUNT_ENABLED,
  EMAIL_VERIFICATION_PENDING,
  PHONE_VERIFICATION_PENDING,
  PRE_ACCOUNT,
  canProbeAccountInfo,
  verificationStateFor,
}