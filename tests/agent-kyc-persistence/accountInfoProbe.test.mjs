import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PROBE_FIELDS,
  canUseAccountInfoProbe,
  failedAccountInfoProbe,
  hasOnlyProbeFields,
  sanitizeAccountInfo,
} from '../../src/app/lib/accountInfoProbe.mjs'

test('Account.Info probe is excluded from production', () => {
  assert.equal(canUseAccountInfoProbe('development'), true)
  assert.equal(canUseAccountInfoProbe('test'), true)
  assert.equal(canUseAccountInfoProbe('production'), false)
})

test('Account.Info probe exposes only booleans and nulls', () => {
  const result = sanitizeAccountInfo({
    userName: 'must-not-leak', created: '2026-08-24', eMail: 'must-not-leak@example.test',
    eMailVerified: null, phoneNr: '+46000000000', phoneNrVerified: '2026-08-24', enabled: false,
    jwt: 'must-not-leak', password: 'must-not-leak',
  })
  assert.equal(hasOnlyProbeFields(result), true)
  assert.deepEqual(Object.keys(result), [...PROBE_FIELDS])
  assert.equal(Object.values(result).every((value) => typeof value === 'boolean' || value === null), true)
  assert.equal(JSON.stringify(result).includes('must-not-leak'), false)
})

test('probe failures expose only an auth classification', () => {
  assert.deepEqual(failedAccountInfoProbe({ statusCode: 403 }), {
    requestSucceeded: false, userNamePresent: false, createdPresent: false,
    emailPresent: null, emailVerified: false, phonePresent: null, phoneVerified: false,
    accountDisabledOrRestricted: null, authBlocked: true,
  })
})
