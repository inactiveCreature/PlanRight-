/**
 * Unit formatting utilities for consistent display of measurements
 */

/**
 * Format a number as meters with proper precision
 * @param n - Number to format
 * @returns Formatted string with "m" suffix
 */
export const fmtMeters = (n: number): string => {
  if (n === undefined || n === null || isNaN(n)) return '—'
  return `${n.toFixed(2).replace(/\.00$/, '')} m`
}

/**
 * Format a number as square meters with proper precision
 * @param n - Number to format
 * @returns Formatted string with "m²" suffix
 */
export const fmtSqm = (n: number): string => {
  if (n === undefined || n === null || isNaN(n)) return '—'
  return `${n.toFixed(2).replace(/\.00$/, '')} m²`
}

/**
 * Format dimensions as length × width × height
 * @param L - Length in meters
 * @param W - Width in meters
 * @param H - Height in meters
 * @returns Formatted dimensions string
 */
export const fmtDims = (L: number, W: number, H: number): string => {
  const length = fmtMeters(L)
  const width = fmtMeters(W)
  const height = fmtMeters(H)
  return `L ${length} × W ${width} × H ${height}`
}

/**
 * Convert string to title case
 * @param str - String to convert
 * @returns Title case string
 */
export const toTitleCase = (str: string): string => {
  if (!str) return '—'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
