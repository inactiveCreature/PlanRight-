#!/usr/bin/env tsx

/**
 * Comprehensive test runner for NSW SEPP Part 2 Rules Engine
 * Verifies all critical scenarios and edge cases
 */

import { run_rules_assessment } from '../src/rules/engine'
import type { Proposal, StructureType } from '../src/types'

interface TestScenario {
  name: string
  proposal: Proposal
  expectedDecision: 'Likely Exempt' | 'Likely Not Exempt' | 'Cannot assess'
  expectedRuleFailures?: string[]
  description: string
}

const scenarios: TestScenario[] = [
  // Shed scenarios
  {
    name: 'A1',
    description: 'Shed, RU2, 40m², h=2.8m, side=6m, rear=6m, behind line=true → Likely Exempt',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'RU2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 8, width_m: 5, height_m: 2.8, area_m2: 40 },
      location: {
        setback_front_m: 6,
        setback_side_m: 6,
        setback_rear_m: 6,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },
  {
    name: 'A2',
    description: 'Shed, R2, 24m², h=3.01m → Fail height (S-HEIGHT-1)',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 6, width_m: 4, height_m: 3.01, area_m2: 24 },
      location: {
        setback_front_m: 1,
        setback_side_m: 1,
        setback_rear_m: 1,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Not Exempt',
    expectedRuleFailures: ['S-HEIGHT-1'],
  },
  {
    name: 'A3',
    description: 'Shed, R3, 22m², side=0.85m → Fail setback residential (S-SIDE-1)',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R3',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 5.5, width_m: 4, height_m: 2.8, area_m2: 22 },
      location: {
        setback_front_m: 1,
        setback_side_m: 0.85,
        setback_rear_m: 1,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Not Exempt',
    expectedRuleFailures: ['S-SIDE-1'],
  },
  {
    name: 'A4',
    description: 'Shed, R5, 48m², side=4.9m → Fail setback rural (S-SIDE-1)',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R5',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 8, width_m: 6, height_m: 2.8, area_m2: 48 },
      location: {
        setback_front_m: 6,
        setback_side_m: 4.9,
        setback_rear_m: 6,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Not Exempt',
    expectedRuleFailures: ['S-SIDE-1'],
  },

  // Patio scenarios
  {
    name: 'B1',
    description: 'Patio, R2, lot=350m², patio=24m² → Pass (within 25m² limit)',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 350,
        zone_text: 'R2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'patio' as StructureType },
      dimensions: { length_m: 6, width_m: 4, height_m: 2.8, area_m2: 24 },
      location: {
        setback_front_m: 1,
        setback_side_m: 1,
        setback_rear_m: 1,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },
  {
    name: 'B2',
    description: 'Patio, R2, lot=290m², patio=25m², setbacks=0.9m → Pass (edge case)',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 290,
        zone_text: 'R2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'patio' as StructureType },
      dimensions: { length_m: 5, width_m: 5, height_m: 2.8, area_m2: 25 },
      location: {
        setback_front_m: 0.9,
        setback_side_m: 0.9,
        setback_rear_m: 0.9,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },

  // Carport scenarios
  {
    name: 'C1',
    description: 'Carport, R3, 24m², h=2.9m, setbacks=0.9m → Pass (within limits)',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R3',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'carport' as StructureType },
      dimensions: { length_m: 6, width_m: 4, height_m: 2.9, area_m2: 24 },
      location: {
        setback_front_m: 1,
        setback_side_m: 0.9,
        setback_rear_m: 1,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },
  {
    name: 'C2',
    description: 'Carport, R5, 48m², side=5m, rear=5m → Pass (rural caps)',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R5',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'carport' as StructureType },
      dimensions: { length_m: 8, width_m: 6, height_m: 2.8, area_m2: 48 },
      location: {
        setback_front_m: 1,
        setback_side_m: 5,
        setback_rear_m: 5,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: true },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },

  // General exclusion scenarios
  {
    name: 'D1',
    description: 'Heritage item true for any structure → Not Exempt due to general exclusion',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
      location: {
        setback_front_m: 1,
        setback_side_m: 1,
        setback_rear_m: 1,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: true,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Not Exempt',
    expectedRuleFailures: ['G-HERITAGE-1'],
  },
  {
    name: 'D2',
    description: 'Easement present and structure within 1m → Fail easement rule',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: true,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
      location: {
        setback_front_m: 1,
        setback_side_m: 0.5,
        setback_rear_m: 0.5,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Not Exempt',
    expectedRuleFailures: ['G-EASEMENT-1'],
  },
  {
    name: 'D3',
    description: 'Unknown zone_text → Cannot assess with errors[] describing unmapped zone',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'INVALID_ZONE',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
      location: {
        setback_front_m: 1,
        setback_side_m: 1,
        setback_rear_m: 1,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Cannot assess',
  },

  // Edge cases
  {
    name: 'E1',
    description: 'Height exactly at 3.0m limit → Pass',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 3.0, area_m2: 16 },
      location: {
        setback_front_m: 1,
        setback_side_m: 1,
        setback_rear_m: 1,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },
  {
    name: 'E2',
    description: 'Area exactly at 20m² limit for residential → Pass',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 5, width_m: 4, height_m: 2.8, area_m2: 20 },
      location: {
        setback_front_m: 1,
        setback_side_m: 1,
        setback_rear_m: 1,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },
  {
    name: 'E3',
    description: 'Setback exactly at 0.9m limit for residential → Pass',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'R2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
      location: {
        setback_front_m: 1,
        setback_side_m: 0.9,
        setback_rear_m: 0.9,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },
  {
    name: 'E4',
    description: 'Setback exactly at 5.0m limit for rural → Pass',
    proposal: {
      property: {
        id: 'X',
        lot_size_m2: 400,
        zone_text: 'RU2',
        frontage_m: 10,
        corner_lot_bool: false,
        easement_bool: false,
      },
      structure: { type: 'shed' as StructureType },
      dimensions: { length_m: 4, width_m: 4, height_m: 2.8, area_m2: 16 },
      location: {
        setback_front_m: 6,
        setback_side_m: 5.0,
        setback_rear_m: 5.0,
        behind_building_line_bool: true,
      },
      siting: { on_easement_bool: false, over_sewer_bool: false, attached_to_dwelling_bool: false },
      context: {
        heritage_item_bool: false,
        conservation_area_bool: false,
        flood_prone_bool: false,
        bushfire_bool: false,
      },
    },
    expectedDecision: 'Likely Exempt',
  },
]

function runScenario(scenario: TestScenario): { passed: boolean; details: string } {
  try {
    const result = run_rules_assessment(scenario.proposal)

    // Check decision
    if (result.decision !== scenario.expectedDecision) {
      return {
        passed: false,
        details: `Expected decision "${scenario.expectedDecision}" but got "${result.decision}"`,
      }
    }

    // Check specific rule failures if expected
    if (scenario.expectedRuleFailures) {
      for (const expectedFailure of scenario.expectedRuleFailures) {
        const failedRule = result.checks.find(
          (check) => check.rule_id === expectedFailure && !check.pass
        )
        if (!failedRule) {
          return {
            passed: false,
            details: `Expected rule ${expectedFailure} to fail but it passed`,
          }
        }
      }
    }

    // Check that all checks are present (skip for Cannot assess scenarios)
    if (result.decision !== 'Cannot assess') {
      const structureType = scenario.proposal.structure.type
      const expectedGeneralRules = 4 // G-AREA-1, G-SITING-1, G-HERITAGE-1, G-EASEMENT-1
      const expectedStructureRules =
        structureType === 'shed' ? 12 : structureType === 'patio' ? 9 : 11
      const totalExpectedRules = expectedGeneralRules + expectedStructureRules

      if (result.checks.length !== totalExpectedRules) {
        return {
          passed: false,
          details: `Expected ${totalExpectedRules} checks but got ${result.checks.length}`,
        }
      }
    }

    return {
      passed: true,
      details: `✓ Decision: ${result.decision}, Checks: ${result.checks.length}, Errors: ${result.errors.length}`,
    }
  } catch (error) {
    return {
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function main() {
  console.log('🧪 NSW SEPP Part 2 Rules Engine - Comprehensive Test Suite\n')

  let passed = 0
  let failed = 0

  for (const scenario of scenarios) {
    const result = runScenario(scenario)

    if (result.passed) {
      console.log(`✅ ${scenario.name}: ${scenario.description}`)
      console.log(`   ${result.details}\n`)
      passed++
    } else {
      console.log(`❌ ${scenario.name}: ${scenario.description}`)
      console.log(`   ${result.details}\n`)
      failed++
    }
  }

  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${scenarios.length} total`)

  if (failed === 0) {
    console.log('🎉 All tests passed! Rules engine is working correctly.')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.')
    process.exit(1)
  }
}

main()
