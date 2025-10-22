import { describe, it, expect, beforeEach } from 'vitest'
import { assess, isProposalReady, getProposalValidationErrors } from '../assessment/assess'
import { usePlanRightStore } from '../store'

describe('Unified Assessment Pipeline', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    usePlanRightStore.setState({
      role: 'Resident',
      proposal: {
        property: {
          id: '',
          lot_size_m2: '',
          zone_text: '',
          frontage_m: '',
          corner_lot_bool: false,
          easement_bool: false,
        },
        structure: { type: 'shed' },
        dimensions: { length_m: '', width_m: '', height_m: '', area_m2: '' },
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
      },
      lastAssessment: undefined,
    })
  })

  it('should return "Cannot assess" for incomplete proposal', () => {
    const result = assess()
    expect(result.decision).toBe('Cannot assess')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should validate proposal readiness correctly', () => {
    // Empty proposal should not be ready
    expect(isProposalReady()).toBe(false)

    // Set required fields
    usePlanRightStore.getState().setField('property.zone_text', 'R2')
    usePlanRightStore.getState().setField('property.lot_size_m2', '450')
    usePlanRightStore.getState().setField('structure.type', 'shed')
    usePlanRightStore.getState().setField('dimensions.height_m', '2.4')
    usePlanRightStore.getState().setField('location.setback_front_m', '5')
    usePlanRightStore.getState().setField('location.setback_side_m', '0.9')
    usePlanRightStore.getState().setField('location.setback_rear_m', '0.9')

    expect(isProposalReady()).toBe(true)
  })

  it('should produce identical results for multiple calls', () => {
    // Set up a valid proposal
    usePlanRightStore.getState().setField('property.zone_text', 'R2')
    usePlanRightStore.getState().setField('property.lot_size_m2', '450')
    usePlanRightStore.getState().setField('structure.type', 'shed')
    usePlanRightStore.getState().setField('dimensions.height_m', '2.4')
    usePlanRightStore.getState().setField('dimensions.area_m2', '9')
    usePlanRightStore.getState().setField('location.setback_front_m', '5')
    usePlanRightStore.getState().setField('location.setback_side_m', '0.9')
    usePlanRightStore.getState().setField('location.setback_rear_m', '0.9')
    usePlanRightStore.getState().setField('location.behind_building_line_bool', true)

    // First assessment (simulating Review button)
    const result1 = assess()

    // Second assessment (simulating chat "run rules")
    const result2 = assess()

    // Results should be identical
    expect(result1.decision).toBe(result2.decision)
    expect(result1.checks.length).toBe(result2.checks.length)
    expect(result1.errors.length).toBe(result2.errors.length)
  })

  it('should store assessment result in store', () => {
    // Set up a valid proposal
    usePlanRightStore.getState().setField('property.zone_text', 'R2')
    usePlanRightStore.getState().setField('property.lot_size_m2', '450')
    usePlanRightStore.getState().setField('structure.type', 'shed')
    usePlanRightStore.getState().setField('dimensions.height_m', '2.4')
    usePlanRightStore.getState().setField('dimensions.area_m2', '9')
    usePlanRightStore.getState().setField('location.setback_front_m', '5')
    usePlanRightStore.getState().setField('location.setback_side_m', '0.9')
    usePlanRightStore.getState().setField('location.setback_rear_m', '0.9')
    usePlanRightStore.getState().setField('location.behind_building_line_bool', true)

    const result = assess()
    const storedResult = usePlanRightStore.getState().lastAssessment

    expect(storedResult).toBeDefined()
    expect(storedResult?.decision).toBe(result.decision)
    expect(storedResult?.checks.length).toBe(result.checks.length)
  })

  it('should validate non-negative numbers correctly', () => {
    // Test negative numbers should fail validation
    usePlanRightStore.getState().setField('property.lot_size_m2', '-100')

    const errors = getProposalValidationErrors()
    expect(errors['property.lot_size_m2']).toContain('non-negative')
  })
})
