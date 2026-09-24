import { sanitizeDocumentDescriptor } from './agentKycDocuments.mjs'
import { deletePrivateContent, getPrivateContent, uploadPrivateContent } from './agentContentProxy.mjs'

const KYC_VAULT_TYPE = 'kikkin.kyc.application.v1'
const KYC_SCHEMA_VERSION = 1
const EPHEMERAL_PRE_AGENT = 'EPHEMERAL_PRE_AGENT'
const AGENT_CONTENT = 'AGENT_CONTENT'
const ACTIVE_LIFECYCLE = 'active'
const TERMINAL_STATES = new Set(['APPROVED', 'REJECTED', 'CANCELLED', 'TRANSFERRED'])
const RESTORE_RESULT = Object.freeze({
  LOADING: 'LOADING',
  FOUND: 'FOUND',
  NOT_FOUND: 'NOT_FOUND',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_FAILED: 'AUTH_FAILED',
  TRANSIENT_FAILURE: 'TRANSIENT_FAILURE',
  INVALID_STATE: 'INVALID_STATE',
})

const FORM_FIELD_ALLOWLIST = Object.freeze([
  'fullName',
  'documentNumber',
  'email',
  'phone',
  'birthDate',
  'documentType',
  'addressStreet',
  'addressNumber',
  'addressZip',
  'addressCity',
  'addressCountry',
  'addressNeighborhood',
  'addressComplement',
  'agreedToTerms',
  'consent',
  'phoneVerified',
  'emailVerified',
  'legalId',
])

const DOCUMENT_SLOTS = Object.freeze(['frontPhoto', 'backPhoto', 'selfie'])

class AgentKycPersistenceError extends Error {
  constructor(code, message, cause) {
    super(message, cause ? { cause } : undefined)
    this.name = 'AgentKycPersistenceError'
    this.code = code
  }
}

class UnsupportedKycSchemaError extends AgentKycPersistenceError {
  constructor(version) {
    super('UNSUPPORTED_SCHEMA_VERSION', `Unsupported KYC Vault schema version: ${version}`)
    this.name = 'UnsupportedKycSchemaError'
    this.version = version
  }
}

class MultipleActiveKycApplicationsError extends AgentKycPersistenceError {
  constructor(applicationIds) {
    super('MULTIPLE_ACTIVE_APPLICATIONS', 'Multiple active KYC applications require explicit resolution.')
    this.name = 'MultipleActiveKycApplicationsError'
    this.applicationIds = applicationIds
  }
}

const isPlainObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

const isIsoTimestamp = (value) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))

const isOpaqueApplicationId = (value) =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const fingerprint = async (value) => {
  if (!value || !globalThis.crypto?.subtle) return null
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value)))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 12)
}

const applicationDiagnostics = async (application, details = {}) => ({
  applicationFingerprint: await fingerprint(application.applicationId),
  revision: application.revision,
  currentStep: application.currentStep,
  ...details,
})

const sanitizeFormState = (form) => {
  if (!isPlainObject(form)) return {}
  const clean = {}
  for (const field of FORM_FIELD_ALLOWLIST) {
    const value = form[field]
    if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) {
      if (value !== undefined) clean[field] = value
    }
  }
  return clean
}

const projectDocumentState = (documents) => {
  const projection = {}
  for (const slot of DOCUMENT_SLOTS) {
    const document = documents?.[slot]
    projection[slot] = sanitizeDocumentDescriptor(document) || (document ? { status: 'legacy' } : null)
  }
  return projection
}

const sanitizeDocumentProjection = (documents) => {
  if (!isPlainObject(documents)) return projectDocumentState(null)
  const projection = {}
  for (const slot of DOCUMENT_SLOTS) {
    const value = documents[slot]
    if (value == null) projection[slot] = null
    else if (sanitizeDocumentDescriptor(value)) projection[slot] = sanitizeDocumentDescriptor(value)
    else if (isPlainObject(value) && value.status === 'legacy') {
      projection[slot] = { status: value.status.slice(0, 32) }
    } else projection[slot] = null
  }
  return projection
}

const normalizeState = (state) => {
  const value = typeof state === 'string' ? state.toUpperCase() : 'FORM_IN_PROGRESS'
  return value || 'FORM_IN_PROGRESS'
}

const lifecycleForState = (state) => TERMINAL_STATES.has(normalizeState(state)) ? 'terminal' : ACTIVE_LIFECYCLE
const stateContentId = (applicationId) => `kyc/applications/${applicationId}/state.json`

const createKycApplicationPayload = ({
  applicationId,
  revision = 1,
  state = 'FORM_IN_PROGRESS',
  currentStep = 0,
  form = {},
  documents = {},
  createdAt,
  updatedAt,
}) => {
  const normalizedState = normalizeState(state)
  const cleanForm = sanitizeFormState(form)
  return {
    schemaVersion: KYC_SCHEMA_VERSION,
    revision,
    applicationId,
    state: normalizedState,
    currentStep: Math.max(0, Math.min(17, Math.trunc(Number(currentStep) || 0))),
    form: cleanForm,
    verification: {
      phone: cleanForm.phoneVerified ? 'verified' : 'pending',
      email: cleanForm.emailVerified ? 'verified' : 'pending',
    },
    documents: projectDocumentState(documents),
    identity: {
      legalId: typeof cleanForm.legalId === 'string' && cleanForm.legalId ? cleanForm.legalId : null,
      lastKnownStatus: null,
    },
    lifecycle: lifecycleForState(normalizedState),
    createdAt,
    updatedAt,
  }
}

const parseKycApplicationPayload = (input) => {
  let payload = input
  if (typeof input === 'string') {
    try {
      payload = JSON.parse(input)
    } catch (cause) {
      throw new AgentKycPersistenceError('MALFORMED_APPLICATION', 'KYC Vault application is not valid JSON.', cause)
    }
  }
  if (!isPlainObject(payload)) {
    throw new AgentKycPersistenceError('MALFORMED_APPLICATION', 'KYC Vault application must be an object.')
  }
  if (payload.schemaVersion !== KYC_SCHEMA_VERSION) {
    throw new UnsupportedKycSchemaError(payload.schemaVersion)
  }
  if (!isOpaqueApplicationId(payload.applicationId)) {
    throw new AgentKycPersistenceError('MALFORMED_APPLICATION', 'KYC Vault applicationId is invalid.')
  }
  if (!Number.isInteger(payload.revision) || payload.revision < 1) {
    throw new AgentKycPersistenceError('MALFORMED_APPLICATION', 'KYC Vault revision is invalid.')
  }
  if (!Number.isInteger(payload.currentStep) || payload.currentStep < 0 || payload.currentStep > 17) {
    throw new AgentKycPersistenceError('MALFORMED_APPLICATION', 'KYC Vault currentStep is invalid.')
  }
  if (!isPlainObject(payload.form) || !isIsoTimestamp(payload.createdAt) || !isIsoTimestamp(payload.updatedAt)) {
    throw new AgentKycPersistenceError('MALFORMED_APPLICATION', 'KYC Vault application fields are invalid.')
  }

  const state = normalizeState(payload.state)
  const form = sanitizeFormState(payload.form)
  return {
    schemaVersion: KYC_SCHEMA_VERSION,
    revision: payload.revision,
    applicationId: payload.applicationId,
    state,
    currentStep: payload.currentStep,
    form,
    verification: {
      phone: form.phoneVerified ? 'verified' : 'pending',
      email: form.emailVerified ? 'verified' : 'pending',
    },
    documents: sanitizeDocumentProjection(payload.documents),
    identity: {
      legalId: typeof payload.identity?.legalId === 'string' && payload.identity.legalId
        ? payload.identity.legalId
        : (form.legalId || null),
      lastKnownStatus: typeof payload.identity?.lastKnownStatus === 'string'
        ? payload.identity.lastKnownStatus
        : null,
    },
    lifecycle: lifecycleForState(state),
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  }
}

const vaultClientId = (item) => item?.clientId || item?.ClientId || null
const vaultId = (item) => item?.vaultId || item?.VaultId || null

const defaultContentClient = (agentApi) => {
  return {
    async put(application) {
      if (typeof File === 'undefined') throw new AgentKycPersistenceError('CONTENT_UPLOAD_UNAVAILABLE', 'File uploads are unavailable in this browser.')
      const file = new File([JSON.stringify(application)], 'state.json', { type: 'application/json' })
      try {
        return await uploadPrivateContent(agentApi, file, stateContentId(application.applicationId))
      } catch (cause) {
        throw new AgentKycPersistenceError('CONTENT_UPLOAD_FAILED', 'Agent Content upload failed.', cause)
      }
    },
    async get(applicationId) {
      try {
        const response = await getPrivateContent(agentApi, stateContentId(applicationId))
        return response.json()
      } catch (cause) {
        throw new AgentKycPersistenceError('CONTENT_GET_FAILED', 'Agent Content retrieval failed.', cause)
      }
    },
    async delete(applicationId) { await deletePrivateContent(agentApi, stateContentId(applicationId)) },
  }
}

const selectActiveApplication = (items) => {
  const active = items.filter(({ application }) =>
    application.lifecycle === ACTIVE_LIFECYCLE && !TERMINAL_STATES.has(application.state))
  if (active.length === 0) return null
  if (active.length > 1) {
    throw new MultipleActiveKycApplicationsError(active.map(({ application }) => application.applicationId))
  }
  return active[0]
}

const sameCutoverState = (expected, actual) =>
  expected.applicationId === actual.applicationId &&
  expected.revision === actual.revision &&
  expected.currentStep === actual.currentStep &&
  JSON.stringify(expected.form) === JSON.stringify(actual.form)

class AgentKycPersistence {
  constructor(agentApi, options = {}) {
    if (!agentApi?.Storage) throw new AgentKycPersistenceError('AGENT_API_UNAVAILABLE', 'Agent Storage API is unavailable.')
    this.agentApi = agentApi
    this.now = options.now || (() => new Date().toISOString())
    this.uuid = options.uuid || (() => globalThis.crypto.randomUUID())
    this.log = options.log || (() => {})
    this.content = options.content || defaultContentClient(agentApi)
  }

  async diagnostic(event, details = {}) {
    this.log(event, details)
  }

  async createApplication(snapshot) {
    const timestamp = this.now()
    const application = createKycApplicationPayload({
      ...snapshot,
      applicationId: snapshot.applicationId || this.uuid(),
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    let content
    let indexId
    try {
      content = await this.content.put(application)
      await this.diagnostic('KYC_CONTENT_CREATED', await applicationDiagnostics(application))
      const verified = parseKycApplicationPayload(await this.content.get(application.applicationId))
      if (!sameCutoverState(application, verified)) {
        throw new AgentKycPersistenceError('CONTENT_VERIFICATION_FAILED', 'Agent Content state verification did not match.')
      }
      await this.diagnostic('KYC_CONTENT_VERIFIED', await applicationDiagnostics(application))
      const index = await this.agentApi.Storage.StoreInVault(null, KYC_VAULT_TYPE, application.applicationId, [])
      indexId = vaultId(index)
      if (!indexId) throw new AgentKycPersistenceError('VAULT_INDEX_CREATE_FAILED', 'Agent Vault did not return an index ID.')
      await this.diagnostic('KYC_VAULT_INDEX_CREATED', await applicationDiagnostics(application, {
        vaultFingerprint: await fingerprint(indexId),
      }))
      const indexRead = await this.agentApi.Storage.GetFromVault(indexId, false)
      if (vaultClientId(indexRead) !== application.applicationId) {
        throw new AgentKycPersistenceError('VAULT_INDEX_VERIFICATION_FAILED', 'Agent Vault index verification did not match.')
      }
      const search = await this.agentApi.Storage.SearchInVault(KYC_VAULT_TYPE, null, false, {}, 0, 100)
      const indexed = (search?.ResultSet || []).some((item) =>
        vaultId(item) === indexId && vaultClientId(item) === application.applicationId)
      if (!indexed) throw new AgentKycPersistenceError('VAULT_INDEX_VERIFICATION_FAILED', 'Agent Vault index search verification did not match.')
      await this.diagnostic('KYC_VAULT_INDEX_VERIFIED', await applicationDiagnostics(application, {
        vaultFingerprint: await fingerprint(indexId),
      }))
      return { vaultId: indexId, application, etag: content.etag }
    } catch (cause) {
      if (indexId) {
        try { await this.agentApi.Storage.DeleteFromVault(indexId) } catch {}
      }
      if (content) {
        try { await this.content.delete(application.applicationId) } catch {}
      }
      throw cause
    }
  }

  async getApplication(applicationId, knownVaultId = null) {
    const application = parseKycApplicationPayload(await this.content.get(applicationId))
    await this.diagnostic('KYC_AGENT_RESTORE', await applicationDiagnostics(application, {
      vaultFingerprint: await fingerprint(knownVaultId),
    }))
    return { vaultId: knownVaultId, application, contentId: stateContentId(applicationId) }
  }

  // A failed read is never equivalent to an absent application.
  async restoreApplication(applicationId, knownVaultId = null) {
    try {
      const restored = await this.getApplication(applicationId, knownVaultId)
      return { status: RESTORE_RESULT.FOUND, restored }
    } catch (error) {
      return { status: restoreResultForError(error), error }
    }
  }

  async findActiveApplicationForRestore() {
    try {
      const response = await this.agentApi.Storage.SearchInVault(
        KYC_VAULT_TYPE, null, false, {}, 0, 100,
      )
      const applications = []
      for (const item of response?.ResultSet || []) {
        const applicationId = vaultClientId(item)
        if (!isOpaqueApplicationId(applicationId)) {
          return { status: RESTORE_RESULT.INVALID_STATE }
        }
        const result = await this.restoreApplication(applicationId, vaultId(item))
        if (result.status === RESTORE_RESULT.FOUND) applications.push(result.restored)
        else if (result.status !== RESTORE_RESULT.NOT_FOUND) return result
      }
      const active = selectActiveApplication(applications)
      return active
        ? { status: RESTORE_RESULT.FOUND, restored: active }
        : { status: RESTORE_RESULT.NOT_FOUND }
    } catch (error) {
      return { status: restoreResultForError(error), error }
    }
  }

  async findApplications() {
    const response = await this.agentApi.Storage.SearchInVault(
      KYC_VAULT_TYPE,
      null,
      false,
      {},
      0,
      100,
    )
    const applications = []
    const malformed = []
    for (const item of response?.ResultSet || []) {
      const applicationId = vaultClientId(item)
      if (!isOpaqueApplicationId(applicationId)) {
        malformed.push('MALFORMED_INDEX')
        continue
      }
      try {
        applications.push(await this.getApplication(applicationId, vaultId(item)))
      } catch (error) {
        if (error instanceof UnsupportedKycSchemaError) throw error
        malformed.push(error.code || 'MALFORMED_APPLICATION')
      }
    }
    await this.diagnostic('KYC_AGENT_SEARCH_RESTORE', { resultCount: applications.length, malformedCount: malformed.length })
    return { applications, malformed }
  }

  async findActiveApplication() {
    const { applications, malformed } = await this.findApplications()
    return { active: selectActiveApplication(applications), malformed }
  }

  async updateApplication(vaultIdValue, currentApplication, snapshot) {
    const application = createKycApplicationPayload({
      ...currentApplication,
      ...snapshot,
      form: { ...currentApplication.form, ...(snapshot.form || {}) },
      documents: snapshot.documents || currentApplication.documents,
      applicationId: currentApplication.applicationId,
      revision: currentApplication.revision + 1,
      createdAt: currentApplication.createdAt,
      updatedAt: this.now(),
    })
    const content = await this.content.put(application)
    const verified = parseKycApplicationPayload(await this.content.get(application.applicationId))
    if (!sameCutoverState(application, verified)) {
      throw new AgentKycPersistenceError('CONTENT_VERIFICATION_FAILED', 'Agent Content save verification did not match.')
    }
    await this.diagnostic('KYC_AGENT_SAVE', await applicationDiagnostics(application, {
      vaultFingerprint: await fingerprint(vaultIdValue),
      hasEtag: Boolean(content.etag),
    }))
    return application
  }

  async deleteApplication(vaultIdValue, applicationId) {
    await this.content.delete(applicationId)
    if (vaultIdValue) await this.agentApi.Storage.DeleteFromVault(vaultIdValue)
    await this.diagnostic('KYC_AGENT_DELETE', {
      applicationFingerprint: await fingerprint(applicationId),
      vaultFingerprint: await fingerprint(vaultIdValue),
    })
  }
}

const createAgentApplication = async (persistence, snapshot) => {
  let created
  try {
    await persistence.diagnostic('KYC_CUTOVER_STARTED', { currentStep: snapshot.currentStep ?? 0 })
    created = await persistence.createApplication(snapshot)
    const verified = await persistence.getApplication(created.application.applicationId, created.vaultId)
    if (!sameCutoverState(created.application, verified.application)) {
      throw new AgentKycPersistenceError('CUTOVER_VERIFICATION_FAILED', 'Agent Content cutover verification did not match.')
    }
    await persistence.diagnostic('KYC_CUTOVER_COMPLETE', await applicationDiagnostics(verified.application))
    return verified
  } catch (cause) {
    if (created?.application) {
      try { await persistence.deleteApplication(created.vaultId, created.application.applicationId) } catch {}
    }
    await persistence.diagnostic('KYC_AGENT_SAVE_FAILED', { stage: 'cutover', code: cause?.code || 'UNKNOWN' })
    throw cause
  }
}

class AgentKycSaveQueue {
  constructor(save) {
    this.save = save
    this.pending = null
    this.sequence = 0
    this.waiters = []
    this.running = false
  }

  enqueue(snapshot) {
    const id = ++this.sequence
    this.pending = { id, snapshot }
    const promise = new Promise((resolve, reject) => this.waiters.push({ id, resolve, reject }))
    this.drain()
    return promise
  }

  async drain() {
    if (this.running) return
    this.running = true
    while (this.pending) {
      const job = this.pending
      this.pending = null
      try {
        const result = await this.save(job.snapshot)
        const completed = this.waiters.filter((waiter) => waiter.id <= job.id)
        this.waiters = this.waiters.filter((waiter) => waiter.id > job.id)
        completed.forEach((waiter) => waiter.resolve(result))
      } catch (error) {
        const failed = this.waiters.filter((waiter) => waiter.id <= job.id)
        this.waiters = this.waiters.filter((waiter) => waiter.id > job.id)
        failed.forEach((waiter) => waiter.reject(error))
      }
    }
    this.running = false
  }
}

export {
  ACTIVE_LIFECYCLE,
  AGENT_CONTENT,
  EPHEMERAL_PRE_AGENT,
  AgentKycPersistence,
  AgentKycPersistenceError,
  AgentKycSaveQueue,
  FORM_FIELD_ALLOWLIST,
  KYC_SCHEMA_VERSION,
  KYC_VAULT_TYPE,
  RESTORE_RESULT,
  MultipleActiveKycApplicationsError,
  TERMINAL_STATES,
  UnsupportedKycSchemaError,
  createKycApplicationPayload,
  createAgentApplication,
  parseKycApplicationPayload,
  projectDocumentState,
  sanitizeFormState,
  selectActiveApplication,
  stateContentId,
}

const httpStatusFromError = (error) =>
  Number(error?.status || error?.cause?.status || error?.statusCode || 0) || null

const restoreResultForError = (error) => {
  const status = httpStatusFromError(error)
  if (status === 404) return RESTORE_RESULT.NOT_FOUND
  if (status === 401 || status === 403) return RESTORE_RESULT.AUTH_FAILED
  if (error instanceof UnsupportedKycSchemaError || error?.code === 'MALFORMED_APPLICATION') {
    return RESTORE_RESULT.INVALID_STATE
  }
  return RESTORE_RESULT.TRANSIENT_FAILURE
}
