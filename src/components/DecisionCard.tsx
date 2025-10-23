import { useState, useRef } from 'react'
import type { RuleResult, RuleCheck } from '../types'
import { lookup_clause } from '../rules/engine'
import type { UserRole } from '../utils/roleCopy'
import { generateDecisionCardPDF, generateTextPDF } from '../utils/pdfGenerator'

// Decision color mapping with enhanced visual states
const DECISION_COLORS = {
  'Likely Exempt': {
    ring: 'ring-emerald-300',
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    statusIcon: '✅',
    statusColor: 'text-emerald-700',
    headerBg: 'bg-gradient-to-r from-emerald-100 to-green-100',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-500',
    iconColor: 'text-white',
    border: 'border-emerald-200',
  },
  'Likely Not Exempt': {
    ring: 'ring-red-300', 
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    statusIcon: '❌',
    statusColor: 'text-red-700',
    headerBg: 'bg-gradient-to-r from-red-100 to-rose-100',
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-500',
    iconColor: 'text-white',
    border: 'border-red-200',
  },
  'Cannot assess': {
    ring: 'ring-amber-300',
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50', 
    statusIcon: '⚠️',
    statusColor: 'text-amber-700',
    headerBg: 'bg-gradient-to-r from-amber-100 to-yellow-100',
    iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-500',
    iconColor: 'text-white',
    border: 'border-amber-200',
  },
}

// Check label normalization
function normalizeCheckLabel(check: RuleCheck): string {
  const { rule_id, note } = check
  
  // Map known patterns to user-friendly labels with clear explanations
  const labelMappings: Record<string, string> = {
    'on_easement': 'Cannot build on easement',
    'over_sewer': 'Cannot build over sewer lines',
    'behind_building_line': 'Must be behind building line',
    'setback_front': 'Front setback distance required',
    'setback_side': 'Side setback distance required', 
    'setback_rear': 'Rear setback distance required',
    'height_max': 'Maximum height limit',
    'area_max': 'Maximum floor area limit',
    'heritage_item': 'Heritage item protection zone',
    'conservation_area': 'Conservation area restrictions',
    'flood_prone': 'Flood prone area limitations',
    'bushfire_prone': 'Bushfire prone area requirements',
    'attached_to_dwelling': 'Must attach to main dwelling',
    'shipping_container': 'Shipping containers not allowed',
    'non_combustible': 'Non-combustible materials required',
    'roof_clearance': 'Roof boundary clearance needed',
    'class_7a': 'Class 7a buildings prohibited',
  }

  // Try to match rule_id patterns
  for (const [pattern, label] of Object.entries(labelMappings)) {
    if (rule_id.toLowerCase().includes(pattern)) {
      return label
    }
  }

  // Fallback to note if no pattern matches
  return note || rule_id
}

// Severity mapping
function getCheckSeverity(check: RuleCheck): 'critical' | 'major' | 'info' {
  if (check.killer === true) return 'critical'
  if (!check.pass) return 'major'
  return 'info'
}

// Sort checks by priority
export function pickTopSix(checks: RuleCheck[]): RuleCheck[] {
  const severityOrder = { critical: 0, major: 1, info: 2 }
  
  return checks
    .sort((a, b) => {
      // First by severity
      const severityDiff = severityOrder[getCheckSeverity(a)] - severityOrder[getCheckSeverity(b)]
      if (severityDiff !== 0) return severityDiff
      
      // Then by pass status (fails before passes)
      if (a.pass !== b.pass) return a.pass ? 1 : -1
      
      // Finally by rule_id alphabetically
      return a.rule_id.localeCompare(b.rule_id)
    })
    .slice(0, 6)
}

// Clause chip component
function ClauseChip({ clauseRef }: { clauseRef: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const clauseInfo = lookup_clause(clauseRef)
  
  return (
    <div className="relative">
      <button
        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 shadow-sm border border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        aria-label={`Clause ${clauseRef}: ${clauseInfo.title}`}
        aria-describedby={`clause-tooltip-${clauseRef}`}
      >
        <span className="truncate">{clauseRef}</span>
      </button>
      
      {isHovered && (
        <div 
          id={`clause-tooltip-${clauseRef}`}
          className="absolute bottom-full left-0 mb-3 w-80 p-4 bg-slate-900 text-white text-sm rounded-xl shadow-xl z-20 border border-slate-700"
          role="tooltip"
        >
          <div className="font-bold mb-2 text-blue-300">{clauseInfo.title}</div>
          <div className="text-slate-300 leading-relaxed">{clauseInfo.summary}</div>
          <div className="absolute top-full left-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  )
}

// Purchaser risk panel
function PurchaserRiskPanel() {
  return (
    <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-lg" role="alert" aria-labelledby="risk-assessment-title">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h4 id="risk-assessment-title" className="text-lg font-bold text-amber-900 mb-3">Purchase Risk Assessment</h4>
          <ul className="text-sm text-amber-800 space-y-2 mb-4" role="list">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" aria-hidden="true"></span>
              <span>Development approval may be required</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" aria-hidden="true"></span>
              <span>Additional costs and delays likely</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" aria-hidden="true"></span>
              <span>Consider impact on property value</span>
            </li>
          </ul>
          <button 
            className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-[#0A6CFF] to-blue-600 text-white font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-[#0A6CFF] focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            aria-label="Export assessment results for conveyancer"
          >
            <span>Export for conveyancer</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Check item component
function CheckItem({ check, showClauseRef = true }: { check: RuleCheck; showClauseRef?: boolean }) {
  const severity = getCheckSeverity(check)
  const label = normalizeCheckLabel(check)
  
  // Determine styling based on severity and pass status
  const getItemStyles = () => {
    if (severity === 'critical' && !check.pass) {
      return 'text-rose-800 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 p-4 rounded-xl shadow-sm'
    }
    if (severity === 'major' && !check.pass) {
      return 'text-amber-800 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4 rounded-xl shadow-sm'
    }
    if (check.pass) {
      return 'text-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-4 rounded-xl shadow-sm'
    }
    return 'text-slate-700 bg-slate-50 border border-slate-200 p-4 rounded-xl'
  }

  const getStatusText = () => {
    if (severity === 'critical' && !check.pass) return 'Critical failure'
    if (severity === 'major' && !check.pass) return 'Major issue'
    if (check.pass) return 'Passed'
    return 'Information'
  }

  const getUserFriendlyExplanation = () => {
    if (check.pass) {
      return 'This requirement is met - no action needed'
    }
    
    if (severity === 'critical') {
      return 'This is a critical issue that must be resolved before proceeding'
    }
    
    if (severity === 'major') {
      return 'This issue needs attention and may require changes to your plans'
    }
    
    return 'Additional information about this requirement'
  }
  
  return (
    <div className={`${getItemStyles()} transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2`} role="listitem">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold mb-1" aria-label={`${label} - ${getStatusText()}`}>
          {label}
        </div>
        <div className="text-xs text-slate-600 mb-2 leading-relaxed font-medium">
          {getUserFriendlyExplanation()}
        </div>
        {check.note !== label && check.note && (
          <div className="text-xs text-slate-500 mb-2 leading-relaxed italic">
            Technical details: {check.note}
          </div>
        )}
        {showClauseRef && (
          <div className="mt-3">
            <ClauseChip clauseRef={check.clause_ref} />
          </div>
        )}
      </div>
    </div>
  )
}

// Main DecisionCard component
export default function DecisionCard({
  result,
  role = 'Resident',
}: {
  result: RuleResult | null
  role?: UserRole
}) {
  const [showFullTrace, setShowFullTrace] = useState(false)
  const [traceFilter, setTraceFilter] = useState<'All' | 'Fails' | 'Passes' | 'Warnings'>('All')
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // PDF download handler
  const handleDownloadPDF = async () => {
    if (!result || !cardRef.current) return
    
    setIsGeneratingPDF(true)
    try {
      // Try visual PDF first, fallback to text PDF if it fails
      try {
        await generateDecisionCardPDF(cardRef.current, result)
      } catch {
        generateTextPDF(result)
      }
    } catch {
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (!result) return null

  const colors = DECISION_COLORS[result.decision]
  const topChecks = pickTopSix(result.checks)
  const criticalFails = result.checks.filter(c => getCheckSeverity(c) === 'critical' && !c.pass)
  const failCount = result.checks.filter(c => !c.pass).length
  const passCount = result.checks.filter(c => c.pass).length
  
  // Filter checks for full trace
  const filteredChecks = result.checks.filter(check => {
    if (traceFilter === 'All') return true
    if (traceFilter === 'Fails') return !check.pass
    if (traceFilter === 'Passes') return check.pass
    if (traceFilter === 'Warnings') return getCheckSeverity(check) === 'major'
    return true
  })

  return (
    <div 
      ref={cardRef}
      className={`rounded-3xl border-2 p-0 bg-white shadow-xl ring-2 ${colors.ring} ${colors.bg} transition-all duration-300 hover:shadow-2xl overflow-hidden`} 
      role="region" 
      aria-labelledby="decision-title"
    >
      {/* Clean Header */}
      <div className={`${colors.headerBg} p-6 border-b border-white/20`}>
        {/* Main Header Row */}
        <div className="flex items-center justify-between mb-4">
          {/* Status Icon and Title */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${colors.iconBg} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl" aria-hidden="true">{colors.statusIcon}</span>
            </div>
            <div>
              <h2 id="decision-title" className="text-3xl font-bold text-slate-900 tracking-tight">{result.decision}</h2>
              <p className="text-slate-600 font-medium mt-1">{result.checks.length} checks evaluated</p>
            </div>
          </div>
          
          {/* PDF Download Button */}
          <div className="flex gap-3">
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2.5 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl transition-all duration-200 border border-white/60 hover:border-white shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Download assessment as PDF"
            >
              {isGeneratingPDF ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Metrics Summary */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true"></div>
            <span className="font-semibold text-slate-700">{failCount} failed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" aria-hidden="true"></div>
            <span className="font-semibold text-slate-700">{passCount} passed</span>
          </div>
          {result.errors.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" aria-hidden="true"></div>
              <span className="font-semibold text-slate-700">{result.errors.length} validation errors</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6">
        {/* Key Findings section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">Assessment Results</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
          </div>
          <div className="space-y-3" role="list" aria-label="Key assessment findings">
            {topChecks.map((check, index) => (
              <CheckItem key={`${check.rule_id}-${index}`} check={check} />
            ))}
          </div>
        </div>

        {/* Purchaser Risk Panel */}
        {role === 'Purchaser' && criticalFails.length > 0 && (
          <PurchaserRiskPanel />
        )}

        {/* Show Full Trace Toggle */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={() => setShowFullTrace(!showFullTrace)}
            className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors group w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2"
            aria-expanded={showFullTrace}
            aria-controls="full-trace-content"
            aria-label={`${showFullTrace ? 'Hide' : 'Show'} full trace of ${result.checks.length} checks`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-slate-200 group-hover:to-slate-300 flex items-center justify-center transition-all duration-200 shadow-sm flex-shrink-0">
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${showFullTrace ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="flex-1 text-left">{showFullTrace ? 'Hide' : 'Show'} full trace ({result.checks.length} checks)</span>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
          </button>

          {showFullTrace && (
            <div id="full-trace-content" className="mt-6">
              {/* Enhanced Filter Controls */}
              <div className="flex flex-wrap gap-2 mb-6">
                {(['All', 'Fails', 'Passes', 'Warnings'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTraceFilter(filter)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      traceFilter === filter
                        ? 'bg-gradient-to-r from-[#0A6CFF] to-blue-600 text-white shadow-md transform scale-105'
                        : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 hover:from-slate-200 hover:to-slate-300 border border-slate-200 hover:border-slate-300'
                    }`}
                    aria-pressed={traceFilter === filter}
                    aria-label={`Filter by ${filter.toLowerCase()}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Full Trace List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2" role="list" aria-label={`Full trace filtered by ${traceFilter.toLowerCase()}`}>
                {filteredChecks.map((check, index) => (
                  <CheckItem key={`trace-${check.rule_id}-${index}`} check={check} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}