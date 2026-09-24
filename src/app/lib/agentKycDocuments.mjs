import { deletePrivateContent, getPrivateContent, uploadPrivateContent } from './agentContentProxy.mjs'

const DOCUMENT_SLOTS = Object.freeze(['frontPhoto', 'backPhoto', 'selfie'])
const MIME_EXTENSIONS = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
})
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
const shouldUseAgentDocuments = (mode) => mode === 'AGENT_CONTENT'
const canPersistDocuments = shouldUseAgentDocuments

class AgentKycDocumentError extends Error {
  constructor(code, message, cause) {
    super(message, cause ? { cause } : undefined)
    this.name = 'AgentKycDocumentError'
    this.code = code
  }
}

const slotName = (slot) => {
  if (!DOCUMENT_SLOTS.includes(slot)) {
    throw new AgentKycDocumentError('INVALID_DOCUMENT_SLOT', 'KYC document slot is invalid.')
  }
  return slot === 'frontPhoto' ? 'id-front' : slot === 'backPhoto' ? 'id-back' : 'selfie'
}

const extensionForMime = (mimeType) => MIME_EXTENSIONS[mimeType] || null

const documentContentId = (applicationId, slot, documentRevision, mimeType) => {
  const extension = extensionForMime(mimeType)
  if (!extension) throw new AgentKycDocumentError('UNSUPPORTED_DOCUMENT_MIME', 'KYC document MIME type is not supported.')
  if (!Number.isInteger(documentRevision) || documentRevision < 1) {
    throw new AgentKycDocumentError('INVALID_DOCUMENT_REVISION', 'KYC document revision is invalid.')
  }
  return `kyc/applications/${applicationId}/documents/${slotName(slot)}-r${documentRevision}.${extension}`
}

const digest = async (bytes) => {
  if (!globalThis.crypto?.subtle) throw new AgentKycDocumentError('HASH_UNAVAILABLE', 'Document integrity hashing is unavailable.')
  const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('')
}

const asBase64 = (bytes) => {
  const values = new Uint8Array(bytes)
  let binary = ''
  for (const value of values) binary += String.fromCharCode(value)
  return btoa(binary)
}

const validateDocument = async (file) => {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new AgentKycDocumentError('INVALID_DOCUMENT', 'KYC document must be a file or blob.')
  }
  const mimeType = typeof file.type === 'string' ? file.type.toLowerCase() : ''
  if (!extensionForMime(mimeType)) {
    throw new AgentKycDocumentError('UNSUPPORTED_DOCUMENT_MIME', 'KYC document MIME type is not supported.')
  }
  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    throw new AgentKycDocumentError('INVALID_DOCUMENT_SIZE', 'KYC document size is invalid.')
  }
  return { mimeType, bytes: await file.arrayBuffer() }
}

const defaultContentClient = (agentApi) => ({
  async put(contentId, file) {
    try {
      return await uploadPrivateContent(agentApi, file, contentId)
    } catch (cause) {
      throw new AgentKycDocumentError('DOCUMENT_UPLOAD_FAILED', 'Agent Content upload failed.', cause)
    }
  },
  async get(contentId) {
    try {
      const response = await getPrivateContent(agentApi, contentId)
      return { bytes: await response.arrayBuffer(), mimeType: response.headers.get('content-type')?.split(';')[0] || '' }
    } catch (cause) {
      throw new AgentKycDocumentError('DOCUMENT_GET_FAILED', 'Agent Content retrieval failed.', cause)
    }
  },
  async delete(contentId) {
    await deletePrivateContent(agentApi, contentId)
  },
})

const sanitizeDocumentDescriptor = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (value.status !== 'uploaded' || !DOCUMENT_SLOTS.includes(value.slot)) return null
  if (typeof value.contentId !== 'string' || !value.contentId.startsWith('kyc/applications/')) return null
  if (!extensionForMime(value.mimeType) || !Number.isInteger(value.size) || value.size < 1 || value.size > MAX_DOCUMENT_BYTES) return null
  if (!Number.isInteger(value.documentRevision) || value.documentRevision < 1) return null
  if (typeof value.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.sha256)) return null
  if (typeof value.updatedAt !== 'string' || !Number.isFinite(Date.parse(value.updatedAt))) return null
  return {
    status: 'uploaded',
    slot: value.slot,
    contentId: value.contentId,
    mimeType: value.mimeType,
    size: value.size,
    etag: typeof value.etag === 'string' ? value.etag.slice(0, 256) : null,
    sha256: value.sha256,
    documentRevision: value.documentRevision,
    updatedAt: value.updatedAt,
  }
}

class AgentKycDocuments {
  constructor(agentApi, persistence, options = {}) {
    if (!agentApi?.Storage || !persistence) throw new AgentKycDocumentError('AGENT_API_UNAVAILABLE', 'Agent document storage is unavailable.')
    this.persistence = persistence
    this.content = options.content || defaultContentClient(agentApi)
    this.now = options.now || (() => new Date().toISOString())
    this.log = options.log || (() => {})
  }

  async upload(applicationRecord, slot, file) {
    const current = applicationRecord?.application
    if (!current?.applicationId || !applicationRecord?.vaultId) {
      throw new AgentKycDocumentError('VAULT_APPLICATION_UNAVAILABLE', 'Agent KYC application is unavailable.')
    }
    const { mimeType, bytes } = await validateDocument(file)
    const previous = sanitizeDocumentDescriptor(current.documents?.[slot])
    const documentRevision = (previous?.documentRevision || 0) + 1
    const contentId = documentContentId(current.applicationId, slot, documentRevision, mimeType)
    const sha256 = await digest(bytes)
    const descriptor = {
      status: 'uploaded',
      slot,
      contentId,
      mimeType,
      size: bytes.byteLength,
      etag: null,
      sha256,
      documentRevision,
      updatedAt: this.now(),
    }

    this.log('AGENT_DOC_UPLOAD_STARTED', { slot, mimeType, byteCount: bytes.byteLength, documentRevision })
    let uploaded = false
    try {
      const response = await this.content.put(contentId, file)
      uploaded = true
      descriptor.etag = typeof response?.etag === 'string' ? response.etag : null
      const verified = await this.content.get(contentId)
      if (verified.mimeType && verified.mimeType !== mimeType) {
        throw new AgentKycDocumentError('DOCUMENT_VERIFICATION_FAILED', 'Agent Content MIME type did not match.')
      }
      if (verified.bytes.byteLength !== bytes.byteLength || await digest(verified.bytes) !== sha256) {
        throw new AgentKycDocumentError('DOCUMENT_VERIFICATION_FAILED', 'Agent Content bytes did not match.')
      }
      const documents = { ...current.documents, [slot]: descriptor }
      const application = await this.persistence.updateApplication(applicationRecord.vaultId, current, { documents })
      if (previous?.contentId && previous.contentId !== contentId) {
        try { await this.content.delete(previous.contentId) } catch {
          this.log('AGENT_DOC_DELETE_FAILED', { slot, reason: 'obsolete-content-cleanup' })
        }
      }
      this.log(previous ? 'AGENT_DOC_REPLACE' : 'AGENT_DOC_UPLOAD_COMPLETE', { slot, mimeType, byteCount: bytes.byteLength, documentRevision })
      return { application, descriptor, bytes }
    } catch (error) {
      if (uploaded) {
        try { await this.content.delete(contentId) } catch {
          this.log('AGENT_DOC_ORPHAN', { slot, mimeType, byteCount: bytes.byteLength })
        }
      }
      this.log('AGENT_DOC_UPLOAD_FAILED', { slot, code: error?.code || 'UNKNOWN' })
      throw error
    }
  }

  async get(descriptor) {
    const clean = sanitizeDocumentDescriptor(descriptor)
    if (!clean) throw new AgentKycDocumentError('INVALID_DOCUMENT_DESCRIPTOR', 'KYC document descriptor is invalid.')
    const result = await this.content.get(clean.contentId)
    if (result.mimeType && result.mimeType !== clean.mimeType || result.bytes.byteLength !== clean.size || await digest(result.bytes) !== clean.sha256) {
      throw new AgentKycDocumentError('DOCUMENT_VERIFICATION_FAILED', 'Agent document retrieval verification failed.')
    }
    this.log('AGENT_DOC_RESTORE', { slot: clean.slot, mimeType: clean.mimeType, byteCount: clean.size })
    return { descriptor: clean, bytes: result.bytes, blob: new Blob([result.bytes], { type: clean.mimeType }) }
  }

  async remove(applicationRecord, slot) {
    const current = applicationRecord?.application
    const previous = sanitizeDocumentDescriptor(current?.documents?.[slot])
    if (!previous) return { application: current, removed: false }
    const documents = { ...current.documents, [slot]: null }
    const application = await this.persistence.updateApplication(applicationRecord.vaultId, current, { documents })
    try { await this.content.delete(previous.contentId) } catch {
      this.log('AGENT_DOC_DELETE_FAILED', { slot, reason: 'content-cleanup' })
    }
    this.log('AGENT_DOC_DELETE', { slot })
    return { application, removed: true }
  }

  async legalAttachment(descriptor) {
    const { bytes, descriptor: clean } = await this.get(descriptor)
    return { base64: asBase64(bytes), fileName: `${slotName(clean.slot)}.${extensionForMime(clean.mimeType)}`, mimeType: clean.mimeType }
  }
}

export {
  AgentKycDocuments,
  AgentKycDocumentError,
  DOCUMENT_SLOTS,
  MAX_DOCUMENT_BYTES,
  canPersistDocuments,
  documentContentId,
  extensionForMime,
  sanitizeDocumentDescriptor,
  shouldUseAgentDocuments,
}