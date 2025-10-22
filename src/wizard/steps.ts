import { z } from 'zod'

// Step IDs
export type StepId =
  | 'start'
  | 'property'
  | 'structure'
  | 'dimensions'
  | 'location'
  | 'siting'
  | 'context'
  | 'review'

// Numeric string coercion helper
const nz = z.preprocess((v) => {
  if (v === '' || v === null || v === undefined) return undefined
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : v
  }
  return v
}, z.number().nonnegative())

// Validation schemas for each step
const startSchema = z.object({
  role: z.enum(['Resident', 'Builder', 'Purchaser', 'Planner', 'Student']),
})

const propertySchema = z.object({
  zone_text: z.enum(['R1', 'R2', 'R3'], {
    errorMap: () => ({ message: 'Zone is required' }),
  }),
  lot_size_m2: nz.refine((val) => val !== undefined, {
    message: 'Lot size must be 0 or greater',
  }),
  frontage_m: nz.refine((val) => val !== undefined, {
    message: 'Frontage must be 0 or greater',
  }),
  corner_lot_bool: z.boolean(),
  easement_bool: z.boolean(),
})

const structureSchema = z.object({
  type: z.enum(['shed', 'patio', 'carport'], {
    errorMap: () => ({ message: 'Structure type is required' }),
  }),
})

const dimensionsSchema = z.object({
  length_m: nz.refine((val) => val !== undefined, {
    message: 'Length must be 0 or greater',
  }),
  width_m: nz.refine((val) => val !== undefined, {
    message: 'Width must be 0 or greater',
  }),
  height_m: nz.refine((val) => val !== undefined, {
    message: 'Height must be 0 or greater',
  }),
  area_m2: nz.optional(),
})

const locationSchema = z
  .object({
    behind_building_line_bool: z.boolean(),
    setback_side_m: nz.refine((val) => val !== undefined, {
      message: 'Side setback must be 0 or greater',
    }),
    setback_rear_m: nz.refine((val) => val !== undefined, {
      message: 'Rear setback must be 0 or greater',
    }),
    setback_front_m: nz.optional(),
  })
  .refine(
    (data) => {
      // If not behind building line, front setback is required
      if (!data.behind_building_line_bool) {
        return data.setback_front_m !== undefined && data.setback_front_m >= 0
      }
      return true
    },
    {
      message: 'Front setback is required when not behind building line',
      path: ['setback_front_m'],
    }
  )

const sitingSchema = z.object({
  on_easement_bool: z.boolean(),
  over_sewer_bool: z.boolean(),
  attached_to_dwelling_bool: z.boolean(),
})

const contextSchema = z.object({
  heritage_item_bool: z.boolean(),
  conservation_area_bool: z.boolean(),
  flood_prone_bool: z.boolean(),
  bushfire_bool: z.boolean(),
})

// Schema mapping
const schemas = {
  start: startSchema,
  property: propertySchema,
  structure: structureSchema,
  dimensions: dimensionsSchema,
  location: locationSchema,
  siting: sitingSchema,
  context: contextSchema,
  review: z.object({}), // Review is computed based on other steps
}

// Field path mappings for friendly error messages
export const fieldLabels: Record<string, string> = {
  role: 'Role',
  zone_text: 'Zone',
  lot_size_m2: 'Lot Size',
  frontage_m: 'Frontage',
  corner_lot_bool: 'Corner Lot',
  easement_bool: 'Easement',
  type: 'Structure Type',
  length_m: 'Length',
  width_m: 'Width',
  height_m: 'Height',
  area_m2: 'Area',
  behind_building_line_bool: 'Behind Building Line',
  setback_front_m: 'Front Setback',
  setback_side_m: 'Side Setback',
  setback_rear_m: 'Rear Setback',
  on_easement_bool: 'On Easement',
  over_sewer_bool: 'Over Sewer',
  attached_to_dwelling_bool: 'Attached to Dwelling',
  heritage_item_bool: 'Heritage Item',
  conservation_area_bool: 'Conservation Area',
  flood_prone_bool: 'Flood Prone',
  bushfire_bool: 'Bushfire Prone',
}

// Required paths for each step (for error mapping)
export const requiredPaths: Record<StepId, string[]> = {
  start: ['role'],
  property: ['zone_text', 'lot_size_m2', 'frontage_m', 'corner_lot_bool', 'easement_bool'],
  structure: ['type'],
  dimensions: ['length_m', 'width_m', 'height_m'],
  location: ['behind_building_line_bool', 'setback_side_m', 'setback_rear_m'],
  siting: ['on_easement_bool', 'over_sewer_bool', 'attached_to_dwelling_bool'],
  context: ['heritage_item_bool', 'conservation_area_bool', 'flood_prone_bool', 'bushfire_bool'],
  review: [],
}

export interface ValidationResult {
  valid: boolean
  errors: Array<{
    path: string
    message: string
  }>
}

export function validateStep(stepId: StepId, data: any): ValidationResult {
  if (stepId === 'review') {
    // Review step is complete only if all prior steps are valid
    const priorSteps: StepId[] = [
      'start',
      'property',
      'structure',
      'dimensions',
      'location',
      'siting',
      'context',
    ]
    const allValid = priorSteps.every((step) => validateStep(step, data).valid)
    return {
      valid: allValid,
      errors: allValid ? [] : [{ path: 'review', message: 'All previous steps must be completed' }],
    }
  }

  const schema = schemas[stepId]
  if (!schema) {
    return { valid: false, errors: [{ path: stepId, message: 'Unknown step' }] }
  }

  try {
    // Extract the relevant data for this step
    let dataToValidate: any
    if (stepId === 'start') {
      dataToValidate = { role: data.role }
    } else {
      dataToValidate = data[stepId]
    }

    schema.parse(dataToValidate)
    return { valid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((err) => ({
          path: `${stepId}.${err.path.join('.')}`,
          message: err.message,
        })),
      }
    }
    return { valid: false, errors: [{ path: stepId, message: 'Validation error' }] }
  }
}

// Helper to get friendly error messages
export function getFriendlyErrorMessage(path: string, message: string): string {
  const fieldName = fieldLabels[path] || path
  return `${fieldName}: ${message}`
}

// Helper to check if a specific field has an error
export function isFieldError(stepId: StepId, fieldPath: string, data: any): boolean {
  const result = validateStep(stepId, data)
  return result.errors.some((error) => error.path === fieldPath)
}
