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
    R1: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R2: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R3: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R4: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R5: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU1: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU2: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU3: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU4: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU5: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU6: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
  },
  patio: {
    R1: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R2: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R3: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R4: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R5: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU1: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU2: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU3: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU4: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU5: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU6: { areaMax: 20, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
  },
  carport: {
    R1: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R2: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R3: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R4: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    R5: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU1: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU2: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU3: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU4: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU5: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
    RU6: { areaMax: 30, frontMin: 5, sideMin: 0.9, rearMin: 0.9, heightMax: 3.0 },
  },
}

/**
 * Get thresholds for a specific structure type and zone.
 * Falls back to R2 defaults if zone not found.
 */
export function getThresholds(structureType: string, zoneText: string): ZoneThresholds {
  const structureThresholds = THRESHOLDS[structureType as keyof ThresholdsConfig]
  if (!structureThresholds) {
    // Fallback to shed defaults if structure type not found
    return THRESHOLDS.shed.R2
  }
  
  const zoneThresholds = structureThresholds[zoneText as keyof StructureThresholds]
  if (!zoneThresholds) {
    // Fallback to R2 defaults if zone not found
    return structureThresholds.R2
  }
  
  return zoneThresholds
}

