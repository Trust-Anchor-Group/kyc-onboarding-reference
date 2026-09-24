'use client'
import React, { useState } from 'react'
import { useStepper } from '@/app/context/StepperContext'
import StepperLayout from '@/app/components/StepperLayout'
import SelfieCapture from '@/app/components/SelfieCapture'
import { useLanguage, content } from '@/app/context/LanguageContext'
import { AGENT_CONTENT } from '@/app/lib/agentKycPersistence.mjs'
import IdentityCaptureWorkspace from '@/app/components/IdentityCaptureWorkspace'

const Step11Selfie = () => {
  const { updateField, documents, step, persistenceMode, getAgentDocumentFile, finishDocumentCapture, uxScenario } = useStepper()
  const [file, setFile] = useState(() => {
    if (documents?.selfie && documents.selfie.base64) {
      // Reconstruct a File-like object for isNextDisabled and preview
      const byteString = atob(documents.selfie.base64)
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
      const blob = new Blob([ab], { type: documents.selfie.contentType || 'image/jpeg' })
      return new File([blob], documents.selfie.fileName || 'ProfilePhoto.jpg', { type: documents.selfie.contentType || 'image/jpeg' })
    }
    return null
  })
  // Rehydrate file state if documents.selfie changes
  React.useEffect(() => {
    if (documents?.selfie?.status === 'uploaded' && documents.selfie.previewUrl) {
      setFile(new File([new Blob()], documents.selfie.contentId?.split('/').pop() || 'selfie.jpg', { type: documents.selfie.mimeType || 'image/jpeg' }))
      return
    }
    if (persistenceMode === AGENT_CONTENT) {
      getAgentDocumentFile('selfie').then((restored) => { if (restored) setFile(restored) }).catch(() => setFile(null))
      return
    }
    if (documents?.selfie && documents.selfie.base64) {
      const byteString = atob(documents.selfie.base64)
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
      const blob = new Blob([ab], { type: documents.selfie.contentType || 'image/jpeg' })
      setFile(new File([blob], documents.selfie.fileName || 'ProfilePhoto.jpg', { type: documents.selfie.contentType || 'image/jpeg' }))
    }
  }, [documents, persistenceMode, getAgentDocumentFile])
  const [error, setError] = useState('')
  const { language } = useLanguage()
  const t = content[language]

  const advanceAfterSave = () => {
    // Let the applicant review the saved selfie and choose Continue, matching
    // the document flow and avoiding a refresh-like jump on mobile.
  }

  const handleFileChange = (e) => {
    const uploaded = e.target.files[0]
    if (!uploaded) return

    if (!uploaded.type.startsWith('image/')) {
      setError(t.errors?.fileType || 'Please upload a valid image file.')
      return
    }

    if (uploaded.size > 5 * 1024 * 1024) {
      setError(t.errors?.fileSize || 'File size should not exceed 5MB.')
      return
    }

    setError('')
    setFile(uploaded)
    if (persistenceMode === AGENT_CONTENT) {
      updateField('selfie', uploaded).then((saved) => {
        if (!saved) setError(t.errors?.uploadFailed || 'Could not save the selfie. Please try again.')
      })
      return
    }
    // correctly persist selfie
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      updateField('selfie', { fileName: uploaded.name, contentType: uploaded.type, base64 })
      advanceAfterSave()
    }
    reader.readAsDataURL(uploaded)
  }

  const handleNext = () => {
    if (!file) {
      setError(t.errors?.fileRequired || 'Please upload a selfie to continue.')
      return
    }

    if (persistenceMode === AGENT_CONTENT) {
      if (documents?.selfie?.status !== 'uploaded') {
        setError(t.errors?.uploadFailed || 'The selfie is still saving. Please wait and try again.')
        return
      }
      finishDocumentCapture(step + 1)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1]
      updateField('selfie', { fileName: file.name, contentType: file.type, base64 })
      finishDocumentCapture(step + 1)
    }
    reader.readAsDataURL(file)
  }

  return (
    <StepperLayout
      titleKey="step11"
      title={t.steps?.step11 || 'Take a clear selfie'}
      description={t.descriptions?.step11 || 'Keep your face centered and use good lighting.'}
      onNext={handleNext}
      isNextDisabled={!file}
      showNext
    >
      <IdentityCaptureWorkspace active="selfie" documents={documents}>
      <SelfieCapture fixture={uxScenario?.capture?.mode === 'selfie' ? uxScenario.capture.state : null} onCapture={async (file) => {
        if (typeof file === 'string') {
          const base64Part = file.split(',')[1] || file
          const byteString = atob(base64Part)
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
          const blob = new Blob([ab], { type: 'image/jpeg' })
          const selfieFile = new File([blob], 'ProfilePhoto.jpg', { type: 'image/jpeg' })
          setFile(selfieFile)
          if (persistenceMode === AGENT_CONTENT) {
            const saved = await updateField('selfie', selfieFile)
          if (!saved) setError(t.errors?.uploadFailed || 'Could not save the selfie. Please try again.')
          else advanceAfterSave()
            return
          }
          updateField('selfie', { fileName: 'ProfilePhoto.jpg', contentType: 'image/jpeg', base64: base64Part })
          advanceAfterSave()
        } else {
          setFile(file)
          if (persistenceMode === AGENT_CONTENT) {
            const saved = await updateField('selfie', file)
            if (!saved) setError(t.errors?.uploadFailed || 'Could not save the selfie. Please try again.')
            else advanceAfterSave()
            return
          }
          // also persist if a File object
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1]
            updateField('selfie', { fileName: file.name, contentType: file.type, base64 })
            advanceAfterSave()
          }
            reader.readAsDataURL(file)
        }
        setError('')
      }} />

      {file && <p className="mt-3 text-center text-sm font-medium text-[var(--access-success)]">{t.access.verification.captureSaved}</p>}
      <div className="space-y-4 mt-6">
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      </IdentityCaptureWorkspace>
    </StepperLayout>
  )
}

export default Step11Selfie
