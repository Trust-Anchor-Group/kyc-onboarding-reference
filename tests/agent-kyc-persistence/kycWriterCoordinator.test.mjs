import assert from 'node:assert/strict'
import test from 'node:test'
import { createKycWriterCoordinator } from '../../src/app/lib/kycWriterCoordinator.mjs'

const createLocks = () => {
  let held = false
  const waiters = []
  return {
    async request(name, options, callback) {
      if (held && options?.ifAvailable) return callback(null)
      if (held) await new Promise((resolve) => waiters.push(resolve))
      held = true
      await callback({ name })
      held = false
      waiters.shift()?.()
    },
  }
}

test('first tab owns editing and second tab is read-only', async () => {
  const locks = createLocks()
  const firstStates = []
  const secondStates = []
  const first = createKycWriterCoordinator({
    navigatorObject: { locks },
    uuid: () => 'tab-a',
    onChange: (state) => firstStates.push(state),
  })
  const second = createKycWriterCoordinator({
    navigatorObject: { locks },
    uuid: () => 'tab-b',
    onChange: (state) => secondStates.push(state),
  })

  assert.equal(await first.start(), true)
  assert.equal(await second.start(), false)
  assert.equal(firstStates.at(-1).isOwner, true)
  assert.equal(secondStates.at(-1).isOwner, false)
  first.stop()
  second.stop()
})

test('another tab can acquire ownership after the first tab closes', async () => {
  const locks = createLocks()
  const firstStates = []
  const secondStates = []
  const first = createKycWriterCoordinator({
    navigatorObject: { locks },
    uuid: () => 'tab-a',
    onChange: (state) => firstStates.push(state),
  })
  assert.equal(await first.start(), true)
  const second = createKycWriterCoordinator({
    navigatorObject: { locks },
    uuid: () => 'tab-b',
    onChange: (state) => secondStates.push(state),
  })
  assert.equal(await second.start(), false)
  first.stop()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(firstStates.at(-1).isOwner, false)
  assert.equal(secondStates.at(-1).isOwner, true)
  second.stop()
})