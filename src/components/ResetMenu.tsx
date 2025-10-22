import { useState } from 'react'
import type { StepId } from '../wizard/steps'

interface ResetMenuProps {
  currentStep: StepId
  onResetStep: (stepId: StepId) => void
  onResetAll: () => void
  disabled?: boolean
}

export default function ResetMenu({
  currentStep,
  onResetStep,
  onResetAll,
  disabled = false,
}: ResetMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleResetStep = () => {
    onResetStep(currentStep)
    setIsOpen(false)
  }

  const handleResetAll = () => {
    onResetAll()
    setIsOpen(false)
  }

  const getStepDisplayName = (stepId: StepId): string => {
    const stepNames: Record<StepId, string> = {
      start: 'Start',
      property: 'Property',
      structure: 'Structure',
      dimensions: 'Dimensions',
      location: 'Location',
      siting: 'Siting',
      context: 'Context',
      review: 'Review',
    }
    return stepNames[stepId] || stepId
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
          disabled
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95'
        }`}
        aria-label="Reset options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-semibold">Reset</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="py-1">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Reset Options
                </h3>
              </div>

              {/* Reset current step */}
              <button
                onClick={handleResetStep}
                disabled={disabled}
                className="w-full px-4 py-4 text-left text-sm text-slate-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-200">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 group-hover:text-blue-900">
                    Reset {getStepDisplayName(currentStep)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Clear only this step's fields</div>
                </div>
                <svg
                  className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Divider */}
              <div className="border-t border-slate-200 my-1" />

              {/* Reset all */}
              <button
                onClick={handleResetAll}
                disabled={disabled}
                className="w-full px-4 py-4 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-900 group-hover:text-red-800">
                    Reset All Fields
                  </div>
                  <div className="text-xs text-red-500 mt-1">Clear entire form and results</div>
                </div>
                <svg
                  className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
