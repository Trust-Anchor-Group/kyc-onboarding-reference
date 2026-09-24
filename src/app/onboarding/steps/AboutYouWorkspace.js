'use client'

import { useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, Fingerprint, UserRound } from 'lucide-react'
import StepperLayout from '@/app/components/StepperLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStepper } from '@/app/context/StepperContext'
import { content, useLanguage } from '@/app/context/LanguageContext'

const validName = (value) => value.trim().split(/\s+/).filter(Boolean).length >= 2

export default function AboutYouWorkspace() {
  const { formData, updateField, setStep } = useStepper()
  const { language } = useLanguage()
  const t = content[language]
  const copy = t.access.launch.about
  const [touched, setTouched] = useState({})
  const [name, setName] = useState(formData.fullName || '')
  const [birthDate, setBirthDate] = useState(formData.birthDate || '')
  const [personalNumber, setPersonalNumber] = useState(formData.documentNumber || '')
  const birthRef = useRef(null)
  const numberRef = useRef(null)

  const hasPersonalNumber = Boolean(personalNumber.trim())
  const complete = useMemo(() => validName(name) && Boolean(birthDate) && hasPersonalNumber, [name, birthDate, hasPersonalNumber])

  const saveAndContinue = async () => {
    setTouched({ name: true, birthDate: true, personalNumber: true })
    if (!complete) return
    await updateField('fullName', name.trim().replace(/\s+/g, ' '))
    await updateField('birthDate', birthDate)
    await updateField('documentNumber', personalNumber.trim())
    // Identity collection begins only after Agent Vault + state.json exist.
    setStep(10)
  }

  return (
    <StepperLayout
      title={t.steps?.step1 || 'About you'}
      description={t.descriptions?.step1}
      showBack={false}
      onNext={saveAndContinue}
      isNextDisabled={!complete}
      wide
      actionClassName="lg:ml-auto lg:flex-none lg:w-[min(100%,675px)]"
    >
      <div className="lg:grid lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
        <aside className="mb-6 border-y border-[var(--access-border)] py-4 lg:mb-0 lg:border-y-0 lg:border-r lg:py-1 lg:pr-8" aria-label={copy.eyebrow}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--access-accent)]">{copy.eyebrow}</p>
          <h2 className="mt-2 hidden text-xl font-medium leading-tight tracking-[-0.02em] lg:mt-3 lg:block lg:text-2xl">{copy.title}</h2>
          <p className="mt-1 text-sm text-[var(--access-text-muted)] lg:hidden">{copy.compact}</p>
          <p className="mt-3 hidden text-sm leading-relaxed text-[var(--access-text-muted)] lg:block">{copy.body}</p>
          <div className="mt-3 hidden flex-wrap gap-x-4 gap-y-2 border-t border-[var(--access-border)] pt-3 text-xs text-[var(--access-text-muted)] lg:mt-6 lg:block lg:space-y-3 lg:pt-4 lg:text-sm">
            <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-[var(--access-accent)]" /> {copy.legalName}</div>
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[var(--access-accent)]" /> {copy.birthDate}</div>
            <div className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-[var(--access-accent)]" /> {copy.personalNumber}</div>
          </div>
        </aside>
        <div className="space-y-6">
        <section aria-labelledby="identity-name" className="relative space-y-2">
            <Label id="identity-name" htmlFor="full-name">{t.labels?.fullName}</Label>
            <Input
              id="full-name"
              autoComplete="name"
              value={name}
              onBlur={() => setTouched((value) => ({ ...value, name: true }))}
              onChange={(event) => setName(event.target.value)}
              placeholder={t.placeholders?.fullName}
              onKeyDown={(event) => { if (event.key === 'Enter' && validName(name)) { event.preventDefault(); birthRef.current?.focus() } }}
              className="h-14 pr-12 text-base"
            />
            {validName(name) && <Check className="absolute bottom-4 right-4 h-5 w-5 text-[var(--access-success)]" aria-label={copy.nameReady} />}
            {touched.name && !validName(name) && <p className="mt-2 text-sm text-[#F6A0AA]">{t.errors?.fullNameTwoWords}</p>}
        </section>

        <section aria-labelledby="identity-birth" className="space-y-2 border-t border-[var(--access-border)] pt-5">
            <Label id="identity-birth" htmlFor="birth-date">{t.labels?.birthDate}</Label>
            <Input
              ref={birthRef}
              id="birth-date"
              type="date"
              autoComplete="bday"
              value={birthDate}
              onBlur={() => setTouched((value) => ({ ...value, birthDate: true }))}
              onChange={(event) => setBirthDate(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter' && birthDate) { event.preventDefault(); numberRef.current?.focus() } }}
              className="h-14 max-w-sm text-base"
            />
            {touched.birthDate && !birthDate && <p className="mt-2 text-sm text-[#F6A0AA]">{t.errors?.required}</p>}
        </section>

        <section aria-labelledby="identity-number" className="space-y-2 border-t border-[var(--access-border)] pt-5">
            <Label id="identity-number" htmlFor="personal-number">{t.labels?.documentNumber}</Label>
            <Input
              ref={numberRef}
              id="personal-number"
              value={personalNumber}
              inputMode="text"
              autoComplete="off"
              maxLength={64}
              placeholder={t.placeholders?.documentNumber}
              onBlur={() => setTouched((value) => ({ ...value, personalNumber: true }))}
              onChange={(event) => setPersonalNumber(event.target.value)}
              className="h-14 max-w-sm text-base"
            />
            <p className="text-xs leading-relaxed text-[var(--access-text-muted)]">{copy.personalNumberHint}</p>
            {touched.personalNumber && !hasPersonalNumber && <p className="mt-2 text-sm text-[#F6A0AA]">{t.errors?.required}</p>}
        </section>
        </div>
      </div>
    </StepperLayout>
  )
}
