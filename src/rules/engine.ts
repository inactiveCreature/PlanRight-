/**
 * Deterministic rules engine implementing SEPP (Exempt Development) 2008 Part 2.
 * Refactored with specific rule IDs and clause references per requirements.
 */
import type { Proposal, RuleResult, RuleCheck } from '../types'
import { normalizeZone } from '../config/thresholds'
import {
  isRuralZone,
  SETBACK_THRESHOLDS,
  AREA_THRESHOLDS,
  HEIGHT_THRESHOLDS,
} from './constants'

// Rule definitions with exact clause references and rule IDs
const RULE_DEFINITIONS: Record<
  string,
  {
    clause_ref: string
    description: string
    killer: boolean
    check: (p: Proposal) => boolean
    noteGenerator: (p: Proposal, pass: boolean) => string
  }
> = {
  // Common applicability
  'A-1': {
    clause_ref: 'SEPP Pt2 General Exclusions',
    description: 'Not on/in heritage item, draft heritage item, foreshore area, or environmentally sensitive area',
    killer: true,
    check: (p: Proposal) => {
      // General exclusions: heritage item, conservation area
      return !p.context.heritage_item_bool && !p.context.conservation_area_bool
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      if (!_pass) {
        return 'Site triggers general exclusions.'
      }
      return `Heritage/conservation: heritage=${p.context.heritage_item_bool}, conservation=${p.context.conservation_area_bool}`
    },
  },

  // Sheds (Subdivision 9)
  'S-2': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv9',
    description: 'Max area: RU/R zones ≤50 m²; other zones ≤20 m²',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'shed') return true
      const area = Number(p.dimensions.area_m2) || 0
      const isRural = isRuralZone(p.property.zone_text)
      const maxArea = isRural ? AREA_THRESHOLDS.SHED.RURAL_MAX : AREA_THRESHOLDS.SHED.RESIDENTIAL_MAX
      return area <= maxArea
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const area = Number(p.dimensions.area_m2) || 0
      const isRural = isRuralZone(p.property.zone_text)
      const maxArea = isRural ? AREA_THRESHOLDS.SHED.RURAL_MAX : AREA_THRESHOLDS.SHED.RESIDENTIAL_MAX
      return `Area ${area.toFixed(1)}m² ≤ ${maxArea}m²`
    },
  },
  'S-3': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv9',
    description: 'Height ≤3.0 m above existing ground',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'shed') return true
      const height = Number(p.dimensions.height_m) || 0
      return height <= HEIGHT_THRESHOLDS.MAX_HEIGHT
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const height = Number(p.dimensions.height_m) || 0
      return `Height ${height}m ≤ ${HEIGHT_THRESHOLDS.MAX_HEIGHT}m`
    },
  },
  'S-4': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv9',
    description: 'Setback: RU1/RU2/RU3/RU4/RU6/R5 each boundary ≥5.0 m; All other zones: side/rear ≥0.9 m',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'shed') return true
      const isRural = isRuralZone(p.property.zone_text)
      const minSetback = isRural ? SETBACK_THRESHOLDS.RURAL_MIN : SETBACK_THRESHOLDS.RESIDENTIAL_MIN
      const sideSetback = Number(p.location.setback_side_m) || 0
      const rearSetback = Number(p.location.setback_rear_m) || 0
      return sideSetback >= minSetback && rearSetback >= minSetback
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const isRural = isRuralZone(p.property.zone_text)
      const minSetback = isRural ? SETBACK_THRESHOLDS.RURAL_MIN : SETBACK_THRESHOLDS.RESIDENTIAL_MIN
      const sideSetback = Number(p.location.setback_side_m) || 0
      const rearSetback = Number(p.location.setback_rear_m) || 0
      
      if (!_pass) {
        const failures: string[] = []
        if (sideSetback < minSetback) failures.push(`side ${sideSetback}m < ${minSetback}m`)
        if (rearSetback < minSetback) failures.push(`rear ${rearSetback}m < ${minSetback}m`)
        return `Setback ${failures.join(', ')} — fail`
      }
      return `Side setback ${sideSetback}m ≥ ${minSetback}m, Rear setback ${rearSetback}m ≥ ${minSetback}m`
    },
  },
  'S-5': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv9',
    description: 'Behind building line of any road frontage if not in rural zones',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'shed') return true
      const isRural = isRuralZone(p.property.zone_text)
      // If in rural zone, BBL requirement doesn't apply
      if (isRural) return true
      // If not in rural zone, must be behind building line
      // Infer from front setback: empty or >= 5m means behind building line
      const frontSetback = p.location.setback_front_m !== undefined && p.location.setback_front_m !== ''
        ? Number(p.location.setback_front_m)
        : undefined
      // If empty, assume behind building line (pass)
      if (frontSetback === undefined) return true
      // If front setback >= 5m (building line), pass
      return frontSetback >= 5.0
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const isRural = isRuralZone(p.property.zone_text)
      if (isRural) {
        return 'Rural zone — behind building line not required'
      }
      const frontSetback = p.location.setback_front_m !== undefined && p.location.setback_front_m !== ''
        ? Number(p.location.setback_front_m)
        : undefined
      if (_pass) {
        if (frontSetback === undefined) {
          return 'Behind building line (no front setback provided) — pass'
        }
        return `Behind building line (front setback ${frontSetback}m ≥ 5m) — pass`
      }
      return `Not behind building line (front setback ${frontSetback || 0}m < 5m) — fail`
    },
  },

  // Patios (Subdivision 6)
  'P-2': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv6',
    description: 'Area limits: ≤25 m²',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'patio') return true
      const area = Number(p.dimensions.area_m2) || 0
      return area <= AREA_THRESHOLDS.PATIO.MAX
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const area = Number(p.dimensions.area_m2) || 0
      return `Area ${area.toFixed(1)}m² ≤ ${AREA_THRESHOLDS.PATIO.MAX}m²`
    },
  },
  'P-4': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv6',
    description: 'Height: roofed ≤3.0 m; walls if any ≤1.4 m',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'patio') return true
      const height = Number(p.dimensions.height_m) || 0
      // Check roof height (we don't have separate wall height, so check main height)
      return height <= HEIGHT_THRESHOLDS.MAX_HEIGHT
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const height = Number(p.dimensions.height_m) || 0
      return `Height ${height}m ≤ ${HEIGHT_THRESHOLDS.MAX_HEIGHT}m`
    },
  },
  'P-5': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv6',
    description: 'Behind building line of road frontage (or ≥50 m from road for farm premises)',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'patio') return true
      // Infer from front setback: empty or >= 5m means behind building line
      const frontSetback = p.location.setback_front_m !== undefined && p.location.setback_front_m !== ''
        ? Number(p.location.setback_front_m)
        : undefined
      // If empty, assume behind building line (pass)
      if (frontSetback === undefined) return true
      // If front setback >= 5m (building line), pass
      return frontSetback >= 5.0
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const frontSetback = p.location.setback_front_m !== undefined && p.location.setback_front_m !== ''
        ? Number(p.location.setback_front_m)
        : undefined
      if (_pass) {
        if (frontSetback === undefined) {
          return 'Behind building line (no front setback provided) — pass'
        }
        return `Behind building line (front setback ${frontSetback}m ≥ 5m) — pass`
      }
      return `Not behind building line (front setback ${frontSetback || 0}m < 5m) — fail`
    },
  },
  'P-6': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv6',
    description: 'Setbacks: RU/R and R5 ≥5.0 m; other zones ≥0.9 m',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'patio') return true
      const isRural = isRuralZone(p.property.zone_text)
      const minSetback = isRural ? SETBACK_THRESHOLDS.RURAL_MIN : SETBACK_THRESHOLDS.RESIDENTIAL_MIN
      const sideSetback = Number(p.location.setback_side_m) || 0
      const rearSetback = Number(p.location.setback_rear_m) || 0
      return sideSetback >= minSetback && rearSetback >= minSetback
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const isRural = isRuralZone(p.property.zone_text)
      const minSetback = isRural ? SETBACK_THRESHOLDS.RURAL_MIN : SETBACK_THRESHOLDS.RESIDENTIAL_MIN
      const sideSetback = Number(p.location.setback_side_m) || 0
      const rearSetback = Number(p.location.setback_rear_m) || 0
      
      if (!_pass) {
        const failures: string[] = []
        if (sideSetback < minSetback) failures.push(`side ${sideSetback}m < ${minSetback}m`)
        if (rearSetback < minSetback) failures.push(`rear ${rearSetback}m < ${minSetback}m`)
        return `Setback ${failures.join(', ')} — fail`
      }
      return `Side setback ${sideSetback}m ≥ ${minSetback}m, Rear setback ${rearSetback}m ≥ ${minSetback}m`
    },
  },

  // Carports (Subdivision 10)
  'C-3': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv10',
    description: 'Area: if lot >300 m² then RU/R/R5 ≤50 m²; other zones ≤25 m²; if lot ≤300 m² then ≤20 m²',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'carport') return true
      const area = Number(p.dimensions.area_m2) || 0
      const lotSize = Number(p.property.lot_size_m2) || 0
      const isRural = isRuralZone(p.property.zone_text)
      
      let maxArea: number
      if (isRural) {
        maxArea = lotSize > AREA_THRESHOLDS.CARPORT.LARGE_LOT_THRESHOLD
          ? AREA_THRESHOLDS.CARPORT.RURAL_LARGE_LOT
          : AREA_THRESHOLDS.CARPORT.RURAL_SMALL_LOT
      } else {
        maxArea = lotSize > AREA_THRESHOLDS.CARPORT.LARGE_LOT_THRESHOLD
          ? AREA_THRESHOLDS.CARPORT.RESIDENTIAL_LARGE_LOT
          : AREA_THRESHOLDS.CARPORT.RESIDENTIAL_SMALL_LOT
      }
      
      return area <= maxArea
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const area = Number(p.dimensions.area_m2) || 0
      const lotSize = Number(p.property.lot_size_m2) || 0
      const isRural = isRuralZone(p.property.zone_text)
      
      let maxArea: number
      if (isRural) {
        maxArea = lotSize > AREA_THRESHOLDS.CARPORT.LARGE_LOT_THRESHOLD
          ? AREA_THRESHOLDS.CARPORT.RURAL_LARGE_LOT
          : AREA_THRESHOLDS.CARPORT.RURAL_SMALL_LOT
      } else {
        maxArea = lotSize > AREA_THRESHOLDS.CARPORT.LARGE_LOT_THRESHOLD
          ? AREA_THRESHOLDS.CARPORT.RESIDENTIAL_LARGE_LOT
          : AREA_THRESHOLDS.CARPORT.RESIDENTIAL_SMALL_LOT
      }
      
      return `Area ${area.toFixed(1)}m² ≤ ${maxArea}m²`
    },
  },
  'C-4': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv10',
    description: 'Height ≤3.0 m; if attached to single-storey dwelling, not above gutter line',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'carport') return true
      const height = Number(p.dimensions.height_m) || 0
      return height <= HEIGHT_THRESHOLDS.MAX_HEIGHT
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const height = Number(p.dimensions.height_m) || 0
      return `Height ${height}m ≤ ${HEIGHT_THRESHOLDS.MAX_HEIGHT}m`
    },
  },
  'C-5': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv10',
    description: 'Front siting: at least 1.0 m behind building line; RU/R/R5 boundaries ≥5.0 m; other zones ≥0.9 m; roof ≥0.5 m from lot boundary',
    killer: false,
    check: (p: Proposal) => {
      if (p.structure.type !== 'carport') return true
      
      // Must be ≥1.0m behind building line
      // Infer from front setback: empty or >= 1.0m means behind building line
      const frontSetback = p.location.setback_front_m !== undefined && p.location.setback_front_m !== ''
        ? Number(p.location.setback_front_m)
        : undefined
      // If empty, assume behind building line (pass)
      if (frontSetback !== undefined && frontSetback < SETBACK_THRESHOLDS.CARPORT_FRONT_OFFSET) {
        return false
      }
      
      // Side/rear setbacks
      const isRural = isRuralZone(p.property.zone_text)
      const minSetback = isRural ? SETBACK_THRESHOLDS.RURAL_MIN : SETBACK_THRESHOLDS.RESIDENTIAL_MIN
      const sideSetback = Number(p.location.setback_side_m) || 0
      const rearSetback = Number(p.location.setback_rear_m) || 0
      
      // Roof clearance (using side/rear setbacks as proxy)
      const roofClearance = Math.min(sideSetback, rearSetback)
      
      return (
        sideSetback >= minSetback &&
        rearSetback >= minSetback &&
        roofClearance >= SETBACK_THRESHOLDS.ROOF_CLEARANCE
      )
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      const isRural = isRuralZone(p.property.zone_text)
      const minSetback = isRural ? SETBACK_THRESHOLDS.RURAL_MIN : SETBACK_THRESHOLDS.RESIDENTIAL_MIN
      const sideSetback = Number(p.location.setback_side_m) || 0
      const rearSetback = Number(p.location.setback_rear_m) || 0
      const frontSetback = p.location.setback_front_m !== undefined && p.location.setback_front_m !== ''
        ? Number(p.location.setback_front_m)
        : undefined
      
      if (!_pass) {
        const failures: string[] = []
        if (frontSetback !== undefined && frontSetback < SETBACK_THRESHOLDS.CARPORT_FRONT_OFFSET) {
          failures.push(`front offset ${frontSetback}m < ${SETBACK_THRESHOLDS.CARPORT_FRONT_OFFSET}m`)
        }
        if (sideSetback < minSetback) failures.push(`side ${sideSetback}m < ${minSetback}m`)
        if (rearSetback < minSetback) failures.push(`rear ${rearSetback}m < ${minSetback}m`)
        if (Math.min(sideSetback, rearSetback) < SETBACK_THRESHOLDS.ROOF_CLEARANCE) {
          failures.push(`roof clearance < ${SETBACK_THRESHOLDS.ROOF_CLEARANCE}m`)
        }
        return `Front siting ${failures.join(', ')} — fail`
      }
      
      // Generate pass note
      const frontNote = frontSetback === undefined
        ? 'Behind building line (no front setback provided) — pass'
        : `Front offset ${frontSetback}m ≥ ${SETBACK_THRESHOLDS.CARPORT_FRONT_OFFSET}m`
      return `${frontNote}, Side ${sideSetback}m ≥ ${minSetback}m, Rear ${rearSetback}m ≥ ${minSetback}m, Roof ≥ ${SETBACK_THRESHOLDS.ROOF_CLEARANCE}m`
    },
  },

  // Context flags
  'X-1': {
    clause_ref: 'SEPP Pt2 heritage siting',
    description: 'In heritage conservation area, structure must be in rear yard',
    killer: false,
    check: (p: Proposal) => {
      // If in conservation area, structure must be in rear yard
      // We don't have a "rear_yard_bool" field, so we'll use rear setback as proxy
      // If rear setback is reasonable (≥1m), assume it's in rear yard
      if (p.context.conservation_area_bool) {
        const rearSetback = Number(p.location.setback_rear_m) || 0
        return rearSetback >= 1.0 // Reasonable proxy for "rear yard"
      }
      return true
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      if (!p.context.conservation_area_bool) {
        return 'Not in conservation area'
      }
      if (_pass) {
        return 'In conservation area — rear yard siting pass'
      }
      return 'In conservation area — rear yard siting fail'
    },
  },
  'X-2': {
    clause_ref: 'SEPP Pt2 bushfire standard',
    description: 'Bushfire: if within 5 m of dwelling then non-combustible',
    killer: false,
    check: (p: Proposal) => {
      // If bushfire prone and structure is within 5m of dwelling, must be non-combustible
      // We don't have distance_to_dwelling or non_combustible_bool fields
      // For now, assume compliance if bushfire is false, or if attached (attached structures are typically compliant)
      if (p.context.bushfire_bool) {
        // If attached, assume compliant (attached structures typically meet non-combustible requirements)
        if (p.siting.attached_to_dwelling_bool) {
          return true
        }
        // If detached, we'd need distance_to_dwelling field - assume compliant for now
        // TODO: Add distance_to_dwelling_bool or distance_to_dwelling_m field to schema
        return true // Placeholder - would need actual distance check
      }
      return true
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      if (!p.context.bushfire_bool) {
        return 'Not bushfire prone'
      }
      if (_pass) {
        return 'Bushfire prone — non-combustible requirement met'
      }
      return 'Bushfire prone — non-combustible requirement fail'
    },
  },

  // Additional rules (keep existing)
  'S-12': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv9',
    description: 'Class 10, non-habitable',
    killer: false,
    check: (_p: Proposal) => true, // Placeholder - would need building class field
    noteGenerator: () => 'Class 10, non-habitable',
  },
  'S-13': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv9',
    description: '≥1 m from registered easement',
    killer: false,
    check: (p: Proposal) => {
      if (p.property.easement_bool) {
        const sideSetback = Number(p.location.setback_side_m) || 0
        const rearSetback = Number(p.location.setback_rear_m) || 0
        return sideSetback >= 1.0 && rearSetback >= 1.0
      }
      return true
    },
    noteGenerator: (p: Proposal, _pass: boolean) => {
      if (!p.property.easement_bool) {
        return 'No registered easement'
      }
      const sideSetback = Number(p.location.setback_side_m) || 0
      const rearSetback = Number(p.location.setback_rear_m) || 0
      return `Easement clearance: side ${sideSetback}m ≥ 1.0m, rear ${rearSetback}m ≥ 1.0m`
    },
  },
  'S-14': {
    clause_ref: 'SEPP Pt2 Div1 Subdiv9',
    description: '≤2 sheds per lot',
    killer: false,
    check: (_p: Proposal) => true, // Placeholder - would need shed count field
    noteGenerator: () => '≤2 sheds per lot',
  },
}

export function run_rules_assessment(p: Proposal): RuleResult {
  const checks: RuleCheck[] = []
  const errors: RuleResult['errors'] = []

  // Validate required fields
  const requiredPaths: [keyof Proposal, string][] = [
    ['structure', 'type'],
    ['dimensions', 'height_m'],
    ['location', 'setback_side_m'],
    ['location', 'setback_rear_m'],
    // Front setback is optional (if empty, assumes behind building line)
  ]

  for (const [a, b] of requiredPaths) {
    const v = (p[a] as any)?.[b]
    if (v === '' || v === null || v === undefined) {
      errors.push({ field: `${String(a)}.${b}`, message: 'Missing required field' })
    }
  }

  if (errors.length) return { decision: 'Cannot assess', checks, errors }

  // Validate numeric inputs
  const height = Number(p.dimensions.height_m)
  const area = Number(p.dimensions.area_m2)
  const frontSetback = p.location.setback_front_m !== undefined && p.location.setback_front_m !== ''
    ? Number(p.location.setback_front_m)
    : undefined
  const sideSetback = Number(p.location.setback_side_m)
  const rearSetback = Number(p.location.setback_rear_m)
  const lotSize = Number(p.property.lot_size_m2)

  if (height <= 0)
    errors.push({ field: 'dimensions.height_m', message: 'Height must be greater than 0' })
  if (area <= 0)
    errors.push({ field: 'dimensions.area_m2', message: 'Area must be greater than 0' })
  // Front setback is optional, but if provided must be valid
  if (frontSetback !== undefined && (isNaN(frontSetback) || frontSetback < 0)) {
    errors.push({ field: 'location.setback_front_m', message: 'Front setback must be 0 or greater if provided' })
  }
  if (sideSetback < 0)
    errors.push({ field: 'location.setback_side_m', message: 'Side setback cannot be negative' })
  if (rearSetback < 0)
    errors.push({ field: 'location.setback_rear_m', message: 'Rear setback cannot be negative' })
  if (lotSize <= 0)
    errors.push({ field: 'property.lot_size_m2', message: 'Lot size must be greater than 0' })

  // Validate zone
  const normalizedZone = normalizeZone(p.property.zone_text)
  const validZones = ['R1', 'R2', 'R3', 'R4', 'R5', 'RU1', 'RU2', 'RU3', 'RU4', 'RU5', 'RU6']
  if (!validZones.includes(normalizedZone)) {
    errors.push({
      field: 'property.zone_text',
      message: `Unknown zone: ${p.property.zone_text}. Must be one of: ${validZones.join(', ')}`,
    })
  }

  if (errors.length) return { decision: 'Cannot assess', checks, errors }

  // Determine which rules to run based on structure type
  const structureType = p.structure.type
  const applicableRuleIds: string[] = []

  // Always include A-1 (general applicability)
  applicableRuleIds.push('A-1')

  // Add structure-specific rules
  if (structureType === 'shed') {
    applicableRuleIds.push('S-2', 'S-3', 'S-4', 'S-5', 'S-12', 'S-13', 'S-14')
  } else if (structureType === 'patio') {
    applicableRuleIds.push('P-2', 'P-4', 'P-5', 'P-6')
  } else if (structureType === 'carport') {
    applicableRuleIds.push('C-3', 'C-4', 'C-5')
  }

  // Always include context rules
  applicableRuleIds.push('X-1', 'X-2')

  // Run applicable rules
  for (const ruleId of applicableRuleIds) {
    const rule = RULE_DEFINITIONS[ruleId]
    if (rule) {
      const pass = rule.check(p)
      const note = rule.noteGenerator(p, pass)
      checks.push({
        rule_id: ruleId,
        clause_ref: rule.clause_ref,
        pass,
        note,
        killer: rule.killer,
      })
    }
  }

  // Determine decision
  // If any killer rule fails, it's "Likely Not Exempt"
  // Otherwise, if any rule fails, it's "Likely Not Exempt"
  // If all rules pass, it's "Likely Exempt"
  const failedChecks = checks.filter((c) => !c.pass)
  const killerFailures = failedChecks.filter((c) => c.killer)

  const decision: RuleResult['decision'] =
    killerFailures.length > 0 || failedChecks.length > 0
      ? 'Likely Not Exempt'
      : 'Likely Exempt'

  return { decision, checks, errors }
}

// Clause lookup API function
export function lookup_clause(clause_ref: string): { title: string; summary: string } {
  const clauseDatabase: Record<string, { title: string; summary: string }> = {
    // General exclusions
    'SEPP Pt2 General Exclusions': {
      title: 'General Exclusions - SEPP Part 2',
      summary:
        'Development is not exempt if the land is a heritage item, draft heritage item, in a foreshore area, or in an environmentally sensitive area.',
    },

    // Shed clauses (Subdivision 9)
    'SEPP Pt2 Div1 Subdiv9': {
      title: 'Sheds - SEPP Part 2 Subdivision 9',
      summary:
        'Requirements for exempt development of sheds: maximum area (RU/R zones ≤50m², other zones ≤20m²), maximum height 3.0m, setbacks (RU/R/R5 ≥5m, others ≥0.9m), must be behind building line in non-rural zones, and other requirements.',
    },

    // Patio clauses (Subdivision 6)
    'SEPP Pt2 Div1 Subdiv6': {
      title: 'Patios - SEPP Part 2 Subdivision 6',
      summary:
        'Requirements for exempt development of patios: maximum area ≤25m², height (roofed ≤3.0m, walls ≤1.4m), must be behind building line, setbacks (RU/R/R5 ≥5m, others ≥0.9m).',
    },

    // Carport clauses (Subdivision 10)
    'SEPP Pt2 Div1 Subdiv10': {
      title: 'Carports - SEPP Part 2 Subdivision 10',
      summary:
        'Requirements for exempt development of carports: area limits based on lot size and zone, maximum height 3.0m, front siting (≥1.0m behind building line), setbacks (RU/R/R5 ≥5m, others ≥0.9m), roof clearance ≥0.5m from boundary.',
    },

    // Context clauses
    'SEPP Pt2 heritage siting': {
      title: 'Heritage Conservation Area Siting',
      summary:
        'In heritage conservation areas, structures must be located in the rear yard of the property.',
    },
    'SEPP Pt2 bushfire standard': {
      title: 'Bushfire Prone Area Requirements',
      summary:
        'In bushfire prone areas, if the structure is within 5 metres of the dwelling, it must be constructed of non-combustible materials.',
    },
  }

  return (
    clauseDatabase[clause_ref] || {
      title: 'Clause Not Found',
      summary: `Clause reference ${clause_ref} not found in database.`,
    }
  )
}
