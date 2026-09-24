'use client'
import React, { useState } from 'react'
import StepperLayout from '@/app/components/StepperLayout'
import { useStepper } from '@/app/context/StepperContext'
import { useStepNavigation } from '@/app/components/useStepNavigation'
import { CreditCard, Car, CheckCircle2 } from 'lucide-react'
import { useLanguage, content } from '@/app/context/LanguageContext'


const Step8ValidateDocument = () => {
  const { updateField, formData, nextStep, step } = useStepper()
  const { language } = useLanguage()
  const t = content[language]
  const [docType, setDocType] = useState(formData.documentType || '')
  const [error, setError] = useState('')
  const { goToStep } = useStepNavigation(step)

  const handleNext = () => {
    if (!docType) {
      setError(t.errors?.required || 'Please select your document type.')
      return
    }
    updateField('documentType', docType)
    nextStep()
    goToStep(step + 1)
  }

  return (
    <StepperLayout
      titleKey="step8"
      title={t.steps?.step8 || 'Choose the ID you will use'}
      description={t.step8Subtitle || 'Use the same document for every photo in this verification.'}
      onNext={handleNext}
      isNextDisabled={!docType}
      contentClassName="pt-0 mt-4 pb-24"
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: 'IDCard', label: t.labels?.idCard || 'ID Card', Icon: CreditCard },
            { value: 'DriverLicense', label: t.labels?.driverLicense || "Driver's License", Icon: Car },
            // { value: 'Passport', label: t.labels?.passport || 'Passport', Icon: Globe },
          ].map(({ value, label, Icon }) => {
            const selected = docType === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setDocType(value)}
                className={`group relative flex min-h-32 w-full flex-col items-start justify-between rounded-xl border p-5 text-left transition
                  ${selected
                    ? 'border-[#FBB040] bg-[#FBB040] text-[#003043]'
                      : 'border-white/15 bg-white/[0.035] hover:border-[#FBB040]/50 hover:bg-white/[0.07]'}
                `}
              >
                <Icon
                  className={`h-7 w-7 ${
                    selected ? 'text-[#003043]' : 'text-[#FBB040]'
                  }`}
                />
                <div>
                  <span className="block text-base font-semibold">{label}</span>
                  <span className={`mt-1 block text-sm ${selected ? 'text-[#003043]/75' : 'text-[#9FC0CA]'}`}>{t.access.verification.bothSides}</span>
                </div>
                {selected && <CheckCircle2 className="absolute right-4 top-4 h-5 w-5" aria-label={t.access.verification.selected} />}
              </button>
            )
          })}

        </div>

        {error && <p className="text-sm text-[#F9A1AB]" role="alert">{error}</p>}
      </div>
    </StepperLayout>
  )
}

export default Step8ValidateDocument
