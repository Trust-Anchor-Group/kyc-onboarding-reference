// These states intentionally contain no credential material. Durable journey
// state and in-memory authentication capability are separate concerns.
const REAUTH = Object.freeze({
  REQUIRED: 'REAUTH_REQUIRED',
  AUTHENTICATING: 'REAUTHENTICATING',
  FAILED: 'REAUTH_FAILED',
  AUTHENTICATED: 'REAUTHENTICATED',
})

const SUBMISSION = Object.freeze({
  READY: 'READY',
  SUBMITTING: 'SUBMITTING',
  SUBMITTED: 'SUBMITTED',
  FAILED_RETRYABLE: 'FAILED_RETRYABLE',
})

const submissionStateFromDurableState = (state) => {
  if (state === SUBMISSION.SUBMITTED) return SUBMISSION.SUBMITTED
  // A reload cannot prove a request that was in flight completed. Return to a
  // truthful retryable state; the client-side lock prevents duplicate taps.
  if (state === SUBMISSION.SUBMITTING || state === SUBMISSION.FAILED_RETRYABLE) return SUBMISSION.FAILED_RETRYABLE
  return SUBMISSION.READY
}

const maySubmit = ({ accepted, reauthState, submissionState }) =>
  Boolean(accepted) && reauthState === REAUTH.AUTHENTICATED && submissionState !== SUBMISSION.SUBMITTING && submissionState !== SUBMISSION.SUBMITTED

export { REAUTH, SUBMISSION, maySubmit, submissionStateFromDurableState }
