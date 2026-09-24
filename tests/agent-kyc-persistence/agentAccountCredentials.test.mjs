import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  buildAccountLoginCandidates,
  emailAccountNameFor,
  normalizeAccountEmail,
  passwordDigestForAccount,
} from '../../src/app/lib/agentAccountCredentials.mjs'

test('Secure-first reauthentication uses the original email-derived account handle', () => {
  const candidates = buildAccountLoginCandidates({
    accountHandle: 'opaque-account-handle',
    email: 'applicant@example.test',
    apiUrl: 'https://agent.example.test',
    password: 'memory-only-password',
  })
  assert.equal(candidates[0].scheme, 'account-handle-v1')
  assert.equal(candidates[0].accountName, 'opaque-account-handle')
  assert.equal(candidates[0].passwordDigest, passwordDigestForAccount('opaque-account-handle', 'https://agent.example.test', 'memory-only-password'))
  assert.equal(candidates.length, 1)
})

test('email login deterministically derives the account name without using personal number', () => {
  const apiUrl = 'https://agent.example.test'
  const accountName = emailAccountNameFor(' Applicant@Example.Test ', apiUrl)
  const candidates = buildAccountLoginCandidates({
    email: ' Applicant@Example.Test ',
    apiUrl,
    password: 'memory-only-password',
  })
  assert.equal(normalizeAccountEmail(' Applicant@Example.Test '), 'applicant@example.test')
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0].scheme, 'email-v1')
  assert.equal(candidates[0].accountName, accountName)
  assert.equal(candidates[0].passwordDigest, passwordDigestForAccount(accountName, apiUrl, 'memory-only-password'))
  assert.equal(JSON.stringify(candidates).includes('memory-only-password'), false)
})

test('browser and account-create route derive the same opaque username', () => {
  const apiUrl = 'https://agent.example.test'
  const email = normalizeAccountEmail(' Applicant@Example.Test ')
  const serverDerived = createHash('shake256', { outputLength: 12 })
    .update(`${apiUrl}:${email}`, 'utf8')
    .digest('base64url')
  assert.equal(emailAccountNameFor(email, apiUrl), serverDerived)
  assert.equal(serverDerived.includes(email), false)
})
