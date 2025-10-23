/**
 * UI-safe thresholds and requirements for setback calculations
 * These values should match the engine constants to avoid duplication
 */

export interface SetbackRequirements {
  front: number
  side: number
  rear: number
}

export type BuildingLineRequirement = 'required' | 'rural-exception'

/**
 * Get minimum setback requirements for a given zone
 * @param zoneText - Zone text from property data
 * @returns Minimum setback requirements
 */
export const getMinSetback = (zoneText: string): SetbackRequirements => {
  const zone = zoneText?.toLowerCase() || ''
  
  // Residential zones (R1, R2, R3, R4, R5)
  if (zone.includes('r1') || zone.includes('r2') || zone.includes('r3') || zone.includes('r4') || zone.includes('r5')) {
    return {
      front: 4.5,
      side: 0.9,
      rear: 0.9
    }
  }
  
  // Rural zones (RU1, RU2, RU3, RU4, RU5)
  if (zone.includes('ru1') || zone.includes('ru2') || zone.includes('ru3') || zone.includes('ru4') || zone.includes('ru5')) {
    return {
      front: 9.0,
      side: 0.9,
      rear: 0.9
    }
  }
  
  // Industrial zones (IN1, IN2, IN3, IN4)
  if (zone.includes('in1') || zone.includes('in2') || zone.includes('in3') || zone.includes('in4')) {
    return {
      front: 6.0,
      side: 0.9,
      rear: 0.9
    }
  }
  
  // Commercial zones (B1, B2, B3, B4, B5, B6, B7)
  if (zone.includes('b1') || zone.includes('b2') || zone.includes('b3') || zone.includes('b4') || zone.includes('b5') || zone.includes('b6') || zone.includes('b7')) {
    return {
      front: 0.0,
      side: 0.0,
      rear: 0.0
    }
  }
  
  // Default fallback
  return {
    front: 4.5,
    side: 0.9,
    rear: 0.9
  }
}

/**
 * Get building line requirement for a given zone
 * @param zoneText - Zone text from property data
 * @returns Building line requirement type
 */
export const getBuildingLineRequirement = (zoneText: string): BuildingLineRequirement => {
  const zone = zoneText?.toLowerCase() || ''
  
  // Rural zones have different building line requirements
  if (zone.includes('ru1') || zone.includes('ru2') || zone.includes('ru3') || zone.includes('ru4') || zone.includes('ru5')) {
    return 'rural-exception'
  }
  
  // All other zones require building line compliance
  return 'required'
}
