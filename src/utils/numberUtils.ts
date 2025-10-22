/**
 * Decimal-safe number parsing utilities
 * Handles edge cases like "0.9" staying "0.9" instead of becoming "9"
 */

/**
 * Parse a string input to a number, preserving decimals and rejecting junk
 * @param input - String input from user
 * @returns number if valid, undefined if invalid
 */
export function parseNumber(input: string): number | undefined {
  if (!input || input.trim() === '') {
    return undefined
  }

  // Remove any whitespace
  const trimmed = input.trim()

  // Handle empty string after trimming
  if (trimmed === '') {
    return undefined
  }

  // Parse as float to preserve decimals
  const parsed = parseFloat(trimmed)

  // Check if parsing resulted in NaN
  if (isNaN(parsed)) {
    return undefined
  }

  // Check if the original string represents a valid number
  // This prevents cases like "0.9" becoming "9" or "1.2.3" being accepted
  const isValidNumberString = /^-?\d*\.?\d+$/.test(trimmed)

  if (!isValidNumberString) {
    return undefined
  }

  return parsed
}

/**
 * Format a number for display, preserving decimals when appropriate
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string
 */
export function formatNumber(value: number | undefined, decimals: number = 1): string {
  if (value === undefined || isNaN(value)) {
    return ''
  }

  // Use toFixed to preserve decimal places, then remove trailing zeros
  const formatted = value.toFixed(decimals)

  // Remove trailing zeros and decimal point if not needed
  return formatted.replace(/\.?0+$/, '')
}

/**
 * Validate that a string represents a valid decimal number
 * @param input - String to validate
 * @returns true if valid decimal number
 */
export function isValidDecimal(input: string): boolean {
  if (!input || input.trim() === '') {
    return true // Empty is valid (will be handled by required validation)
  }

  const trimmed = input.trim()

  // Must match decimal number pattern
  const decimalPattern = /^-?\d*\.?\d+$/

  if (!decimalPattern.test(trimmed)) {
    return false
  }

  // Must be parseable as a number
  const parsed = parseFloat(trimmed)
  return !isNaN(parsed)
}

/**
 * Sanitize input to only allow valid decimal characters
 * @param input - Raw input string
 * @returns Sanitized string with only valid decimal characters
 */
export function sanitizeDecimalInput(input: string): string {
  // Allow digits, decimal point, and minus sign
  return input.replace(/[^0-9.-]/g, '')
}

/**
 * Check if a number is within valid range
 * @param value - Number to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns true if within range
 */
export function isInRange(value: number | undefined, min?: number, max?: number): boolean {
  if (value === undefined || isNaN(value)) {
    return false
  }

  if (min !== undefined && value < min) {
    return false
  }

  if (max !== undefined && value > max) {
    return false
  }

  return true
}
