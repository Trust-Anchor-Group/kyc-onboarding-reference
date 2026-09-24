export function generateTransferPin() {
  const range = 900000
  const limit = Math.floor(0x100000000 / range) * range
  const values = new Uint32Array(1)
  do {
    crypto.getRandomValues(values)
  } while (values[0] >= limit)
  return String(100000 + (values[0] % range))
}

export async function generateQrLink(session, pin, configuredAgentAPI = null) {
  if (typeof window === 'undefined') return null
  const KEY_ID = 'user-key-id'
  const { keyPassword, accountPassword } = session || {}

  try {
    if (!keyPassword || !accountPassword || !/^\d{6}$/.test(pin || '')) {
      return null
    }

    // Reuse the configured, authenticated client from the application. This
    // preserves the partner host selected at login instead of creating an
    // unconfigured second client for the transfer request.
    const AgentAPI = configuredAgentAPI || (await import('agent-api')).default
    const response = await AgentAPI.Account.Transfer(
      'ed448',
      'urn:nf:iot:e2e:1.0',
      KEY_ID,
      keyPassword,
      accountPassword,
      pin
    )

    if (response?.qrCodeUrl) {
      return {
        qrCodeUrl: response.qrCodeUrl,
        onboardingUri: response.onboardingUri,
        width: response.qrCodeWidth,
        height: response.qrCodeHeight,
      }
    }

    return null
  } catch {
    return null
  }
}
