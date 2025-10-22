import { run_rules_assessment } from '../rules/engine'
import { usePlanRightStore } from '../store'
import { validateProposal } from './schema'
import type { RuleResult } from '../types'

/**
 * Unified assessment function that:
 * 1. Reads proposal from store
 * 2. Validates proposal using Zod schema
 * 3. Calls run_rules_assessment if valid
 * 4. Writes result to store
 *
 * Used by both Review button and chat "Run rules" action
 */
export function assess(): RuleResult {
  const store = usePlanRightStore.getState()
  const proposal = store.proposal

  // Step 1: Validate proposal using Zod schema
  const validation = validateProposal(proposal)

  if (!validation.success) {
    // Create a "Cannot assess" result with validation errors
    const result: RuleResult = {
      decision: 'Cannot assess',
      checks: [],
      errors: validation.errors.map((error) => ({
        field: error.split(':')[0] || 'unknown',
        message: error.split(':').slice(1).join(':').trim() || error,
      })),
    }

    // Write result to store
    store.setAssessment(result)
    return result
  }

  // Step 2: Call rules engine with validated proposal
  const result = run_rules_assessment(proposal)

  // Step 3: Write result to store
  store.setAssessment(result)

  return result
}

/**
 * Check if proposal is ready for assessment
 * Returns true if all required fields are present and valid
 */
export function isProposalReady(): boolean {
  const store = usePlanRightStore.getState()
  const proposal = store.proposal

  const validation = validateProposal(proposal)
  return validation.success
}

/**
 * Get validation errors for the current proposal
 * Returns field-specific error messages
 */
export function getProposalValidationErrors(): Record<string, string> {
  const store = usePlanRightStore.getState()
  const proposal = store.proposal

  const validation = validateProposal(proposal)

  if (validation.success) {
    return {}
  }

  // Convert Zod errors to field-specific format
  const fieldErrors: Record<string, string> = {}
  validation.errors.forEach((error) => {
    const [field, ...messageParts] = error.split(':')
    const message = messageParts.join(':').trim()
    fieldErrors[field] = message
  })

  return fieldErrors
}

/**
 * Get the last assessment result from store
 */
export function getLastAssessment(): RuleResult | undefined {
  const store = usePlanRightStore.getState()
  return store.lastAssessment
}
