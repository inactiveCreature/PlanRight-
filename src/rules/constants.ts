/**
 * Centralized threshold constants for SEPP Part 2 rules
 * Based on NSW SEPP (Exempt Development) 2008 Part 2
 * Organized by zone group and structure type
 */

/**
 * Zone groups for threshold lookups
 */
export const ZONE_GROUPS = {
  RURAL: ['RU1', 'RU2', 'RU3', 'RU4', 'RU5', 'RU6', 'R5'],
  RESIDENTIAL: ['R1', 'R2', 'R3', 'R4'],
} as const

/**
 * Check if zone is rural (RU* or R5)
 */
export function isRuralZone(zoneText: string): boolean {
  const normalized = zoneText.trim().toUpperCase()
  return ZONE_GROUPS.RURAL.includes(normalized as any) || normalized.startsWith('RU')
}

/**
 * Setback thresholds by zone group
 */
export const SETBACK_THRESHOLDS = {
  RURAL_MIN: 5.0, // RU/R/R5 zones require 5m setbacks
  RESIDENTIAL_MIN: 0.9, // Other zones require 0.9m setbacks
  CARPORT_FRONT_OFFSET: 1.0, // Carports must be ≥1.0m behind building line
  ROOF_CLEARANCE: 0.5, // Roof ≥500mm from boundary
} as const

/**
 * Area thresholds by structure type and zone
 */
export const AREA_THRESHOLDS = {
  SHED: {
    RURAL_MAX: 50, // RU/R/R5: ≤50m²
    RESIDENTIAL_MAX: 20, // Other zones: ≤20m²
  },
  PATIO: {
    MAX: 25, // All zones: ≤25m²
  },
  CARPORT: {
    RURAL_LARGE_LOT: 50, // RU/R/R5, lot >300m²: ≤50m²
    RURAL_SMALL_LOT: 20, // RU/R/R5, lot ≤300m²: ≤20m²
    RESIDENTIAL_LARGE_LOT: 25, // Other zones, lot >300m²: ≤25m²
    RESIDENTIAL_SMALL_LOT: 20, // Other zones, lot ≤300m²: ≤20m²
    LARGE_LOT_THRESHOLD: 300, // Lot size threshold (m²)
  },
} as const

/**
 * Height thresholds
 */
export const HEIGHT_THRESHOLDS = {
  MAX_HEIGHT: 3.0, // Maximum height for all structures
  PATIO_WALL_MAX: 1.4, // Patio wall height max (if walls present)
} as const

