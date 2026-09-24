import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canUseUxAcceptanceHarness,
  getUxAcceptanceScenario,
  SCENARIOS,
} from '../../src/app/lib/uxAcceptanceHarness.mjs'

test('UX acceptance harness is impossible to activate in production', () => {
  assert.equal(canUseUxAcceptanceHarness('production'), false)
  assert.equal(getUxAcceptanceScenario('completion', 'production'), null)
})

test('UX acceptance harness exposes representative development states only', () => {
  assert.equal(canUseUxAcceptanceHarness('development'), true)
  assert.equal(getUxAcceptanceScenario('phone-error', 'development').ui, 'otp-error')
  assert.equal(getUxAcceptanceScenario('completion', 'test').ui, 'completion')
  assert.equal(getUxAcceptanceScenario('capture-document-ready', 'development').capture.state, 'ready')
  assert.equal(getUxAcceptanceScenario('capture-selfie-multiple', 'test').capture.mode, 'selfie')
  assert.equal(getUxAcceptanceScenario('device-front', 'development').durable, undefined)
  assert.equal(getUxAcceptanceScenario('device-front', 'production'), null)
  assert.equal(getUxAcceptanceScenario('unknown', 'development'), null)
  assert.ok(Object.keys(SCENARIOS).length >= 15)
})
