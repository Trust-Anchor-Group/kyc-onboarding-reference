import { ClipboardCheck, LockKeyhole, ScanLine, UserRound } from 'lucide-react'

export const ONBOARDING_PHASES = [
  { key: 'account', label: 'Secure your verification', start: 0, end: 2, Icon: LockKeyhole },
  { key: 'details', label: 'About you', start: 3, end: 9, Icon: UserRound },
  { key: 'identity', label: 'Verify your identity', start: 10, end: 15, Icon: ScanLine },
  { key: 'review', label: 'Review and submit', start: 15, end: 17, Icon: ClipboardCheck },
]

export const getOnboardingPhase = (step) =>
  ONBOARDING_PHASES.find((phase) => step >= phase.start && step <= phase.end) || ONBOARDING_PHASES[0]

export const getOnboardingPhaseIndex = (step) =>
  Math.max(0, ONBOARDING_PHASES.findIndex((phase) => step >= phase.start && step <= phase.end))

export const getPrimaryActionLabel = (step, fallback = 'Continue') => {
  const labels = {
    0: 'Send verification codes',
    1: 'Verify phone',
    2: 'Verify email',
    3: 'Continue',
    4: 'Create secure account',
    6: 'Verify phone',
    8: 'Verify email',
    9: 'Continue',
    10: 'Choose document',
    11: 'Use this photo',
    12: 'Continue',
    13: 'Use this photo',
    14: 'Use this selfie',
    15: 'Review information',
    16: 'Review consent',
    17: 'Submit verification',
  }
  return labels[step] || fallback
}

export const getActiveTask = (step) => {
  if (step === 0) return 'secure-account'
  if (step === 1) return 'verify-phone'
  if (step === 2) return 'verify-email'
  if (step >= 3 && step <= 9) return 'details'
  if (step >= 10 && step <= 15) return step === 11 ? 'front-photo' : step === 13 ? 'back-photo' : step === 14 ? 'selfie' : 'identity-details'
  return step === 17 ? 'consent' : 'review'
}
