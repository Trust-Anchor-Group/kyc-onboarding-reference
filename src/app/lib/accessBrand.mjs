const PRODUCT = Object.freeze({ name: 'Access', provider: 'Neuro' })

const normalizePartner = (value) => {
  const partner = String(value || '').trim()
  if (!partner || partner.toLowerCase() === 'none') return null
  return partner
}

// Access is partner-neutral unless an entry point explicitly provides context.
// Keep historical persistence identifiers untouched; this only controls active UX.
const getAccessBrand = (partner = process.env.NEXT_PUBLIC_ACCESS_PARTNER ?? 'none') => ({
  ...PRODUCT,
  partner: normalizePartner(partner),
})

const canUseEntryHarness = (nodeEnv) => nodeEnv !== 'production'

const resolveEntryBrand = ({ search = '', nodeEnv = process.env.NODE_ENV, partner } = {}) => {
  const configured = getAccessBrand(partner)
  if (!canUseEntryHarness(nodeEnv)) return configured
  const scenario = new URLSearchParams(search).get('__entry')
  if (scenario === 'generic') return getAccessBrand('none')
  if (scenario === 'partner') return getAccessBrand('Athletes and You')
  return configured
}

export { PRODUCT, canUseEntryHarness, getAccessBrand, normalizePartner, resolveEntryBrand }
