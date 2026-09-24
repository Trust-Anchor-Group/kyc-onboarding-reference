import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PENDING_HINT_TTL_MS,
  accountVerificationFromInfo,
  createPendingHint,
  parsePendingHint,
  pendingStepFromVerification,
} from '../../src/app/lib/pendingAccountRecovery.mjs'

test('Agent verification status is authoritative for every partial state', () => {
  const matrix = [
    [{ phoneNrVerified: false, eMailVerified: false }, 1],
    [{ phoneNrVerified: true, eMailVerified: false }, 2],
    [{ phoneNrVerified: false, eMailVerified: true }, 1],
    [{ phoneNrVerified: true, eMailVerified: true }, 3],
  ]
  for (const [info, step] of matrix) {
    assert.equal(pendingStepFromVerification(accountVerificationFromInfo(info)), step)
  }
})

test('enabled account overrides stale partial fields', () => {
  assert.deepEqual(accountVerificationFromInfo({ enabled: true }), {
    enabled: true,
    emailVerified: true,
    phoneVerified: true,
  })
})

test('pending hint is minimal, absolute-expiry based and non-authoritative', () => {
  const now = 1_000
  const hint = createPendingHint({ accountHandle: 'opaque-handle', now })
  assert.deepEqual(Object.keys(hint).sort(), ['accountHandle', 'activeChannel', 'journey', 'otpExpiresAt', 'schemaVersion'])
  assert.equal(hint.otpExpiresAt, now + PENDING_HINT_TTL_MS)
  assert.deepEqual(parsePendingHint(JSON.stringify(hint), now), hint)
  assert.equal(parsePendingHint(JSON.stringify(hint), hint.otpExpiresAt), null)
})

test('pending hint never contains KYC, contact, credential, OTP or token data', () => {
  const hint = createPendingHint({ accountHandle: 'opaque-handle', now: 1_000 })
  for (const forbidden of ['email', 'phone', 'fullName', 'birthDate', 'cpf', 'address', 'password', 'otpCode', 'jwt', 'documents', 'selfie']) {
    assert.equal(Object.hasOwn(hint, forbidden), false)
  }
  assert.equal(hint.activeChannel, 'phone')
})
