'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

const AgentAPIContext = createContext(null)

export const AgentAPIProvider = ({ children }) => {
  const [api, setApi] = useState(null)


  useEffect(() => {
    const loadAgentAPI = async () => {
      const mod = await import('agent-api')
      const instance = mod.default

      if (process.env.NEXT_PUBLIC_AGENT_API_URL) {
        const endpoint = new URL(process.env.NEXT_PUBLIC_AGENT_API_URL)
        instance.IO?.SetHost?.(endpoint.host, endpoint.protocol === 'https:')
      }

      setApi(instance)
    }
    loadAgentAPI()
  }, [])

  return (
    <AgentAPIContext.Provider value={api}>
      {api ? children : null}
    </AgentAPIContext.Provider>
  )
}

export const useAgentAPI = () => {
  const context = useContext(AgentAPIContext)
  if (!context) {
    throw new Error('useAgentAPI must be used within AgentAPIProvider')
  }
  return context
}
