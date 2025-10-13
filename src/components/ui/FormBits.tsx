import React from 'react'


export function Field({ label, hint, error, success, required, children, className }: { 
  label: string, 
  hint?: string, 
  error?: string, 
  success?: string,
  required?: boolean,
  children: React.ReactNode,
  className?: string
}) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <label className="block text-label mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {hint && <span className="text-slate-500 font-normal"> — {hint}</span>}
      </label>
      <div className={`transition-all duration-200 ${error ? 'ring-2 ring-red-200' : success ? 'ring-2 ring-green-200' : ''}`}>
        {children}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </p>
      )}
    </div>
  )
}

export function TextInput({ value, onChange, type = 'text', placeholder, invalid, success, restrictTo = 'none' }: { 
  value: any, 
  onChange: (v:any)=>void, 
  type?: string, 
  placeholder?: string,
  invalid?: boolean,
  success?: boolean,
  restrictTo?: 'zone' | 'none' // Add restriction option
}) {
  const baseClasses = "w-full rounded-xl border px-grid-md py-grid-sm text-slate-900 focus-ring transition-all duration-200"
  const stateClasses = invalid 
    ? "border-red-500 focus-visible:outline-red-600" 
    : success 
    ? "border-green-500 focus-visible:outline-green-600"
    : "border-neutral-300 hover:border-neutral-400 focus-visible:outline-blue-600"
  
  // Enhanced input handler for zone restrictions - allows continuous typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    if (restrictTo === 'zone') {
      // Only allow letters and numbers, convert to uppercase
      const sanitizedValue = inputValue.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      
      // Limit to reasonable zone code length (max 4 characters)
      if (sanitizedValue.length <= 4) {
        onChange(sanitizedValue)
      }
    } else {
      // Default behavior for other text inputs
      onChange(inputValue)
    }
  }
  
  return (
    <input
      value={value}
      onChange={handleInputChange}
      type={type}
      placeholder={placeholder}
      className={`${baseClasses} ${stateClasses}`}
    />
  )
}


export function Select({ value, onChange, options, invalid, success }: { 
  value: any, 
  onChange: (v:any)=>void, 
  options: {value:string, label:string}[],
  invalid?: boolean,
  success?: boolean
}) {
  const baseClasses = "w-full rounded-xl border px-grid-md py-grid-sm text-slate-900 focus-ring transition-all duration-200"
  const stateClasses = invalid 
    ? "border-red-500 focus-visible:outline-red-600" 
    : success 
    ? "border-green-500 focus-visible:outline-green-600"
    : "border-neutral-300 hover:border-neutral-400 focus-visible:outline-blue-600"
  
  return (
    <select
      value={value}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      className={`${baseClasses} ${stateClasses}`}
    >
      <option value="">— Select —</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}


export const Chip: React.FC<{onClick?:()=>void, children: React.ReactNode, variant?: 'default' | 'primary' | 'success' | 'warning', className?: string}> = ({ 
  onClick, 
  children, 
  variant = 'default',
  className = ''
}) => {
  const variantClasses = {
    default: 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700',
    primary: 'bg-blue-100 hover:bg-blue-200 border-blue-200 text-blue-700',
    success: 'bg-green-100 hover:bg-green-200 border-green-200 text-green-700',
    warning: 'bg-amber-100 hover:bg-amber-200 border-amber-200 text-amber-700'
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }
  
  return (
    <button 
      onClick={onClick} 
      onKeyDown={handleKeyDown}
      aria-label={typeof children === 'string' ? children : 'Action button'}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs mr-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}


export const Tooltip: React.FC<{ children: React.ReactNode, content: string }> = ({ children, content }) => {
  const [isVisible, setIsVisible] = React.useState(false)
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-900 rounded-lg shadow-lg whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
        </div>
      )}
    </div>
  )
}