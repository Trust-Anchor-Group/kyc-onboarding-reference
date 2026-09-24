'use client'

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStepper } from '@/app/context/StepperContext'
import StepperLayout from '@/app/components/StepperLayout'
import { useLanguage, content } from '@/app/context/LanguageContext'
import { CheckCircle2, MapPin, RotateCw } from 'lucide-react'


const COUNTRY_OPTIONS = [
  'Brazil',
  'Sweden',
  'Austria',
  'Belgium',
  'Denmark',
  'Italy',
  'Netherlands',
  'Norway',
  'Poland',
  'Switzerland',
  'Czech Republic',
  'Slovakia',
  'Chile',
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Portugal',
  'Argentina',
  'Mexico',
]

const COUNTRY_CODES = {
  Brazil: 'BR', Sweden: 'SE', Austria: 'AT', Belgium: 'BE', Denmark: 'DK',
  France: 'FR', Germany: 'DE', Italy: 'IT', Netherlands: 'NL', Norway: 'NO',
  Poland: 'PL', Portugal: 'PT', Slovakia: 'SK', Spain: 'ES', Switzerland: 'CH',
  'Czech Republic': 'CZ', 'United Kingdom': 'GB', 'United States': 'US',
  Canada: 'CA', Chile: 'CL', Argentina: 'AR', Mexico: 'MX',
}

const ZIPPOPOTAM_COUNTRIES = new Set([
  'AT', 'BE', 'CH', 'CZ', 'DE', 'DK', 'ES', 'FR', 'GB', 'IT', 'NL', 'NO',
  'PL', 'PT', 'SE', 'SK',
])

const countryNameFor = (value) => {
  if (!value) return 'Brazil'
  return Object.entries(COUNTRY_CODES).find(([, code]) => code === value.toUpperCase())?.[0] || value
}

const Step12Address = () => {
  const { updateField, formData, nextStep } = useStepper()

  const [street, setStreet] = useState(formData.addressStreet?.trim() || '')
  const [zip, setZip] = useState(formData.addressZip?.trim() || '')

  // Brazilian CEPs have a fixed numeric format. Other countries can use
  // letters and spaces, such as SW1A 1AA in the United Kingdom.
  const formatPostalCode = (value, selectedCountry) => {
    // Keep letters if someone enters a European code before changing the
    // country selector (the initial country is Brazil for existing flows).
    if (selectedCountry !== 'Brazil' || /[a-z]/i.test(value)) {
      return value.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 12).toUpperCase()
    }
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return digits.slice(0, 5) + '-' + digits.slice(5);
  };
  const [neighborhood, setNeighborhood] = useState(formData.addressNeighborhood?.trim() || '')
  const [city, setCity] = useState(formData.addressCity?.trim() || '')
  const [country, setCountry] = useState(() => countryNameFor(formData.addressCountry?.trim()))
  const [number, setNumber] = useState(formData.addressNumber?.trim() || '')
  const [complement, setComplement] = useState(formData.addressComplement?.trim() || '')
  const [errors, setErrors] = useState({})
  const [lookupState, setLookupState] = useState('idle')
  const lookupRequestRef = useRef(0)
  const addressValuesRef = useRef({ street: '', neighborhood: '', city: '' })
  const { language } = useLanguage()
  const t = content[language]
  const copy = t.access.launch.address
  const [countryOpen, setCountryOpen] = useState(false)
  const countryRef = React.useRef(null)
  const countryButtonRef = React.useRef(null)
  const [mounted, setMounted] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState({})
  const [openUp, setOpenUp] = useState(false)

  useEffect(() => {
    addressValuesRef.current = { street, neighborhood, city }
  }, [street, neighborhood, city])

  useEffect(() => setMounted(true), [])

  // Position dropdown in portal to prevent clipping by parent overflow
  useLayoutEffect(() => {
    if (countryOpen && countryButtonRef.current) {
      const rect = countryButtonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - rect.bottom
      const desiredHeight = 224 // ~ max-h-56 (56 * 4)
      const shouldOpenUp = spaceBelow < desiredHeight && rect.top > desiredHeight
      setOpenUp(shouldOpenUp)
      const top = shouldOpenUp ? Math.max(8, rect.top - desiredHeight - 4) : rect.bottom + 4
      setDropdownStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: `${desiredHeight}px`,
      })
    }
  }, [countryOpen])

  // Recompute on resize / scroll
  useEffect(() => {
    if (!countryOpen) return
    const handler = () => {
      if (countryButtonRef.current) {
        const rect = countryButtonRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - rect.bottom
        const desiredHeight = 224
        const shouldOpenUp = spaceBelow < desiredHeight && rect.top > desiredHeight
        setOpenUp(shouldOpenUp)
        const top = shouldOpenUp ? Math.max(8, rect.top - desiredHeight - 4) : rect.bottom + 4
        setDropdownStyle(prev => ({ ...prev, top: `${top}px`, left: `${rect.left}px`, width: `${rect.width}px` }))
      }
    }
    window.addEventListener('resize', handler)
    window.addEventListener('scroll', handler, true)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('scroll', handler, true)
    }
  }, [countryOpen])

  // Close on outside click (after click so option onClick fires). Ignore clicks inside the portal list via data attribute
  useEffect(() => {
    const handleDocClick = (e) => {
      if (!countryOpen) return
      if (e.target.closest?.('[data-country-dropdown]')) return
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setCountryOpen(false)
      }
    }
    if (countryOpen) document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [countryOpen])

  // Keyboard navigation for custom dropdown
  const [countryFocusIndex, setCountryFocusIndex] = useState(-1)
  useEffect(() => {
    if (!countryOpen) {
      setCountryFocusIndex(-1)
      return
    }
    // Ensure focus index points to current selection initially
    const currentIndex = COUNTRY_OPTIONS.indexOf(country)
    setCountryFocusIndex(currentIndex >= 0 ? currentIndex : 0)
  }, [countryOpen, country])

  const handleCountryKey = (e) => {
    if (!countryOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault()
      setCountryOpen(true)
      return
    }
    if (!countryOpen) return
    if (e.key === 'Escape') {
      e.preventDefault()
      setCountryOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCountryFocusIndex((prev) => (prev + 1) % COUNTRY_OPTIONS.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCountryFocusIndex((prev) => (prev - 1 + COUNTRY_OPTIONS.length) % COUNTRY_OPTIONS.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (countryFocusIndex >= 0) {
        const selected = COUNTRY_OPTIONS[countryFocusIndex]
        setCountry(selected)
        setCountryOpen(false)
      }
    }
  }

  // 🔁 CEP Auto-fill when ZIP reaches 8 digits
  useEffect(() => {
    const countryCode = COUNTRY_CODES[country]
    const brazilianCep = zip.replace(/\D/g, '')
    const postalCode = zip.replace(/[^a-zA-Z0-9]/g, '')
    const isBrazilianCep = countryCode === 'BR' && brazilianCep.length === 8
    const isEuropeanPostalCode = ZIPPOPOTAM_COUNTRIES.has(countryCode) && postalCode.length >= 3

    if (!isBrazilianCep && !isEuropeanPostalCode) {
      setLookupState('idle')
      return undefined
    }

    const controller = new AbortController()
    const requestId = lookupRequestRef.current + 1
    lookupRequestRef.current = requestId
    const lookupTimer = window.setTimeout(async () => {
      setLookupState('loading')
      try {
        if (isBrazilianCep) {
          const response = await fetch(`https://viacep.com.br/ws/${brazilianCep}/json/`, { signal: controller.signal })
          const data = await response.json()
          if (data.erro) throw new Error('CEP_NOT_FOUND')
          if (requestId !== lookupRequestRef.current) return
          const nextStreet = data.logradouro || ''
          const nextNeighborhood = data.bairro || ''
          const nextCity = data.localidade || ''
          // Autofill only empty fields. A user's manual correction always wins.
          const currentValues = addressValuesRef.current
          if (!currentValues.street.trim() && nextStreet) { setStreet(nextStreet); updateField('addressStreet', nextStreet) }
          if (!currentValues.neighborhood.trim() && nextNeighborhood) { setNeighborhood(nextNeighborhood); updateField('addressNeighborhood', nextNeighborhood) }
          if (!currentValues.city.trim() && nextCity) { setCity(nextCity); updateField('addressCity', nextCity) }
          setCountry('Brazil')
        } else {
          const response = await fetch(`https://api.zippopotam.us/${countryCode.toLowerCase()}/${encodeURIComponent(postalCode)}`, { signal: controller.signal })
          if (!response.ok) throw new Error('POSTCODE_NOT_FOUND')
          const data = await response.json()
          const place = data.places?.[0]
          if (!place) throw new Error('POSTCODE_NOT_FOUND')
          // European postcode data identifies a locality, not a street.
          if (requestId !== lookupRequestRef.current) return
          const nextCity = place['place name'] || ''
          const nextNeighborhood = place.state || place['state abbreviation'] || ''
          const currentValues = addressValuesRef.current
          if (!currentValues.city.trim() && nextCity) { setCity(nextCity); updateField('addressCity', nextCity) }
          if (!currentValues.neighborhood.trim() && nextNeighborhood) { setNeighborhood(nextNeighborhood); updateField('addressNeighborhood', nextNeighborhood) }
        }
        setLookupState('success')
      } catch (error) {
        if (error.name !== 'AbortError') setLookupState('error')
      }
    }, 350)

    return () => {
      window.clearTimeout(lookupTimer)
      controller.abort()
    }
  }, [zip, country, updateField])

  const validate = () => {
    const newErrors = {}
    if (!street.trim()) newErrors.street = copy.streetRequired
    if (!zip.trim()) newErrors.zip = copy.zipRequired
    if (!number.trim()) newErrors.number = copy.numberRequired
    // Complement is optional
    if (!neighborhood.trim()) newErrors.neighborhood = copy.neighborhoodRequired
    if (!city.trim()) newErrors.city = copy.cityRequired
    if (!country.trim()) newErrors.country = copy.countryRequired
    setErrors(newErrors)
    // Show all errors at once
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    // Always trim and remove extra spaces before validation and sending
    const trimmedStreet = street.replace(/\s+/g, ' ').trim()
    const trimmedZip = zip.replace(/\s+/g, '').trim()
    const trimmedNeighborhood = neighborhood.replace(/\s+/g, ' ').trim()
    const trimmedCity = city.replace(/\s+/g, ' ').trim()
    const trimmedCountry = country.replace(/\s+/g, ' ').trim()
    const trimmedNumber = number.replace(/\s+/g, '').trim()
    const trimmedComplement = complement.replace(/\s+/g, ' ').trim()

    setStreet(trimmedStreet)
    setZip(trimmedZip)
    setNeighborhood(trimmedNeighborhood)
    setCity(trimmedCity)
    setCountry(trimmedCountry)
    setNumber(trimmedNumber)
    setComplement(trimmedComplement)

    // Validate with trimmed values
    const newErrors = {}
    if (!trimmedStreet) newErrors.street = copy.streetRequired
    if (!trimmedZip) newErrors.zip = copy.zipRequired
    if (!trimmedNumber) newErrors.number = copy.numberRequired
    // Complement is optional
    if (!trimmedNeighborhood) newErrors.neighborhood = copy.neighborhoodRequired
    if (!trimmedCity) newErrors.city = copy.cityRequired
    if (!trimmedCountry) newErrors.country = copy.countryRequired
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const countryCode = COUNTRY_CODES[trimmedCountry] || trimmedCountry
    updateField('addressStreet', trimmedStreet)
    updateField('addressZip', trimmedZip)
    updateField('addressNeighborhood', trimmedNeighborhood)
    updateField('addressCity', trimmedCity)
    updateField('addressCountry', countryCode)
    updateField('addressNumber', trimmedNumber)
    updateField('addressComplement', trimmedComplement)
    nextStep()
    // Remove goToStep(step + 1) to avoid double navigation
  }

  return (
    <StepperLayout
      title={t.steps?.step12 || 'Where do you live?'}
      description={t.descriptions?.step12}
      onNext={handleNext}
    isNextDisabled={!zip || !street || !number || !neighborhood || !city || !country}
      contentClassName="pb-24"
      wide
      actionClassName="lg:ml-auto lg:flex-none lg:w-[min(100%,780px)]"
    >
      <div className="lg:grid lg:grid-cols-[minmax(220px,0.58fr)_minmax(560px,1.42fr)] lg:items-start lg:gap-20">
        <aside className="mb-8 hidden border-l border-[var(--access-border)] pl-6 lg:block" aria-label={copy.guidance}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--access-accent)]">{copy.eyebrow}</p>
          <h2 className="mt-4 max-w-[15rem] text-2xl font-medium leading-tight tracking-[-0.025em]">{copy.title}</h2>
          <p className="mt-5 max-w-[15rem] text-sm leading-relaxed text-[var(--access-text-muted)]">{copy.body}</p>
        </aside>
        <div className="space-y-5 pb-3.5">
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[#FBB040]/15 text-[#FBB040]"><MapPin className="h-4 w-4" aria-hidden="true" /></div>
            <div><p className="text-sm font-semibold text-white">{copy.find}</p><p className="mt-1 text-xs leading-relaxed text-[#B7D0DA]">{copy.findHint}</p></div>
          </div>
          <div className="mt-4 flex flex-col">
          <Label htmlFor="zip" className="!text-[#B7D0DA]">{t.labels?.zip || 'ZIP / Postal Code'}</Label>
          <Input
            id="zip"
            value={zip}
            onChange={(e) => {
              const raw = e.target.value;
              setZip(formatPostalCode(raw, country));
            }}
            onBlur={() => setZip(formatPostalCode(zip, country))}
            placeholder={t.placeholders?.zip || '12345-678'}
            autoComplete="postal-code"
            className="h-12"
            maxLength={12}
          />
          <div className="mt-2 min-h-5 text-xs" aria-live="polite">
            {lookupState === 'loading' && <span className="inline-flex items-center gap-1.5 text-[#B7D0DA]"><RotateCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> {copy.looking}</span>}
            {lookupState === 'success' && <span className="inline-flex items-center gap-1.5 text-[#29BF86]"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> {copy.found}</span>}
            {lookupState === 'error' && <span className="text-[#FBB040]">{copy.notFound}</span>}
          </div>
          {errors.zip && <p className="text-sm text-red-500">{errors.zip}</p>}
          </div>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FBB040]">{copy.yourAddress}</p>
          <div className="mt-4 space-y-3">
          <div className="flex flex-col">
          <Label htmlFor="street" className="!text-[#B7D0DA]">{t.labels?.street || 'Street Address'}</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value.replace(/[0-9]/g, '').replace(/\s{2,}/g, ' '))}
              placeholder={t.placeholders?.street || '123 Main St'}
              autoComplete="address-line1"
              className="h-12"
            />
            {errors.street && <p className="text-sm text-red-500">{errors.street}</p>}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="number" className="!text-[#B7D0DA]">{t.labels?.number || 'Number'}</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\s+/g, ''))}
                placeholder={t.placeholders?.number || '223'}
                autoComplete="address-line2"
                className="h-12"
              />
              {errors.number && <p className="text-sm text-red-500">{errors.number}</p>}
            </div>

            <div className="flex-1">
              <Label htmlFor="complement" className="!text-[#B7D0DA]">{t.labels?.complement || 'Complement'}</Label>
              <Input
                id="complement"
                value={complement}
                onChange={(e) => setComplement(e.target.value.replace(/\s{2,}/g, ' '))}
                placeholder={t.placeholders?.complement || 'Apt, Suite'}
                autoComplete="address-line2"
                className="h-12"
              />
              {errors.complement && <p className="text-sm text-red-500">{errors.complement}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="neighborhood" className="!text-[#B7D0DA]">{t.labels?.neighborhood || 'Neighborhood*'}</Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value.replace(/\s{2,}/g, ' '))}
              placeholder={t.placeholders?.neighborhood || 'Neighborhood'}
              autoComplete="address-level3"
              className="h-12"
            />
            {errors.neighborhood && <p className="text-sm text-red-500">{errors.neighborhood}</p>}
        </div>
        <div className="flex flex-col">
          <Label htmlFor="city" className="!text-[#B7D0DA]">{t.labels?.city || 'City'}</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value.replace(/\s{2,}/g, ' '))}
            placeholder={t.placeholders?.city || 'New York'}
            autoComplete="address-level2"
            className="h-12"
          />
          {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
        </div>
        <div className="flex flex-col relative" ref={countryRef}>
          <Label htmlFor="country" className="!text-[#B7D0DA]">{t.labels?.country || 'Country'}</Label>
            <button
              id="country"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={countryOpen}
              onClick={() => setCountryOpen(o => !o)}
              onKeyDown={handleCountryKey}
              ref={countryButtonRef}
              className={`w-full h-12 text-left px-4 py-3 rounded-xl border ${countryOpen ? 'border-[#FBB040]' : country ? 'border-white/20' : 'border-white/20'} bg-[var(--step-bg)] focus:outline-none focus:ring-0 focus:border-[#FBB040] transition duration-200 flex items-center justify-between ${country ? 'text-white' : 'text-white/50'}`}
            >
              <span className="truncate">{country || t.placeholders?.country || copy.selectCountry}</span>
              <span className={`ml-2 text-xs transition-transform ${countryOpen ? 'rotate-180' : ''} ${country ? 'text-white/70' : 'text-white/40'}`}>▼</span>
            </button>
            {mounted && countryOpen && createPortal(
            <ul
              role="listbox"
              tabIndex={-1}
              aria-activedescendant={countryFocusIndex >= 0 ? `country-opt-${countryFocusIndex}` : undefined}
              style={dropdownStyle}
              data-country-dropdown
              className="z-[1000] max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-white/20 bg-[var(--step-bg)] py-1 shadow-lg focus:outline-none"
              onWheel={(e) => e.stopPropagation()}
            >
              {COUNTRY_OPTIONS.map((c, idx) => {
                const active = idx === countryFocusIndex
                const selected = c === country
                return (
                  <li
                    id={`country-opt-${idx}`}
                    role="option"
                    aria-selected={selected}
                    key={c}
                    onClick={() => { setCountry(c); setCountryOpen(false) }}
                    className={`px-4 py-2 cursor-pointer text-sm text-white hover:bg-white/10 ${active ? 'bg-white/10' : ''} ${selected ? 'font-semibold text-[#FBB040]' : ''}`}
                  >
                    {c}
                  </li>
                )
              })}
              {country && !COUNTRY_OPTIONS.includes(country) && (
                <li
                  role="option"
                  aria-selected={true}
                  className="px-4 py-2 cursor-pointer text-sm font-semibold text-[#FBB040]"
                  onClick={() => { setCountry(country); setCountryOpen(false) }}
                >
                  {country}
                </li>
              )}
            </ul>, document.body)}
          {errors.country && <p className="text-sm text-red-500 mt-1">{errors.country}</p>}
        </div>
          </div>
        </section>
        </div>
      </div>
    </StepperLayout>
  )
}

export default Step12Address
