'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { useStepper } from '@/app/context/StepperContext'
const AboutYouWorkspace = dynamic(() => import('./steps/AboutYouWorkspace'))
const SecureVerificationWorkspace = dynamic(() => import('./steps/SecureVerificationWorkspace'))
const Step5VerifyPhone = dynamic(() => import('./steps/step5'))
const Step6VerifyEmail = dynamic(() => import('./steps/step6'))
const Step8ValidateDocument = dynamic(() => import('./steps/step8'))
const Step10UploadBack = dynamic(() => import('./steps/step10'))
const Step9UploadFront = dynamic(() => import('./steps/step9'))
const Step11Selfie = dynamic(() => import('./steps/step11'))
const Step12Address = dynamic(() => import('./steps/step12'))
const Step13Terms = dynamic(() => import('./steps/step13'))
const CorrectReviewStep = dynamic(() => import('./steps/correct'))
import AccountDetectedOverlay from './components/AccountDetectedOverlay'

export default function OnboardingPage() {
  return (
    <div className="access-onboarding relative min-h-[100dvh] bg-[var(--access-page)]">
      <div className="relative w-full">
        <StepperFlow />
      </div>
    </div>
  )
}

function StepperFlow() {
  const { step, setStep, formData, documents, persistenceMode, accountVerificationState, accountDetectedVisible, hideAccountDetected, stepRetryCounters } = useStepper()
  const prevStepRef = React.useRef(step)
  const [direction, setDirection] = React.useState('forward')
  const steps = [
    <SecureVerificationWorkspace key="secure" />,
    <Step5VerifyPhone key="phone-otp" />,
    <Step6VerifyEmail key="email-otp" />,
    <AboutYouWorkspace key="about-you" />,
    <AutoAdvance key="legacy-4" to={10} />,
    <AutoAdvance key="legacy-5" to={10} />,
    <AutoAdvance key="legacy-6" to={10} />,
    <AutoAdvance key="legacy-7" to={10} />,
    <AutoAdvance key="legacy-8" to={10} />,
    <AutoAdvance key="legacy-9" to={10} />,
    <Step8ValidateDocument key="step8" />,
    <Step9UploadFront key="step9" />,
    <AutoAdvance key="front-complete" to={13} />,
    <Step10UploadBack key="step10" />,
    <Step11Selfie key="step11" />,
    <Step12Address key="step12" />,
    <CorrectReviewStep key="correct" />,
    <Step13Terms key="step13" />,
  ]

  const element = steps[step]
  const retrySuffix = stepRetryCounters?.[step] || 0
  const transitionKey = `${step}-${retrySuffix}-${direction}`

  React.useEffect(() => {
    const prev = prevStepRef.current
    setDirection(step >= prev ? 'forward' : 'backward')
    prevStepRef.current = step
  }, [step])

  const keyedElement = element
    ? React.cloneElement(element, { key: `${element.key || `step-${step}`}-${retrySuffix}` })
    : null

  React.useEffect(() => {
    const hasAddress = Boolean(
      formData?.addressStreet?.trim() &&
      formData?.addressZip?.trim() &&
      formData?.addressNumber?.trim() &&
      formData?.addressNeighborhood?.trim() &&
      formData?.addressCity?.trim() &&
      formData?.addressCountry?.trim()
    )

    let maxReachable = 0
    if (accountVerificationState !== 'PRE_ACCOUNT') maxReachable = 1
    if (formData?.phoneVerified) maxReachable = 2
    if (formData?.phoneVerified && formData?.emailVerified && persistenceMode === 'AGENT_CONTENT') maxReachable = 3
    if (formData?.fullName?.trim() && formData?.birthDate && formData?.documentNumber?.trim()) maxReachable = 10
    if (formData?.documentType) maxReachable = 11
    if (documents?.frontPhoto?.base64 || documents?.frontPhoto?.status === 'uploaded') maxReachable = 13
    if (documents?.backPhoto?.base64 || documents?.backPhoto?.status === 'uploaded') maxReachable = 14
    if (documents?.selfie?.base64 || documents?.selfie?.status === 'uploaded') maxReachable = 15
    if (hasAddress) maxReachable = 17

    if (step > maxReachable) {
      setStep(maxReachable)
    }
  }, [step, setStep, formData, documents, persistenceMode, accountVerificationState])

  return (
    <>
      {keyedElement && (
        <div
          key={transitionKey}
          className={`kyc-step-animate ${direction === 'forward' ? 'kyc-step-forward' : 'kyc-step-backward'}`}
        >
          {keyedElement}
        </div>
      )}
      {accountDetectedVisible && (
        <AccountDetectedOverlay onContinue={hideAccountDetected} />
      )}
    </>
  )
}

function AutoAdvance({ to }) {
  const { setStep } = useStepper()
  React.useEffect(() => { setStep(to) }, [setStep, to])
  return <div className="min-h-[100dvh] bg-[var(--access-page)]" aria-live="polite" />
}
