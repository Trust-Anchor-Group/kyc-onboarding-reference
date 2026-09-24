import { NextResponse } from 'next/server'

const contentIdPattern = /^kyc\/applications\/[0-9a-f-]{36}\/(state\.json|documents\/(id-front|id-back|selfie)-r[1-9]\d*\.(jpg|png|webp))$/i
const accountNamePattern = /^[A-Za-z0-9_-]{1,128}$/

const configuredAgentUrl = () => {
  const value = process.env.AGENT_API_URL || process.env.NEXT_PUBLIC_AGENT_API_URL
  if (!value) throw new Error('Agent Content proxy is not configured.')
  return new URL(value)
}

const authorization = (request) => {
  const value = request.headers.get('authorization') || ''
  if (!value.startsWith('Bearer ')) return null
  return value
}

const contentUrl = (agentUrl, accountName, contentId) => {
  const path = contentId.split('/').map(encodeURIComponent).join('/')
  return new URL(`/Agent/Storage/Content/${encodeURIComponent(accountName)}/${path}`, agentUrl)
}

const validRequest = (contentId, accountName, token) =>
  Boolean(token && contentIdPattern.test(contentId || '') && accountNamePattern.test(accountName || ''))

export async function POST(request) {
  try {
    const token = authorization(request)
    const form = await request.formData()
    const contentId = form.get('ContentId')
    const visibility = form.get('Visibility')
    const accountName = form.get('AccountName')
    const content = form.get('Content')
    if (!validRequest(contentId, accountName, token) || visibility !== 'Private' || !(content instanceof File)) {
      return NextResponse.json({ error: 'Invalid private Content request.' }, { status: 400 })
    }

    const outgoing = new FormData()
    outgoing.append('Content', content, content.name || 'content')
    outgoing.append('ContentId', contentId)
    outgoing.append('Visibility', 'Private')
    const response = await fetch(new URL('/Agent/Storage/Content', configuredAgentUrl()), {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: token },
      body: outgoing,
      cache: 'no-store',
    })
    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Private Content upload failed.' }, { status: 502 })
  }
}

export async function GET(request) {
  try {
    const token = authorization(request)
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const accountName = searchParams.get('accountName')
    if (!validRequest(contentId, accountName, token)) {
      return NextResponse.json({ error: 'Invalid private Content request.' }, { status: 400 })
    }
    const response = await fetch(contentUrl(configuredAgentUrl(), accountName, contentId), {
      headers: { Authorization: token },
      cache: 'no-store',
    })
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Private Content retrieval failed.' }, { status: 502 })
  }
}

export async function DELETE(request) {
  try {
    const token = authorization(request)
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const accountName = searchParams.get('accountName')
    if (!validRequest(contentId, accountName, token)) {
      return NextResponse.json({ error: 'Invalid private Content request.' }, { status: 400 })
    }
    const response = await fetch(contentUrl(configuredAgentUrl(), accountName, contentId), {
      method: 'DELETE',
      headers: { Authorization: token },
      cache: 'no-store',
    })
    return new NextResponse(null, { status: response.status, headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Private Content deletion failed.' }, { status: 502 })
  }
}