import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AgentKycDocuments,
  AgentKycDocumentError,
  MAX_DOCUMENT_BYTES,
  canPersistDocuments,
  documentContentId,
  extensionForMime,
  sanitizeDocumentDescriptor,
  shouldUseAgentDocuments,
} from '../../src/app/lib/agentKycDocuments.mjs'

const APPLICATION_ID = 'd9707e43-e88c-4f35-a186-d74592570662'
const VAULT_ID = 'synthetic-vault-id'
const NOW = '2026-08-19T10:00:00.000Z'
const jpegA = new Uint8Array([0xff, 0xd8, 0xff, 0x01]).buffer
const pngB = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer

const file = (bytes, type) => new Blob([bytes], { type })

const createHarness = () => {
  const contents = new Map()
  const deleted = []
  let etag = 0
  const persistence = {
    async updateApplication(vaultId, application, patch) {
      assert.equal(vaultId, VAULT_ID)
      return { ...application, ...patch, revision: application.revision + 1 }
    },
  }
  const documents = new AgentKycDocuments({ Storage: {} }, persistence, {
    now: () => NOW,
    content: {
      async put(contentId, uploaded) {
        contents.set(contentId, { bytes: await uploaded.arrayBuffer(), mimeType: uploaded.type })
        etag += 1
        return { url: `synthetic://${contentId}`, etag: `etag-${etag}` }
      },
      async get(contentId) {
        const value = contents.get(contentId)
        if (!value) throw new Error('not found')
        return { bytes: value.bytes.slice(0), mimeType: value.mimeType }
      },
      async delete(contentId) {
        deleted.push(contentId)
        contents.delete(contentId)
      },
    },
  })
  return { contents, deleted, persistence, documents }
}

const applicationRecord = (documents = {}) => ({
  vaultId: VAULT_ID,
  application: { applicationId: APPLICATION_ID, revision: 1, documents },
})

test('document ContentIds use slot names, revisions, and MIME-consistent extensions', () => {
  assert.equal(extensionForMime('image/jpeg'), 'jpg')
  assert.equal(extensionForMime('image/png'), 'png')
  assert.equal(extensionForMime('image/webp'), 'webp')
  assert.equal(extensionForMime('image/gif'), null)
  assert.equal(documentContentId(APPLICATION_ID, 'frontPhoto', 2, 'image/jpeg'), `kyc/applications/${APPLICATION_ID}/documents/id-front-r2.jpg`)
  assert.throws(() => documentContentId(APPLICATION_ID, 'frontPhoto', 1, 'image/gif'), AgentKycDocumentError)
})

test('documents route only from durable Agent mode', () => {
  assert.equal(shouldUseAgentDocuments('AGENT_CONTENT'), true)
  assert.equal(shouldUseAgentDocuments('REDIS_LEGACY'), false)
  assert.equal(canPersistDocuments('EPHEMERAL_PRE_AGENT'), false)
  assert.equal(canPersistDocuments('REDIS_LEGACY'), false)
})

test('uploads verified private document metadata without raw bytes', async () => {
  const { documents } = createHarness()
  const saved = await documents.upload(applicationRecord(), 'frontPhoto', file(jpegA, 'image/jpeg'))
  assert.equal(saved.descriptor.status, 'uploaded')
  assert.equal(saved.descriptor.contentId, `kyc/applications/${APPLICATION_ID}/documents/id-front-r1.jpg`)
  assert.equal(saved.descriptor.size, 4)
  assert.equal(saved.application.documents.frontPhoto.base64, undefined)
  assert.equal(saved.application.documents.frontPhoto.contentId, saved.descriptor.contentId)
  const restored = await documents.get(saved.descriptor)
  assert.deepEqual(new Uint8Array(restored.bytes), new Uint8Array(jpegA))
})

test('rejects unsupported MIME types and oversized files before upload', async () => {
  const { documents, contents } = createHarness()
  await assert.rejects(() => documents.upload(applicationRecord(), 'frontPhoto', file(jpegA, 'image/gif')), { code: 'UNSUPPORTED_DOCUMENT_MIME' })
  await assert.rejects(() => documents.upload(applicationRecord(), 'frontPhoto', file(new Uint8Array(MAX_DOCUMENT_BYTES + 1), 'image/jpeg')), { code: 'INVALID_DOCUMENT_SIZE' })
  assert.equal(contents.size, 0)
})

test('retake with a changed MIME creates a new descriptor then cleans obsolete Content', async () => {
  const { documents, contents, deleted } = createHarness()
  const first = await documents.upload(applicationRecord(), 'frontPhoto', file(jpegA, 'image/jpeg'))
  const second = await documents.upload({ vaultId: VAULT_ID, application: first.application }, 'frontPhoto', file(pngB, 'image/png'))
  assert.equal(second.descriptor.documentRevision, 2)
  assert.equal(second.descriptor.contentId, `kyc/applications/${APPLICATION_ID}/documents/id-front-r2.png`)
  assert.equal(contents.has(first.descriptor.contentId), false)
  assert.equal(contents.has(second.descriptor.contentId), true)
  assert.deepEqual(deleted, [first.descriptor.contentId])
})

test('state-save failure removes newly uploaded Content and preserves the old descriptor', async () => {
  const { documents, contents, deleted } = createHarness()
  documents.persistence.updateApplication = async () => { throw new Error('synthetic state save failure') }
  await assert.rejects(() => documents.upload(applicationRecord(), 'selfie', file(jpegA, 'image/jpeg')))
  assert.equal(contents.size, 0)
  assert.equal(deleted.length, 1)
})

test('remove updates state before deleting Content and Legal attachment is transient base64', async () => {
  const { documents, contents, deleted } = createHarness()
  const saved = await documents.upload(applicationRecord(), 'selfie', file(jpegA, 'image/jpeg'))
  const attachment = await documents.legalAttachment(saved.descriptor)
  assert.equal(attachment.mimeType, 'image/jpeg')
  assert.equal(typeof attachment.base64, 'string')
  const removed = await documents.remove({ vaultId: VAULT_ID, application: saved.application }, 'selfie')
  assert.equal(removed.application.documents.selfie, null)
  assert.equal(contents.size, 0)
  assert.deepEqual(deleted, [saved.descriptor.contentId])
})

test('descriptor sanitizer rejects raw data and accepts verified metadata only', async () => {
  const { documents } = createHarness()
  const saved = await documents.upload(applicationRecord(), 'backPhoto', file(jpegA, 'image/jpeg'))
  assert.equal(sanitizeDocumentDescriptor({ ...saved.descriptor, base64: 'raw' }).base64, undefined)
  assert.equal(sanitizeDocumentDescriptor({ ...saved.descriptor, contentId: 'https://public.example/document.jpg' }), null)
})
