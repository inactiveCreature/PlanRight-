import { describe, it, expect, beforeEach } from 'vitest'
import { usePlanRightStore } from '../src/store'
import { INITIAL_PROPOSAL } from '../src/state/initialProposal'

describe('Reset Functionality Tests', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePlanRightStore.setState({
      role: 'Resident',
      proposal: JSON.parse(JSON.stringify(INITIAL_PROPOSAL)),
      lastAssessment: undefined,
      undoSnapshot: null,
    })
  })

  describe('reset_all_restores_defaults', () => {
    it('should restore proposal to initial state', () => {
      const store = usePlanRightStore.getState()

      // Modify some fields
      store.setField('property.zone_text', 'R3')
      store.setField('property.lot_size_m2', '1000')
      store.setField('structure.type', 'carport')
      store.setField('dimensions.length_m', '10')

      // Reset all
      store.resetAll()

      // Check that proposal is restored to initial state
      const newState = usePlanRightStore.getState()
      expect(newState.proposal).toEqual(INITIAL_PROPOSAL)
      expect(newState.lastAssessment).toBeUndefined()
    })

    it('should clear lastAssessment', () => {
      const store = usePlanRightStore.getState()

      // Set an assessment
      const mockAssessment = {
        decision: 'Likely Exempt',
        checks: [],
        notes: [],
      }
      store.setAssessment(mockAssessment)

      // Reset all
      store.resetAll()

      // Check that assessment is cleared
      const newState = usePlanRightStore.getState()
      expect(newState.lastAssessment).toBeUndefined()
    })

    it('should optionally reset role', () => {
      const store = usePlanRightStore.getState()

      // Set role to Builder
      store.setRole('Builder')

      // Reset all without keeping role
      store.resetAll(false)

      // Check that role is reset to Resident
      const newState = usePlanRightStore.getState()
      expect(newState.role).toBe('Resident')
    })

    it('should keep role when keepRole is true', () => {
      const store = usePlanRightStore.getState()

      // Set role to Builder
      store.setRole('Builder')

      // Reset all keeping role
      store.resetAll(true)

      // Check that role is preserved
      const newState = usePlanRightStore.getState()
      expect(newState.role).toBe('Builder')
    })
  })

  describe('reset_step_clears_only_step_fields', () => {
    it('should clear only property fields when resetting property step', () => {
      const store = usePlanRightStore.getState()

      // Modify fields from different steps
      store.setField('property.zone_text', 'R3')
      store.setField('property.lot_size_m2', '1000')
      store.setField('structure.type', 'carport')
      store.setField('dimensions.length_m', '10')
      store.setField('location.setback_front_m', '6')

      // Reset only property step
      store.resetStep('property')

      // Check that only property fields are reset
      const newState = usePlanRightStore.getState()
      expect(newState.proposal.property.zone_text).toBe('R1') // Reset to initial
      expect(newState.proposal.property.lot_size_m2).toBe('') // Reset to initial
      expect(newState.proposal.structure.type).toBe('carport') // Unchanged
      expect(newState.proposal.dimensions.length_m).toBe('10') // Unchanged
      expect(newState.proposal.location.setback_front_m).toBe('6') // Unchanged
    })

    it('should clear only structure fields when resetting structure step', () => {
      const store = usePlanRightStore.getState()

      // Modify fields from different steps
      store.setField('property.zone_text', 'R3')
      store.setField('structure.type', 'carport')
      store.setField('dimensions.length_m', '10')

      // Reset only structure step
      store.resetStep('structure')

      // Check that only structure fields are reset
      const newState = usePlanRightStore.getState()
      expect(newState.proposal.property.zone_text).toBe('R3') // Unchanged
      expect(newState.proposal.structure.type).toBe('shed') // Reset to initial
      expect(newState.proposal.dimensions.length_m).toBe('10') // Unchanged
    })

    it('should clear only dimensions fields when resetting dimensions step', () => {
      const store = usePlanRightStore.getState()

      // Modify fields from different steps
      store.setField('property.zone_text', 'R3')
      store.setField('dimensions.length_m', '10')
      store.setField('dimensions.width_m', '5')
      store.setField('location.setback_front_m', '6')

      // Reset only dimensions step
      store.resetStep('dimensions')

      // Check that only dimensions fields are reset
      const newState = usePlanRightStore.getState()
      expect(newState.proposal.property.zone_text).toBe('R3') // Unchanged
      expect(newState.proposal.dimensions.length_m).toBe('') // Reset to initial
      expect(newState.proposal.dimensions.width_m).toBe('') // Reset to initial
      expect(newState.proposal.location.setback_front_m).toBe('6') // Unchanged
    })
  })

  describe('undo_reset_restores_snapshot', () => {
    it('should restore previous state when undoing reset', () => {
      const store = usePlanRightStore.getState()

      // Modify some fields
      store.setField('property.zone_text', 'R3')
      store.setField('property.lot_size_m2', '1000')
      store.setField('structure.type', 'carport')

      // Set an assessment
      const mockAssessment = {
        decision: 'Likely Exempt',
        checks: [],
        notes: [],
      }
      store.setAssessment(mockAssessment)

      // Take snapshot
      store.takeSnapshot()

      // Reset all
      store.resetAll()

      // Verify reset worked
      let newState = usePlanRightStore.getState()
      expect(newState.proposal.property.zone_text).toBe('R1')
      expect(newState.lastAssessment).toBeUndefined()

      // Undo reset
      store.undoReset()

      // Check that previous state is restored
      newState = usePlanRightStore.getState()
      expect(newState.proposal.property.zone_text).toBe('R3')
      expect(newState.proposal.property.lot_size_m2).toBe('1000')
      expect(newState.proposal.structure.type).toBe('carport')
      expect(newState.lastAssessment).toEqual(mockAssessment)
      expect(newState.undoSnapshot).toBeNull()
    })

    it('should do nothing if no snapshot exists', () => {
      const store = usePlanRightStore.getState()

      // Modify some fields
      store.setField('property.zone_text', 'R3')

      // Try to undo without taking snapshot
      store.undoReset()

      // Check that nothing changed
      const newState = usePlanRightStore.getState()
      expect(newState.proposal.property.zone_text).toBe('R3')
    })
  })

  describe('snapshot_functionality', () => {
    it('should create deep copy of current state', () => {
      const store = usePlanRightStore.getState()

      // Modify some fields
      store.setField('property.zone_text', 'R3')
      store.setField('property.lot_size_m2', '1000')

      // Set an assessment
      const mockAssessment = {
        decision: 'Likely Exempt',
        checks: [],
        notes: [],
      }
      store.setAssessment(mockAssessment)

      // Take snapshot
      store.takeSnapshot()

      // Modify fields again
      store.setField('property.zone_text', 'R2')
      store.setField('property.lot_size_m2', '500')

      // Check that snapshot preserved original values
      const state = usePlanRightStore.getState()
      expect(state.undoSnapshot).not.toBeNull()
      expect(state.undoSnapshot?.proposal.property.zone_text).toBe('R3')
      expect(state.undoSnapshot?.proposal.property.lot_size_m2).toBe('1000')
      expect(state.undoSnapshot?.lastAssessment).toEqual(mockAssessment)
    })
  })
})
