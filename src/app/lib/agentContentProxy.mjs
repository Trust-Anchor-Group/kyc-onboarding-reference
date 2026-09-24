const sessionValue = (agentApi, name) => agentApi.Account?.GetSessionString?.(name) || sessionStorage.getItem(name)

class AgentContentRequestError extends Error {
  constructor(operation, status) {
    super(`${operation}_${status}`)
    this.name = 'AgentContentRequestError'
    this.code = `${operation}_${status}`
    this.status = status
  }
}

const credentials = (agentApi) => {
  const token = sessionValue(agentApi, 'AgentAPI.Token')
  const accountName = sessionValue(agentApi, 'AgentAPI.UserName')
  if (!token || !accountName) throw new Error('AGENT_SESSION_UNAVAILABLE')
  return { token, accountName }
}

const endpoint = (contentId, accountName) =>
  `/api/agent/content?${new URLSearchParams({ contentId, accountName }).toString()}`

const uploadPrivateContent = async (agentApi, file, contentId) => {
  const { token, accountName } = credentials(agentApi)
  const form = new FormData()
  form.append('Content', file, file.name || 'content')
  form.append('ContentId', contentId)
  form.append('Visibility', 'Private')
  form.append('AccountName', accountName)
  const response = await fetch('/api/agent/content', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!response.ok) throw new AgentContentRequestError('CONTENT_UPLOAD_FAILED', response.status)
  return response.json()
}

const getPrivateContent = async (agentApi, contentId) => {
  const { token, accountName } = credentials(agentApi)
  const response = await fetch(endpoint(contentId, accountName), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new AgentContentRequestError('CONTENT_GET_FAILED', response.status)
  return response
}

const deletePrivateContent = async (agentApi, contentId) => {
  const { token, accountName } = credentials(agentApi)
  const response = await fetch(endpoint(contentId, accountName), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new AgentContentRequestError('CONTENT_DELETE_FAILED', response.status)
}

export { AgentContentRequestError, deletePrivateContent, getPrivateContent, uploadPrivateContent }
