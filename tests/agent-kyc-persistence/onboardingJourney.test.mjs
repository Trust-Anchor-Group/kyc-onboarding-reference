import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getOnboardingPhase,
  getOnboardingPhaseIndex,
  getPrimaryActionLabel,
  getActiveTask,
  ONBOARDING_PHASES,
} from '../../src/app/components/onboardingJourney.mjs'

test('onboarding exposes four applicant phases instead of internal step numbers', () => {
  assert.equal(ONBOARDING_PHASES.length, 4)
  assert.equal(getOnboardingPhase(0).label, 'Secure your verification')
  assert.equal(getOnboardingPhase(5).label, 'About you')
  assert.equal(getOnboardingPhase(11).label, 'Verify your identity')
  assert.equal(getOnboardingPhase(17).label, 'Review and submit')
  assert.equal(getOnboardingPhaseIndex(17), 3)
})

test('active task mapping identifies the one task needing attention', () => {
  assert.equal(getActiveTask(3), 'details')
  assert.equal(getActiveTask(1), 'verify-phone')
  assert.equal(getActiveTask(2), 'verify-email')
  assert.equal(getActiveTask(11), 'front-photo')
  assert.equal(getActiveTask(13), 'back-photo')
  assert.equal(getActiveTask(14), 'selfie')
  assert.equal(getActiveTask(17), 'consent')
})

test('important journey actions use human-facing labels', () => {
  assert.equal(getPrimaryActionLabel(0), 'Send verification codes')
  assert.equal(getPrimaryActionLabel(1), 'Verify phone')
  assert.equal(getPrimaryActionLabel(11), 'Use this photo')
  assert.equal(getPrimaryActionLabel(17), 'Submit verification')
})
