const PROBE_FIELDS = Object.freeze([
  'requestSucceeded',
  'userNamePresent',
  'createdPresent',
  'emailPresent',
  'emailVerified',
  'phonePresent',
  'phoneVerified',
  'accountDisabledOrRestricted',
  'authBlocked',
])

const canUseAccountInfoProbe = (nodeEnv) => nodeEnv !== 'production'

const presentOrNull = (value) => value == null ? null : Boolean(String(value).trim())

const sanitizeAccountInfo = (info) => ({
  requestSucceeded: true,
  userNamePresent: Boolean(String(info?.userName ?? info?.UserName ?? '').trim()),
  createdPresent: Boolean(info?.created ?? info?.Created),
  emailPresent: presentOrNull(info?.eMail ?? info?.email ?? info?.EMail),
  emailVerified: Boolean(info?.eMailVerified ?? info?.emailVerified ?? info?.EMailVerified),
  phonePresent: presentOrNull(info?.phoneNr ?? info?.phone ?? info?.PhoneNr),
  phoneVerified: Boolean(info?.phoneNrVerified ?? info?.phoneVerified ?? info?.PhoneNrVerified),
  accountDisabledOrRestricted: typeof (info?.enabled ?? info?.Enabled) === 'boolean'
    ? !(info?.enabled ?? info?.Enabled)
    : null,
  authBlocked: false,
})

const failedAccountInfoProbe = (error) => {
  const status = Number(error?.status ?? error?.statusCode ?? error?.cause?.status ?? 0) || null
  return {
    requestSucceeded: false,
    userNamePresent: false,
    createdPresent: false,
    emailPresent: null,
    emailVerified: false,
    phonePresent: null,
    phoneVerified: false,
    accountDisabledOrRestricted: null,
    authBlocked: status === 401 || status === 403,
  }
}

const hasOnlyProbeFields = (value) =>
  value && Object.keys(value).length === PROBE_FIELDS.length && PROBE_FIELDS.every((field) => field in value)

export {
  PROBE_FIELDS,
  canUseAccountInfoProbe,
  failedAccountInfoProbe,
  hasOnlyProbeFields,
  sanitizeAccountInfo,
}
