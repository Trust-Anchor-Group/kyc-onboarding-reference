import assert from 'node:assert/strict'
import test from 'node:test'
import {
  LEGAL_PROPERTY_ORDER,
  buildLegalProperties,
  classifyLegalApplyPreflightFailure,
  evaluateLegalApplyPreflight,
  isLegalApplyPreflightReady,
  isLegalRefererUsable,
  propertyNamesAreStable,
} from '../../src/app/lib/legalApplyPreflight.mjs'

const form = {
  fullName: 'Synthetic Legal Applicant',
  documentNumber: '111.444.777-35',
  birthDate: '1990-01-15',
  addressStreet: 'Synthetic Avenue',
  addressNumber: '101',
  addressZip: '12345-678',
  addressCity: 'Test City',
  addressCountry: 'BR',
  addressNeighborhood: 'Test District',
}

test('Legal ApplyId properties use a stable canonical dictionary order', () => {
  const properties = buildLegalProperties(form)
  assert.deepEqual(Object.keys(properties), LEGAL_PROPERTY_ORDER.slice(0, -1))
  assert.equal(propertyNamesAreStable(properties), true)
})

test('Legal ApplyId preflight rejects missing target-required properties', () => {
  const properties = buildLegalProperties(form)
  const result = evaluateLegalApplyPreflight({
    accountEnabled: true,
    keyExists: true,
    keyAlgorithmMatches: true,
    applicationAttributesLoaded: true,
    properties,
    applicationAttributes: [{ name: 'FIRST', required: true }, { name: 'TARGET_REQUIRED', required: true }],
    personalNumberValid: true,
    accountPasswordAvailable: true,
    keyPasswordAvailable: true,
    refererPresent: true,
    requestHostMatchesSignatureHost: true,
    existingLegalApplicationAbsent: true,
  })
  assert.equal(result.requiredPropertiesPresent, false)
  assert.equal(isLegalApplyPreflightReady(result), false)
})

test('Legal ApplyId preflight requires all contract checks before one retry', () => {
  const properties = buildLegalProperties(form)
  const result = evaluateLegalApplyPreflight({
    accountEnabled: true,
    keyExists: true,
    keyAlgorithmMatches: true,
    applicationAttributesLoaded: true,
    properties,
    applicationAttributes: [{ name: 'FIRST', required: true }, { name: 'PNR', required: true }],
    personalNumberValid: true,
    accountPasswordAvailable: true,
    keyPasswordAvailable: true,
    refererPresent: true,
    requestHostMatchesSignatureHost: true,
    existingLegalApplicationAbsent: true,
  })
  assert.equal(isLegalApplyPreflightReady(result), true)
})

test('Legal ApplyId rejects localhost as immutable browser Referer metadata', () => {
  assert.equal(isLegalRefererUsable('http://localhost:3000'), false)
  assert.equal(isLegalRefererUsable('http://localhost'), true)
  assert.equal(isLegalRefererUsable('https://127.0.0.1'), false)
  assert.equal(isLegalRefererUsable('https://kyc.example.test'), true)
})

test('Legal ApplyId preflight reports an unsupported browser origin precisely', () => {
  assert.equal(classifyLegalApplyPreflightFailure({ refererPresent: false }), 'LEGAL_ORIGIN_UNSUPPORTED')
  assert.equal(classifyLegalApplyPreflightFailure({ refererPresent: true, requestHostMatchesSignatureHost: false }), 'LEGAL_SIGNATURE_HOST_MISMATCH')
  assert.equal(classifyLegalApplyPreflightFailure({ refererPresent: true, requestHostMatchesSignatureHost: true }), 'LEGAL_APPLY_PREFLIGHT_FAILED')
})
