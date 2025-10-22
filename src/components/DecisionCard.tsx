import type { RuleResult } from '../types'
import { getRoleSpecificNextSteps, type UserRole } from '../utils/roleCopy'

/** Decision Card matching exact format from system prompt requirements. */
export default function DecisionCard({
  result,
  role = 'Resident',
}: {
  result: RuleResult | null
  role?: UserRole
}) {
  if (!result) return null

  const isExempt = result.decision === 'Likely Exempt'
  const isNotExempt = result.decision === 'Likely Not Exempt'

  // Get unique clause references for the references section
  const uniqueClauses = [...new Set(result.checks.map((c) => c.clause_ref))].sort()

  // Generate role-specific next steps
  const getNextSteps = () => {
    // Critical fails: all killer fails + non-killer fails where killer=false and pass=false
    const criticalFails = result.checks.filter((c) => {
      if (!c.pass) {
        // All killer fails are critical
        if (c.killer === true) {
          return true
        }
        // Non-killer fails are also critical
        return true
      }
      return false
    })
    const hasFailures = criticalFails.length > 0

    // Get role-specific next steps
    const roleSteps = getRoleSpecificNextSteps(role, hasFailures)

    if (!hasFailures) {
      return roleSteps
    }

    // Add specific technical steps for failures
    const technicalSteps: string[] = []
    criticalFails.forEach((c) => {
      switch (c.rule_id) {
        case 'G-AREA-1':
          technicalSteps.push('Check area calculation - length × width should match entered area')
          break
        case 'G-SITING-1':
          technicalSteps.push('Relocate structure off easement')
          break
        case 'G-HERITAGE-1':
          technicalSteps.push('Seek council advice - heritage/conservation restrictions apply')
          break
        case 'S-BBL-1':
        case 'P-BBL-1':
        case 'C-BBL-1':
          technicalSteps.push('Ensure structure is behind building line')
          break
        case 'S-FRONT-1':
        case 'P-FRONT-1':
        case 'C-FRONT-1':
          technicalSteps.push('Increase front setback to ≥ 5.0m')
          break
        case 'S-HEIGHT-1':
          technicalSteps.push('Reduce height to ≤ 3.0m')
          break
        case 'S-AREA-1':
          technicalSteps.push('Reduce area to ≤ 20m²')
          break
        case 'S-SIDE-1':
          technicalSteps.push('Increase side setback to ≥ 0.9m')
          break
        case 'S-REAR-1':
          technicalSteps.push('Increase rear setback to ≥ 0.9m')
          break
        case 'S-SEWER-1':
          technicalSteps.push('Relocate structure away from sewer lines')
          break
        case 'S-ATTACH-1':
          technicalSteps.push('Detach shed from dwelling')
          break
        case 'S-FLOOD-1':
          technicalSteps.push('Seek council advice - flood restrictions apply')
          break
        case 'S-BUSHFIRE-1':
          technicalSteps.push('Seek council advice - bushfire restrictions apply')
          break
      }
    })

    // Combine role-specific and technical steps
    return [...technicalSteps, ...roleSteps]
  }

  return (
    <div
      className={`border-2 rounded-2xl p-6 shadow-lg transition-all duration-300 max-w-[960px] mx-auto ${
        isExempt
          ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
          : isNotExempt
            ? 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50'
            : 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50'
      }`}
    >
      {/* DECISION Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div
            className={`p-4 rounded-2xl ${
              isExempt ? 'bg-green-200' : isNotExempt ? 'bg-red-200' : 'bg-amber-200'
            }`}
          >
            {isExempt ? (
              <svg className="w-8 h-8 text-green-800" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : isNotExempt ? (
              <svg className="w-8 h-8 text-red-800" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">DECISION: {result.decision}</h2>
            <p className="text-sm text-slate-600 font-medium">Rules Engine Assessment</p>
          </div>
        </div>
      </div>

      {/* WHY Section */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">WHY (≤6 bullets):</h3>
        <ul className="space-y-2">
          {result.checks.slice(0, 6).map((c) => (
            <li key={c.rule_id} className="flex items-start gap-3">
              <span
                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  c.pass ? 'bg-green-600' : 'bg-red-600'
                }`}
              ></span>
              <span className="text-sm">
                <span className="font-medium">{c.note}</span> —
                <span
                  className={`ml-1 font-semibold ${c.pass ? 'text-green-800' : 'text-red-800'}`}
                >
                  {c.pass ? 'pass' : 'fail'}
                </span>
                <span className="ml-1 text-slate-500">[{c.clause_ref}]</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Critical fails */}
      {result.checks.some((c) => !c.pass) && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-red-800 mb-4">Critical fails (if any):</h3>
          <ul className="space-y-2">
            {result.checks
              .filter((c) => !c.pass)
              .map((c) => (
                <li key={c.rule_id} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-sm text-red-800">
                    {c.rule_id === 'G-AREA-1'
                      ? 'Area calculation mismatch — check length × width'
                      : c.rule_id === 'G-SITING-1'
                        ? 'On easement — relocate off easement'
                        : c.rule_id === 'G-HERITAGE-1'
                          ? 'Heritage/conservation restrictions — seek council advice'
                          : c.rule_id === 'S-BBL-1' ||
                              c.rule_id === 'P-BBL-1' ||
                              c.rule_id === 'C-BBL-1'
                            ? 'Not behind building line — relocate behind building line'
                            : c.rule_id === 'S-FRONT-1' ||
                                c.rule_id === 'P-FRONT-1' ||
                                c.rule_id === 'C-FRONT-1'
                              ? 'Insufficient front setback — increase to ≥5.0m'
                              : c.rule_id === 'S-HEIGHT-1'
                                ? 'Height exceeds 3.0m — reduce height'
                                : c.rule_id === 'S-AREA-1'
                                  ? 'Area exceeds 20m² — reduce area'
                                  : c.rule_id === 'S-SIDE-1'
                                    ? 'Insufficient side setback — increase to ≥0.9m'
                                    : c.rule_id === 'S-REAR-1'
                                      ? 'Insufficient rear setback — increase to ≥0.9m'
                                      : c.rule_id === 'S-SEWER-1'
                                        ? 'Over sewer — relocate away from sewer'
                                        : c.rule_id === 'S-ATTACH-1'
                                          ? 'Shed attached to dwelling — detach'
                                          : c.rule_id === 'S-FLOOD-1'
                                            ? 'Flood prone — seek council advice'
                                            : c.rule_id === 'S-BUSHFIRE-1'
                                              ? 'Bushfire prone — seek council advice'
                                              : 'Compliance issue — seek council advice'}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Next steps:</h3>
        <ul className="space-y-1">
          {getNextSteps().map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* References */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">References:</h3>
        <p className="text-sm text-slate-700">
          SEPP (Exempt Development) 2008, Part 2 — {uniqueClauses.join(', ')}
        </p>
      </div>

      {/* Missing Information Section */}
      {result.errors.length > 0 && (
        <div className="mt-8 p-4 bg-red-50 border-2 border-red-300 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5 text-red-800" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h5 className="font-bold text-red-800">Missing Information</h5>
          </div>
          <ul className="text-sm text-red-800 space-y-1">
            {result.errors.map((error, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
