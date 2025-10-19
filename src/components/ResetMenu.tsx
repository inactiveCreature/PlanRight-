import React, { useState } from 'react'
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
  disabled = false 
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
      review: 'Review'
    }
    return stepNames[stepId] || stepId
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
          disabled 
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' 
            : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
        aria-label="Reset options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Reset</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="py-2">
              {/* Header */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Reset Options
                </h3>
              </div>
              
              {/* Reset current step */}
              <button
                onClick={handleResetStep}
                disabled={disabled}
                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Reset {getStepDisplayName(currentStep)}</div>
                  <div className="text-xs text-slate-500">Clear only this step's fields</div>
                </div>
              </button>
              
              {/* Divider */}
              <div className="border-t border-slate-100 my-1" />
              
              {/* Reset all */}
              <button
                onClick={handleResetAll}
                disabled={disabled}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">Reset All Fields</div>
                  <div className="text-xs text-red-500">Clear entire form and results</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
