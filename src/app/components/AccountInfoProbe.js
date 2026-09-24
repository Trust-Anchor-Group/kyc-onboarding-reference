'use client'

import { useEffect, useState } from 'react'
import { useAgentAPI } from '@/app/context/AgentAPIProvider'
import {
  canUseAccountInfoProbe,
  failedAccountInfoProbe,
  sanitizeAccountInfo,
} from '@/app/lib/accountInfoProbe.mjs'

export default function AccountInfoProbe() {
  const AgentAPI = useAgentAPI()
  const [enabled, setEnabled] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('__accountInfoProbe') === '1'
    if (!requested || !canUseAccountInfoProbe(process.env.NODE_ENV)) return
    setEnabled(true)
    let cancelled = false
    AgentAPI.Account.Info()
      .then((info) => { if (!cancelled) setResult(sanitizeAccountInfo(info)) })
      .catch((error) => { if (!cancelled) setResult(failedAccountInfoProbe(error)) })
    return () => { cancelled = true }
  }, [AgentAPI])

  if (!enabled) return null
  return (
    <aside data-testid="account-info-probe" className="fixed inset-x-3 top-3 z-[200] rounded-xl border border-white/15 bg-[#001D29] p-3 text-xs text-white shadow-xl">
      <p className="font-semibold">Sanitized Account.Info probe</p>
      <pre className="mt-2 overflow-auto" data-testid="account-info-probe-result">
        {result ? JSON.stringify(result) : 'pending'}
      </pre>
    </aside>
  )
}
