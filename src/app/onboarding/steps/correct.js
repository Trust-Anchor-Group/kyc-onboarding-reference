'use client'

import React, { useMemo, useState } from 'react'
import StepperLayout from '@/app/components/StepperLayout'
import { useStepper } from '@/app/context/StepperContext'
import { useLanguage, content } from '@/app/context/LanguageContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FileBadge2,
  MapPin,
  Pencil,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

const InfoRow = ({ label, value, placeholder }) => (
  <div className="grid grid-cols-1 gap-x-5 gap-y-1 rounded-xl border border-[var(--access-border)] bg-[color-mix(in_srgb,var(--access-surface-subtle)_48%,transparent)] px-4 py-3 sm:grid-cols-[minmax(125px,0.42fr)_minmax(0,1fr)] sm:items-center">
    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--access-text-muted)]">{label}</span>
    <span className={`min-w-0 break-words text-sm font-medium sm:text-base ${value ? 'text-[var(--access-text)]' : 'italic text-[var(--access-text-muted)]'}`}>
      {value || placeholder}
    </span>
  </div>
)

const SectionCard = ({ title, description, icon, onEdit, editLabel, children }) => (
  <section className="access-review-card relative overflow-hidden rounded-2xl border border-[var(--access-border)] bg-[var(--access-surface)] p-4 shadow-[0_18px_45px_var(--access-shadow)] sm:p-5">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-[color-mix(in_srgb,var(--access-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--access-accent)_12%,transparent)] text-[var(--access-accent)]">
            {icon}
          </span>
          <h2 className="text-lg font-semibold text-[var(--access-text)]">{title}</h2>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="access-review-edit inline-flex min-h-9 items-center gap-2 self-start rounded-lg border border-[var(--access-border)] px-3 text-sm font-semibold transition hover:border-[var(--access-accent)] hover:text-[var(--access-accent)] sm:self-auto"
          >
            <span>{editLabel}</span>
            <Pencil className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm leading-relaxed text-[var(--access-text-secondary)]">{description}</p>
      ) : null}
      <div className="space-y-4">{children}</div>
    </div>
  </section>
)

const FileItem = ({ label, file, placeholder, onRetake, savedLabel, retakeLabel }) => {
  const hasFile = Boolean(file?.base64 || file?.status === 'uploaded')

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--access-border)] bg-[color-mix(in_srgb,var(--access-surface-subtle)_48%,transparent)] px-3 py-3">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#FBB040]/30 bg-[#FBB040]/15 text-[#FBB040]">
          <FileBadge2 className="h-5 w-5" aria-hidden />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-[var(--access-text)] sm:text-base">{label}</span>
          <span className="text-xs text-[var(--access-text-muted)] sm:text-sm">{hasFile ? savedLabel : placeholder}</span>
        </div>
      </div>
      {hasFile ? (
        <div className="flex items-center gap-1">
          <button type="button" onClick={onRetake} className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--access-accent)] transition hover:bg-[color-mix(in_srgb,var(--access-accent)_12%,transparent)]" aria-label={`${retakeLabel}: ${label}`}>
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {retakeLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}

const localeMap = {
  pt: 'pt-BR',
  sv: 'sv-SE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  ar: 'ar',
}

const maskEmail = (value = '') => {
  const [name, domain] = value.split('@')
  return domain ? `${name.slice(0, 1)}•••@${domain}` : value
}
const maskTail = (value = '', visible = 4) => value ? `•••• ${value.replace(/\s/g, '').slice(-visible)}` : ''

const AddressEditor = ({ formData, onCancel, onSave, copy, common }) => {
  const [values, setValues] = useState({
    addressZip: formData.addressZip || '',
    addressStreet: formData.addressStreet || '',
    addressNumber: formData.addressNumber || '',
    addressComplement: formData.addressComplement || '',
    addressNeighborhood: formData.addressNeighborhood || '',
    addressCity: formData.addressCity || '',
  })
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const complete = values.addressZip && values.addressStreet && values.addressNumber && values.addressNeighborhood && values.addressCity

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/65 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="address-editor-title">
      <div className="w-full rounded-t-2xl border border-white/10 bg-[#003043] p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-[#FBB040]">{copy.address}</p>
            <h2 id="address-editor-title" className="mt-1 text-xl font-semibold text-white">{copy.updateAddress}</h2>
          </div>
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-[#B7D0DA] hover:text-white">{common.close}</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ['addressZip', copy.postalCode, 'postal-code'],
            ['addressStreet', copy.street, 'address-line1'],
            ['addressNumber', copy.number, 'address-line2'],
            ['addressComplement', copy.unit, 'address-line2'],
            ['addressNeighborhood', copy.area, 'address-level3'],
            ['addressCity', copy.city, 'address-level2'],
          ].map(([key, label, autoComplete]) => (
            <div key={key} className={key === 'addressStreet' ? 'sm:col-span-2' : ''}>
              <Label htmlFor={`review-${key}`}>{label}</Label>
              <Input id={`review-${key}`} value={values[key]} autoComplete={autoComplete} onChange={(event) => update(key, event.target.value)} className="mt-1 h-11" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="h-11 flex-1 rounded-xl border border-white/15 text-sm font-semibold text-white">{common.cancel}</button>
          <button type="button" disabled={!complete} onClick={() => onSave(values)} className="h-11 flex-1 rounded-xl bg-[#FBB040] text-sm font-semibold text-[#003043] disabled:bg-white/10 disabled:text-[#7DA9B8]">{common.save}</button>
        </div>
      </div>
    </div>
  )
}

const PersonalEditor = ({ formData, onCancel, onSave, copy, common }) => {
  const [fullName, setFullName] = useState(formData.fullName || '')
  const [birthDate, setBirthDate] = useState(formData.birthDate || '')
  const [documentNumber, setDocumentNumber] = useState(formData.documentNumber || '')
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/65 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="personal-editor-title">
      <div className="w-full rounded-t-2xl border border-white/10 bg-[#003043] p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-start justify-between gap-6">
          <div><p className="text-sm font-semibold text-[#FBB040]">{copy.personal}</p><h2 id="personal-editor-title" className="mt-1 text-xl font-semibold text-white">{copy.updatePersonal}</h2></div>
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-[#B7D0DA] hover:text-white">{common.close}</button>
        </div>
        <div className="mt-5 space-y-3">
          <div><Label htmlFor="review-full-name">{copy.fullLegalName}</Label><Input id="review-full-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1 h-11" /></div>
          <div><Label htmlFor="review-birth-date">{copy.birthDate}</Label><Input id="review-birth-date" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="mt-1 h-11" /></div>
          <div><Label htmlFor="review-personal-number">{copy.personalNumber}</Label><Input id="review-personal-number" value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} className="mt-1 h-11" /></div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="h-11 flex-1 rounded-xl border border-white/15 text-sm font-semibold text-white">{common.cancel}</button>
          <button type="button" disabled={!fullName.trim() || !birthDate || !documentNumber.trim()} onClick={() => onSave({ fullName: fullName.trim(), birthDate, documentNumber: documentNumber.trim() })} className="h-11 flex-1 rounded-xl bg-[#FBB040] text-sm font-semibold text-[#003043] disabled:bg-white/10 disabled:text-[#7DA9B8]">{common.save}</button>
        </div>
      </div>
    </div>
  )
}

export default function CorrectReviewStep() {
  const { formData, documents, nextStep, updateField, beginDocumentRetake } = useStepper()
  const { language } = useLanguage()
  const t = content[language]
  const launch = t.access.launch
  const [accepted, setAccepted] = useState(Boolean(formData?.consent))
  const [editingAddress, setEditingAddress] = useState(false)
  const [editingPersonal, setEditingPersonal] = useState(false)

  const missingPlaceholder = t.correct?.missing || 'Not provided'

  const { givenNames, surname } = useMemo(() => {
    const raw = (formData.fullName || '').trim()
    if (!raw) return { givenNames: '', surname: '' }
    const parts = raw.split(/\s+/)
    if (parts.length === 1) return { givenNames: raw, surname: '' }
    return {
      givenNames: parts.slice(0, -1).join(' '),
      surname: parts.slice(-1)[0],
    }
  }, [formData.fullName])

  const formattedBirthDate = useMemo(() => {
    if (!formData.birthDate) return ''
    const date = new Date(formData.birthDate)
    if (Number.isNaN(date.getTime())) return formData.birthDate
    const locale = localeMap[language] || 'en-US'
    try {
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)
    } catch {
      return formData.birthDate
    }
  }, [formData.birthDate, language])

  const docTypeLabel = useMemo(() => {
    const type = formData.documentType
    if (!type) return ''
    const mapping = {
      IDCard: t.labels?.idCard || 'ID Card',
      DriverLicense: t.labels?.driverLicense || "Driver's License",
      Passport: t.labels?.passport || 'Passport',
    }
    return mapping[type] || type
  }, [formData.documentType, t.labels])

  const addressLine = useMemo(() => {
    const street = formData.addressStreet?.trim()
    const number = formData.addressNumber?.trim()
    return [street, number].filter(Boolean).join(' ')
  }, [formData.addressStreet, formData.addressNumber])

  const filesList = [
    {
      key: 'selfie',
      label: t.correct?.files?.selfie || t.labels?.selfie || 'Selfie photo',
      step: 14,
    },
    {
      key: 'frontPhoto',
      label: t.correct?.files?.front || t.labels?.uploadFront || 'Front of ID',
      step: 11,
    },
    {
      key: 'backPhoto',
      label: t.correct?.files?.back || t.labels?.uploadBack || 'Back of ID',
      step: 13,
    },
  ]

  const requiredValues = [
    formData.fullName?.trim(),
    formData.email?.trim(),
    formData.phone?.trim(),
    formData.documentNumber?.trim(),
    formData.documentType,
    formData.birthDate,
    formData.addressCountry?.trim(),
    formData.addressZip?.trim(),
    addressLine,
    formData.addressNeighborhood?.trim(),
    formData.addressCity?.trim(),
    documents?.selfie?.base64 || documents?.selfie?.status === 'uploaded',
    documents?.frontPhoto?.base64 || documents?.frontPhoto?.status === 'uploaded',
    documents?.backPhoto?.base64 || documents?.backPhoto?.status === 'uploaded',
  ]
  const allComplete = requiredValues.every(Boolean)

  return (
    <StepperLayout
      titleKey="correct"
      title={t.review?.title || 'Review and submit'}
      // description={t.descriptions?.correct || 'Before finalizing, please review your information.'}
      customButton={
        <button
          type="button"
          onClick={async () => {
            if (!allComplete || !accepted) return
            await updateField('consent', true)
            nextStep()
          }}
          disabled={!allComplete || !accepted}
          className={`h-[48px] w-full rounded-xl text-[18px] font-semibold transition ${
            allComplete
              ? 'bg-[#FBB040] text-[#003043] hover:bg-[#e09c33]'
              : 'bg-[#003043] text-[#7DA9B8] cursor-not-allowed'
          }`}
          aria-disabled={!allComplete}
        >
          {allComplete && accepted
            ? launch.review.everythingRight
            : !allComplete
              ? t.correct?.incompleteCta || 'Complete missing info first'
              : launch.review.acceptFirst}
        </button>
      }
      contentClassName="pt-6 pb-24"
      hideMobileActions={editingAddress || editingPersonal}
      wide
      actionClassName="access-review-action lg:ml-0 lg:flex-1 lg:w-auto"
    >
      <div className="space-y-6 lg:max-w-[900px]">
        <div className="access-review-intro flex items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--access-success)_30%,var(--access-border))] bg-[color-mix(in_srgb,var(--access-success)_8%,var(--access-surface))] p-4 sm:p-5">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[color-mix(in_srgb,var(--access-success)_16%,transparent)] text-[var(--access-success)]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--access-text)]">{launch.review.requested}</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--access-text-secondary)]">{launch.review.accountDescription}</p>
          </div>
        </div>
        {!allComplete && (
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--access-warning)_35%,var(--access-border))] bg-[color-mix(in_srgb,var(--access-warning)_10%,var(--access-surface))] px-4 py-3 text-sm text-[var(--access-warning)]">
            {t.correct?.incompleteNotice ||
              'Some required information or files are missing. Please edit the relevant sections before continuing.'}
          </div>
        )}

        <SectionCard
          title={t.correct?.sections?.account || 'Account details'}
          icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          description={launch.review.accountDescription}
        >
          <InfoRow
            label={t.correct?.rows?.accountName || t.labels?.fullName || 'Account name'}
            value={formData.fullName?.trim()}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.email || t.labels?.email || 'Email'}
            value={maskEmail(formData.email?.trim())}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.phone || t.labels?.phone || 'Phone number'}
            value={maskTail(formData.phone?.trim())}
            placeholder={missingPlaceholder}
          />
        </SectionCard>

        <SectionCard
          title={t.correct?.sections?.personal || 'Personal details'}
          icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
          onEdit={() => setEditingPersonal(true)}
          editLabel={t.correct?.edit || t.actions?.tapToEdit || 'Edit'}
        >
          <InfoRow
            label={t.correct?.rows?.givenNames || 'Given names'}
            value={givenNames}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.surname || 'Surname'}
            value={surname}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.birthDate || t.labels?.birthDate || 'Date of birth'}
            value={formattedBirthDate}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.documentNumber || t.labels?.documentNumber || 'Document number'}
            value={maskTail(formData.documentNumber?.trim())}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.documentType || t.labels?.documentType || 'Document type'}
            value={docTypeLabel}
            placeholder={missingPlaceholder}
          />
        </SectionCard>

        <SectionCard
          title={t.correct?.sections?.address || 'Address information'}
          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
          onEdit={() => setEditingAddress(true)}
          editLabel={t.correct?.edit || t.actions?.tapToEdit || 'Edit'}
        >
          <InfoRow
            label={t.correct?.rows?.country || t.labels?.country || 'Country'}
            value={formData.addressCountry?.trim()}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.zip || t.labels?.zip || 'ZIP / Postal code'}
            value={formData.addressZip?.trim()}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.address || t.labels?.address || 'Address'}
            value={addressLine}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.neighborhood || t.labels?.neighborhood || 'Area'}
            value={formData.addressNeighborhood?.trim()}
            placeholder={missingPlaceholder}
          />
          <InfoRow
            label={t.correct?.rows?.city || t.labels?.city || 'City'}
            value={formData.addressCity?.trim()}
            placeholder={missingPlaceholder}
          />
          {formData.addressComplement ? (
            <InfoRow
              label={t.correct?.rows?.complement || t.labels?.complement || 'Complement'}
              value={formData.addressComplement?.trim()}
              placeholder={missingPlaceholder}
            />
          ) : null}
        </SectionCard>

        <SectionCard
          title={t.correct?.sections?.files || 'Files'}
          icon={<FileBadge2 className="h-4 w-4" aria-hidden="true" />}
          description={t.correct?.sections?.Description || 'Your identity photos are ready for verification.'}
        >
          <div className="space-y-3">
            {filesList.map((file) => (
              <FileItem
                key={file.key}
                label={file.label}
                file={documents?.[file.key]}
                placeholder={t.correct?.rows?.fileMissing || missingPlaceholder}
                onRetake={() => beginDocumentRetake(file.step)}
                savedLabel={launch.common.saved}
                retakeLabel={t.buttons?.retake}
              />
            ))}
          </div>
        </SectionCard>

        <section className="access-review-consent overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--access-accent)_35%,var(--access-border))] bg-[color-mix(in_srgb,var(--access-accent)_7%,var(--access-surface))] p-4 sm:p-5" aria-labelledby="consent-title">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--access-accent)]">{launch.review.requested}</p>
          <h2 id="consent-title" className="mt-2 text-xl font-semibold text-[var(--access-text)]">{launch.review.acceptTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--access-text-secondary)]">{launch.review.requestBody}</p>
          <details className="mt-4 rounded-xl border border-[var(--access-border)] bg-[color-mix(in_srgb,var(--access-surface-subtle)_55%,transparent)] px-4 py-3 text-sm text-[var(--access-text-secondary)]">
            <summary className="cursor-pointer font-semibold text-[var(--access-text)]">{launch.review.readTerms}</summary>
            <div className="mt-3 space-y-3 leading-relaxed">
              <p>{t.terms?.p1 || 'By continuing, you confirm that the information and files submitted are truthful, complete, and belong to you.'}</p>
              <p>{t.terms?.p2 || 'Your data is processed for compliance, anti-fraud checks, and legal identity verification in accordance with applicable regulation.'}</p>
              <p>{t.terms?.p3 || 'Submitting this form starts a review. False or misleading information may result in account restrictions.'}</p>
            </div>
          </details>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--access-border)] bg-[color-mix(in_srgb,var(--access-surface-subtle)_55%,transparent)] p-4">
            <Checkbox id="review-consent" checked={accepted} onCheckedChange={(value) => setAccepted(Boolean(value))} className="mt-0.5 border-[var(--access-accent)]" />
            <Label htmlFor="review-consent" className="cursor-pointer text-sm font-medium leading-relaxed text-[var(--access-text)]">{launch.review.consent}</Label>
          </div>
        </section>
      </div>
      {editingAddress && (
        <AddressEditor
          formData={formData}
          copy={launch.review}
          common={launch.common}
          onCancel={() => setEditingAddress(false)}
          onSave={(values) => {
            Object.entries(values).forEach(([key, value]) => updateField(key, value))
            setEditingAddress(false)
          }}
        />
      )}
      {editingPersonal && (
        <PersonalEditor
          formData={formData}
          copy={launch.review}
          common={launch.common}
          onCancel={() => setEditingPersonal(false)}
          onSave={(values) => {
            Object.entries(values).forEach(([key, value]) => updateField(key, value))
            setEditingPersonal(false)
          }}
        />
      )}
    </StepperLayout>
  )
}
