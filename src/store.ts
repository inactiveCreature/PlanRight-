/**
 * Global store using Zustand for single source of truth
 * Contains: proposal, role, lastAssessment
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Proposal, RuleResult, UserRole } from './types'
import { run_rules_assessment } from './rules/engine'
import { validateStep, type StepId, type ValidationResult } from './wizard/steps'
import { INITIAL_PROPOSAL } from './state/initialProposal'

// Safe defaults for proposal data
const defaultProposal: Proposal = {
  property: {
    id: '',
    lot_size_m2: '',
    zone_text: '',
    frontage_m: '',
    corner_lot_bool: false,
    easement_bool: false,
  },
  structure: {
    type: '',
  },
  dimensions: {
    length_m: '',
    width_m: '',
    height_m: '',
    area_m2: '',
  },
  location: {
    setback_front_m: '',
    setback_side_m: '',
    setback_rear_m: '',
    behind_building_line_bool: false,
  },
  siting: {
    on_easement_bool: false,
    over_sewer_bool: false,
    attached_to_dwelling_bool: false,
  },
  context: {
    heritage_item_bool: false,
    conservation_area_bool: false,
    flood_prone_bool: false,
    bushfire_bool: false,
  },
}

interface PlanRightStore {
  // Core state
  role: UserRole
  proposal: Proposal
  lastAssessment?: RuleResult
  undoSnapshot?: {
    proposal: Proposal
    lastAssessment?: RuleResult
    role: UserRole
    currentStep?: number
  } | null
  currentStep: number

  // Step intent tracking
  stepTouched: Record<StepId, boolean>
  stepConfirmed: Record<Exclude<StepId, 'start' | 'review'>, boolean>

  // Actions
  setRole: (role: UserRole) => void
  setField: (path: string, value: any) => void
  setAssessment: (result: RuleResult) => void
  resetProposal: () => void
  setCurrentStep: (step: number) => void

  // Step intent actions
  markStepTouched: (id: StepId) => void
  markStepConfirmed: (id: Exclude<StepId, 'start' | 'review'>) => void
  resetStepUX: (id: StepId) => void
  resetAllUX: () => void

  // Reset functionality
  resetAll: (keepRole?: boolean, keepChat?: boolean) => void
  resetStep: (stepId: StepId) => void
  takeSnapshot: () => void
  undoReset: () => void

  // Assessment pipeline
  assess: () => RuleResult

  // Step validation selectors
  getStepStatus: (stepId: StepId) => 'complete' | 'todo'
  getStepErrors: (stepId: StepId) => ValidationResult
  validateCurrentStep: (stepId: StepId) => ValidationResult
}

export const usePlanRightStore = create<PlanRightStore>()(
  persist(
    (set, get) => ({
      // Initial state
      role: 'Resident',
      proposal: defaultProposal,
      lastAssessment: undefined,
      undoSnapshot: null,
      currentStep: 0,

      // Initialize step intent tracking
      stepTouched: {
        start: false,
        property: false,
        structure: false,
        dimensions: false,
        location: false,
        siting: false,
        context: false,
        review: false,
      },
      stepConfirmed: {
        property: false,
        structure: false,
        dimensions: false,
        location: false,
        siting: false,
        context: false,
      },

      // Actions
      setRole: (role: UserRole) => set({ role }),

      setCurrentStep: (step: number) => set({ currentStep: step }),

      setField: (path: string, value: any) => {
        const currentProposal = get().proposal
        const newProposal = { ...currentProposal }

        // Parse the path and update nested object
        const pathParts = path.split('.')
        let current: any = newProposal

        // Navigate to the parent object
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {}
          }
          current = current[pathParts[i]]
        }

        // Set the final value
        const finalKey = pathParts[pathParts.length - 1]
        current[finalKey] = value

        set({ proposal: newProposal })

        // Mark the appropriate step as touched based on the field path
        const stepFromPath = pathParts[0] as StepId
        if (
          stepFromPath &&
          ['property', 'structure', 'dimensions', 'location', 'siting', 'context'].includes(
            stepFromPath
          )
        ) {
          get().markStepTouched(stepFromPath)
        }
      },

      setAssessment: (result: RuleResult) => set({ lastAssessment: result }),

      // Step intent actions
      markStepTouched: (id: StepId) => {
        set((state) => ({
          stepTouched: { ...state.stepTouched, [id]: true },
        }))
      },

      markStepConfirmed: (id: Exclude<StepId, 'start' | 'review'>) => {
        set((state) => ({
          stepConfirmed: { ...state.stepConfirmed, [id]: true },
        }))
      },

      resetStepUX: (id: StepId) => {
        set((state) => ({
          stepTouched: { ...state.stepTouched, [id]: false },
          stepConfirmed:
            id !== 'start' && id !== 'review'
              ? { ...state.stepConfirmed, [id]: false }
              : state.stepConfirmed,
        }))
      },

      resetAllUX: () => {
        set({
          stepTouched: {
            start: false,
            property: false,
            structure: false,
            dimensions: false,
            location: false,
            siting: false,
            context: false,
            review: false,
          },
          stepConfirmed: {
            property: false,
            structure: false,
            dimensions: false,
            location: false,
            siting: false,
            context: false,
          },
        })
      },

      resetProposal: () => set({ proposal: defaultProposal, lastAssessment: undefined }),

      // Reset functionality
      resetAll: (keepRole = true, _keepChat = true) => {
        const updates: Partial<PlanRightStore> = {
          proposal: JSON.parse(JSON.stringify(INITIAL_PROPOSAL)), // Deep clone
          lastAssessment: undefined,
          currentStep: 0, // Reset to first step
        }

        if (!keepRole) {
          updates.role = 'Resident'
        }

        set(updates)

        // Reset all UX flags
        get().resetAllUX()
      },

      resetStep: (stepId: StepId) => {
        const currentProposal = get().proposal
        const newProposal = JSON.parse(JSON.stringify(currentProposal)) // Deep clone

        // Map step IDs to their field paths
        const stepFields: Record<StepId, string[]> = {
          start: [],
          property: [
            'property.id',
            'property.lot_size_m2',
            'property.zone_text',
            'property.frontage_m',
            'property.corner_lot_bool',
            'property.easement_bool',
          ],
          structure: ['structure.type'],
          dimensions: [
            'dimensions.length_m',
            'dimensions.width_m',
            'dimensions.height_m',
            'dimensions.area_m2',
          ],
          location: [
            'location.setback_front_m',
            'location.setback_side_m',
            'location.setback_rear_m',
            'location.behind_building_line_bool',
          ],
          siting: [
            'siting.on_easement_bool',
            'siting.over_sewer_bool',
            'siting.attached_to_dwelling_bool',
          ],
          context: [
            'context.heritage_item_bool',
            'context.conservation_area_bool',
            'context.flood_prone_bool',
            'context.bushfire_bool',
          ],
          review: [],
        }

        const fieldsToReset = stepFields[stepId] || []

        // Reset fields to their initial values
        fieldsToReset.forEach((fieldPath) => {
          const pathParts = fieldPath.split('.')
          let current: any = newProposal

          // Navigate to the parent object
          for (let i = 0; i < pathParts.length - 1; i++) {
            current = current[pathParts[i]]
          }

          // Set to initial value
          const finalKey = pathParts[pathParts.length - 1]
          const initialValue = INITIAL_PROPOSAL[pathParts[0] as keyof Proposal]
          if (typeof initialValue === 'object' && initialValue !== null) {
            current[finalKey] = (initialValue as any)[finalKey]
          }
        })

        set({ proposal: newProposal })

        // Reset UX flags for this step
        get().resetStepUX(stepId)
      },

      takeSnapshot: () => {
        const currentState = get()
        set({
          undoSnapshot: {
            proposal: JSON.parse(JSON.stringify(currentState.proposal)),
            lastAssessment: currentState.lastAssessment
              ? JSON.parse(JSON.stringify(currentState.lastAssessment))
              : undefined,
            role: currentState.role,
            currentStep: currentState.currentStep,
          },
        })
      },

      undoReset: () => {
        const undoSnapshot = get().undoSnapshot
        if (undoSnapshot) {
          set({
            proposal: undoSnapshot.proposal,
            lastAssessment: undoSnapshot.lastAssessment,
            role: undoSnapshot.role,
            currentStep: undoSnapshot.currentStep || 0,
            undoSnapshot: null,
          })
        }
      },

      // Assessment pipeline
      assess: () => {
        const proposal = get().proposal
        const result = run_rules_assessment(proposal)
        set({ lastAssessment: result })
        return result
      },

      // Step validation selectors
      getStepStatus: (stepId: StepId) => {
        const { role, proposal, stepTouched, stepConfirmed } = get()
        const validationData = { role, ...proposal }
        const result = validateStep(stepId, validationData)

        // Check if step is valid
        const valid = result.valid

        // Check if user has shown intent (touched or confirmed)
        const touched = stepTouched[stepId] === true
        const confirmed =
          stepId === 'start' || stepId === 'review' ? false : stepConfirmed[stepId] === true

        // Step is complete only if valid AND (touched OR confirmed)
        return valid && (touched || confirmed) ? 'complete' : 'todo'
      },

      getStepErrors: (stepId: StepId) => {
        const { role, proposal } = get()
        const validationData = { role, ...proposal }
        return validateStep(stepId, validationData)
      },

      validateCurrentStep: (stepId: StepId) => {
        const { role, proposal } = get()
        const validationData = { role, ...proposal }
        return validateStep(stepId, validationData)
      },
    }),
    {
      name: 'planright-store',
      partialize: (state) => ({
        proposal: state.proposal,
        role: state.role,
        stepTouched: state.stepTouched,
        stepConfirmed: state.stepConfirmed,
        // Don't persist lastAssessment
      }),
    }
  )
)
