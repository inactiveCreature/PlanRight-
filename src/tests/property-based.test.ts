import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { run_rules_assessment } from '../rules/engine'
import type { Proposal, StructureType } from '../types'

/**
 * Property-based tests using fast-check to ensure robustness
 * Tests invariants and edge cases that might be missed by specific test cases
 */

describe('Property-Based Tests for Rules Engine', () => {
  
  // Arbitrary generators for proposal components
  const zoneArbitrary = fc.constantFrom('R1', 'R2', 'R3', 'R4', 'R5', 'RU1', 'RU2', 'RU3', 'RU4', 'RU5', 'RU6')
  const structureTypeArbitrary = fc.constantFrom('shed', 'patio', 'carport')
  const lotSizeArbitrary = fc.float({ min: 100, max: 2000 })
  const dimensionArbitrary = fc.float({ min: 0.1, max: 20 })
  const setbackArbitrary = fc.float({ min: 0, max: 20 })
  const booleanArbitrary = fc.boolean()

  const proposalArbitrary: fc.Arbitrary<Proposal> = fc.record({
    property: fc.record({
      id: fc.string(),
      lot_size_m2: lotSizeArbitrary,
      zone_text: zoneArbitrary,
      frontage_m: fc.float({ min: 5, max: 50 }),
      corner_lot_bool: booleanArbitrary,
      easement_bool: booleanArbitrary,
    }),
    structure: fc.record({
      type: structureTypeArbitrary,
    }),
    dimensions: fc.record({
      length_m: dimensionArbitrary,
      width_m: dimensionArbitrary,
      height_m: fc.float({ min: 0.1, max: 10 }),
      area_m2: fc.float({ min: 0.1, max: 100 }),
    }),
    location: fc.record({
      setback_front_m: setbackArbitrary,
      setback_side_m: setbackArbitrary,
      setback_rear_m: setbackArbitrary,
      behind_building_line_bool: booleanArbitrary,
    }),
    siting: fc.record({
      on_easement_bool: booleanArbitrary,
      over_sewer_bool: booleanArbitrary,
      attached_to_dwelling_bool: booleanArbitrary,
    }),
    context: fc.record({
      heritage_item_bool: booleanArbitrary,
      conservation_area_bool: booleanArbitrary,
      flood_prone_bool: booleanArbitrary,
      bushfire_bool: booleanArbitrary,
    }),
  })

  describe('Determinism Properties', () => {
    
    it('should produce identical results for identical inputs', () => {
      fc.assert(fc.property(proposalArbitrary, (proposal) => {
        const result1 = run_rules_assessment(proposal)
        const result2 = run_rules_assessment(proposal)
        
        expect(result1.decision).toBe(result2.decision)
        expect(result1.checks.length).toBe(result2.checks.length)
        expect(result1.errors.length).toBe(result2.errors.length)
        
        // Deep equality check
        expect(result1).toEqual(result2)
      }))
    })

    it('should not use non-deterministic sources (no Date.now, Math.random, etc.)', () => {
      fc.assert(fc.property(proposalArbitrary, (proposal) => {
        const result1 = run_rules_assessment(proposal)
        
        // Run multiple times to ensure no randomness
        for (let i = 0; i < 5; i++) {
          const result2 = run_rules_assessment(proposal)
          expect(result1).toEqual(result2)
        }
      }))
    })
  })

  describe('Zone Classification Properties', () => {
    
    it('should treat R5 as rural (5m setbacks, larger area caps)', () => {
      fc.assert(fc.property(
        fc.record({
          lotSize: fc.float({ min: 200, max: 1000 }),
          area: fc.float({ min: 20, max: 50 }),
          sideSetback: fc.float({ min: 4.9, max: 6 }),
          rearSetback: fc.float({ min: 4.9, max: 6 }),
        }),
        ({ lotSize, area, sideSetback, rearSetback }) => {
          const proposal: Proposal = {
            property: { id: 'X', lot_size_m2: lotSize, zone_text: 'R5', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
            structure: { type: 'shed' },
            dimensions: { length_m: 5, width_m: 4, height_m: 2.8, area_m2: area },
            location: { setback_front_m: 6, setback_side_m: sideSetback, setback_rear_m: rearSetback, behind_building_line_bool: true },
            siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
            context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
          }
          
          const result = run_rules_assessment(proposal)
          
          if (area <= 50 && sideSetback >= 5.0 && rearSetback >= 5.0) {
            expect(result.decision).toBe('Likely Exempt')
          } else {
            expect(result.decision).toBe('Likely Not Exempt')
          }
        }
      ))
    })

    it('should treat RU zones as rural (5m setbacks, larger area caps)', () => {
      fc.assert(fc.property(
        fc.record({
          zone: fc.constantFrom('RU1', 'RU2', 'RU3', 'RU4', 'RU5', 'RU6'),
          lotSize: fc.float({ min: 200, max: 1000 }),
          area: fc.float({ min: 20, max: 50 }),
          sideSetback: fc.float({ min: 4.9, max: 6 }),
          rearSetback: fc.float({ min: 4.9, max: 6 }),
        }),
        ({ zone, lotSize, area, sideSetback, rearSetback }) => {
          const proposal: Proposal = {
            property: { id: 'X', lot_size_m2: lotSize, zone_text: zone, frontage_m: 10, corner_lot_bool: false, easement_bool: false },
            structure: { type: 'shed' },
            dimensions: { length_m: 5, width_m: 4, height_m: 2.8, area_m2: area },
            location: { setback_front_m: 6, setback_side_m: sideSetback, setback_rear_m: rearSetback, behind_building_line_bool: true },
            siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
            context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
          }
          
          const result = run_rules_assessment(proposal)
          
          if (area <= 50 && sideSetback >= 5.0 && rearSetback >= 5.0) {
            expect(result.decision).toBe('Likely Exempt')
          } else {
            expect(result.decision).toBe('Likely Not Exempt')
          }
        }
      ))
    })

    it('should treat R1-R4 as residential (0.9m setbacks, smaller area caps)', () => {
      fc.assert(fc.property(
        fc.record({
          zone: fc.constantFrom('R1', 'R2', 'R3', 'R4'),
          lotSize: fc.float({ min: 200, max: 1000 }),
          area: fc.float({ min: 15, max: 25 }),
          sideSetback: fc.float({ min: 0.8, max: 1.2 }),
          rearSetback: fc.float({ min: 0.8, max: 1.2 }),
        }),
        ({ zone, lotSize, area, sideSetback, rearSetback }) => {
          const proposal: Proposal = {
            property: { id: 'X', lot_size_m2: lotSize, zone_text: zone, frontage_m: 10, corner_lot_bool: false, easement_bool: false },
            structure: { type: 'shed' },
            dimensions: { length_m: 5, width_m: 4, height_m: 2.8, area_m2: area },
            location: { setback_front_m: 1, setback_side_m: sideSetback, setback_rear_m: rearSetback, behind_building_line_bool: true },
            siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
            context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
          }
          
          const result = run_rules_assessment(proposal)
          
          if (area <= 20 && sideSetback >= 0.9 && rearSetback >= 0.9) {
            expect(result.decision).toBe('Likely Exempt')
          } else {
            expect(result.decision).toBe('Likely Not Exempt')
          }
        }
      ))
    })
  })

  describe('Carport Lot Size Logic Properties', () => {
    
    it('should adjust carport area limits based on lot size', () => {
      fc.assert(fc.property(
        fc.record({
          zone: fc.constantFrom('R1', 'R2', 'R3', 'R4', 'R5', 'RU1', 'RU2', 'RU3', 'RU4', 'RU5', 'RU6'),
          lotSize: fc.float({ min: 200, max: 500 }),
          area: fc.float({ min: 15, max: 30 }),
        }),
        ({ zone, lotSize, area }) => {
          const proposal: Proposal = {
            property: { id: 'X', lot_size_m2: lotSize, zone_text: zone, frontage_m: 10, corner_lot_bool: false, easement_bool: false },
            structure: { type: 'carport' },
            dimensions: { length_m: 5, width_m: 4, height_m: 2.8, area_m2: area },
            location: { setback_front_m: 1, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
            siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
            context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
          }
          
          const result = run_rules_assessment(proposal)
          const areaCheck = result.checks.find(c => c.rule_id === 'C-AREA-1')
          
          if (areaCheck) {
            const isRural = zone.startsWith('RU') || zone === 'R5'
            const expectedMaxArea = lotSize > 300 ? (isRural ? 50 : 25) : 20
            
            if (area <= expectedMaxArea) {
              expect(areaCheck.pass).toBe(true)
            } else {
              expect(areaCheck.pass).toBe(false)
            }
          }
        }
      ))
    })
  })

  describe('Floating Point Precision Properties', () => {
    
    it('should handle floating point precision correctly at thresholds', () => {
      fc.assert(fc.property(
        fc.record({
          height: fc.float({ min: 2.99, max: 3.01 }),
          area: fc.float({ min: 19.9, max: 20.1 }),
          sideSetback: fc.float({ min: 0.89, max: 0.91 }),
        }),
        ({ height, area, sideSetback }) => {
          const proposal: Proposal = {
            property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
            structure: { type: 'shed' },
            dimensions: { length_m: 5, width_m: 4, height_m: height, area_m2: area },
            location: { setback_front_m: 1, setback_side_m: sideSetback, setback_rear_m: 1, behind_building_line_bool: true },
            siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
            context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
          }
          
          const result = run_rules_assessment(proposal)
          
          const heightCheck = result.checks.find(c => c.rule_id === 'S-HEIGHT-1')
          const areaCheck = result.checks.find(c => c.rule_id === 'S-AREA-1')
          const sideCheck = result.checks.find(c => c.rule_id === 'S-SIDE-1')
          
          if (heightCheck) {
            expect(heightCheck.pass).toBe(height <= 3.0)
          }
          if (areaCheck) {
            expect(areaCheck.pass).toBe(area <= 20.0)
          }
          if (sideCheck) {
            expect(sideCheck.pass).toBe(sideSetback >= 0.9)
          }
        }
      ))
    })
  })

  describe('Behind Building Line Logic Properties', () => {
    
    it('should fail BBL rules when behind_building_line_bool is false in residential zones', () => {
      fc.assert(fc.property(
        fc.record({
          zone: fc.constantFrom('R1', 'R2', 'R3', 'R4'),
          frontSetback: fc.float({ min: 0, max: 10 }),
        }),
        ({ zone, frontSetback }) => {
          const proposal: Proposal = {
            property: { id: 'X', lot_size_m2: 400, zone_text: zone, frontage_m: 10, corner_lot_bool: false, easement_bool: false },
            structure: { type: 'shed' },
            dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
            location: { setback_front_m: frontSetback, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: false },
            siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
            context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
          }
          
          const result = run_rules_assessment(proposal)
          const bblCheck = result.checks.find(c => c.rule_id === 'S-BBL-1')
          
          expect(bblCheck?.pass).toBe(false)
        }
      ))
    })
  })

  describe('Killer Rule Properties', () => {
    
    it('should fail with killer rules when heritage/conservation flags are true', () => {
      fc.assert(fc.property(
        fc.record({
          heritage: booleanArbitrary,
          conservation: booleanArbitrary,
        }),
        ({ heritage, conservation }) => {
          const proposal: Proposal = {
            property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
            structure: { type: 'shed' },
            dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
            location: { setback_front_m: 1, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
            siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
            context: { heritage_item_bool: heritage, conservation_area_bool: conservation, flood_prone_bool: false, bushfire_bool: false },
          }
          
          const result = run_rules_assessment(proposal)
          const heritageCheck = result.checks.find(c => c.rule_id === 'G-HERITAGE-1')
          
          if (heritage || conservation) {
            expect(result.decision).toBe('Likely Not Exempt')
            expect(heritageCheck?.pass).toBe(false)
            expect(heritageCheck?.killer).toBe(true)
          } else {
            expect(heritageCheck?.pass).toBe(true)
          }
        }
      ))
    })

    it('should fail with killer rules when on easement', () => {
      fc.assert(fc.property(
        fc.record({
          onEasement: booleanArbitrary,
        }),
        ({ onEasement }) => {
          const proposal: Proposal = {
            property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
            structure: { type: 'shed' },
            dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
            location: { setback_front_m: 1, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
            siting: { on_easement_bool: onEasement, over_sewer_bool: false, attached_to_dwelling_bool: false },
            context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
          }
          
          const result = run_rules_assessment(proposal)
          const sitingCheck = result.checks.find(c => c.rule_id === 'G-SITING-1')
          
          if (onEasement) {
            expect(result.decision).toBe('Likely Not Exempt')
            expect(sitingCheck?.pass).toBe(false)
            expect(sitingCheck?.killer).toBe(true)
          } else {
            expect(sitingCheck?.pass).toBe(true)
          }
        }
      ))
    })
  })

  describe('Complete Rule Evaluation Properties', () => {
    
    it('should evaluate all applicable rules regardless of early failures', () => {
      fc.assert(fc.property(proposalArbitrary, (proposal) => {
        const result = run_rules_assessment(proposal)
        
        // Count expected rules based on structure type
        const structureType = proposal.structure.type
        const expectedGeneralRules = 4 // G-AREA-1, G-SITING-1, G-HERITAGE-1, G-EASEMENT-1
        const expectedStructureRules = structureType === 'shed' ? 10 : structureType === 'patio' ? 8 : 9
        
        const totalExpectedRules = expectedGeneralRules + expectedStructureRules
        expect(result.checks.length).toBe(totalExpectedRules)
        
        // Verify all checks have required fields
        result.checks.forEach(check => {
          expect(check.rule_id).toBeDefined()
          expect(check.clause_ref).toBeDefined()
          expect(typeof check.pass).toBe('boolean')
          expect(check.note).toBeDefined()
        })
      }))
    })

    it('should return Cannot assess for invalid inputs', () => {
      fc.assert(fc.property(
        fc.record({
          zone: fc.string({ minLength: 1, maxLength: 20 }),
          height: fc.float({ min: -10, max: 10 }),
          area: fc.float({ min: -10, max: 10 }),
        }),
        ({ zone, height, area }) => {
          // Create invalid proposals
          const invalidProposals = [
            // Invalid zone
            {
              property: { id: 'X', lot_size_m2: 400, zone_text: zone, frontage_m: 10, corner_lot_bool: false, easement_bool: false },
              structure: { type: 'shed' as StructureType },
              dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
              location: { setback_front_m: 1, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
              siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
              context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
            },
            // Invalid height
            {
              property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
              structure: { type: 'shed' as StructureType },
              dimensions: { length_m: 4, width_m: 4, height_m: height, area_m2: 16 },
              location: { setback_front_m: 1, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
              siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
              context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
            },
            // Invalid area
            {
              property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
              structure: { type: 'shed' as StructureType },
              dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: area },
              location: { setback_front_m: 1, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
              siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
              context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
            }
          ]
          
          invalidProposals.forEach(proposal => {
            const result = run_rules_assessment(proposal)
            
            // Check if any validation should trigger Cannot assess
            const hasInvalidZone = !['R1', 'R2', 'R3', 'R4', 'R5', 'RU1', 'RU2', 'RU3', 'RU4', 'RU5', 'RU6'].includes(zone)
            const hasInvalidHeight = height <= 0
            const hasInvalidArea = area <= 0
            
            if (hasInvalidZone || hasInvalidHeight || hasInvalidArea) {
              expect(result.decision).toBe('Cannot assess')
              expect(result.errors.length).toBeGreaterThan(0)
            }
          })
        }
      ))
    })
  })
})
