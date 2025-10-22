/**
 * Invariants and assertion helpers for the rules engine
 * Ensures critical business rules are enforced with typed errors
 */

export class EngineError extends Error {
  constructor(
    public ruleId: string,
    public clauseRef: string,
    message: string,
    public field?: string
  ) {
    super(message)
    this.name = 'EngineError'
  }
}

/**
 * Assert that a numeric value is non-negative
 */
export function assertNonNegative(value: number, field: string): void {
  if (value < 0) {
    throw new EngineError(
      'VALIDATION',
      '2.6(1)/2.9(1)/2.10(1)',
      `${field} cannot be negative: ${value}`,
      field
    )
  }
}

/**
 * Assert that a numeric value is positive
 */
export function assertPositive(value: number, field: string): void {
  if (value <= 0) {
    throw new EngineError(
      'VALIDATION',
      '2.6(1)/2.9(1)/2.10(1)',
      `${field} must be positive: ${value}`,
      field
    )
  }
}

/**
 * Assert that a value is not NaN or Infinity
 */
export function assertFinite(value: number, field: string): void {
  if (!isFinite(value)) {
    throw new EngineError(
      'VALIDATION',
      '2.6(1)/2.9(1)/2.10(1)',
      `${field} must be a finite number: ${value}`,
      field
    )
  }
}

/**
 * Assert that height is within valid range
 */
export function assertHeightValid(height: number, ruleId: string, clauseRef: string): void {
  assertFinite(height, 'height_m')
  assertNonNegative(height, 'height_m')
  if (height > 10) {
    // Reasonable upper bound
    throw new EngineError(ruleId, clauseRef, `Height ${height}m exceeds reasonable maximum of 10m`)
  }
}

/**
 * Assert that area is within valid range
 */
export function assertAreaValid(area: number, ruleId: string, clauseRef: string): void {
  assertFinite(area, 'area_m2')
  assertPositive(area, 'area_m2')
  if (area > 200) {
    // Reasonable upper bound
    throw new EngineError(ruleId, clauseRef, `Area ${area}m² exceeds reasonable maximum of 200m²`)
  }
}

/**
 * Assert that setback is non-negative
 */
export function assertSetbackValid(
  setback: number,
  field: string,
  ruleId: string,
  clauseRef: string
): void {
  assertFinite(setback, field)
  assertNonNegative(setback, field)
  if (setback > 50) {
    // Reasonable upper bound
    throw new EngineError(
      ruleId,
      clauseRef,
      `${field} ${setback}m exceeds reasonable maximum of 50m`
    )
  }
}

/**
 * Assert that zone is valid
 */
export function assertZoneValid(zoneText: string): void {
  const validZones = ['R1', 'R2', 'R3', 'R4', 'R5', 'RU1', 'RU2', 'RU3', 'RU4', 'RU5', 'RU6']
  if (!validZones.includes(zoneText)) {
    throw new EngineError(
      'VALIDATION',
      '2.6(1)/2.9(1)/2.10(1)',
      `Invalid zone: ${zoneText}. Must be one of: ${validZones.join(', ')}`,
      'property.zone_text'
    )
  }
}

/**
 * Assert that structure type is valid
 */
export function assertStructureTypeValid(structureType: string): void {
  const validTypes = ['shed', 'patio', 'carport']
  if (!validTypes.includes(structureType)) {
    throw new EngineError(
      'VALIDATION',
      '2.6(1)/2.9(1)/2.10(1)',
      `Invalid structure type: ${structureType}. Must be one of: ${validTypes.join(', ')}`,
      'structure.type'
    )
  }
}

/**
 * Assert that area calculation matches input within tolerance
 */
export function assertAreaCalculationValid(
  length: number,
  width: number,
  inputArea: number,
  tolerance: number = 0.1
): void {
  const calculatedArea = length * width
  const difference = Math.abs(inputArea - calculatedArea)

  if (difference > tolerance) {
    throw new EngineError(
      'G-AREA-1',
      '2.6(1)(b)/2.9(1)(b)/2.10(1)(b)',
      `Area calculation mismatch: calculated=${calculatedArea.toFixed(2)}m² vs input=${inputArea.toFixed(2)}m² (difference=${difference.toFixed(2)}m² > tolerance=${tolerance}m²)`
    )
  }
}

/**
 * Assert that behind building line logic is correct
 */
export function assertBehindBuildingLineLogic(
  behindBuildingLine: boolean,
  frontSetback: number,
  minFrontSetback: number,
  ruleId: string,
  clauseRef: string
): void {
  if (!behindBuildingLine && frontSetback < minFrontSetback) {
    throw new EngineError(
      ruleId,
      clauseRef,
      `Structure not behind building line but front setback ${frontSetback}m < required ${minFrontSetback}m`
    )
  }
}

/**
 * Assert that easement clearance is adequate
 */
export function assertEasementClearance(
  easementExists: boolean,
  sideSetback: number,
  rearSetback: number,
  minClearance: number = 1.0
): void {
  if (easementExists && (sideSetback < minClearance || rearSetback < minClearance)) {
    throw new EngineError(
      'G-EASEMENT-1',
      '2.6(1)(e)/2.9(1)(e)/2.10(1)(e)',
      `Easement exists but structure within ${minClearance}m clearance: side=${sideSetback}m, rear=${rearSetback}m`
    )
  }
}

/**
 * Assert that heritage/conservation restrictions are not violated
 */
export function assertHeritageCompliance(heritageItem: boolean, conservationArea: boolean): void {
  if (heritageItem || conservationArea) {
    throw new EngineError(
      'G-HERITAGE-1',
      '2.6(2)/2.9(2)/2.10(2)',
      `Development not exempt: heritage_item=${heritageItem}, conservation_area=${conservationArea}`
    )
  }
}

/**
 * Assert that structure is not on easement
 */
export function assertNotOnEasement(onEasement: boolean): void {
  if (onEasement) {
    throw new EngineError(
      'G-SITING-1',
      '2.6(1)(e)/2.9(1)(e)/2.10(1)(e)',
      'Structure cannot be located on easement'
    )
  }
}

/**
 * Assert that structure is not over sewer
 */
export function assertNotOverSewer(overSewer: boolean, ruleId: string, clauseRef: string): void {
  if (overSewer) {
    throw new EngineError(ruleId, clauseRef, 'Structure cannot be located over sewer main')
  }
}

/**
 * Assert that shed is detached from dwelling
 */
export function assertShedDetached(attachedToDwelling: boolean): void {
  if (attachedToDwelling) {
    throw new EngineError('S-ATTACH-1', '2.9(1)(f)', 'Shed must be detached from dwelling')
  }
}

/**
 * Assert that structure is not flood prone
 */
export function assertNotFloodProne(floodProne: boolean, ruleId: string, clauseRef: string): void {
  if (floodProne) {
    throw new EngineError(ruleId, clauseRef, 'Development not exempt: land is flood prone')
  }
}

/**
 * Assert that structure is not bushfire prone
 */
export function assertNotBushfireProne(
  bushfireProne: boolean,
  ruleId: string,
  clauseRef: string
): void {
  if (bushfireProne) {
    throw new EngineError(ruleId, clauseRef, 'Development not exempt: land is bushfire prone')
  }
}

/**
 * Assert that area is within limits for zone and structure type
 */
export function assertAreaWithinLimits(
  area: number,
  maxArea: number,
  ruleId: string,
  clauseRef: string
): void {
  if (area > maxArea) {
    throw new EngineError(
      ruleId,
      clauseRef,
      `Area ${area.toFixed(1)}m² exceeds maximum ${maxArea}m²`
    )
  }
}

/**
 * Assert that height is within limits
 */
export function assertHeightWithinLimits(
  height: number,
  maxHeight: number,
  ruleId: string,
  clauseRef: string
): void {
  if (height > maxHeight) {
    throw new EngineError(ruleId, clauseRef, `Height ${height}m exceeds maximum ${maxHeight}m`)
  }
}

/**
 * Assert that setback meets minimum requirements
 */
export function assertSetbackMeetsMinimum(
  setback: number,
  minSetback: number,
  field: string,
  ruleId: string,
  clauseRef: string
): void {
  if (setback < minSetback) {
    throw new EngineError(
      ruleId,
      clauseRef,
      `${field} ${setback}m is less than minimum ${minSetback}m`
    )
  }
}
