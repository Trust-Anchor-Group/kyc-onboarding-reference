'use client'

import { useStepper } from '@/app/context/StepperContext'

export function useStepNavigation() {
  const { goToStep, nextStep, prevStep } = useStepper()

  return {
    goToStep,
    nextStep,
    prevStep,
  }
}
