import assert from 'node:assert/strict'
import test from 'node:test'
import { REAUTH, SUBMISSION, maySubmit, submissionStateFromDurableState } from '../../src/app/lib/submissionContinuity.mjs'

test('a password value alone never unlocks final submission', () => {
  assert.equal(maySubmit({ accepted: true, password: 'wrong', reauthState: REAUTH.REQUIRED, submissionState: SUBMISSION.READY }), false)
  assert.equal(maySubmit({ accepted: true, password: 'wrong', reauthState: REAUTH.FAILED, submissionState: SUBMISSION.READY }), false)
  assert.equal(maySubmit({ accepted: true, reauthState: REAUTH.AUTHENTICATED, submissionState: SUBMISSION.READY }), true)
})

test('refresh preserves truthful final submission recovery state', () => {
  assert.equal(submissionStateFromDurableState(SUBMISSION.SUBMITTING), SUBMISSION.FAILED_RETRYABLE)
  assert.equal(submissionStateFromDurableState(SUBMISSION.FAILED_RETRYABLE), SUBMISSION.FAILED_RETRYABLE)
  assert.equal(submissionStateFromDurableState(SUBMISSION.SUBMITTED), SUBMISSION.SUBMITTED)
})
