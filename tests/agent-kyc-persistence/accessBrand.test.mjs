import assert from 'node:assert/strict'
import test from 'node:test'
import { canUseEntryHarness, getAccessBrand, resolveEntryBrand } from '../../src/app/lib/accessBrand.mjs'

test('Access is always the product and Neuro is always the provider', () => {
  assert.deepEqual(getAccessBrand('Athletes and You'), { name: 'Access', provider: 'Neuro', partner: 'Athletes and You' })
  assert.deepEqual(getAccessBrand('none'), { name: 'Access', provider: 'Neuro', partner: null })
})

test('entry acceptance variants cannot override production partner context', () => {
  assert.equal(canUseEntryHarness('production'), false)
  assert.equal(resolveEntryBrand({ search: '?__entry=generic', nodeEnv: 'production', partner: 'Athletes and You' }).partner, 'Athletes and You')
})

test('development acceptance can render generic and partner entries', () => {
  assert.equal(resolveEntryBrand({ search: '?__entry=generic', nodeEnv: 'development', partner: 'Athletes and You' }).partner, null)
  assert.equal(resolveEntryBrand({ search: '?__entry=partner', nodeEnv: 'development', partner: null }).partner, 'Athletes and You')
})
