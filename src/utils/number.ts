/**
 * Number formatting utilities for consistent display
 */

export function toMeters(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return `${num.toFixed(2).replace(/\.?0+$/, '')}m`
}

export function toSqm(value: number | string | undefined): string {
  if (value === undefined || value === null || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return `${num.toFixed(2).replace(/\.?0+$/, '')}m²`
}

export function formatNumber(value: number | string | undefined, decimals = 2): string {
  if (value === undefined || value === null || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return num.toFixed(decimals).replace(/\.?0+$/, '')
}
