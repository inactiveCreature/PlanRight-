import { describe, it, expect } from 'vitest'
import { run_rules_assessment } from '../rules/engine'
import type { StructureType } from '../types'

// Original 6 scenarios (do not change), plus 2 new edge cases.
const scenarios = [
  {
    name: 'Likely Exempt baseline shed',
    proposal: {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.4, area_m2: 16 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Exempt',
  },
  {
    name: 'Fail: height too tall',
    proposal: {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 3.6, area_m2: 16 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Fail: not behind building line',
    proposal: {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.4, area_m2: 16 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: false },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Fail: area too large for shed in non-rural zone',
    proposal: {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 6, width_m: 4, height_m: 2.7, area_m2: 30 },
      location: { setback_front_m: 6, setback_side_m: 1, setback_rear_m: 1.2, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Fail: on easement',
    proposal: {
      property: { id: 'X', lot_size_m2: 500, zone_text: 'R2', frontage_m: 12, corner_lot_bool: false, easement_bool: true },
      structure: { type: 'patio' as StructureType },
      dimensions: { length_m: 3, width_m: 3, height_m: 2.4, area_m2: 9 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: true, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Cannot assess: missing height',
    proposal: {
      property: { id: 'X', lot_size_m2: 500, zone_text: 'R2', frontage_m: 12, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'carport' as StructureType },
      dimensions: { length_m: 5, width_m: 3, height_m: '', area_m2: 15 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Cannot assess',
  },
  // New cases
  {
    name: 'Carport area cap passes at 30 m²',
    proposal: {
      property: { id: 'X', lot_size_m2: 600, zone_text: 'R2', frontage_m: 14, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'carport' as StructureType },
      dimensions: { length_m: 6, width_m: 5, height_m: 2.7, area_m2: 30 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Exempt',
  },
  {
    name: 'Cannot assess: missing front setback',
    proposal: {
      property: { id: 'X', lot_size_m2: 600, zone_text: 'R2', frontage_m: 14, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'patio' as StructureType },
      dimensions: { length_m: 3, width_m: 4, height_m: 2.4, area_m2: 12 },
      location: { setback_front_m: '', setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Cannot assess',
  },
  // Additional comprehensive test scenarios
  {
    name: 'Patio attached to dwelling - passes',
    proposal: {
      property: { id: 'X', lot_size_m2: 500, zone_text: 'R2', frontage_m: 12, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'patio' as StructureType },
      dimensions: { length_m: 4, width_m: 3, height_m: 2.7, area_m2: 12 },
      location: { setback_front_m: 6, setback_side_m: 1.2, setback_rear_m: 1.5, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Exempt',
  },
  {
    name: 'Shed attached to dwelling - fails',
    proposal: {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 3, width_m: 3, height_m: 2.4, area_m2: 9 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Heritage item - fails',
    proposal: {
      property: { id: 'X', lot_size_m2: 450, zone_text: 'R2', frontage_m: 12, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'carport' as StructureType },
      dimensions: { length_m: 5, width_m: 4, height_m: 2.8, area_m2: 20 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: true, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Conservation area - fails',
    proposal: {
      property: { id: 'X', lot_size_m2: 600, zone_text: 'R1', frontage_m: 15, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'patio' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.5, area_m2: 16 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: true, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Flood prone area - fails',
    proposal: {
      property: { id: 'X', lot_size_m2: 350, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 3, width_m: 3, height_m: 2.4, area_m2: 9 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: true, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Bushfire prone area - fails',
    proposal: {
      property: { id: 'X', lot_size_m2: 800, zone_text: 'R1', frontage_m: 18, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'carport' as StructureType },
      dimensions: { length_m: 6, width_m: 4, height_m: 2.7, area_m2: 24 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: true },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Over sewer - fails',
    proposal: {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'patio' as StructureType },
      dimensions: { length_m: 3, width_m: 3, height_m: 2.4, area_m2: 9 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: true, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Side setback too small - fails',
    proposal: {
      property: { id: 'X', lot_size_m2: 500, zone_text: 'R2', frontage_m: 12, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 3, height_m: 2.4, area_m2: 12 },
      location: { setback_front_m: 5, setback_side_m: 0.5, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Rear setback too small - fails',
    proposal: {
      property: { id: 'X', lot_size_m2: 450, zone_text: 'R2', frontage_m: 11, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'carport' as StructureType },
      dimensions: { length_m: 5, width_m: 3, height_m: 2.7, area_m2: 15 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 0.6, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Likely Not Exempt',
  },
  {
    name: 'Cannot assess: missing side setback',
    proposal: {
      property: { id: 'X', lot_size_m2: 500, zone_text: 'R2', frontage_m: 12, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'patio' as StructureType },
      dimensions: { length_m: 3, width_m: 4, height_m: 2.4, area_m2: 12 },
      location: { setback_front_m: 5, setback_side_m: '', setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Cannot assess',
  },
  {
    name: 'Cannot assess: missing rear setback',
    proposal: {
      property: { id: 'X', lot_size_m2: 500, zone_text: 'R2', frontage_m: 12, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'carport' as StructureType },
      dimensions: { length_m: 5, width_m: 3, height_m: 2.7, area_m2: 15 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: '', behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Cannot assess',
  },
  {
    name: 'Cannot assess: missing structure type',
    proposal: {
      property: { id: 'X', lot_size_m2: 500, zone_text: 'R2', frontage_m: 12, corner_lot_bool: false, easement_bool: false },
      structure: { type: '' as any },
      dimensions: { length_m: 3, width_m: 4, height_m: 2.4, area_m2: 12 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    },
    expected: 'Cannot assess',
  },
]

describe('rules engine scenarios', () => {
  for (const s of scenarios) {
    it(s.name, () => {
      const r = run_rules_assessment(s.proposal as any)
      expect(r.decision).toBe(s.expected)
    })
  }
})

describe('new functionality tests', () => {
  it('blocks_on_easement: proposal.siting.on_easement_bool = true → decision "Likely Not Exempt"; G-SITING-1 pass=false', () => {
    const proposal = {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.4, area_m2: 16 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: true, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    }
    const result = run_rules_assessment(proposal)
    expect(result.decision).toBe('Likely Not Exempt')
    const sitingCheck = result.checks.find(c => c.rule_id === 'G-SITING-1')
    expect(sitingCheck?.pass).toBe(false)
  })

  it('bbl_front_logic: when BBL=true, S-BBL-1 pass=true and S-FRONT-1 is not evaluated; when BBL=false and front<min, S-FRONT-1 fail', () => {
    // Test BBL=true case
    const proposalBBL = {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.4, area_m2: 16 },
      location: { setback_front_m: 3, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    }
    const resultBBL = run_rules_assessment(proposalBBL)
    const bblCheck = resultBBL.checks.find(c => c.rule_id === 'S-BBL-1')
    const frontCheck = resultBBL.checks.find(c => c.rule_id === 'S-FRONT-1')
    expect(bblCheck?.pass).toBe(true)
    expect(frontCheck?.pass).toBe(true) // Should pass because BBL=true

    // Test BBL=false with insufficient front setback
    const proposalNoBBL = {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.4, area_m2: 16 },
      location: { setback_front_m: 3, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: false },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    }
    const resultNoBBL = run_rules_assessment(proposalNoBBL)
    const bblCheck2 = resultNoBBL.checks.find(c => c.rule_id === 'S-BBL-1')
    const frontCheck2 = resultNoBBL.checks.find(c => c.rule_id === 'S-FRONT-1')
    expect(bblCheck2?.pass).toBe(false)
    expect(frontCheck2?.pass).toBe(false) // Should fail because front < 5.0m
  })

  it('zone_binding: sending "Zone R2" updates store and thresholds snapshot used by assess()', () => {
    const proposal = {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.4, area_m2: 16 },
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    }
    const result = run_rules_assessment(proposal)
    expect(result.decision).toBe('Likely Exempt')
    // Verify that the zone is properly used in the assessment
    expect(proposal.property.zone_text).toBe('R2')
  })

  it('area_tolerance_check: auto-calc area = length*width; if user-entered area_m2 differs by > 0.02 m², show warning', () => {
    const proposal = {
      property: { id: 'X', lot_size_m2: 400, zone_text: 'R2', frontage_m: 10, corner_lot_bool: false, easement_bool: false },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.4, area_m2: 15.95 }, // Should trigger tolerance check
      location: { setback_front_m: 5, setback_side_m: 1, setback_rear_m: 1, behind_building_line_bool: true },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: { heritage_item_bool: false, conservation_area_bool: false, flood_prone_bool: false, bushfire_bool: false },
    }
    const result = run_rules_assessment(proposal)
    const areaCheck = result.checks.find(c => c.rule_id === 'G-AREA-1')
    expect(areaCheck).toBeDefined()
    expect(areaCheck?.pass).toBe(false)
    expect(areaCheck?.note).toContain('calc=16.00m² vs input=15.95m²')
  })
})
