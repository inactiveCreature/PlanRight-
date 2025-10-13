/**
 * Shared type definitions so teams stop arguing in the PR comments.
 */
export type StructureType = 'shed' | 'patio' | 'carport'
export type UserRole = 'Resident' | 'Builder' | 'Purchaser' | 'Planner' | 'Student'

export interface Property {
  id: string
  lot_size_m2: number | string
  zone_text: string
  frontage_m: number | string
  corner_lot_bool: boolean
  easement_bool: boolean
}

export interface Structure { type: StructureType | '' }

export interface Dimensions {
  length_m: number | string
  width_m: number | string
  height_m: number | string
  area_m2: number | string
}

export interface Location {
  setback_front_m: number | string
  setback_side_m: number | string
  setback_rear_m: number | string
  behind_building_line_bool: boolean
}

export interface Siting {
  on_easement_bool: boolean
  over_sewer_bool: boolean
  attached_to_dwelling_bool: boolean
}

export interface ContextFlags {
  heritage_item_bool: boolean
  conservation_area_bool: boolean
  flood_prone_bool: boolean
  bushfire_bool: boolean
}

export interface Proposal {
  property: Property
  structure: Structure
  dimensions: Dimensions
  location: Location
  siting: Siting
  context: ContextFlags
}

export interface RuleCheck {
  rule_id: string
  clause_ref: string
  pass: boolean
  note: string
  killer?: boolean
}

export interface RuleResult {
  decision: 'Likely Exempt' | 'Likely Not Exempt' | 'Cannot assess'
  checks: RuleCheck[]
  errors: { field: string, message: string }[]
}
