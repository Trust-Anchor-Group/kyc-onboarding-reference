import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AGENT_CONTENT,
  EPHEMERAL_PRE_AGENT,
  AgentKycPersistence,
  AgentKycSaveQueue,
  RESTORE_RESULT,
  MultipleActiveKycApplicationsError,
  UnsupportedKycSchemaError,
  createKycApplicationPayload,
  parseKycApplicationPayload,
  sanitizeFormState,
  selectActiveApplication,
  stateContentId,
} from '../../src/app/lib/agentKycPersistence.mjs'

const APPLICATION_ID = 'd9707e43-e88c-4f35-a186-d74592570662'
const VAULT_ID = 'synthetic-vault-id'
const NOW = '2026-08-18T10:00:00.000Z'

const snapshot = (overrides = {}) => ({
  applicationId: APPLICATION_ID,
  state: 'FORM_IN_PROGRESS',
  currentStep: 5,
  form: {
    fullName: 'Synthetic Applicant',
    email: 'synthetic@example.invalid',
    phoneVerified: true,
    password: 'must-not-persist',
    jwt: 'must-not-persist',
  },
  documents: { frontPhoto: { base64: 'raw-image' }, backPhoto: null, selfie: { base64: 'raw-selfie' } },
  ...overrides,
})

const makeApplication = (overrides = {}) => createKycApplicationPayload({
  ...snapshot(), revision: 1, createdAt: NOW, updatedAt: NOW, ...overrides,
})

const createMocks = () => {
  const calls = []
  const indexes = new Map()
  const contents = new Map()
  let etag = 0
  return {
    calls,
    agentApi: {
      Storage: {
        async StoreInVault(vaultId, type, clientId, tags) {
          calls.push(['vault-store', vaultId, type, clientId, tags])
          const id = vaultId || VAULT_ID
          indexes.set(id, { vaultId: id, clientId, Tags: tags })
          return { vaultId: id }
        },
        async GetFromVault(vaultId) { return indexes.get(vaultId) },
        async SearchInVault() { return { ResultSet: [...indexes.values()] } },
        async DeleteFromVault(vaultId) { indexes.delete(vaultId) },
      },
    },
    content: {
      async put(application) {
        contents.set(application.applicationId, structuredClone(application))
        etag += 1
        return { url: `synthetic://${stateContentId(application.applicationId)}`, etag: `etag-${etag}` }
      },
      async get(applicationId) {
        const content = contents.get(applicationId)
        if (!content) throw new Error('content not found')
        return structuredClone(content)
      },
      async delete(applicationId) { contents.delete(applicationId) },
    },
    contents,
    indexes,
  }
}

const persistenceFor = (mocks) => new AgentKycPersistence(mocks.agentApi, {
  content: mocks.content,
  now: () => NOW,
  uuid: () => APPLICATION_ID,
})

test('state JSON persists only allowlisted fields and document placeholders', () => {
  const application = makeApplication()
  assert.deepEqual(application.form, { fullName: 'Synthetic Applicant', email: 'synthetic@example.invalid', phoneVerified: true })
  assert.deepEqual(application.documents, { frontPhoto: { status: 'legacy' }, backPhoto: null, selfie: { status: 'legacy' } })
  assert.equal(application.identity.legalId, null)
})

test('Content state uses a deterministic private application path', () => {
  assert.equal(stateContentId(APPLICATION_ID), `kyc/applications/${APPLICATION_ID}/state.json`)
})

test('create writes and verifies Content before creating an empty-tag Vault index', async () => {
  const mocks = createMocks()
  const created = await persistenceFor(mocks).createApplication(snapshot())
  assert.equal(created.application.applicationId, APPLICATION_ID)
  assert.deepEqual(mocks.calls, [['vault-store', null, 'kikkin.kyc.application.v1', APPLICATION_ID, []]])
  assert.deepEqual(await mocks.content.get(APPLICATION_ID), created.application)
})

test('find searches the Vault index then restores durable Content state', async () => {
  const mocks = createMocks()
  const persistence = persistenceFor(mocks)
  const created = await persistence.createApplication(snapshot())
  const found = await persistence.findActiveApplication()
  assert.equal(found.malformed.length, 0)
  assert.equal(found.active.vaultId, created.vaultId)
  assert.equal(found.active.application.applicationId, APPLICATION_ID)
})

test('update replaces the same Content state and increments revision without changing index tags', async () => {
  const mocks = createMocks()
  const persistence = persistenceFor(mocks)
  const created = await persistence.createApplication(snapshot())
  const updated = await persistence.updateApplication(created.vaultId, created.application, { currentStep: 6, form: { fullName: 'Updated Applicant' } })
  assert.equal(updated.revision, 2)
  assert.equal(updated.currentStep, 6)
  assert.equal((await mocks.content.get(APPLICATION_ID)).form.fullName, 'Updated Applicant')
  assert.deepEqual(mocks.indexes.get(VAULT_ID).Tags, [])
})

test('delete removes Content state and its Vault index', async () => {
  const mocks = createMocks()
  const persistence = persistenceFor(mocks)
  const created = await persistence.createApplication(snapshot())
  await persistence.deleteApplication(created.vaultId, APPLICATION_ID)
  assert.equal(mocks.contents.has(APPLICATION_ID), false)
  assert.equal(mocks.indexes.has(VAULT_ID), false)
})

test('failed index verification removes the Content state', async () => {
  const mocks = createMocks()
  mocks.agentApi.Storage.GetFromVault = async () => ({ vaultId: VAULT_ID, clientId: '00000000-0000-4000-8000-000000000000' })
  await assert.rejects(() => persistenceFor(mocks).createApplication(snapshot()), { code: 'VAULT_INDEX_VERIFICATION_FAILED' })
  assert.equal(mocks.contents.has(APPLICATION_ID), false)
})

test('failed Vault Search verification removes both the Content state and index', async () => {
  const mocks = createMocks()
  mocks.agentApi.Storage.SearchInVault = async () => ({ ResultSet: [] })
  await assert.rejects(() => persistenceFor(mocks).createApplication(snapshot()), { code: 'VAULT_INDEX_VERIFICATION_FAILED' })
  assert.equal(mocks.contents.has(APPLICATION_ID), false)
  assert.equal(mocks.indexes.has(VAULT_ID), false)
})

test('failed Agent save does not advance durable state or invoke a Redis fallback', async () => {
  const mocks = createMocks()
  const persistence = persistenceFor(mocks)
  const created = await persistence.createApplication(snapshot())
  mocks.content.put = async () => { throw new Error('synthetic Agent Content failure') }
  await assert.rejects(() => persistence.updateApplication(created.vaultId, created.application, { currentStep: 6 }))
  assert.equal((await mocks.content.get(APPLICATION_ID)).revision, 1)
  assert.equal(mocks.calls.filter(([name]) => name.startsWith('redis')).length, 0)
})

test('payload parsing rejects unsupported schema and removes sensitive fields', () => {
  assert.deepEqual(sanitizeFormState({ email: 'safe@example.invalid', password: 'secret' }), { email: 'safe@example.invalid' })
  assert.throws(() => parseKycApplicationPayload({ ...makeApplication(), schemaVersion: 2 }), UnsupportedKycSchemaError)
})
test('active selection rejects ambiguity without a Redis persistence mode', () => {
  const active = { application: makeApplication() }
  assert.equal(selectActiveApplication([active]), active)
  assert.throws(() => selectActiveApplication([active, active]), MultipleActiveKycApplicationsError)
})

test('every new journey begins ephemeral and cannot select a Redis fallback mode', () => {
  assert.equal(EPHEMERAL_PRE_AGENT, 'EPHEMERAL_PRE_AGENT')
  assert.equal(AGENT_CONTENT, 'AGENT_CONTENT')
})

test('failed ephemeral Agent creation leaves no durable state or Redis fallback', async () => {
  const mocks = createMocks()
  mocks.content.put = async () => { throw new Error('synthetic Agent Content failure') }
  await assert.rejects(() => persistenceFor(mocks).createApplication(snapshot()))
  assert.equal(mocks.contents.size, 0)
  assert.equal(mocks.indexes.size, 0)
  assert.equal(mocks.calls.filter(([name]) => name.startsWith('redis')).length, 0)
})

test('Agent application creation validates state recovered from Content', async () => {
  const mocks = createMocks()
  const restored = await persistenceFor(mocks).createApplication(snapshot())
  assert.equal(restored.application.applicationId, APPLICATION_ID)
  assert.equal(restored.vaultId, VAULT_ID)
})

test('cached and no-cache Vault Search recovery both restore the latest Agent state', async () => {
  const mocks = createMocks()
  const persistence = persistenceFor(mocks)
  const created = await persistence.createApplication(snapshot())
  const updated = await persistence.updateApplication(created.vaultId, created.application, { currentStep: 8, form: { legalId: 'synthetic-legal-marker' } })
  const cached = await persistence.getApplication(APPLICATION_ID, VAULT_ID)
  const noCache = await persistence.findActiveApplication()
  assert.equal(cached.application.revision, 2)
  assert.equal(cached.application.currentStep, 8)
  assert.equal(noCache.active.application.revision, 2)
  assert.equal(noCache.active.application.identity.legalId, 'synthetic-legal-marker')
  assert.equal(updated.revision, noCache.active.application.revision)
})

test('one active plus terminal applications selects the active application, while multiple active is a conflict', () => {
  const active = { application: makeApplication() }
  const terminal = { application: makeApplication({ applicationId: 'c9707e43-e88c-4f35-a186-d74592570662', state: 'APPROVED' }) }
  assert.equal(selectActiveApplication([]), null)
  assert.equal(selectActiveApplication([active, terminal]), active)
  assert.equal(selectActiveApplication([terminal, terminal]), null)
  assert.throws(() => selectActiveApplication([active, active]), MultipleActiveKycApplicationsError)
})

test('save queue coalesces a pending state update', async () => {
  const saved = []
  let releaseFirst
  const firstSave = new Promise((resolve) => { releaseFirst = resolve })
  const queue = new AgentKycSaveQueue(async (value) => {
    saved.push(value)
    if (value.step === 1) await firstSave
    return value
  })
  const first = queue.enqueue({ step: 1, field: 'A' })
  const second = queue.enqueue({ step: 2, field: 'B' })
  const third = queue.enqueue({ step: 3, field: 'C' })
  releaseFirst()
  await Promise.all([first, second, third])
  assert.deepEqual(saved, [{ step: 1, field: 'A' }, { step: 3, field: 'C' }])
})

test('state JSON preserves Agent document metadata but drops raw document payloads', () => {
  const descriptor = {
    status: 'uploaded',
    slot: 'frontPhoto',
    contentId: `kyc/applications/${APPLICATION_ID}/documents/id-front-r1.jpg`,
    mimeType: 'image/jpeg',
    size: 4,
    etag: 'synthetic-etag',
    sha256: 'a'.repeat(64),
    documentRevision: 1,
    updatedAt: NOW,
    base64: 'must-not-persist',
  }
  const application = makeApplication({ documents: { frontPhoto: descriptor } })
  assert.equal(application.documents.frontPhoto.contentId, descriptor.contentId)
  assert.equal(application.documents.frontPhoto.base64, undefined)
})

test('restore classifies 200, 404, auth, transient failure, and invalid state distinctly', async () => {
  const mocks = createMocks()
  const persistence = persistenceFor(mocks)
  await persistence.createApplication(snapshot())
  assert.equal((await persistence.restoreApplication(APPLICATION_ID, VAULT_ID)).status, RESTORE_RESULT.FOUND)

  mocks.content.get = async () => { const error = new Error('not found'); error.status = 404; throw error }
  assert.equal((await persistence.restoreApplication(APPLICATION_ID, VAULT_ID)).status, RESTORE_RESULT.NOT_FOUND)

  mocks.content.get = async () => { const error = new Error('unauthorized'); error.status = 401; throw error }
  assert.equal((await persistence.restoreApplication(APPLICATION_ID, VAULT_ID)).status, RESTORE_RESULT.AUTH_FAILED)

  mocks.content.get = async () => { const error = new Error('temporary'); error.status = 500; throw error }
  assert.equal((await persistence.restoreApplication(APPLICATION_ID, VAULT_ID)).status, RESTORE_RESULT.TRANSIENT_FAILURE)

  mocks.content.get = async () => ({ schemaVersion: 1, applicationId: APPLICATION_ID })
  assert.equal((await persistence.restoreApplication(APPLICATION_ID, VAULT_ID)).status, RESTORE_RESULT.INVALID_STATE)
})

test('a transient restore failure does not write, create, or replace populated durable state and retry restores it', async () => {
  const mocks = createMocks()
  const persistence = persistenceFor(mocks)
  const created = await persistence.createApplication(snapshot({ currentStep: 9, form: { fullName: 'Durable Applicant' } }))
  const durableBeforeFailure = structuredClone(mocks.contents.get(APPLICATION_ID))
  let putCalls = 0
  const originalPut = mocks.content.put
  mocks.content.put = async (...args) => { putCalls += 1; return originalPut(...args) }
  let failRead = true
  mocks.content.get = async (applicationId) => {
    if (failRead) { const error = new Error('runtime failed'); error.status = 500; throw error }
    return structuredClone(mocks.contents.get(applicationId))
  }

  assert.equal((await persistence.restoreApplication(APPLICATION_ID, created.vaultId)).status, RESTORE_RESULT.TRANSIENT_FAILURE)
  assert.deepEqual(mocks.contents.get(APPLICATION_ID), durableBeforeFailure)
  assert.equal(putCalls, 0)
  assert.equal(mocks.calls.filter(([name]) => name === 'vault-store').length, 1)

  failRead = false
  const retried = await persistence.restoreApplication(APPLICATION_ID, created.vaultId)
  assert.equal(retried.status, RESTORE_RESULT.FOUND)
  assert.equal(retried.restored.application.currentStep, 9)
  assert.equal(retried.restored.application.form.fullName, 'Durable Applicant')
  assert.equal(putCalls, 0)
})
