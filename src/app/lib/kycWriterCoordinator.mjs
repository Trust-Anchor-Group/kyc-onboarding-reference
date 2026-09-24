const HEARTBEAT_MS = 1500
const OWNER_TIMEOUT_MS = 4500
const ELECTION_MS = 120

const createKycWriterCoordinator = ({
  name = 'kikkin-kyc-form-writer',
  onChange = () => {},
  navigatorObject = globalThis.navigator,
  BroadcastChannelClass = globalThis.BroadcastChannel,
  uuid = () => globalThis.crypto.randomUUID(),
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  setRepeating = setInterval,
  clearRepeating = clearInterval,
} = {}) => {
  let stopped = false
  let releaseLock
  let channel
  let heartbeatTimer
  let ownerTimeout
  let electionTimer
  let ownerId = null
  const tabId = uuid()
  const candidates = new Set([tabId])

  const setOwner = (isOwner, reason) => onChange({ isOwner, reason, tabId })

  const stopFallbackTimers = () => {
    if (heartbeatTimer) clearRepeating(heartbeatTimer)
    if (ownerTimeout) clearTimer(ownerTimeout)
    if (electionTimer) clearTimer(electionTimer)
    heartbeatTimer = null
    ownerTimeout = null
    electionTimer = null
  }

  const send = (message) => channel?.postMessage({ ...message, tabId })

  const becomeFallbackOwner = () => {
    if (stopped) return
    ownerId = tabId
    setOwner(true, 'broadcast-owner')
    send({ type: 'OWNER' })
    heartbeatTimer = setRepeating(() => send({ type: 'OWNER' }), HEARTBEAT_MS)
  }

  const scheduleOwnerTimeout = () => {
    if (ownerTimeout) clearTimer(ownerTimeout)
    ownerTimeout = setTimer(() => {
      if (stopped || ownerId === tabId) return
      ownerId = null
      candidates.clear()
      candidates.add(tabId)
      send({ type: 'CLAIM' })
      electionTimer = setTimer(() => {
        if ([...candidates].sort()[0] === tabId) becomeFallbackOwner()
      }, ELECTION_MS)
    }, OWNER_TIMEOUT_MS)
  }

  const startFallback = async () => {
    if (!BroadcastChannelClass) {
      setOwner(true, 'coordination-unavailable')
      return true
    }
    channel = new BroadcastChannelClass(name)
    channel.onmessage = ({ data }) => {
      if (!data || data.tabId === tabId) return
      if (data.type === 'CLAIM') {
        candidates.add(data.tabId)
        if (ownerId === tabId) send({ type: 'OWNER' })
      } else if (data.type === 'OWNER') {
        ownerId = data.tabId
        stopFallbackTimers()
        setOwner(false, 'broadcast-locked')
        scheduleOwnerTimeout()
      } else if (data.type === 'RELEASE' && ownerId === data.tabId) {
        ownerId = null
        scheduleOwnerTimeout()
      }
    }
    setOwner(false, 'broadcast-electing')
    send({ type: 'CLAIM' })
    await new Promise((resolve) => {
      electionTimer = setTimer(() => {
        if (!ownerId && [...candidates].sort()[0] === tabId) becomeFallbackOwner()
        resolve()
      }, ELECTION_MS)
    })
    return ownerId === tabId
  }

  const start = async () => {
    stopped = false
    if (!navigatorObject?.locks?.request) return startFallback()

    let resolveStarted
    const started = new Promise((resolve) => { resolveStarted = resolve })
    navigatorObject.locks.request(name, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
      if (!lock) {
        setOwner(false, 'web-lock-held')
        resolveStarted(false)
        navigatorObject.locks.request(name, { mode: 'exclusive' }, async (waitingLock) => {
          if (!waitingLock || stopped) return
          setOwner(true, 'web-lock-owner')
          await new Promise((resolve) => { releaseLock = resolve })
        }).catch(() => {
          if (!stopped) startFallback()
        })
        return
      }
      setOwner(true, 'web-lock-owner')
      resolveStarted(true)
      await new Promise((resolve) => { releaseLock = resolve })
    }).catch(() => {
      resolveStarted(false)
      if (!stopped) startFallback()
    })
    return started
  }

  const stop = () => {
    stopped = true
    if (ownerId === tabId) send({ type: 'RELEASE' })
    releaseLock?.()
    releaseLock = null
    stopFallbackTimers()
    channel?.close()
    channel = null
    setOwner(false, 'stopped')
  }

  return { start, stop, tabId }
}

export { createKycWriterCoordinator }