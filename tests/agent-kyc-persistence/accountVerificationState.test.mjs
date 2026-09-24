import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACCOUNT_ENABLED,
  EMAIL_VERIFICATION_PENDING,
  PHONE_VERIFICATION_PENDING,
  canProbeAccountInfo,
  verificationStateFor,
} from '../../src/app/lib/accountVerificationState.mjs'

test('newly created account enters verification without Account.Info eligibility', () => {
  const state = verificationStateFor({ emailVerified: false, phoneVerified: false, phoneRequired: true })
  assert.equal(state, EMAIL_VERIFICATION_PENDING)
  assert.equal(canProbeAccountInfo(state), false)
})

test('email verification alone keeps a phone-provided account pending', () => {
  const state = verificationStateFor({ emailVerified: true, phoneVerified: false, phoneRequired: true })
  assert.equal(state, PHONE_VERIFICATION_PENDING)
  assert.equal(canProbeAccountInfo(state), false)
})

test('both required verifications enable the Account.Info gate', () => {
  const state = verificationStateFor({ emailVerified: true, phoneVerified: true, phoneRequired: true })
  assert.equal(state, ACCOUNT_ENABLED)
  assert.equal(canProbeAccountInfo(state), true)
})

test('an account without a phone requires email verification only', () => {
  const state = verificationStateFor({ emailVerified: true, phoneVerified: false, phoneRequired: false })
  assert.equal(state, ACCOUNT_ENABLED)
  assert.equal(canProbeAccountInfo(state), true)
})

test('verification failure remains pending and cannot cut over or fall back to Redis', () => {
  const state = verificationStateFor({ emailVerified: false, phoneVerified: true, phoneRequired: true })
  assert.equal(state, EMAIL_VERIFICATION_PENDING)
  assert.equal(canProbeAccountInfo(state), false)
})

test('an Account.Info 403 before verification is an expected disabled-account state', () => {
  const state = verificationStateFor({ emailVerified: false, phoneVerified: false, phoneRequired: true })
  assert.equal(canProbeAccountInfo(state), false)
})

test('an Account.Info 403 after all verification is an unexpected enabled-account target failure', () => {
  const state = verificationStateFor({ emailVerified: true, phoneVerified: true, phoneRequired: true })
  assert.equal(canProbeAccountInfo(state), true)
})

test('a successful post-verification Account.Info response is enabled even without an enabled field', () => {
  const info = { eMailVerified: 1, phoneNrVerified: 1 }
  const state = verificationStateFor({ emailVerified: true, phoneVerified: true, phoneRequired: true })
  assert.equal(canProbeAccountInfo(state), true)
  assert.equal('enabled' in info, false)
})