import { z } from 'zod'

// Base schema for non-negative numbers (can be string or number)
const nonNegativeNumber = z.union([
  z.string().refine(
    (val) => {
      const num = Number(val)
      return !isNaN(num) && num >= 0
    },
    { message: 'Must be a non-negative number' }
  ),
  z.number().min(0, 'Must be non-negative'),
])

// Structure type schema
const structureTypeSchema = z.enum(['shed', 'patio', 'carport'])

// Property schema
const propertySchema = z.object({
  id: z.string(),
  lot_size_m2: nonNegativeNumber,
  zone_text: z.string().min(1, 'Zone is required'),
  frontage_m: nonNegativeNumber,
  corner_lot_bool: z.boolean(),
  easement_bool: z.boolean(),
})

// Structure schema
const structureSchema = z.object({
  type: structureTypeSchema,
})

// Dimensions schema
const dimensionsSchema = z.object({
  length_m: nonNegativeNumber,
  width_m: nonNegativeNumber,
  height_m: nonNegativeNumber,
  area_m2: nonNegativeNumber,
})

// Location schema
const locationSchema = z.object({
  setback_front_m: nonNegativeNumber,
  setback_side_m: nonNegativeNumber,
  setback_rear_m: nonNegativeNumber,
  behind_building_line_bool: z.boolean(),
})

// Siting schema
const sitingSchema = z.object({
  on_easement_bool: z.boolean(),
  over_sewer_bool: z.boolean(),
  attached_to_dwelling_bool: z.boolean(),
})

// Context schema
const contextSchema = z.object({
  heritage_item_bool: z.boolean(),
  conservation_area_bool: z.boolean(),
  flood_prone_bool: z.boolean(),
  bushfire_bool: z.boolean(),
})

// Complete proposal schema
export const proposalSchema = z.object({
  property: propertySchema,
  structure: structureSchema,
  dimensions: dimensionsSchema,
  location: locationSchema,
  siting: sitingSchema,
  context: contextSchema,
})

// Type inference for TypeScript
export type ProposalSchema = z.infer<typeof proposalSchema>

// Validation function with detailed error messages
export function validateProposal(proposal: unknown): { success: boolean; errors: string[] } {
  try {
    proposalSchema.parse(proposal)
    return { success: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.')
        return `${path}: ${err.message}`
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}
