import { sha3_256, shake256 } from '@noble/hashes/sha3'
import { bytesToHex } from '@noble/hashes/utils'

const toBase64Url = (bytes) => globalThis.btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const passwordDigestForAccount = (accountHandle, apiUrl, password) =>
  bytesToHex(sha3_256(new TextEncoder().encode(`${String(accountHandle || '').trim()}:${apiUrl}:${password}`)))

const normalizeAccountEmail = (email) => String(email || '').trim().toLowerCase()

const emailAccountNameFor = (email, apiUrl) =>
  toBase64Url(shake256(new TextEncoder().encode(`${apiUrl}:${normalizeAccountEmail(email)}`), { dkLen: 12 }))

const buildAccountLoginCandidates = ({ accountHandle, email, apiUrl, password }) => {
  const candidates = []
  const handle = String(accountHandle || '').trim()
  if (handle) candidates.push({
    scheme: 'account-handle-v1',
    accountName: handle,
    passwordDigest: passwordDigestForAccount(handle, apiUrl, password),
  })

  const normalizedEmail = normalizeAccountEmail(email)
  if (normalizedEmail) {
    const accountName = emailAccountNameFor(normalizedEmail, apiUrl)
    if ((!handle || handle === accountName) && !candidates.some((candidate) => candidate.accountName === accountName)) candidates.push({
      scheme: 'email-v1',
      accountName,
      passwordDigest: passwordDigestForAccount(accountName, apiUrl, password),
    })
  }
  return candidates
}

export { buildAccountLoginCandidates, emailAccountNameFor, normalizeAccountEmail, passwordDigestForAccount }
