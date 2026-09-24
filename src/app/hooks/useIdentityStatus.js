'use client'

import { useState, useEffect } from 'react'
import { useStepper } from '../context/StepperContext'
import { useAgentAPI } from '../context/AgentAPIProvider'
const POLLING_INTERVAL = 15000

export function useIdentityStatus() {
  const AgentAPI = useAgentAPI()
  const [status, setStatus] = useState(null)
  const { formData } = useStepper()
  const legalId = formData?.legalId

  useEffect(() => {
    if (!legalId) return

    const fetchStatus = async () => {
      try {
        const identity = await AgentAPI.Legal.GetIdentity(legalId)
        setStatus(identity?.Identity?.status?.state || identity?.status?.state || null)

      } catch {
        setStatus(null)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [AgentAPI, legalId])

  return status
}
