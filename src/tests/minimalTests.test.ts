/**
 * Minimal Tests - Essential guardrails against regressions
 * Tests critical functionality that must not break
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { run_rules_assessment } from '../rules/engine'
import { assess } from '../assessment/assess'
import { usePlanRightStore } from '../store'
import { parseNumber } from '../utils/numberUtils'
import type { Proposal, StructureType } from '../types'

describe('Minimal Tests - Regression Guardrails', () => {
  beforeEach(() => {
    // Reset store to clean state before each test
    usePlanRightStore.getState().resetProposal()
  })

  describe('blocks_on_easement', () => {
    it('should return decision Not Exempt when structure is on easement; G-SITING-1 false', () => {
      const proposal: Proposal = {
        property: {
          id: 'test-property',
          lot_size_m2: '500',
          zone_text: 'R1',
          frontage_m: '20',
          corner_lot_bool: false,
          easement_bool: true,
        },
        structure: {
          type: 'shed' as StructureType,
        },
        dimensions: {
          length_m: '4',
          width_m: '4',
          height_m: '2.5',
          area_m2: '16',
        },
        location: {
          setback_front_m: '5',
          setback_side_m: '1',
          setback_rear_m: '1',
          behind_building_line_bool: true,
        },
        siting: {
          on_easement_bool: true, // This should trigger G-SITING-1 failure
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

      const result = run_rules_assessment(proposal)

      // Should be Not Exempt due to easement
      expect(result.decision).toBe('Likely Not Exempt')

      // G-SITING-1 should fail (killer rule)
      const sitingCheck = result.checks.find((check) => check.rule_id === 'G-SITING-1')
      expect(sitingCheck).toBeDefined()
      expect(sitingCheck?.pass).toBe(false)
      expect(sitingCheck?.killer).toBe(true)
    })
  })

  describe('bbl_front_logic', () => {
    it('should skip S-FRONT-1 when BBL=true', () => {
      const store = usePlanRightStore.getState()

      // Set up proposal with BBL=true (no front setback required)
      store.setField('property.zone_text', 'R1')
      store.setField('property.lot_size_m2', '500')
      store.setField('structure.type', 'shed')
      store.setField('dimensions.height_m', '2.5')
      store.setField('dimensions.length_m', '4')
      store.setField('dimensions.width_m', '4')
      store.setField('dimensions.area_m2', '16')
      store.setField('location.setback_front_m', '5') // Provide valid value for schema validation
      store.setField('location.setback_side_m', '1')
      store.setField('location.setback_rear_m', '1')
      store.setField('location.behind_building_line_bool', true) // Behind building line
      store.setField('siting.on_easement_bool', false)
      store.setField('siting.over_sewer_bool', false)
      store.setField('siting.attached_to_dwelling_bool', false)
      store.setField('context.heritage_item_bool', false)
      store.setField('context.conservation_area_bool', false)
      store.setField('context.flood_prone_bool', false)
      store.setField('context.bushfire_bool', false)

      const result = assess()

      // Should be Likely Exempt
      expect(result.decision).toBe('Likely Exempt')

      // S-FRONT-1 should not be present or should pass (not required when BBL=true)
      const frontCheck = result.checks.find((check) => check.rule_id === 'S-FRONT-1')
      if (frontCheck) {
        expect(frontCheck.pass).toBe(true)
      }
    })

    it('should fail S-FRONT-1 when BBL=false with too-small front setback', () => {
      const store = usePlanRightStore.getState()

      // Set up proposal with BBL=false and insufficient front setback
      store.setField('property.zone_text', 'R1')
      store.setField('property.lot_size_m2', '500')
      store.setField('structure.type', 'shed')
      store.setField('dimensions.height_m', '2.5')
      store.setField('dimensions.length_m', '4')
      store.setField('dimensions.width_m', '4')
      store.setField('dimensions.area_m2', '16')
      store.setField('location.setback_front_m', '3') // Too small for R1 (needs 5m)
      store.setField('location.setback_side_m', '1')
      store.setField('location.setback_rear_m', '1')
      store.setField('location.behind_building_line_bool', false) // Not behind building line
      store.setField('siting.on_easement_bool', false)
      store.setField('siting.over_sewer_bool', false)
      store.setField('siting.attached_to_dwelling_bool', false)
      store.setField('context.heritage_item_bool', false)
      store.setField('context.conservation_area_bool', false)
      store.setField('context.flood_prone_bool', false)
      store.setField('context.bushfire_bool', false)

      const result = assess()

      // Should be Not Exempt due to insufficient front setback
      expect(result.decision).toBe('Likely Not Exempt')

      // S-FRONT-1 should fail
      const frontCheck = result.checks.find((check) => check.rule_id === 'S-FRONT-1')
      expect(frontCheck).toBeDefined()
      expect(frontCheck?.pass).toBe(false)
    })
  })

  describe('decimals_ok', () => {
    it('should persist 0.9 end-to-end through parsing, store, and assessment', () => {
      // Test parseNumber utility
      const parsed = parseNumber('0.9')
      expect(parsed).toBe(0.9)

      // Test store integration
      const store = usePlanRightStore.getState()
      store.setField('dimensions.height_m', 0.9)
      expect(store.proposal.dimensions.height_m).toBe(0.9)

      // Test with string input
      store.setField('dimensions.height_m', '0.9')
      expect(Number(store.proposal.dimensions.height_m)).toBe(0.9)

      // Test end-to-end assessment
      store.setField('property.zone_text', 'R1')
      store.setField('property.lot_size_m2', '500')
      store.setField('structure.type', 'shed')
      store.setField('dimensions.length_m', '3')
      store.setField('dimensions.width_m', '3')
      store.setField('dimensions.area_m2', '9')
      store.setField('location.setback_front_m', '5')
      store.setField('location.setback_side_m', '1')
      store.setField('location.setback_rear_m', '1')
      store.setField('location.behind_building_line_bool', true)
      store.setField('siting.on_easement_bool', false)
      store.setField('siting.over_sewer_bool', false)
      store.setField('siting.attached_to_dwelling_bool', false)
      store.setField('context.heritage_item_bool', false)
      store.setField('context.conservation_area_bool', false)
      store.setField('context.flood_prone_bool', false)
      store.setField('context.bushfire_bool', false)

      const result = assess()

      // Should succeed with 0.9 height
      expect(result.decision).not.toBe('Cannot assess')

      // Height should still be 0.9 in the final proposal
      expect(Number(store.proposal.dimensions.height_m)).toBe(0.9)
    })
  })

  describe('zone_binding', () => {
    it('should update store and thresholds when zone changes to R2', () => {
      const store = usePlanRightStore.getState()

      // Set up a basic proposal
      store.setField('property.zone_text', 'R1')
      store.setField('property.lot_size_m2', '500')
      store.setField('structure.type', 'shed')
      store.setField('dimensions.height_m', '3.0')
      store.setField('dimensions.length_m', '4')
      store.setField('dimensions.width_m', '4')
      store.setField('dimensions.area_m2', '16')
      store.setField('location.setback_front_m', '5')
      store.setField('location.setback_side_m', '1')
      store.setField('location.setback_rear_m', '1')
      store.setField('location.behind_building_line_bool', false)
      store.setField('siting.on_easement_bool', false)
      store.setField('siting.over_sewer_bool', false)
      store.setField('siting.attached_to_dwelling_bool', false)
      store.setField('context.heritage_item_bool', false)
      store.setField('context.conservation_area_bool', false)
      store.setField('context.flood_prone_bool', false)
      store.setField('context.bushfire_bool', false)

      // Change zone to R2
      store.setField('property.zone_text', 'R2')
      expect(store.proposal.property.zone_text).toBe('R2')

      // Run assessment - should use R2 thresholds
      const result = assess()

      // Should succeed (R2 has same thresholds as R1 for shed)
      expect(result.decision).not.toBe('Cannot assess')

      // Verify the assessment used R2 zone
      const proposal = store.proposal
      expect(proposal.property.zone_text).toBe('R2')

      // Test that thresholds are applied correctly
      // R2 shed should have same limits as R1: heightMax=3.0, areaMax=20, frontMin=5
      const heightCheck = result.checks.find((check) => check.rule_id === 'S-HEIGHT-1')
      if (heightCheck) {
        expect(heightCheck.pass).toBe(true) // 3.0 <= 3.0
      }

      const areaCheck = result.checks.find((check) => check.rule_id === 'S-AREA-1')
      if (areaCheck) {
        expect(areaCheck.pass).toBe(true) // 16 <= 20
      }
    })
  })
})
