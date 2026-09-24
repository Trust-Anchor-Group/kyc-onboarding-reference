const LEGAL_PROPERTY_ORDER = Object.freeze([
  'FIRST',
  'LAST',
  'PNR',
  'ADDR',
  'ZIP',
  'CITY',
  'COUNTRY',
  'AREA',
  'BDAY',
  'BMONTH',
  'BYEAR',
  'COMPLEMENT',
])

const buildLegalProperties = (form) => {
  const nameParts = String(form.fullName || '').trim().split(/\s+/).filter(Boolean)
  const lastName = nameParts.pop() || ''
  const firstName = nameParts.join(' ')
  const [year = '', month = '', day = ''] = String(form.birthDate || '').split('-')
  const properties = {
    FIRST: firstName,
    LAST: lastName,
    PNR: form.documentNumber || '',
    ADDR: [form.addressStreet, form.addressNumber].filter(Boolean).join(' '),
    ZIP: form.addressZip || '',
    CITY: form.addressCity || '',
    COUNTRY: form.addressCountry || '',
    AREA: form.addressNeighborhood || '',
    BDAY: day,
    BMONTH: month,
    BYEAR: year,
  }
  if (String(form.addressComplement || '').trim()) properties.COMPLEMENT = form.addressComplement.trim()
  return properties
}

const propertyNamesAreStable = (properties) =>
  Object.keys(properties).every((name, index) => name === LEGAL_PROPERTY_ORDER[index])

const isLegalRefererUsable = (origin) => {
  try {
    const url = new URL(origin)
    // The Legal service resolves the browser Referer server-side. Localhost with a
    // development port is not reachable there; only the default HTTP origin works.
    if (url.hostname === 'localhost') return url.protocol === 'http:' && url.port === ''
    return url.protocol === 'https:' && !['127.0.0.1', '::1'].includes(url.hostname)
  } catch {
    return false
  }
}

const requiredPropertyNames = (attributes) => (Array.isArray(attributes) ? attributes : [])
  .filter((attribute) => attribute?.required === true || attribute?.Required === true)
  .map((attribute) => attribute?.name || attribute?.Name)
  .filter((name) => typeof name === 'string')

const evaluateLegalApplyPreflight = ({
  accountEnabled,
  keyExists,
  keyAlgorithmMatches,
  applicationAttributesLoaded,
  properties,
  applicationAttributes,
  personalNumberValid,
  accountPasswordAvailable,
  keyPasswordAvailable,
  refererPresent,
  requestHostMatchesSignatureHost,
  existingLegalApplicationAbsent,
}) => {
  const requiredNames = requiredPropertyNames(applicationAttributes)
  const requiredPropertiesPresent = requiredNames.every((name) => String(properties?.[name] || '').trim())
  const propertiesDictionaryValid = Boolean(properties) && !Array.isArray(properties) && typeof properties === 'object'
  const propertyOrderStable = propertiesDictionaryValid && propertyNamesAreStable(properties)
  return {
    accountEnabled: Boolean(accountEnabled),
    keyExists: Boolean(keyExists),
    keyAlgorithmMatches: Boolean(keyAlgorithmMatches),
    applicationAttributesLoaded: Boolean(applicationAttributesLoaded),
    requiredPropertiesPresent,
    personalNumberValid: Boolean(personalNumberValid),
    propertiesDictionaryValid,
    propertyOrderStable,
    accountPasswordAvailable: Boolean(accountPasswordAvailable),
    keyPasswordAvailable: Boolean(keyPasswordAvailable),
    refererPresent: Boolean(refererPresent),
    requestHostMatchesSignatureHost: Boolean(requestHostMatchesSignatureHost),
    existingLegalApplicationAbsent: Boolean(existingLegalApplicationAbsent),
  }
}

const isLegalApplyPreflightReady = (result) => Object.values(result).every(Boolean)

const classifyLegalApplyPreflightFailure = (result) => {
  if (result?.refererPresent === false) return 'LEGAL_ORIGIN_UNSUPPORTED'
  if (result?.requestHostMatchesSignatureHost === false) return 'LEGAL_SIGNATURE_HOST_MISMATCH'
  if (result?.existingLegalApplicationAbsent === false) return 'LEGAL_APPLICATION_ALREADY_EXISTS'
  return 'LEGAL_APPLY_PREFLIGHT_FAILED'
}

export {
  LEGAL_PROPERTY_ORDER,
  buildLegalProperties,
  classifyLegalApplyPreflightFailure,
  evaluateLegalApplyPreflight,
  isLegalApplyPreflightReady,
  isLegalRefererUsable,
  propertyNamesAreStable,
  requiredPropertyNames,
}
