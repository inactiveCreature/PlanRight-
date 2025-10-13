import { describe, it, expect, beforeEach } from 'vitest'
import { usePlanRightStore } from '../store'

describe('BBL vs Front Setback Logic', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    usePlanRightStore.setState({
      role: 'Resident',
      proposal: {
        property: { id: '', lot_size_m2: '', zone_text: '', frontage_m: '', corner_lot_bool: false, easement_bool: false },
        structure: { type: 'shed' },
        dimensions: { length_m: '', width_m: '', height_m: '', area_m2: '' },
        location: { setback_front_m: '', setback_side_m: '', setback_rear_m: '', behind_building_line_bool: false },
        siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
        context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
      },
      lastAssessment: undefined,
    })
  })

  it('should require front setback when NOT behind building line', () => {
    const store = usePlanRightStore.getState()
    
    // Default: behind_building_line_bool = false
    expect(store.proposal.location.behind_building_line_bool).toBe(false)
    
    // Should require front setback
    const errors = store.getValidationErrors()
    expect(errors['location.setback_front_m']).toBeDefined()
    expect(errors['location.setback_front_m']).toContain('Please enter the front setback distance')
  })

  it('should NOT require front setback when behind building line', () => {
    const store = usePlanRightStore.getState()
    
    // Set behind building line to true
    store.setField('location.behind_building_line_bool', true)
    expect(store.proposal.location.behind_building_line_bool).toBe(true)
    
    // Should NOT require front setback
    const errors = store.getValidationErrors()
    expect(errors['location.setback_front_m']).toBeUndefined()
  })

  it('should validate front setback minimum when NOT behind building line', () => {
    const store = usePlanRightStore.getState()
    
    // Set a front setback that's too small
    store.setField('location.setback_front_m', '3.0')
    
    const errors = store.getValidationErrors()
    expect(errors['location.setback_front_m']).toBeDefined()
    expect(errors['location.setback_front_m']).toContain('must be ≥ 5m')
  })

  it('should accept valid front setback when NOT behind building line', () => {
    const store = usePlanRightStore.getState()
    
    // Set a valid front setback
    store.setField('location.setback_front_m', '6.0')
    
    const errors = store.getValidationErrors()
    expect(errors['location.setback_front_m']).toBeUndefined()
  })

  it('should ignore front setback validation when behind building line', () => {
    const store = usePlanRightStore.getState()
    
    // Set behind building line to true
    store.setField('location.behind_building_line_bool', true)
    
    // Set an invalid front setback (should be ignored)
    store.setField('location.setback_front_m', '1.0')
    
    const errors = store.getValidationErrors()
    expect(errors['location.setback_front_m']).toBeUndefined()
  })

  it('should toggle front setback requirement when BBL changes', () => {
    const store = usePlanRightStore.getState()
    
    // Initially NOT behind building line - should require front setback
    expect(store.proposal.location.behind_building_line_bool).toBe(false)
    let errors = store.getValidationErrors()
    expect(errors['location.setback_front_m']).toBeDefined()
    
    // Toggle to behind building line - should NOT require front setback
    store.setField('location.behind_building_line_bool', true)
    errors = store.getValidationErrors()
    expect(errors['location.setback_front_m']).toBeUndefined()
    
    // Toggle back to NOT behind building line - should require front setback again
    store.setField('location.behind_building_line_bool', false)
    errors = store.getValidationErrors()
    expect(errors['location.setback_front_m']).toBeDefined()
  })

  it('should validate location step completion based on BBL logic', () => {
    const store = usePlanRightStore.getState()
    
    // Set up valid side and rear setbacks
    store.setField('location.setback_side_m', '0.9')
    store.setField('location.setback_rear_m', '0.9')
    
    // When NOT behind building line, front setback is required
    store.setField('location.behind_building_line_bool', false)
    expect(store.isStepComplete('location')).toBe(false) // Missing front setback
    
    store.setField('location.setback_front_m', '5.0')
    expect(store.isStepComplete('location')).toBe(true) // All setbacks valid
    
    // When behind building line, front setback is not required
    store.setField('location.behind_building_line_bool', true)
    store.setField('location.setback_front_m', '') // Clear front setback
    expect(store.isStepComplete('location')).toBe(true) // Still complete without front setback
  })
})
