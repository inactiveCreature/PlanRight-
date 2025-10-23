import React from 'react'

export interface StatusChipProps {
  state: 'pass' | 'fail' | 'warn' | 'neutral'
  label: string
  helpText?: string
  onFix?: () => void
  className?: string
}

export function StatusChip({ 
  state, 
  label, 
  helpText, 
  onFix, 
  className = '' 
}: StatusChipProps) {
  const [showTooltip, setShowTooltip] = React.useState(false)
  
  // State-specific styling
  const getStateStyles = () => {
    switch (state) {
      case 'pass':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200'
      case 'fail':
        return 'bg-rose-50 text-rose-800 border border-rose-200'
      case 'warn':
        return 'bg-amber-50 text-amber-900 border border-amber-200'
      case 'neutral':
        return 'bg-slate-50 text-slate-700 border border-slate-200'
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200'
    }
  }

  // State-specific icons
  const getStateIcon = () => {
    switch (state) {
      case 'pass':
        return '✓'
      case 'fail':
        return '!'
      case 'warn':
        return '⚠'
      case 'neutral':
        return '•'
      default:
        return '•'
    }
  }

  // State-specific screen reader text
  const getStateText = () => {
    switch (state) {
      case 'pass':
        return 'Passed'
      case 'fail':
        return 'Failed'
      case 'warn':
        return 'Warning'
      case 'neutral':
        return 'Neutral'
      default:
        return 'Neutral'
    }
  }

  const chipElement = (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-sm font-medium whitespace-nowrap max-w-full truncate transition-all duration-200 ${getStateStyles()} ${className} ${
        onFix ? 'cursor-pointer hover:shadow-md hover:scale-105 active:scale-95' : ''
      }`}
      onClick={onFix}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="status"
      aria-label={`${getStateText()}: ${label}`}
      title={label}
    >
      <span className="text-sm font-bold flex-shrink-0" aria-hidden="true">
        {getStateIcon()}
      </span>
      <span className="sr-only">{getStateText()}: </span>
      <span className="truncate">{label}</span>
      {onFix && (
        <span className="text-xs opacity-60 ml-0.5 flex-shrink-0" aria-hidden="true">
          ✏️
        </span>
      )}
    </div>
  )

  // Tooltip for help text
  if (helpText && showTooltip) {
    return (
      <div className="relative">
        {chipElement}
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-20 border border-slate-700"
          role="tooltip"
        >
          <div className="text-slate-200 leading-relaxed">{helpText}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      </div>
    )
  }

  return chipElement
}
