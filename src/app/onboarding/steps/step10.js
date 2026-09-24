
'use client'

import React from 'react'
import { useLanguage, content } from '@/app/context/LanguageContext'
import StepUpload from '@/app/components/StepUpload'

const Step10UploadBack = () => {
  const { language } = useLanguage()
  const t = content[language]

  return (
    <StepUpload
      stepKey="step10"
      fieldKey="backPhoto"
      titleKey="step10"
      title={t.steps?.step10 || 'Back of your ID'}
      description={t.descriptions?.step10b || 'Make sure every corner and the details on the back are clear.'}
    />
  )
}

export default Step10UploadBack
