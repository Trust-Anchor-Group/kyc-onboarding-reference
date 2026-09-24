'use client'

import React from 'react'
import { useLanguage, content } from '@/app/context/LanguageContext'
import StepUpload from '@/app/components/StepUpload'

const Step9UploadFront = () => {
  const { language } = useLanguage()
  const t = content[language]

  return (
    <StepUpload
      stepKey="step9"
      fieldKey="frontPhoto"
      titleKey="step9"
      title={t.steps?.step9 || 'Front of your ID'}
      description={t.descriptions?.step9b || 'Make sure every corner, your name, and your photo are clear.'}
    />
  );
}

export default Step9UploadFront
