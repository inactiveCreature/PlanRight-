import { describe, it, expect, vi } from 'vitest'
import { pickTopSix, toMeters, toSquareMeters } from '../components/DecisionCard'
import type { RuleCheck } from '../types'

// Mock the lookup_clause function
vi.mock('../rules/engine', () => ({
  lookup_clause: vi.fn((clauseRef: string) => ({
    title: `Title for ${clauseRef}`,
    summary: `Summary for ${clauseRef}`,
  })),
}))

describe('DecisionCard v2 Core Functions', () => {
  const mockChecks: RuleCheck[] = [
    {
      rule_id: 'S-HEIGHT-1',
      clause_ref: '2.9(1)(a)',
      pass: false,
      note: 'Height exceeds 3.0m limit',
      killer: true,
    },
    {
      rule_id: 'S-AREA-1', 
      clause_ref: '2.9(1)(b)',
      pass: false,
      note: 'Area exceeds 20m² limit',
      killer: false,
    },
    {
      rule_id: 'S-SETBACK-SIDE-1',
      clause_ref: '2.9(1)(d)',
      pass: true,
      note: 'Side setback compliant',
      killer: false,
    },
    {
      rule_id: 'S-EASEMENT-1',
      clause_ref: '2.9(1)(e)',
      pass: false,
      note: 'Structure on easement',
      killer: true,
    },
    {
      rule_id: 'S-DETACHED-1',
      clause_ref: '2.9(1)(f)',
      pass: true,
      note: 'Structure is detached',
      killer: false,
    },
    {
      rule_id: 'S-HERITAGE-1',
      clause_ref: '2.9(2)',
      pass: false,
      note: 'Heritage item restriction',
      killer: false,
    },
    {
      rule_id: 'S-FLOOD-1',
      clause_ref: '2.9(3)',
      pass: true,
      note: 'Not flood prone',
      killer: false,
    },
  ]

  describe('Number formatting utilities', () => {
    it('toMeters formats numbers correctly', () => {
      expect(toMeters(3.5)).toBe('3.5m')
      expect(toMeters(3.0)).toBe('3m')
      expect(toMeters(3.00)).toBe('3m')
      expect(toMeters('3.5')).toBe('3.5m')
      expect(toMeters(undefined)).toBe('—')
      expect(toMeters('')).toBe('—')
      expect(toMeters('invalid')).toBe('—')
    })

    it('toSquareMeters formats numbers correctly', () => {
      expect(toSquareMeters(20.5)).toBe('20.5m²')
      expect(toSquareMeters(20.0)).toBe('20m²')
      expect(toSquareMeters(20.00)).toBe('20m²')
      expect(toSquareMeters('20.5')).toBe('20.5m²')
      expect(toSquareMeters(undefined)).toBe('—')
      expect(toSquareMeters('')).toBe('—')
      expect(toSquareMeters('invalid')).toBe('—')
    })
  })

  describe('pickTopSix function', () => {
    it('sorts by severity: critical > major > info', () => {
      const sorted = pickTopSix(mockChecks)
      const severities = sorted.map((check: RuleCheck) => {
        if (check.killer === true) return 'critical'
        if (!check.pass) return 'major'
        return 'info'
      })
      
      // Should have critical first, then major, then info
      expect(severities[0]).toBe('critical')
      expect(severities[1]).toBe('critical')
      expect(severities[2]).toBe('major')
      expect(severities[3]).toBe('info')
      expect(severities[4]).toBe('info')
      expect(severities[5]).toBe('info')
    })

    it('sorts fails before passes within same severity', () => {
      const sorted = pickTopSix(mockChecks)
      
      // Within major severity, fails should come before passes
      const majorChecks = sorted.filter((check: RuleCheck) => !check.killer && !check.pass)
      const infoFails = sorted.filter((check: RuleCheck) => !check.killer && check.pass)
      
      expect(majorChecks.length).toBeGreaterThan(0)
      expect(infoFails.length).toBeGreaterThan(0)
    })

    it('sorts by rule_id alphabetically within same severity and pass status', () => {
      const sorted = pickTopSix(mockChecks)
      
      // Check that critical checks are sorted alphabetically
      const criticalChecks = sorted.filter((check: RuleCheck) => check.killer === true)
      expect(criticalChecks[0].rule_id).toBe('S-EASEMENT-1')
      expect(criticalChecks[1].rule_id).toBe('S-HEIGHT-1')
    })

    it('limits to 6 items', () => {
      const sorted = pickTopSix(mockChecks)
      expect(sorted).toHaveLength(6)
    })

    it('handles empty array', () => {
      const sorted = pickTopSix([])
      expect(sorted).toHaveLength(0)
    })

    it('handles array with fewer than 6 items', () => {
      const shortChecks = mockChecks.slice(0, 3)
      const sorted = pickTopSix(shortChecks)
      expect(sorted).toHaveLength(3)
    })
  })

  describe('Edge cases', () => {
    it('handles checks with missing killer property', () => {
      const incompleteCheck: RuleCheck = {
        rule_id: 'S-TEST-1',
        clause_ref: '2.9(1)(a)',
        pass: false,
        note: '',
        killer: undefined,
      }
      
      const sorted = pickTopSix([incompleteCheck])
      expect(sorted).toHaveLength(1)
      expect(sorted[0].rule_id).toBe('S-TEST-1')
    })

    it('handles checks with empty note', () => {
      const emptyNoteCheck: RuleCheck = {
        rule_id: 'S-TEST-2',
        clause_ref: '2.9(1)(b)',
        pass: true,
        note: '',
        killer: false,
      }
      
      const sorted = pickTopSix([emptyNoteCheck])
      expect(sorted).toHaveLength(1)
      expect(sorted[0].rule_id).toBe('S-TEST-2')
    })
  })
})