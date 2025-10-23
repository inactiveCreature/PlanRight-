import { useState, useEffect, useRef } from 'react'
import type { StructureType } from '../../types'
import type { UserRole } from '../../utils/roleCopy'
import { Field, Select, Tooltip } from '../../components/ui/FormBits'
import { SwitchField } from '../../components/form/SwitchField'
import { NumberField } from '../../components/NumberField'
import SelectField from '../../components/SelectField'
import Stepper from '../../components/Stepper'
import DecisionCard from '../../components/DecisionCard'
import PageHeader from '../../components/PageHeader'
import Card from '../../components/Card'
import ResetMenu from '../../components/ResetMenu'
import ResetConfirmationModal from '../../components/ResetConfirmationModal'
import UndoToast from '../../components/UndoToast'
import { StatusTag } from '../../components/StatusTag'
import { fmtDims, fmtSqm, fmtMeters, toTitleCase } from '../../utils/format'
import { getMinSetback } from '../../constants/thresholds'
import { list_sample_properties } from '../../data/sampleProperties'
import { assess } from '../../assessment/assess'
import { usePlanRightStore } from '../../store'
import {
  getFriendlyErrorMessage,
  isFieldError,
  type StepId,
} from '../../wizard/steps'
import { ZONES } from '../../config/zones'
import AddressField from '../../components/form/AddressField'

/** Step list for the left stepper. */
const STEPS: { id: StepId; title: string }[] = [
  { id: 'start', title: 'Start' },
  { id: 'property', title: 'Property' },
  { id: 'structure', title: 'Structure' },
  { id: 'dimensions', title: 'Dimensions' },
  { id: 'location', title: 'Location/Setbacks' },
  { id: 'siting', title: 'Siting' },
  { id: 'context', title: 'Context' },
  { id: 'review', title: 'Review' },
]

const STRUCTURE_OPTIONS: { value: StructureType | ''; label: string }[] = [
  { value: '', label: 'Choose a structure' },
  { value: 'shed', label: 'Shed' },
  { value: 'patio', label: 'Patio' },
  { value: 'carport', label: 'Carport' },
]

// Get sample properties from API
const SAMPLE_PROPERTIES = list_sample_properties().map((prop) => ({
  ...prop,
  frontage_m: Math.floor(Math.random() * 15) + 8, // Generate reasonable frontage
  corner_lot_bool: prop.flags.includes('corner_lot'),
  easement_bool: prop.flags.includes('easement'),
}))

export default function PlanRightWizard({
  role,
  onChangeRole,
}: {
  role: UserRole
  onChangeRole: (r: UserRole) => void
}) {
  // Use global store instead of local state
  const {
    proposal,
    lastAssessment,
    currentStep: storeCurrentStep,
    setField,
    setRole,
    setCurrentStep,
    validateCurrentStep,
    resetAll,
    resetStep,
    takeSnapshot,
    undoReset,
    markStepConfirmed,
  } = usePlanRightStore()

  // Local UI state only
  const [current, setCurrent] = useState(0)
  const [manualArea, setManualArea] = useState(false)
  const [useSample, setUseSample] = useState(false)
  const [selectedSampleId, setSelectedSampleId] = useState('')
  const [showErrorSummary, setShowErrorSummary] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const errorSummaryRef = useRef<HTMLDivElement>(null)

  // Sync role with store
  useEffect(() => {
    setRole(role)
  }, [role, setRole])

  // Sync current step with store
  useEffect(() => {
    setCurrent(storeCurrentStep)
  }, [storeCurrentStep])

  // Update store when local current changes
  useEffect(() => {
    setCurrentStep(current)
  }, [current, setCurrentStep])

  // Reset handlers
  const handleResetAll = () => {
    setShowResetModal(true)
  }

  const handleConfirmResetAll = (keepRole: boolean, keepChat: boolean) => {
    takeSnapshot()
    resetAll(keepRole, keepChat)
    setShowUndoToast(true)
    setShowErrorSummary(false)
  }

  const handleResetStep = (stepId: StepId) => {
    resetStep(stepId)
    setShowErrorSummary(false)
  }

  const handleUndoReset = () => {
    undoReset()
    setShowUndoToast(false)
  }

  const handleDismissUndoToast = () => {
    setShowUndoToast(false)
  }


  // Status tag mappings for Location & Siting
  const getLocationSitingTags = () => {
    const { behind_building_line_bool } = proposal.location
    const { on_easement_bool, over_sewer_bool } = proposal.siting

    return {
      behind_building_line: behind_building_line_bool === true ? (
        <StatusTag 
          state="pass" 
          text="Behind building line"
        />
      ) : behind_building_line_bool === false ? (
        <StatusTag 
          state="fail" 
          text="In front of building line"
        />
      ) : (
        <StatusTag 
          state="neutral" 
          text="Not provided"
        />
      ),

      on_easement: on_easement_bool === true ? (
        <StatusTag 
          state="fail" 
          text="Inside registered easement"
        />
      ) : on_easement_bool === false ? (
        <StatusTag 
          state="pass" 
          text="No easement conflict"
        />
      ) : (
        <StatusTag 
          state="neutral" 
          text="Not provided"
        />
      ),

      over_sewer: over_sewer_bool === true ? (
        <StatusTag 
          state="warn" 
          text="Above sewer/service line"
        />
      ) : over_sewer_bool === false ? (
        <StatusTag 
          state="pass" 
          text="No sewer line under structure"
        />
      ) : (
        <StatusTag 
          state="neutral" 
          text="Not provided"
        />
      )
    }
  }

  // Status tag mappings for Context Flags
  const getContextFlagsTags = () => {
    const { heritage_item_bool, conservation_area_bool, flood_prone_bool, bushfire_bool } = proposal.context

    return {
      heritage_item: heritage_item_bool === true ? (
        <StatusTag 
          state="fail" 
          text="Heritage item"
        />
      ) : heritage_item_bool === false ? (
        <StatusTag 
          state="neutral" 
          text="Not heritage-listed"
        />
      ) : (
        <StatusTag 
          state="neutral" 
          text="Not provided"
        />
      ),

      conservation_area: conservation_area_bool === true ? (
        <StatusTag 
          state="warn" 
          text="In conservation area"
        />
      ) : conservation_area_bool === false ? (
        <StatusTag 
          state="neutral" 
          text="Outside conservation area"
        />
      ) : (
        <StatusTag 
          state="neutral" 
          text="Not provided"
        />
      ),

      flood_prone: flood_prone_bool === true ? (
        <StatusTag 
          state="warn" 
          text="Flood-prone land"
        />
      ) : flood_prone_bool === false ? (
        <StatusTag 
          state="neutral" 
          text="Not flood-prone"
        />
      ) : (
        <StatusTag 
          state="neutral" 
          text="Not provided"
        />
      ),

      bushfire: bushfire_bool === true ? (
        <StatusTag 
          state="warn" 
          text="Bushfire-prone land"
        />
      ) : bushfire_bool === false ? (
        <StatusTag 
          state="neutral" 
          text="Not bushfire-prone"
        />
      ) : (
        <StatusTag 
          state="neutral" 
          text="Not provided"
        />
      )
    }
  }

  // Auto-calc area when length/width change and not manual
  useEffect(() => {
    if (!manualArea) {
      const L = Number(proposal.dimensions.length_m) || 0
      const W = Number(proposal.dimensions.width_m) || 0
      const A = L && W ? Number((L * W).toFixed(2)) : ''
      if (A !== proposal.dimensions.area_m2) {
        setField('dimensions.area_m2', A)
      }
    }
  }, [
    proposal.dimensions.length_m,
    proposal.dimensions.width_m,
    manualArea,
    proposal.dimensions.area_m2,
    setField,
  ])

  // Get current step validation
  const currentStepId = STEPS[current].id as StepId
  const { valid: isCurrentStepValid, errors: currentStepErrors } =
    validateCurrentStep(currentStepId)

  // Live field validation for current step
  const validationData = { role, ...proposal }

  // Helper to get field error message
  const getFieldError = (fieldPath: string): string | undefined => {
    const error = currentStepErrors.find(
      (e: { path: string; message: string }) => e.path === fieldPath
    )
    return error?.message
  }

  // Helper to check if field has error (with conditional logic for front setback)
  const hasFieldError = (fieldPath: string): boolean => {
    // Special handling for front setback when behind building line
    if (fieldPath === 'setback_front_m' && proposal.location.behind_building_line_bool) {
      return false // Never show error when behind building line
    }
    return isFieldError(currentStepId, fieldPath, validationData)
  }

  // Hide error summary when step becomes valid
  useEffect(() => {
    if (isCurrentStepValid) {
      setShowErrorSummary(false)
    }
  }, [isCurrentStepValid])

  function next() {
    if (isCurrentStepValid) {
      // Mark current step as confirmed before navigating
      const currentStepId = STEPS[current].id
      if (currentStepId !== 'start' && currentStepId !== 'review') {
        markStepConfirmed(currentStepId)
      }

      setCurrent((c) => Math.min(c + 1, STEPS.length - 1))
      setShowErrorSummary(false)
    } else {
      // Show error summary and focus first invalid field
      setShowErrorSummary(true)
      setTimeout(() => {
        errorSummaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Focus first invalid field
        const firstError = currentStepErrors[0]
        if (firstError) {
          const fieldElement = document.querySelector(`[name="${firstError.path}"]`) as HTMLElement
          fieldElement?.focus()
        }
      }, 100)
    }
  }

  function back() {
    setCurrent((c) => Math.max(c - 1, 0))
    setShowErrorSummary(false)
  }

  function jump(i: number) {
    setCurrent(i)
    setShowErrorSummary(false)
  }

  function StepContent() {
    const stepId = STEPS[current].id

    if (stepId === 'start') {
      const ROLE_OPTIONS = [
        { value: 'Resident', label: 'Resident' },
        { value: 'Builder', label: 'Builder/Contractor' },
        { value: 'Purchaser', label: 'Property Purchaser' },
        { value: 'Planner', label: 'Council/Planner' },
        { value: 'Student', label: 'Student/Training' },
      ]
      return (
        <>
          <PageHeader
            title="Start"
            subtitle="Assessment type and role preset. This tool screens sheds, patios and carports only (SEPP Part 2)."
          />
          <Card>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5 md:col-span-12">
                <Field label="User role" hint="Drives tone only">
                  <Select value={role} onChange={onChangeRole} options={ROLE_OPTIONS} />
                </Field>
              </div>
              <div className="col-span-7 md:col-span-12">
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Assessment type
                </label>
                <div className="text-slate-700 text-sm">New shed / patio / carport</div>
              </div>
            </div>
          </Card>
        </>
      )
    }

    if (stepId === 'property') {
      return (
        <>
          <PageHeader
            title="Property"
            subtitle="Enter lot basics. We only use these to screen against SEPP Part 2."
          >
            <ResetMenu
              currentStep="property"
              onResetStep={handleResetStep}
              onResetAll={handleResetAll}
            />
          </PageHeader>

          <Card className="mb-6">
            <div className="mb-4">
              <SwitchField
                label="Use a sample property?"
                description="Select a sample to auto-fill property fields, or continue with manual entry."
                checked={useSample}
                onChange={setUseSample}
              />
            </div>
            {useSample && (
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-8 md:col-span-12">
                  <label className="block text-sm font-medium text-slate-800 mb-1">
                    Sample property
                  </label>
                  <select
                    value={selectedSampleId}
                    onChange={(e) => setSelectedSampleId((e.target as HTMLSelectElement).value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">— Select —</option>
                    {SAMPLE_PROPERTIES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 md:col-span-12 flex items-end">
                  <button
                    onClick={() => {
                      const sel = SAMPLE_PROPERTIES.find((x) => x.id === selectedSampleId)
                      if (!sel) return
                      setField('property.id', sel.id)
                      setField('property.lot_size_m2', sel.lot_size_m2)
                      setField('property.zone_text', sel.zone_text)
                      setField('property.frontage_m', sel.frontage_m)
                      setField('property.corner_lot_bool', sel.corner_lot_bool)
                      setField('property.easement_bool', sel.easement_bool)
                      setField('context.flood_prone_bool', sel.flags.includes('flood_prone'))
                      setField('context.bushfire_bool', sel.flags.includes('bushfire'))
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    aria-label="Apply selected sample property data to form"
                  >
                    Apply sample
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card className="mb-6">
            <div className="mb-4">
              <AddressField onSelect={handleAddressSelect} />
            </div>
          </Card>

          <Card className="mb-6">
            <div className="space-y-4">
              <div>
                <SelectField
                  id="zone-select"
                  label="Zone"
                  value={proposal.property.zone_text}
                  options={ZONES.map((zone) => ({ value: zone.value, label: zone.label }))}
                  onChange={(value) => setField('property.zone_text', value)}
                  placeholder="Select a zone"
                  description="Residential zone used for setback and size checks"
                  error={getFieldError('zone_text')}
                  required
                />
              </div>
              <NumberField
                label="Lot size (m²)"
                value={
                  typeof proposal.property.lot_size_m2 === 'number'
                    ? proposal.property.lot_size_m2
                    : undefined
                }
                onCommit={(v) => setField('property.lot_size_m2', v)}
                min={0}
                step={0.1}
                placeholder="450"
                suffix="m²"
                required
                ariaLabel="Lot size in square meters"
                invalid={hasFieldError('lot_size_m2')}
                errorMessage={getFieldError('lot_size_m2')}
              />

              <NumberField
                label="Frontage (m)"
                value={
                  typeof proposal.property.frontage_m === 'number'
                    ? proposal.property.frontage_m
                    : undefined
                }
                onCommit={(v) => setField('property.frontage_m', v)}
                min={0}
                step={0.1}
                placeholder="12.0"
                suffix="m"
                ariaLabel="Frontage in meters"
                invalid={hasFieldError('frontage_m')}
                errorMessage={getFieldError('frontage_m')}
              />
              <SwitchField
                label="Corner lot?"
                description="Is your property on a street corner? Corner lots have different setback requirements and may have additional restrictions."
                checked={proposal.property.corner_lot_bool}
                onChange={(v: boolean) => setField('property.corner_lot_bool', v)}
              />

              <SwitchField
                label="Any easements registered?"
                description="Are there registered easements on your property? Easements are areas where utilities have rights. Check your property title or survey."
                checked={proposal.property.easement_bool}
                onChange={(v: boolean) => setField('property.easement_bool', v)}
              />
            </div>
          </Card>
        </>
      )
    }

    if (stepId === 'structure') {
      return (
        <>
          <PageHeader
            title="Structure"
            subtitle="We currently screen sheds, patios and carports only."
          >
            <ResetMenu
              currentStep="structure"
              onResetStep={handleResetStep}
              onResetAll={handleResetAll}
            />
          </PageHeader>
          <Card>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-5 md:col-span-12">
                <Field
                  label="Type"
                  error={getFieldError('type')}
                  required
                  hint="Select the type of structure you're planning"
                >
                  <Tooltip content="Choose the type of structure you want to build. Different rules apply to each type.">
                    <Select
                      value={proposal.structure.type}
                      onChange={(v) => setField('structure.type', v as StructureType)}
                      options={STRUCTURE_OPTIONS}
                      invalid={hasFieldError('type')}
                    />
                  </Tooltip>
                </Field>
              </div>
            </div>
          </Card>
        </>
      )
    }

    if (stepId === 'dimensions') {
      return (
        <>
          <PageHeader
            title="Dimensions"
            subtitle="Enter overall size. Area auto-calculates unless you override."
          >
            <ResetMenu
              currentStep="dimensions"
              onResetStep={handleResetStep}
              onResetAll={handleResetAll}
            />
          </PageHeader>
          <Card>
            <div className="space-y-4">
              <NumberField
                label="Length (m)"
                value={
                  typeof proposal.dimensions.length_m === 'number'
                    ? proposal.dimensions.length_m
                    : undefined
                }
                onCommit={(v) => setField('dimensions.length_m', v)}
                min={0}
                step={0.1}
                placeholder="3.0"
                suffix="m"
                ariaLabel="Length in meters"
                invalid={hasFieldError('length_m')}
                errorMessage={getFieldError('length_m')}
              />
              <NumberField
                label="Width (m)"
                value={
                  typeof proposal.dimensions.width_m === 'number'
                    ? proposal.dimensions.width_m
                    : undefined
                }
                onCommit={(v) => setField('dimensions.width_m', v)}
                min={0}
                step={0.1}
                placeholder="2.4"
                suffix="m"
                ariaLabel="Width in meters"
                invalid={hasFieldError('width_m')}
                errorMessage={getFieldError('width_m')}
              />

              <NumberField
                label="Height (m)"
                value={
                  typeof proposal.dimensions.height_m === 'number'
                    ? proposal.dimensions.height_m
                    : undefined
                }
                onCommit={(v) => setField('dimensions.height_m', v)}
                min={0}
                step={0.1}
                placeholder="2.4"
                suffix="m"
                required
                ariaLabel="Height in meters"
                invalid={hasFieldError('height_m')}
                errorMessage={getFieldError('height_m')}
              />
              <NumberField
                label="Area (m²)"
                value={
                  typeof proposal.dimensions.area_m2 === 'number'
                    ? proposal.dimensions.area_m2
                    : undefined
                }
                onCommit={(v) => {
                  setManualArea(true)
                  setField('dimensions.area_m2', v)
                }}
                min={0}
                step={0.1}
                placeholder="7.2"
                suffix="m²"
                ariaLabel="Area in square meters"
                invalid={hasFieldError('area_m2')}
                errorMessage={getFieldError('area_m2')}
              />
            </div>
          </Card>
        </>
      )
    }

    if (stepId === 'location') {
      return (
        <>
          <PageHeader
            title="Location & Setbacks"
            subtitle="If behind the building line, front setback is not required. If in front, meet the minimum front setback."
          >
            <ResetMenu
              currentStep="location"
              onResetStep={handleResetStep}
              onResetAll={handleResetAll}
            />
          </PageHeader>
          <Card>
            <div className="space-y-4">
              <SwitchField
                label="Behind building line?"
                description="Is the structure behind the building line? The building line is typically 5m from the street frontage. Structures must be behind this line."
                checked={proposal.location.behind_building_line_bool}
                onChange={(v: boolean) => setField('location.behind_building_line_bool', v)}
              />
              <NumberField
                label="Front setback (m)"
                value={
                  typeof proposal.location.setback_front_m === 'number'
                    ? proposal.location.setback_front_m
                    : undefined
                }
                onCommit={(v) => setField('location.setback_front_m', v)}
                disabled={proposal.location.behind_building_line_bool}
                min={0}
                step={0.1}
                placeholder={proposal.location.behind_building_line_bool ? 'Not required' : '5.0'}
                suffix="m"
                required={!proposal.location.behind_building_line_bool}
                ariaLabel="Front setback in meters"
                invalid={hasFieldError('setback_front_m')}
                errorMessage={getFieldError('setback_front_m')}
              />

              <NumberField
                label="Side setback (m)"
                value={
                  typeof proposal.location.setback_side_m === 'number'
                    ? proposal.location.setback_side_m
                    : undefined
                }
                onCommit={(v) => setField('location.setback_side_m', v)}
                min={0}
                step={0.1}
                placeholder="0.9"
                suffix="m"
                ariaLabel="Side setback in meters"
                invalid={hasFieldError('setback_side_m')}
                errorMessage={getFieldError('setback_side_m')}
              />
              <NumberField
                label="Rear setback (m)"
                value={
                  typeof proposal.location.setback_rear_m === 'number'
                    ? proposal.location.setback_rear_m
                    : undefined
                }
                onCommit={(v) => setField('location.setback_rear_m', v)}
                min={0}
                step={0.1}
                placeholder="0.9"
                suffix="m"
                ariaLabel="Rear setback in meters"
                invalid={hasFieldError('setback_rear_m')}
                errorMessage={getFieldError('setback_rear_m')}
              />
            </div>

            {/* BBL Helper Copy */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-300 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-800" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Building Line Logic</h4>
                  <p className="text-sm text-blue-800">
                    {proposal.location.behind_building_line_bool ? (
                      <>
                        ✅ <strong>Behind building line:</strong> Front setback is not required.
                        Your structure is positioned behind the building line (typically 5m from
                        street frontage).
                      </>
                    ) : (
                      <>
                        ⚠️ <strong>In front of building line:</strong> Front setback is required and
                        must meet the minimum distance (5.0m) from the street frontage.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      )
    }

    if (stepId === 'siting') {
      return (
        <>
          <PageHeader
            title="Siting"
            subtitle="Avoid easements and services. Sheds should be detached."
          >
            <ResetMenu
              currentStep="siting"
              onResetStep={handleResetStep}
              onResetAll={handleResetAll}
            />
          </PageHeader>
          <Card>
            <div className="space-y-4">
              <SwitchField
                label="On easement?"
                description="Is the structure on an easement? Easements are areas where utilities have rights. Structures should avoid these areas."
                checked={proposal.siting.on_easement_bool}
                onChange={(v: boolean) => setField('siting.on_easement_bool', v)}
              />
              <SwitchField
                label="Over sewer?"
                description="Is the structure over sewer lines? Structures should not be built over sewer mains or infrastructure."
                checked={proposal.siting.over_sewer_bool}
                onChange={(v: boolean) => setField('siting.over_sewer_bool', v)}
              />

              <SwitchField
                label="Attached to dwelling?"
                description="Is the structure attached to the main house? Sheds must be detached. Patios and carports may be attached to the dwelling."
                checked={proposal.siting.attached_to_dwelling_bool}
                onChange={(v: boolean) => setField('siting.attached_to_dwelling_bool', v)}
              />
            </div>
          </Card>
        </>
      )
    }

    if (stepId === 'context') {
      return (
        <>
          <PageHeader
            title="Context & Constraints"
            subtitle="Environmental and planning overlays that may affect your development proposal."
          >
            <ResetMenu
              currentStep="context"
              onResetStep={handleResetStep}
              onResetAll={handleResetAll}
            />
          </PageHeader>

          {/* Heritage & Conservation Section */}
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Heritage & Conservation</h3>
                <p className="text-sm text-slate-600">Special protection areas with additional requirements</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <SwitchField
                  label="Heritage item?"
                  description="Is the property a heritage item? Heritage items have special protection and may require additional approvals."
                  checked={proposal.context.heritage_item_bool}
                  onChange={(v: boolean) => setField('context.heritage_item_bool', v)}
                />
                {proposal.context.heritage_item_bool && (
                  <div className="ml-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="text-sm font-semibold text-red-800">Development Impact</div>
                        <div className="text-sm text-red-700">Heritage items typically require development consent and may not be exempt under SEPP Part 2.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <SwitchField
                  label="Conservation area?"
                  description="Is the property in a conservation area? Conservation areas have special planning controls that may affect development."
                  checked={proposal.context.conservation_area_bool}
                  onChange={(v: boolean) => setField('context.conservation_area_bool', v)}
                />
                {proposal.context.conservation_area_bool && (
                  <div className="ml-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="text-sm font-semibold text-amber-800">Development Impact</div>
                        <div className="text-sm text-amber-700">Conservation areas may have additional requirements for materials, design, and approval processes.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Environmental Risks Section */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Environmental Risks</h3>
                <p className="text-sm text-slate-600">Natural hazards that may require special considerations</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <SwitchField
                  label="Flood prone?"
                  description="Is the property in a flood prone area? Flood prone areas may have additional requirements for development."
                  checked={proposal.context.flood_prone_bool}
                  onChange={(v: boolean) => setField('context.flood_prone_bool', v)}
                />
                {proposal.context.flood_prone_bool && (
                  <div className="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="text-sm font-semibold text-blue-800">Development Impact</div>
                        <div className="text-sm text-blue-700">Flood prone areas may require elevated construction, flood-compatible materials, and additional approvals.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <SwitchField
                  label="Bushfire prone?"
                  description="Is the property in a bushfire prone area? Bushfire prone areas have special requirements for development and materials."
                  checked={proposal.context.bushfire_bool}
                  onChange={(v: boolean) => setField('context.bushfire_bool', v)}
                />
                {proposal.context.bushfire_bool && (
                  <div className="ml-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="text-sm font-semibold text-orange-800">Development Impact</div>
                        <div className="text-sm text-orange-700">Bushfire prone areas require fire-resistant materials, ember protection, and may need additional approvals.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </>
      )
    }

    if (stepId === 'review') {
      return (
        <>
          <PageHeader title="Review" subtitle="Confirm entries then run the rules check.">
            <div className="flex items-center gap-3">
              <ResetMenu
                currentStep="review"
                onResetStep={handleResetStep}
                onResetAll={handleResetAll}
              />
              <button
                onClick={() => assess()}
                className="btn-primary"
                aria-label="Run rules assessment to check if development is exempt"
              >
                Run rules check
              </button>
            </div>
          </PageHeader>

          <div className="space-y-6">
            <Card>
              <div className="border-b border-slate-200 pb-6 mb-6">
                <h4 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Project Summary</h4>
                <p className="text-sm text-slate-600 font-medium">Complete overview of your development proposal</p>
              </div>
              
              <div className="space-y-6">
                {/* Structure Details Section */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="mb-6">
                    <h5 className="text-xl font-bold text-slate-800 tracking-tight">Structure Details</h5>
                    <p className="text-sm text-slate-600">Physical specifications and dimensions of your proposed structure</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Structure Type</div>
                      <div className="text-lg font-bold text-slate-800 leading-tight">{toTitleCase(proposal.structure.type || '—')}</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dimensions</div>
                      <div className="text-lg font-bold text-slate-800 leading-tight">
                        {fmtDims(
                          Number(proposal.dimensions.length_m) || 0,
                          Number(proposal.dimensions.width_m) || 0,
                          Number(proposal.dimensions.height_m) || 0
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Total Area</div>
                      <div className="text-lg font-bold text-slate-800 leading-tight">{fmtSqm(Number(proposal.dimensions.area_m2) || 0)}</div>
                    </div>
                  </div>
                </div>

                {/* Setbacks Section */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="mb-6">
                    <h5 className="text-xl font-bold text-slate-800 tracking-tight">Setback Requirements</h5>
                    <p className="text-sm text-slate-600">Minimum distances from property boundaries and building lines</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Front Setback</div>
                      <div className="text-lg font-bold text-slate-800 leading-tight mb-3">
                        {fmtMeters(Number(proposal.location.setback_front_m) || 0)}
                      </div>
                      {(() => {
                        const minSetback = getMinSetback(proposal.property.zone_text)
                        const value = Number(proposal.location.setback_front_m) || 0
                        const isBelowMin = value < minSetback.front
                        return (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-slate-500">Minimum: {fmtMeters(minSetback.front)}</div>
                            {isBelowMin && (
                              <StatusTag 
                                state="fail" 
                                text={`Below minimum (${fmtMeters(minSetback.front)})`} 
                                showPrefix={false} 
                                className="text-xs" 
                              />
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Side Setback</div>
                      <div className="text-lg font-bold text-slate-800 leading-tight mb-3">
                        {fmtMeters(Number(proposal.location.setback_side_m) || 0)}
                      </div>
                      {(() => {
                        const minSetback = getMinSetback(proposal.property.zone_text)
                        const value = Number(proposal.location.setback_side_m) || 0
                        const isBelowMin = value < minSetback.side
                        return (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-slate-500">Minimum: {fmtMeters(minSetback.side)}</div>
                            {isBelowMin && (
                              <StatusTag 
                                state="fail" 
                                text={`Below minimum (${fmtMeters(minSetback.side)})`} 
                                showPrefix={false} 
                                className="text-xs" 
                              />
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Rear Setback</div>
                      <div className="text-lg font-bold text-slate-800 leading-tight mb-3">
                        {fmtMeters(Number(proposal.location.setback_rear_m) || 0)}
                      </div>
                      {(() => {
                        const minSetback = getMinSetback(proposal.property.zone_text)
                        const value = Number(proposal.location.setback_rear_m) || 0
                        const isBelowMin = value < minSetback.rear
                        return (
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-slate-500">Minimum: {fmtMeters(minSetback.rear)}</div>
                            {isBelowMin && (
                              <StatusTag 
                                state="fail" 
                                text={`Below minimum (${fmtMeters(minSetback.rear)})`} 
                                showPrefix={false} 
                                className="text-xs" 
                              />
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* Location & Siting Section */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="mb-6">
                    <h5 className="text-xl font-bold text-slate-800 tracking-tight">Location & Siting</h5>
                    <p className="text-sm text-slate-600">Positioning relative to building lines, easements, and utilities</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Building Line Position</div>
                      <div className="min-w-0">
                        {getLocationSitingTags().behind_building_line}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Easement Status</div>
                      <div className="min-w-0">
                        {getLocationSitingTags().on_easement}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sewer Line Position</div>
                      <div className="min-w-0">
                        {getLocationSitingTags().over_sewer}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Context Flags Section */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="mb-6">
                    <h5 className="text-xl font-bold text-slate-800 tracking-tight">Context & Constraints</h5>
                    <p className="text-sm text-slate-600">Environmental and planning overlays affecting development</p>
                  </div>
                  
                  {/* Heritage & Conservation Row */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h6 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Heritage & Conservation</h6>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Heritage Status</div>
                        <div className="min-w-0">
                          {getContextFlagsTags().heritage_item}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Conservation Area</div>
                        <div className="min-w-0">
                          {getContextFlagsTags().conservation_area}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Environmental Risks Row */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h6 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Environmental Risks</h6>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Flood Risk</div>
                        <div className="min-w-0">
                          {getContextFlagsTags().flood_prone}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Bushfire Risk</div>
                        <div className="min-w-0">
                          {getContextFlagsTags().bushfire}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <DecisionCard result={lastAssessment || null} role={role} />
          </div>
        </>
      )
    }
    return null
  }

  function updateFormFields(values: Partial<Record<string, any>>) {
    // Map common planning/address fields into the store using setField.
    // Keeps callers simple (they can pass propertyAddress + planning flags).
    if (!values) return

    // residentZone -> property.zone_text
    if (values.residentZone !== undefined) {
      setField('property.zone_text', values.residentZone)
    }

    // Planning/context flags -> context.*
    if (values.heritageArea !== undefined) {
      setField('context.heritage_item_bool', Boolean(values.heritageArea))
    }
    if (values.conservationArea !== undefined) {
      setField('context.conservation_area_bool', Boolean(values.conservationArea))
    }
    if (values.floodProne !== undefined) {
      setField('context.flood_prone_bool', Boolean(values.floodProne))
    }
    if (values.bushfireProne !== undefined) {
      setField('context.bushfire_bool', Boolean(values.bushfireProne))
    }

    // Raw planning payload for debugging
    if (values.planningRaw !== undefined) {
      setField('property.planning_raw', values.planningRaw)
    }

    // Generic fallback: set any top-level keys that map directly to store paths
    Object.keys(values).forEach((k) => {
      if (
        [
          'propertyAddress',
          'residentZone',
          'heritageArea',
          'conservationArea',
          'floodProne',
          'bushfireProne',
          'planningRaw',
        ].includes(k)
      )
        return
      // If caller passed keys like "property.id" or "context.some_flag", forward them
      if (k.includes('.')) {
        setField(k, (values as any)[k])
      }
    })
  }

  function handleAddressSelect(addr: any) {
    const planning = addr.planning || {}
    updateFormFields({
      propertyAddress: {
        street: addr.street
          ? `${addr.houseNumber ? addr.houseNumber + ' ' : ''}${addr.street}`.trim()
          : undefined,
        city: addr.city,
        state: addr.state,
        postcode: addr.postcode,
        lat: addr.lat,
        lon: addr.lon,
      },
      residentZone: planning.residentZone ?? null,
      heritageArea: planning.heritage ?? false,
      conservationArea: planning.conservationArea ?? false,
      floodProne: planning.floodProne ?? false,
      bushfireProne: planning.bushfireProne ?? false,
      planningRaw: planning.raw,
    })
  }

  return (
    <>
      {/* Left column: stepper (desktop only) */}
      <aside className="hidden lg:block sticky top-[80px] z-20 w-[280px] max-w-[280px] min-w-0">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-5 h-5 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-lg font-bold text-slate-900">Wizard</div>
          </div>
          <Stepper steps={STEPS} current={current} onJump={jump} />
          <div className="mt-6 flex gap-3">
            <button onClick={back} disabled={current === 0} className="flex-1 btn-secondary">
              Back
            </button>
            <button
              onClick={next}
              disabled={current === STEPS.length - 1 || !isCurrentStepValid}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </Card>
      </aside>

      {/* Center: step content */}
      <section className="mx-auto max-w-[960px] lg:max-w-[960px] lg:mx-auto lg:min-w-0 w-full lg:w-auto min-w-0">
        <div className="animate-slide-up">
          {/* Error Summary */}
          {showErrorSummary && currentStepErrors.length > 0 && (
            <div ref={errorSummaryRef} className="mb-6">
              <Card className="border-warning bg-warning">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-warning mb-2">
                      Please complete the required fields
                    </h3>
                    <ul className="text-sm text-warning space-y-1">
                      {currentStepErrors.map(
                        (error: { path: string; message: string }, index: number) => (
                          <li key={index}>
                            • {getFriendlyErrorMessage(error.path, error.message)}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <StepContent />
        </div>
      </section>

      {/* Reset Modal */}
      <ResetConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmResetAll}
      />

      {/* Undo Toast */}
      <UndoToast
        isVisible={showUndoToast}
        onUndo={handleUndoReset}
        onDismiss={handleDismissUndoToast}
      />
    </>
  )
}

