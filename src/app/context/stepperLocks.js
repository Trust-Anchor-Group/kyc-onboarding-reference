'use client'

export const VERIFICATION_GATES = [1, 2, 3, 10]

const isNumber = (value) => typeof value === 'number' && Number.isInteger(value)

export const hasVisitedStep = (targetStep, currentStep, completedSteps) => {
  if (!isNumber(targetStep)) return false
  if (isNumber(currentStep) && currentStep >= targetStep) return true
  return completedSteps?.has?.(targetStep) ?? false
}

export const getHighestGateReached = (currentStep, completedSteps) => {
  let highestGate = -1
  for (const gate of VERIFICATION_GATES) {
    if (hasVisitedStep(gate, currentStep, completedSteps)) {
      highestGate = gate
    }
  }
  return highestGate
}

export const getEarliestUnlockedStep = (currentStep, completedSteps) => {
  const highestGate = getHighestGateReached(currentStep, completedSteps)
  return highestGate === -1 ? 0 : highestGate
}

export const canAccessVerificationStep = (targetStep, currentStep, completedSteps) => {
  if (!VERIFICATION_GATES.includes(targetStep)) return false
  return hasVisitedStep(targetStep, currentStep, completedSteps)
}
