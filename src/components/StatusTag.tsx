import { cn } from '../utils/cn'

export interface StatusTagProps {
  state: "pass" | "fail" | "warn" | "neutral"
  text: string              // e.g. "In front of building line"
  showPrefix?: boolean      // default true → add "Pass: ", "Fail: ", etc.
  className?: string
}

export function StatusTag({ 
  state, 
  text, 
  showPrefix = true, 
  className = '' 
}: StatusTagProps) {
  const getStateStyles = () => {
    switch (state) {
      case 'pass':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'fail':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'warn':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'neutral':
        return 'bg-slate-50 text-slate-600 border-slate-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  const getPrefix = () => {
    if (!showPrefix) return ''
    switch (state) {
      case 'pass':
        return '✓'
      case 'fail':
        return '✗'
      case 'warn':
        return '⚠'
      case 'neutral':
        return ''
      default:
        return ''
    }
  }

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-lg border px-3 py-2 text-sm font-semibold",
        "whitespace-normal break-words text-pretty max-w-full leading-tight",
        getStateStyles(),
        className
      )}
    >
      {showPrefix && (
        <span className="mr-2 text-base leading-none">{getPrefix()}</span>
      )}
      <span>{text}</span>
    </span>
  )
}
