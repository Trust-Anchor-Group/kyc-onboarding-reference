'use client'
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'

export const useAgentHost = (host) => {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const resolvedHost = host || process.env.NEXT_PUBLIC_AGENT_API_URI

    import('agent-api').then((mod) => {
      const AgentAPI = mod.default || mod

      try {
        AgentAPI.IO.SetHost(resolvedHost, true)

        window.AgentAPI = AgentAPI
      } catch {
        console.error('Failed to configure Agent API host')
      }
    })
  }, [host])
}
