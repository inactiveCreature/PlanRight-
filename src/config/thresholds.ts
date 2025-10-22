/**
 * Threshold configuration for different structure types and zones.
 * Based on SEPP (Exempt Development) 2008 Part 2 requirements.
 */

export interface ZoneThresholds {
  areaMax: number
  frontMin: number
  sideMin: number
  rearMin: number
  heightMax: number
}

export interface StructureThresholds {
  R1: ZoneThresholds
  R2: ZoneThresholds
  R3: ZoneThresholds
  R4: ZoneThresholds
  R5: ZoneThresholds
  RU1: ZoneThresholds
  RU2: ZoneThresholds
  RU3: ZoneThresholds
  RU4: ZoneThresholds
  RU5: ZoneThresholds
  RU6: ZoneThresholds
}

export interface ThresholdsConfig {
  shed: StructureThresholds
  patio: StructureThresholds
  carport: StructureThresholds
}

export const THRESHOLDS: ThresholdsConfig = {
  shed: {
    // Residential zones: ≤20m², 0.9m setbacks
    R1: { areaMax: 20, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R2: { areaMax: 20, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R3: { areaMax: 20, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R4: { areaMax: 20, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    // R5 treated as rural: ≤50m², 5m setbacks
    R5: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    // Rural zones: ≤50m², 5m setbacks
    RU1: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU2: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU3: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU4: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU5: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU6: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
  },
  patio: {
    // Residential zones: ≤25m², 0.9m setbacks
    R1: { areaMax: 25, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R2: { areaMax: 25, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R3: { areaMax: 25, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R4: { areaMax: 25, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    // R5 treated as rural: ≤25m², 5m setbacks
    R5: { areaMax: 25, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    // Rural zones: ≤25m², 5m setbacks
    RU1: { areaMax: 25, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU2: { areaMax: 25, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU3: { areaMax: 25, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU4: { areaMax: 25, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU5: { areaMax: 25, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU6: { areaMax: 25, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
  },
  carport: {
    // Residential zones: ≤25m² if lot >300m², ≤20m² if ≤300m², 0.9m setbacks
    R1: { areaMax: 25, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R2: { areaMax: 25, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R3: { areaMax: 25, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R4: { areaMax: 25, frontMin: 0.9, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    // R5 treated as rural: ≤50m² if lot >300m², ≤20m² if ≤300m², 5m setbacks
    R5: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    // Rural zones: ≤50m² if lot >300m², ≤20m² if ≤300m², 5m setbacks
    RU1: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU2: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU3: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU4: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU5: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
    RU6: { areaMax: 50, frontMin: 5.0, sideMin: 5.0, rearMin: 5.0, heightMax: 3.0 },
  },
}

/**
 * Normalize zone text to canonical zone classes
 */
export function normalizeZone(zoneText: string): string {
  const normalized = zoneText.trim().toUpperCase()
  
  // Map common variations to canonical zones
  const zoneMap: Record<string, string> = {
    'R1': 'R1', 'R2': 'R2', 'R3': 'R3', 'R4': 'R4', 'R5': 'R5',
    'RU1': 'RU1', 'RU2': 'RU2', 'RU3': 'RU3', 'RU4': 'RU4', 'RU5': 'RU5', 'RU6': 'RU6',
    'RESIDENTIAL': 'R2', 'RURAL': 'RU1', 'FARMING': 'RU1',
    'ZONE R1': 'R1', 'ZONE R2': 'R2', 'ZONE R3': 'R3', 'ZONE R4': 'R4', 'ZONE R5': 'R5',
    'ZONE RU1': 'RU1', 'ZONE RU2': 'RU2', 'ZONE RU3': 'RU3', 'ZONE RU4': 'RU4', 'ZONE RU5': 'RU5', 'ZONE RU6': 'RU6'
  }
  
  return zoneMap[normalized] || normalized
}

/**
 * Check if zone is rural (RU* or R5)
 */
export function isRuralZone(zoneText: string): boolean {
  const normalized = normalizeZone(zoneText)
  return normalized.startsWith('RU') || normalized === 'R5'
}

/**
 * Get thresholds for a specific structure type and zone.
 * For carports, adjusts area limits based on lot size.
 * Falls back to R2 defaults if zone not found.
 */
export function getThresholds(structureType: string, zoneText: string, lotSizeM2?: number): ZoneThresholds {
  const structureThresholds = THRESHOLDS[structureType as keyof ThresholdsConfig]
  if (!structureThresholds) {
    // Fallback to shed defaults if structure type not found
    return THRESHOLDS.shed.R2
  }
  
  const normalizedZone = normalizeZone(zoneText)
  const zoneThresholds = structureThresholds[normalizedZone as keyof StructureThresholds]
  if (!zoneThresholds) {
    // Fallback to R2 defaults if zone not found
    return structureThresholds.R2
  }
  
  // For carports, adjust area limits based on lot size
  if (structureType === 'carport' && lotSizeM2 !== undefined) {
    const lotSize = Number(lotSizeM2)
    const isRural = isRuralZone(zoneText)
    
    let adjustedAreaMax = zoneThresholds.areaMax
    
    if (isRural) {
      // Rural zones: ≤50m² if lot >300m², ≤20m² if ≤300m²
      adjustedAreaMax = lotSize > 300 ? 50 : 20
    } else {
      // Residential zones: ≤25m² if lot >300m², ≤20m² if ≤300m²
      adjustedAreaMax = lotSize > 300 ? 25 : 20
    }
    
    return {
      ...zoneThresholds,
      areaMax: adjustedAreaMax
    }
  }
  
  return zoneThresholds
}

