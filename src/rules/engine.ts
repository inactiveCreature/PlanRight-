/**
 * Deterministic rules engine implementing SEPP (Exempt Development) 2008 Part 2.
 * Each rule maps to specific clauses with exact thresholds from the legislation.
 */
import type { Proposal, RuleResult, RuleCheck } from '../types'
import { getThresholds } from '../config/thresholds'

// SEPP Part 2 Subdivision thresholds (based on NSW legislation)
const SEPP_THRESHOLDS = {
  // Subdivision 6 - Patios
  patio: {
    max_height: 3.0, // Clause 2.6(1)(a)
    max_area: 20.0, // Clause 2.6(1)(b) 
    min_front_setback: 5.0, // Clause 2.6(1)(c)
    min_side_setback: 0.9, // Clause 2.6(1)(d)
    min_rear_setback: 0.9, // Clause 2.6(1)(d)
    behind_building_line: true, // Clause 2.6(1)(c)
    no_easement: true, // Clause 2.6(1)(e)
    no_sewer: true, // Clause 2.6(1)(e)
    attachment_allowed: true, // Clause 2.6(1)(f)
  },
  // Subdivision 9 - Sheds  
  shed: {
    max_height: 3.0, // Clause 2.9(1)(a)
    max_area: 20.0, // Clause 2.9(1)(b)
    min_front_setback: 5.0, // Clause 2.9(1)(c)
    min_side_setback: 0.9, // Clause 2.9(1)(d)
    min_rear_setback: 0.9, // Clause 2.9(1)(d)
    behind_building_line: true, // Clause 2.9(1)(c)
    no_easement: true, // Clause 2.9(1)(e)
    no_sewer: true, // Clause 2.9(1)(e)
    attachment_allowed: false, // Clause 2.9(1)(f) - sheds must be detached
  },
  // Subdivision 10 - Carports
  carport: {
    max_height: 3.0, // Clause 2.10(1)(a)
    max_area: 30.0, // Clause 2.10(1)(b)
    min_front_setback: 5.0, // Clause 2.10(1)(c)
    min_side_setback: 0.9, // Clause 2.10(1)(d)
    min_rear_setback: 0.9, // Clause 2.10(1)(d)
    behind_building_line: true, // Clause 2.10(1)(c)
    no_easement: true, // Clause 2.10(1)(e)
    no_sewer: true, // Clause 2.10(1)(e)
    attachment_allowed: true, // Clause 2.10(1)(f)
  }
}

// Rule definitions with clause references - unbundled checks with killer semantics
const RULE_DEFINITIONS = {
  // General checks (apply to all structures)
  'G-AREA-1': { 
    clause_ref: '2.6(1)(b)/2.9(1)(b)/2.10(1)(b)', 
    description: 'Area tolerance check', 
    killer: false,
    check: (p: Proposal) => {
      const length = Number(p.dimensions.length_m) || 0
      const width = Number(p.dimensions.width_m) || 0
      const area = Number(p.dimensions.area_m2) || 0
      const calculatedArea = length * width
      // Pass if any dimension is missing or if area difference is within tolerance
      return length === 0 || width === 0 || area === 0 || Math.abs(area - calculatedArea) <= 0.02
    }
  },
  'G-SITING-1': { 
    clause_ref: '2.6(1)(e)/2.9(1)(e)/2.10(1)(e)', 
    description: 'Not on easement', 
    killer: true,
    check: (p: Proposal) => !p.siting.on_easement_bool 
  },
  'G-HERITAGE-1': { 
    clause_ref: '2.6(2)/2.9(2)/2.10(2)', 
    description: 'No heritage/conservation restrictions', 
    killer: true,
    check: (p: Proposal) => !p.context.heritage_item_bool && !p.context.conservation_area_bool 
  },
  
  // Structure-specific checks
  'S-BBL-1': { 
    clause_ref: '2.9(1)(c)', 
    description: 'BBL true when required', 
    killer: false,
    check: (p: Proposal) => p.location.behind_building_line_bool 
  },
  'S-FRONT-1': { 
    clause_ref: '2.9(1)(c)', 
    description: 'Front setback ≥ min when BBL=false', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return p.location.behind_building_line_bool || Number(p.location.setback_front_m) >= thresholds.frontMin
    }
  },
  'P-BBL-1': { 
    clause_ref: '2.6(1)(c)', 
    description: 'BBL true when required', 
    killer: false,
    check: (p: Proposal) => p.location.behind_building_line_bool 
  },
  'P-FRONT-1': { 
    clause_ref: '2.6(1)(c)', 
    description: 'Front setback ≥ min when BBL=false', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return p.location.behind_building_line_bool || Number(p.location.setback_front_m) >= thresholds.frontMin
    }
  },
  'C-BBL-1': { 
    clause_ref: '2.10(1)(c)', 
    description: 'BBL true when required', 
    killer: false,
    check: (p: Proposal) => p.location.behind_building_line_bool 
  },
  'C-FRONT-1': { 
    clause_ref: '2.10(1)(c)', 
    description: 'Front setback ≥ min when BBL=false', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return p.location.behind_building_line_bool || Number(p.location.setback_front_m) >= thresholds.frontMin
    }
  },
  
  // Additional rules for comprehensive testing
  'S-HEIGHT-1': { 
    clause_ref: '2.9(1)(a)', 
    description: 'Maximum height 3.0m', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.dimensions.height_m) <= thresholds.heightMax
    }
  },
  'S-AREA-1': { 
    clause_ref: '2.9(1)(b)', 
    description: 'Maximum area 20m²', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.dimensions.area_m2) <= thresholds.areaMax
    }
  },
  'S-SIDE-1': { 
    clause_ref: '2.9(1)(d)', 
    description: 'Minimum 0.9m side setback', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.location.setback_side_m) >= thresholds.sideMin
    }
  },
  'S-REAR-1': { 
    clause_ref: '2.9(1)(d)', 
    description: 'Minimum 0.9m rear setback', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.location.setback_rear_m) >= thresholds.rearMin
    }
  },
  'S-SEWER-1': { 
    clause_ref: '2.9(1)(e)', 
    description: 'Not over sewer', 
    killer: false,
    check: (p: Proposal) => !p.siting.over_sewer_bool 
  },
  'S-ATTACH-1': { 
    clause_ref: '2.9(1)(f)', 
    description: 'Detached from dwelling', 
    killer: false,
    check: (p: Proposal) => !p.siting.attached_to_dwelling_bool 
  },
  'S-FLOOD-1': { 
    clause_ref: '2.9(3)', 
    description: 'Not flood prone', 
    killer: false,
    check: (p: Proposal) => !p.context.flood_prone_bool 
  },
  'S-BUSHFIRE-1': { 
    clause_ref: '2.9(3)', 
    description: 'Not bushfire prone', 
    killer: false,
    check: (p: Proposal) => !p.context.bushfire_bool 
  },
  
  // Patio-specific rules
  'P-HEIGHT-1': { 
    clause_ref: '2.6(1)(a)', 
    description: 'Maximum height 3.0m', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.dimensions.height_m) <= thresholds.heightMax
    }
  },
  'P-AREA-1': { 
    clause_ref: '2.6(1)(b)', 
    description: 'Maximum area 20m²', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.dimensions.area_m2) <= thresholds.areaMax
    }
  },
  'P-SIDE-1': { 
    clause_ref: '2.6(1)(d)', 
    description: 'Minimum 0.9m side setback', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.location.setback_side_m) >= thresholds.sideMin
    }
  },
  'P-REAR-1': { 
    clause_ref: '2.6(1)(d)', 
    description: 'Minimum 0.9m rear setback', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.location.setback_rear_m) >= thresholds.rearMin
    }
  },
  'P-SEWER-1': { 
    clause_ref: '2.6(1)(e)', 
    description: 'Not over sewer', 
    killer: false,
    check: (p: Proposal) => !p.siting.over_sewer_bool 
  },
  'P-FLOOD-1': { 
    clause_ref: '2.6(3)', 
    description: 'Not flood prone', 
    killer: false,
    check: (p: Proposal) => !p.context.flood_prone_bool 
  },
  'P-BUSHFIRE-1': { 
    clause_ref: '2.6(3)', 
    description: 'Not bushfire prone', 
    killer: false,
    check: (p: Proposal) => !p.context.bushfire_bool 
  },
  
  // Carport-specific rules
  'C-HEIGHT-1': { 
    clause_ref: '2.10(1)(a)', 
    description: 'Maximum height 3.0m', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.dimensions.height_m) <= thresholds.heightMax
    }
  },
  'C-AREA-1': { 
    clause_ref: '2.10(1)(b)', 
    description: 'Maximum area 30m²', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.dimensions.area_m2) <= thresholds.areaMax
    }
  },
  'C-SIDE-1': { 
    clause_ref: '2.10(1)(d)', 
    description: 'Minimum 0.9m side setback', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.location.setback_side_m) >= thresholds.sideMin
    }
  },
  'C-REAR-1': { 
    clause_ref: '2.10(1)(d)', 
    description: 'Minimum 0.9m rear setback', 
    killer: false,
    check: (p: Proposal) => {
      const thresholds = getThresholds(p.structure.type, p.property.zone_text)
      return Number(p.location.setback_rear_m) >= thresholds.rearMin
    }
  },
  'C-SEWER-1': { 
    clause_ref: '2.10(1)(e)', 
    description: 'Not over sewer', 
    killer: false,
    check: (p: Proposal) => !p.siting.over_sewer_bool 
  },
  'C-FLOOD-1': { 
    clause_ref: '2.10(3)', 
    description: 'Not flood prone', 
    killer: false,
    check: (p: Proposal) => !p.context.flood_prone_bool 
  },
  'C-BUSHFIRE-1': { 
    clause_ref: '2.10(3)', 
    description: 'Not bushfire prone', 
    killer: false,
    check: (p: Proposal) => !p.context.bushfire_bool 
  },
}

export function run_rules_assessment(p: Proposal): RuleResult {
  const checks: RuleCheck[] = []
  const errors: RuleResult['errors'] = []

  // Validate required fields
  const requiredPaths: [keyof Proposal, string][] = [
    ['structure','type'],
    ['dimensions','height_m'],
    ['location','setback_front_m'],
    ['location','setback_side_m'],
    ['location','setback_rear_m'],
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
  const frontSetback = Number(p.location.setback_front_m)
  const sideSetback = Number(p.location.setback_side_m)
  const rearSetback = Number(p.location.setback_rear_m)

  if (height <= 0) errors.push({ field: 'dimensions.height_m', message: 'Height must be greater than 0' })
  if (area <= 0) errors.push({ field: 'dimensions.area_m2', message: 'Area must be greater than 0' })
  if (frontSetback < 0) errors.push({ field: 'location.setback_front_m', message: 'Front setback cannot be negative' })
  if (sideSetback < 0) errors.push({ field: 'location.setback_side_m', message: 'Side setback cannot be negative' })
  if (rearSetback < 0) errors.push({ field: 'location.setback_rear_m', message: 'Rear setback cannot be negative' })

  if (errors.length) return { decision: 'Cannot assess', checks, errors }

  // Get structure-specific rules
  const structureType = p.structure.type
  const rulePrefix = structureType === 'shed' ? 'S' : structureType === 'patio' ? 'P' : 'C'
  
  // Run all applicable rules (general + structure-specific)
  Object.entries(RULE_DEFINITIONS).forEach(([ruleId, rule]) => {
    // Include general rules (G-*) and structure-specific rules
    if (ruleId.startsWith('G-') || ruleId.startsWith(rulePrefix)) {
      const pass = rule.check(p)
      const note = generateRuleNote(ruleId, rule, p, pass)
      checks.push({
        rule_id: ruleId,
        clause_ref: rule.clause_ref,
        pass,
        note,
        killer: rule.killer
      })
    }
  })

  // Determine decision - any rule failure makes it "Likely Not Exempt"
  const allFails = checks.filter(c => !c.pass)
  const decision: RuleResult['decision'] = allFails.length === 0 ? 'Likely Exempt' : 'Likely Not Exempt'
  
  return { decision, checks, errors }
}

function generateRuleNote(ruleId: string, rule: any, p: Proposal, pass: boolean): string {
  const structureType = p.structure.type
  const height = Number(p.dimensions.height_m)
  const area = Number(p.dimensions.area_m2)
  const frontSetback = Number(p.location.setback_front_m)
  const sideSetback = Number(p.location.setback_side_m)
  const rearSetback = Number(p.location.setback_rear_m)
  const thresholds = getThresholds(structureType, p.property.zone_text)

  switch (ruleId) {
    case 'G-AREA-1':
      const length = Number(p.dimensions.length_m) || 0
      const width = Number(p.dimensions.width_m) || 0
      const calculatedArea = length * width
      return `Area tolerance: calc=${calculatedArea.toFixed(2)}m² vs input=${area.toFixed(2)}m²`
    case 'G-SITING-1':
      return `On easement = ${p.siting.on_easement_bool}`
    case 'G-HERITAGE-1':
      return `Heritage/conservation: heritage=${p.context.heritage_item_bool}, conservation=${p.context.conservation_area_bool}`
    case 'S-BBL-1': case 'P-BBL-1': case 'C-BBL-1':
      return `Behind building line = ${p.location.behind_building_line_bool}`
    case 'S-FRONT-1': case 'P-FRONT-1': case 'C-FRONT-1':
      return `Front setback ${frontSetback}m ≥ ${thresholds.frontMin}m (when not behind building line)`
    case 'S-HEIGHT-1': case 'P-HEIGHT-1': case 'C-HEIGHT-1':
      return `Height ${height}m ≤ ${thresholds.heightMax}m`
    case 'S-AREA-1': case 'P-AREA-1': case 'C-AREA-1':
      return `Area ${area.toFixed(1)}m² ≤ ${thresholds.areaMax}m²`
    case 'S-SIDE-1': case 'P-SIDE-1': case 'C-SIDE-1':
      return `Side setback ${sideSetback}m ≥ ${thresholds.sideMin}m`
    case 'S-REAR-1': case 'P-REAR-1': case 'C-REAR-1':
      return `Rear setback ${rearSetback}m ≥ ${thresholds.rearMin}m`
    case 'S-SEWER-1': case 'P-SEWER-1': case 'C-SEWER-1':
      return `Over sewer = ${p.siting.over_sewer_bool}`
    case 'S-ATTACH-1':
      return `Attached to dwelling = ${p.siting.attached_to_dwelling_bool} (sheds must be detached)`
    case 'S-FLOOD-1': case 'P-FLOOD-1': case 'C-FLOOD-1':
      return `Flood prone = ${p.context.flood_prone_bool}`
    case 'S-BUSHFIRE-1': case 'P-BUSHFIRE-1': case 'C-BUSHFIRE-1':
      return `Bushfire prone = ${p.context.bushfire_bool}`
    default:
      return rule.description
  }
}

// Clause lookup API function
export function lookup_clause(clause_ref: string): { title: string, summary: string } {
  const clauseDatabase: Record<string, { title: string, summary: string }> = {
    // Shed clauses (Subdivision 9)
    '2.9(1)(a)': { 
      title: 'Maximum Height - Sheds', 
      summary: 'The height of a shed must not exceed 3 metres above ground level (existing).' 
    },
    '2.9(1)(b)': { 
      title: 'Maximum Area - Sheds', 
      summary: 'The floor area of a shed must not exceed 20 square metres.' 
    },
    '2.9(1)(c)': { 
      title: 'Front Setback - Sheds', 
      summary: 'A shed must be located behind the building line and at least 5 metres from any street frontage.' 
    },
    '2.9(1)(d)': { 
      title: 'Side and Rear Setbacks - Sheds', 
      summary: 'A shed must be at least 0.9 metres from any side or rear boundary.' 
    },
    '2.9(1)(e)': { 
      title: 'Easements and Services - Sheds', 
      summary: 'A shed must not be located on an easement or over any sewer main or water main.' 
    },
    '2.9(1)(f)': { 
      title: 'Detachment - Sheds', 
      summary: 'A shed must be detached from any other building.' 
    },
    '2.9(2)': { 
      title: 'Heritage and Conservation - Sheds', 
      summary: 'Development is not exempt if the land is a heritage item or in a conservation area.' 
    },
    '2.9(3)': { 
      title: 'Flood and Bushfire - Sheds', 
      summary: 'Development is not exempt if the land is flood prone or bushfire prone.' 
    },
    
    // Patio clauses (Subdivision 6)
    '2.6(1)(a)': { 
      title: 'Maximum Height - Patios', 
      summary: 'The height of a patio must not exceed 3 metres above ground level (existing).' 
    },
    '2.6(1)(b)': { 
      title: 'Maximum Area - Patios', 
      summary: 'The floor area of a patio must not exceed 20 square metres.' 
    },
    '2.6(1)(c)': { 
      title: 'Front Setback - Patios', 
      summary: 'A patio must be located behind the building line and at least 5 metres from any street frontage.' 
    },
    '2.6(1)(d)': { 
      title: 'Side and Rear Setbacks - Patios', 
      summary: 'A patio must be at least 0.9 metres from any side or rear boundary.' 
    },
    '2.6(1)(e)': { 
      title: 'Easements and Services - Patios', 
      summary: 'A patio must not be located on an easement or over any sewer main or water main.' 
    },
    '2.6(1)(f)': { 
      title: 'Attachment - Patios', 
      summary: 'A patio may be attached to a dwelling house.' 
    },
    '2.6(2)': { 
      title: 'Heritage and Conservation - Patios', 
      summary: 'Development is not exempt if the land is a heritage item or in a conservation area.' 
    },
    '2.6(3)': { 
      title: 'Flood and Bushfire - Patios', 
      summary: 'Development is not exempt if the land is flood prone or bushfire prone.' 
    },
    
    // Carport clauses (Subdivision 10)
    '2.10(1)(a)': { 
      title: 'Maximum Height - Carports', 
      summary: 'The height of a carport must not exceed 3 metres above ground level (existing).' 
    },
    '2.10(1)(b)': { 
      title: 'Maximum Area - Carports', 
      summary: 'The floor area of a carport must not exceed 30 square metres.' 
    },
    '2.10(1)(c)': { 
      title: 'Front Setback - Carports', 
      summary: 'A carport must be located behind the building line and at least 5 metres from any street frontage.' 
    },
    '2.10(1)(d)': { 
      title: 'Side and Rear Setbacks - Carports', 
      summary: 'A carport must be at least 0.9 metres from any side or rear boundary.' 
    },
    '2.10(1)(e)': { 
      title: 'Easements and Services - Carports', 
      summary: 'A carport must not be located on an easement or over any sewer main or water main.' 
    },
    '2.10(1)(f)': { 
      title: 'Attachment - Carports', 
      summary: 'A carport may be attached to a dwelling house.' 
    },
    '2.10(2)': { 
      title: 'Heritage and Conservation - Carports', 
      summary: 'Development is not exempt if the land is a heritage item or in a conservation area.' 
    },
    '2.10(3)': { 
      title: 'Flood and Bushfire - Carports', 
      summary: 'Development is not exempt if the land is flood prone or bushfire prone.' 
    },
  }
  
  return clauseDatabase[clause_ref] || { 
    title: 'Clause Not Found', 
    summary: `Clause reference ${clause_ref} not found in database.` 
  }
}

// Sample properties API function
export function list_sample_properties(): Array<{ id: string, label: string, lot_size_m2: number, zone_text: string, flags: string[] }> {
  return [
    { 
      id: 'ALB-001', 
      label: '12 Jarrah St, Albury NSW 2640', 
      lot_size_m2: 310, 
      zone_text: 'R2', 
      flags: [] 
    },
    { 
      id: 'ALB-002', 
      label: '5 Riverbend Ave, Albury NSW 2640', 
      lot_size_m2: 420, 
      zone_text: 'R2', 
      flags: ['flood_prone'] 
    },
    { 
      id: 'ALB-003', 
      label: '9 Regent Pl, Albury NSW 2640', 
      lot_size_m2: 780, 
      zone_text: 'R1', 
      flags: ['bushfire'] 
    },
    { 
      id: 'ALB-004', 
      label: '23 Heritage Way, Albury NSW 2640', 
      lot_size_m2: 450, 
      zone_text: 'R2', 
      flags: ['heritage_item'] 
    },
    { 
      id: 'ALB-005', 
      label: '7 Conservation Cres, Albury NSW 2640', 
      lot_size_m2: 600, 
      zone_text: 'R1', 
      flags: ['conservation_area'] 
    },
    { 
      id: 'ALB-006', 
      label: '15 Corner St, Albury NSW 2640', 
      lot_size_m2: 350, 
      zone_text: 'R2', 
      flags: ['corner_lot'] 
    },
    { 
      id: 'ALB-007', 
      label: '31 Easement Rd, Albury NSW 2640', 
      lot_size_m2: 400, 
      zone_text: 'R2', 
      flags: ['easement'] 
    },
    { 
      id: 'ALB-008', 
      label: '42 Rural View, Albury NSW 2640', 
      lot_size_m2: 1200, 
      zone_text: 'RU1', 
      flags: [] 
    },
    { 
      id: 'ALB-009', 
      label: '18 Mixed Zone Ave, Albury NSW 2640', 
      lot_size_m2: 500, 
      zone_text: 'R3', 
      flags: [] 
    },
    { 
      id: 'ALB-010', 
      label: '55 Complex St, Albury NSW 2640', 
      lot_size_m2: 380, 
      zone_text: 'R2', 
      flags: ['flood_prone', 'bushfire', 'easement'] 
    }
  ]
}
