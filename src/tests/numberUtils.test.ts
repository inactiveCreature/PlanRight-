import { describe, it, expect } from 'vitest'
import { parseNumber, formatNumber, isValidDecimal, sanitizeDecimalInput, isInRange } from '../utils/numberUtils'

describe('Decimal-Safe Number Handling', () => {
  describe('parseNumber', () => {
    it('should preserve decimals correctly', () => {
      expect(parseNumber('0.9')).toBe(0.9)
      expect(parseNumber('1.5')).toBe(1.5)
      expect(parseNumber('2.4')).toBe(2.4)
      expect(parseNumber('5.0')).toBe(5.0)
    })

    it('should handle integers', () => {
      expect(parseNumber('5')).toBe(5)
      expect(parseNumber('10')).toBe(10)
      expect(parseNumber('0')).toBe(0)
    })

    it('should handle negative numbers', () => {
      expect(parseNumber('-1.5')).toBe(-1.5)
      expect(parseNumber('-5')).toBe(-5)
    })

    it('should handle empty and whitespace inputs', () => {
      expect(parseNumber('')).toBeUndefined()
      expect(parseNumber('   ')).toBeUndefined()
      expect(parseNumber(' 0.9 ')).toBe(0.9) // Should trim whitespace
    })

    it('should reject invalid inputs', () => {
      expect(parseNumber('abc')).toBeUndefined()
      expect(parseNumber('1.2.3')).toBeUndefined()
      expect(parseNumber('1.2a')).toBeUndefined()
      expect(parseNumber('--1')).toBeUndefined()
    })

    it('should handle edge cases', () => {
      expect(parseNumber('0.')).toBeUndefined() // Incomplete decimal
      expect(parseNumber('.5')).toBe(0.5) // Valid decimal starting with dot
      expect(parseNumber('1.')).toBeUndefined() // Incomplete decimal
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with appropriate decimals', () => {
      expect(formatNumber(0.9)).toBe('0.9')
      expect(formatNumber(1.0)).toBe('1')
      expect(formatNumber(2.4)).toBe('2.4')
      expect(formatNumber(5.00)).toBe('5')
    })

    it('should handle undefined and NaN', () => {
      expect(formatNumber(undefined)).toBe('')
      expect(formatNumber(NaN)).toBe('')
    })

    it('should respect decimal places parameter', () => {
      expect(formatNumber(1.234, 2)).toBe('1.23')
      expect(formatNumber(1.234, 0)).toBe('1')
    })
  })

  describe('isValidDecimal', () => {
    it('should validate decimal numbers', () => {
      expect(isValidDecimal('0.9')).toBe(true)
      expect(isValidDecimal('1.5')).toBe(true)
      expect(isValidDecimal('5')).toBe(true)
      expect(isValidDecimal('0')).toBe(true)
    })

    it('should reject invalid inputs', () => {
      expect(isValidDecimal('abc')).toBe(false)
      expect(isValidDecimal('1.2.3')).toBe(false)
      expect(isValidDecimal('1.2a')).toBe(false)
    })

    it('should allow empty input', () => {
      expect(isValidDecimal('')).toBe(true)
      expect(isValidDecimal('   ')).toBe(true)
    })
  })

  describe('sanitizeDecimalInput', () => {
    it('should remove invalid characters', () => {
      expect(sanitizeDecimalInput('1a2b3')).toBe('123')
      expect(sanitizeDecimalInput('1.2.3')).toBe('1.2.3') // Preserves multiple dots for validation
      expect(sanitizeDecimalInput('1-2-3')).toBe('1-2-3') // Preserves multiple minus signs for validation
    })

    it('should preserve valid characters', () => {
      expect(sanitizeDecimalInput('123.45')).toBe('123.45')
      expect(sanitizeDecimalInput('-123.45')).toBe('-123.45')
      expect(sanitizeDecimalInput('0.9')).toBe('0.9')
    })
  })

  describe('isInRange', () => {
    it('should check if number is within range', () => {
      expect(isInRange(5, 0, 10)).toBe(true)
      expect(isInRange(0, 0, 10)).toBe(true)
      expect(isInRange(10, 0, 10)).toBe(true)
      expect(isInRange(-1, 0, 10)).toBe(false)
      expect(isInRange(11, 0, 10)).toBe(false)
    })

    it('should handle undefined bounds', () => {
      expect(isInRange(5, 0)).toBe(true)
      expect(isInRange(5, undefined, 10)).toBe(true)
      expect(isInRange(5)).toBe(true)
    })

    it('should handle undefined and NaN values', () => {
      expect(isInRange(undefined, 0, 10)).toBe(false)
      expect(isInRange(NaN, 0, 10)).toBe(false)
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle the "0.9 becomes 9" issue', () => {
      // This was the original problem - 0.9 should stay 0.9
      const input = '0.9'
      const parsed = parseNumber(input)
      expect(parsed).toBe(0.9)
      
      // Should format back to 0.9
      const formatted = formatNumber(parsed)
      expect(formatted).toBe('0.9')
    })

    it('should handle setback values correctly', () => {
      const setbacks = ['0.9', '1.5', '5.0', '12.0']
      setbacks.forEach(setback => {
        const parsed = parseNumber(setback)
        expect(parsed).toBe(parseFloat(setback))
        expect(formatNumber(parsed)).toBe(setback.replace(/\.0$/, ''))
      })
    })

    it('should handle area calculations', () => {
      const length = parseNumber('3.0')
      const width = parseNumber('2.4')
      const area = (length || 0) * (width || 0)
      
      expect(length).toBe(3.0)
      expect(width).toBe(2.4)
      expect(area).toBeCloseTo(7.2, 1) // Use toBeCloseTo for floating point comparison
      expect(formatNumber(area)).toBe('7.2')
    })

    it('should handle partial input during typing', () => {
      // User typing "0." should be preserved for further input
      const partial = '0.'
      const sanitized = sanitizeDecimalInput(partial)
      expect(sanitized).toBe('0.')
      
      // But parseNumber should reject it as incomplete
      const parsed = parseNumber(partial)
      expect(parsed).toBeUndefined()
    })
  })
})
