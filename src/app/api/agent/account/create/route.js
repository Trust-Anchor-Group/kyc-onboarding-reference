import { createHash, createHmac, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { applyRateLimit, getClientIp } from '@/app/lib/rateLimit'

export const runtime = 'nodejs'

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
}

const errorResponse = (message, status) =>
  NextResponse.json({ error: message }, { status, headers: noStoreHeaders })

const isValidString = (value, maxLength) =>
  typeof value === 'string' && value.length > 0 && value.length <= maxLength

export async function POST(request) {
  const rateLimit = applyRateLimit({
    scope: 'agent-account-create',
    identifier: getClientIp(request),
    max: 10,
    windowMs: 15 * 60 * 1000,
  })

  if (!rateLimit.ok) {
    return errorResponse('Too many account creation attempts.', 429)
  }

  const apiUrl = process.env.AGENT_API_URL || process.env.NEXT_PUBLIC_AGENT_API_URL
  const apiKey = process.env.AGENT_API_KEY
  const secret = process.env.AGENT_SECRET

  if (!apiUrl || !apiKey || !secret) {
    return errorResponse('Agent account creation is not configured.', 503)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return errorResponse('Invalid request body.', 400)
  }

  const { userName, email, phone, passwordDigest, seconds = 3600, language = 'en' } = body || {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const accountNamespace = process.env.NEXT_PUBLIC_AGENT_API_URL || apiUrl
  const expectedUserName = normalizedEmail
    ? createHash('shake256', { outputLength: 12 }).update(`${accountNamespace}:${normalizedEmail}`, 'utf8').digest('base64url')
    : ''
  if (
    !isValidString(userName, 128) ||
    !isValidString(normalizedEmail, 320) ||
    userName !== expectedUserName ||
    !isValidString(phone, 64) ||
    !/^[a-f0-9]{64}$/i.test(passwordDigest || '') ||
    !Number.isInteger(seconds) ||
    seconds < 60 ||
    seconds > 86400 ||
    !isValidString(language, 16)
  ) {
    return errorResponse('Invalid account creation request.', 400)
  }

  const agentUrl = new URL(apiUrl)
  const nonce = randomBytes(32).toString('base64')
  const signatureInput = [
    userName,
    agentUrl.host,
    normalizedEmail,
    phone,
    passwordDigest,
    apiKey,
    nonce,
  ].join(':')
  const signature = createHmac('sha256', secret).update(signatureInput, 'utf8').digest('base64')

  try {
    const response = await fetch(new URL('/Agent/Account/Create', agentUrl), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName,
        eMail: normalizedEmail,
        phoneNr: phone,
        password: passwordDigest,
        apiKey,
        nonce,
        signature,
        seconds,
        language,
      }),
      cache: 'no-store',
    })

    const responseText = await response.text()
    if (!response.ok) {
      return errorResponse(responseText || 'Agent account creation failed.', response.status)
    }

    const payload = responseText ? JSON.parse(responseText) : {}
    return NextResponse.json(payload, { headers: noStoreHeaders })
  } catch {
    return errorResponse('Agent account creation failed.', 502)
  }
}
