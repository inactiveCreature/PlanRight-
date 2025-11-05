/**
 * Comprehensive test suite for SEPP Part 2 setbacks and building line rules
 * Tests all critical scenarios as specified in requirements
 */
import { describe, it, expect } from 'vitest'
import { run_rules_assessment } from '../engine'
import type { Proposal, StructureType } from '../../types'

describe('SEPP Part 2 - Setbacks and Building Line Rules', () => {
  // Helper to create base proposal
  const createBaseProposal = (overrides: Partial<Proposal> = {}): Proposal => ({
    property: {
      id: 'test',
      lot_size_m2: 450,
      zone_text: 'R2',
      frontage_m: 12,
      corner_lot_bool: false,
      easement_bool: false,
      ...overrides.property,
    },
    structure: {
      type: 'shed' as StructureType,
      ...overrides.structure,
    },
    dimensions: {
      length_m: 3.0,
      width_m: 2.4,
      height_m: 2.4,
      area_m2: 7.2,
      ...overrides.dimensions,
    },
    location: {
      setback_front_m: undefined, // Behind building line (no front setback)
      setback_side_m: 0.9,
      setback_rear_m: 0.9,
      ...overrides.location,
    },
    siting: {
      on_easement_bool: false,
      over_sewer_bool: false,
      attached_to_dwelling_bool: false,
      ...overrides.siting,
    },
    context: {
      heritage_item_bool: false,
      conservation_area_bool: false,
      flood_prone_bool: false,
      bushfire_bool: false,
      ...overrides.context,
    },
  })

  describe('Shed Rules', () => {
    it('Shed, R2 zone, 20 m², h=2.6, side=0.9, rear=0.9, behind_line (no front setback) → Exempt (S-2,S-3,S-4,S-5 pass)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'shed' },
        property: { zone_text: 'R2', lot_size_m2: 450 },
        dimensions: {
          length_m: 4,
          width_m: 5,
          height_m: 2.6,
          area_m2: 20,
        },
        location: {
          setback_front_m: undefined, // Behind building line (no front setback)
          setback_side_m: 0.9,
          setback_rear_m: 0.9,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Exempt')
      expect(result.errors.length).toBe(0)

      // Verify key checks pass
      const s2 = result.checks.find((c) => c.rule_id === 'S-2')
      const s3 = result.checks.find((c) => c.rule_id === 'S-3')
      const s4 = result.checks.find((c) => c.rule_id === 'S-4')
      const s5 = result.checks.find((c) => c.rule_id === 'S-5')

      expect(s2?.pass).toBe(true)
      expect(s3?.pass).toBe(true)
      expect(s4?.pass).toBe(true)
      expect(s5?.pass).toBe(true)
    })

    it('Shed, R2, 22 m², h=3.2 → Not Exempt (S-3 fail height 3.2>3.0)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'shed' },
        property: { zone_text: 'R2', lot_size_m2: 450 },
        dimensions: {
          length_m: 4,
          width_m: 5.5,
          height_m: 3.2,
          area_m2: 22,
        },
        location: {
          setback_front_m: undefined, // Behind building line
          setback_side_m: 0.9,
          setback_rear_m: 0.9,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Not Exempt')
      expect(result.errors.length).toBe(0)

      const s3 = result.checks.find((c) => c.rule_id === 'S-3')
      expect(s3?.pass).toBe(false)
      expect(s3?.note).toContain('3.2')
      expect(s3?.note).toContain('3.0')
    })

    it('Shed, R5, 40 m², side=4.0, rear=4.0, behind_line=true → Not Exempt (S-4 fail; needs 5.0 m each boundary in R5)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'shed' },
        property: { zone_text: 'R5', lot_size_m2: 450 },
        dimensions: {
          length_m: 8,
          width_m: 5,
          height_m: 2.6,
          area_m2: 40,
        },
        location: {
          setback_front_m: undefined, // Behind building line
          setback_side_m: 4.0,
          setback_rear_m: 4.0,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Not Exempt')
      expect(result.errors.length).toBe(0)

      const s4 = result.checks.find((c) => c.rule_id === 'S-4')
      expect(s4?.pass).toBe(false)
      expect(s4?.note).toContain('4.0')
      expect(s4?.note).toContain('5.0')
    })

    it('Shed, RU2, 50 m², side/rear 5.0 m exact → Exempt boundary case', () => {
      const proposal = createBaseProposal({
        structure: { type: 'shed' },
        property: { zone_text: 'RU2', lot_size_m2: 450 },
        dimensions: {
          length_m: 10,
          width_m: 5,
          height_m: 2.6,
          area_m2: 50,
        },
        location: {
          setback_front_m: undefined, // Behind building line
          setback_side_m: 5.0,
          setback_rear_m: 5.0,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Exempt')
      expect(result.errors.length).toBe(0)

      const s2 = result.checks.find((c) => c.rule_id === 'S-2')
      const s4 = result.checks.find((c) => c.rule_id === 'S-4')
      expect(s2?.pass).toBe(true)
      expect(s4?.pass).toBe(true)
    })
  })

  describe('Patio Rules', () => {
    it('Patio, R2, 18 m², front setback 4.5m (< 5m) → Not Exempt (P-5 fail)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'patio' },
        property: { zone_text: 'R2', lot_size_m2: 450 },
        dimensions: {
          length_m: 6,
          width_m: 3,
          height_m: 2.6,
          area_m2: 18,
        },
        location: {
          setback_front_m: 4.5, // < 5m, not behind building line
          setback_side_m: 0.9,
          setback_rear_m: 0.9,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Not Exempt')
      expect(result.errors.length).toBe(0)

      const p5 = result.checks.find((c) => c.rule_id === 'P-5')
      expect(p5?.pass).toBe(false)
      expect(p5?.note).toContain('fail')
    })

    it('Patio, RU1, 24 m², side=4.0 → Not Exempt (P-6 fail; needs 5.0 m)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'patio' },
        property: { zone_text: 'RU1', lot_size_m2: 450 },
        dimensions: {
          length_m: 8,
          width_m: 3,
          height_m: 2.6,
          area_m2: 24,
        },
        location: {
          setback_front_m: undefined, // Behind building line
          setback_side_m: 4.0,
          setback_rear_m: 5.0,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Not Exempt')
      expect(result.errors.length).toBe(0)

      const p6 = result.checks.find((c) => c.rule_id === 'P-6')
      expect(p6?.pass).toBe(false)
      expect(p6?.note).toContain('4.0')
      expect(p6?.note).toContain('5.0')
    })
  })

  describe('Carport Rules', () => {
    it('Carport, R2, 20 m², front offset 0.5 m (< 1.0m) → Not Exempt (C-5 needs ≥1.0 m behind)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'carport' },
        property: { zone_text: 'R2', lot_size_m2: 450 },
        dimensions: {
          length_m: 5,
          width_m: 4,
          height_m: 2.6,
          area_m2: 20,
        },
        location: {
          setback_front_m: 0.5, // Only 0.5m - needs ≥1.0m
          setback_side_m: 0.9,
          setback_rear_m: 0.9,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Not Exempt')
      expect(result.errors.length).toBe(0)

      const c5 = result.checks.find((c) => c.rule_id === 'C-5')
      expect(c5?.pass).toBe(false)
      expect(c5?.note).toContain('0.5')
      expect(c5?.note).toContain('1.0')
    })

    it('Carport, R5, 48 m², secondary setbacks 5 m and behind line ok → Exempt (C-3,C-5 pass)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'carport' },
        property: { zone_text: 'R5', lot_size_m2: 500 }, // Lot >300m²
        dimensions: {
          length_m: 8,
          width_m: 6,
          height_m: 2.6,
          area_m2: 48,
        },
        location: {
          setback_front_m: undefined, // Behind building line (or >= 1.0m would also pass)
          setback_side_m: 5.0,
          setback_rear_m: 5.0,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Exempt')
      expect(result.errors.length).toBe(0)

      const c3 = result.checks.find((c) => c.rule_id === 'C-3')
      const c5 = result.checks.find((c) => c.rule_id === 'C-5')
      expect(c3?.pass).toBe(true)
      expect(c5?.pass).toBe(true)
    })
  })

  describe('Context Rules', () => {
    it('Shed in heritage conservation area, rear yard=false → Not Exempt (X-1 fail)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'shed' },
        property: { zone_text: 'R2', lot_size_m2: 450 },
        dimensions: {
          length_m: 4,
          width_m: 5,
          height_m: 2.6,
          area_m2: 20,
        },
        location: {
          setback_front_m: undefined, // Behind building line
          setback_side_m: 0.9,
          setback_rear_m: 0.5, // Small rear setback (not in rear yard)
        },
        context: {
          heritage_item_bool: false,
          conservation_area_bool: true, // In conservation area
          flood_prone_bool: false,
          bushfire_bool: false,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Not Exempt')
      expect(result.errors.length).toBe(0)

      const x1 = result.checks.find((c) => c.rule_id === 'X-1')
      expect(x1?.pass).toBe(false)
      expect(x1?.note).toContain('fail')
    })
  })

  // Note: behind_building_line_bool is no longer a field - it's inferred from front setback

  describe('Behind Building Line Logic', () => {
    it('Shed, RU2 zone (rural), behind building line (no front setback) → S-5 passes (BBL not required in rural zones)', () => {
      const proposal = createBaseProposal({
        structure: { type: 'shed' },
        property: { zone_text: 'RU2' }, // Rural zone
        location: {
          setback_front_m: undefined, // Behind building line
          setback_side_m: 5.0,
          setback_rear_m: 5.0,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Exempt')
      expect(result.errors.length).toBe(0)

      const s5 = result.checks.find((c) => c.rule_id === 'S-5')
      expect(s5?.pass).toBe(true) // Should pass because it's a rural zone
    })

    it('Shed, R2 zone (non-rural), front setback 4.5m (< 5m) → S-5 fails', () => {
      const proposal = createBaseProposal({
        structure: { type: 'shed' },
        property: { zone_text: 'R2' }, // Non-rural zone
        location: {
          setback_front_m: 4.5, // < 5m, not behind building line
          setback_side_m: 0.9,
          setback_rear_m: 0.9,
        },
      })

      const result = run_rules_assessment(proposal)

      expect(result.decision).toBe('Likely Not Exempt')
      expect(result.errors.length).toBe(0)

      const s5 = result.checks.find((c) => c.rule_id === 'S-5')
      expect(s5?.pass).toBe(false)
    })
  })
})

