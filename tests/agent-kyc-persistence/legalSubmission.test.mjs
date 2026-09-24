import assert from 'node:assert/strict'
import test from 'node:test'
import { submitLegalEvidence } from '../../src/app/lib/legalSubmission.mjs'

test('an immediately approved sandbox identity needs no evidence submission', async () => {
  const calls = []
  await submitLegalEvidence({
    legalId: 'synthetic-id',
    getIdentity: async () => ({ Identity: { status: { state: 'Approved' } } }),
    uploadAttachments: async () => { calls.push('upload') },
    readyForApproval: async () => { calls.push('ready') },
  })
  assert.deepEqual(calls, [])
})

test('a created identity receives its evidence and readiness request', async () => {
  const calls = []
  await submitLegalEvidence({
    legalId: 'synthetic-id',
    getIdentity: async () => ({ Identity: { status: { state: 'Created' } } }),
    uploadAttachments: async () => { calls.push('upload') },
    readyForApproval: async () => { calls.push('ready') },
  })
  assert.deepEqual(calls, ['upload', 'ready'])
})

test('a failed upload is accepted only if the identity was approved meanwhile', async () => {
  let state = 'Created'
  await submitLegalEvidence({
    legalId: 'synthetic-id',
    getIdentity: async () => ({ Identity: { status: { state } } }),
    uploadAttachments: async () => { state = 'Approved'; throw new Error('already approved') },
    readyForApproval: async () => { assert.fail('readiness should not be requested') },
  })

  state = 'Created'
  await assert.rejects(submitLegalEvidence({
    legalId: 'synthetic-id',
    getIdentity: async () => ({ Identity: { status: { state } } }),
    uploadAttachments: async () => { throw new Error('upload failed') },
    readyForApproval: async () => { assert.fail('readiness should not be requested') },
  }), /upload failed/)
})
