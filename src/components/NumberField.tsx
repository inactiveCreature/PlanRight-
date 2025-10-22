import React, { useState, useEffect, useRef } from 'react'

/**
 * Helper function to safely parse decimal strings
 */
function parseDecimalSafe(str: string): number | undefined {
  if (!str || str.trim() === '') {
    return undefined
  }

  const trimmed = str.trim()

  // Handle empty string after trimming
  if (trimmed === '') {
    return undefined
  }

  // Parse as float to preserve decimals
  const parsed = parseFloat(trimmed)

  // Check if parsing resulted in NaN
  if (isNaN(parsed)) {
    return undefined
  }

  // Check if the original string represents a valid number
  // This prevents cases like "0.9" becoming "9" or "1.2.3" being accepted
  const isValidNumberString = /^-?\d*\.?\d+$/.test(trimmed)

  if (!isValidNumberString) {
    return undefined
  }

  return parsed
}

interface NumberFieldProps {
  label?: string
  value: number | undefined
  onCommit: (n: number | undefined) => void
  min?: number
  max?: number
  step?: number
  suffix?: 'm' | 'm²' | string
  required?: boolean
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  invalid?: boolean
  errorMessage?: string
  id?: string
}

export function NumberField({
  label,
  value,
  onCommit,
  min,
  max,
  _step = 0.1,
  suffix,
  required = false,
  placeholder,
  ariaLabel,
  disabled = false,
  invalid = false,
  errorMessage,
  id,
}: NumberFieldProps) {
  // Internal string state for editing - do NOT coerce to number on each keystroke
  const [draft, setDraft] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync draft with external value when not focused
  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null) {
        setDraft('')
      } else {
        setDraft(value.toString())
      }
    }
  }, [value, isFocused])

  // Handle input changes - allow valid decimal strings during typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty string
    if (inputValue === '') {
      setDraft('')
      return
    }

    // Allow "-" for negative numbers
    if (inputValue === '-') {
      setDraft('-')
      return
    }

    // Allow "." for decimal numbers
    if (inputValue === '.') {
      setDraft('.')
      return
    }

    // Allow "0." for decimal numbers starting with 0
    if (inputValue === '0.') {
      setDraft('0.')
      return
    }

    // Check if input contains only valid decimal characters
    const validDecimalPattern = /^-?\d*\.?\d*$/
    if (validDecimalPattern.test(inputValue)) {
      setDraft(inputValue)
    }
    // Reject other characters
  }

  // Handle blur/commit - parse and validate the final value
  const handleBlur = () => {
    setIsFocused(false)
    commitValue()
  }

  // Handle Enter key - commit the value
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitValue()
      inputRef.current?.blur()
    }
  }

  // Commit the current draft value
  const commitValue = () => {
    const parsed = parseDecimalSafe(draft)

    if (parsed !== undefined) {
      // Clamp to min/max if provided
      let finalValue = parsed
      if (min !== undefined && finalValue < min) {
        finalValue = min
      }
      if (max !== undefined && finalValue > max) {
        finalValue = max
      }

      onCommit(finalValue)
    } else {
      // If parsing failed, commit undefined (or previous value if required)
      onCommit(required ? value : undefined)
    }
  }

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true)
  }

  // Base classes for styling
  const baseClasses =
    'w-full rounded-xl border px-3 py-2 text-slate-900 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all duration-200'
  const stateClasses = invalid
    ? 'border-red-500 focus-visible:outline-red-600'
    : 'border-neutral-300 hover:border-neutral-400 focus-visible:outline-blue-600'

  const disabledClasses = disabled ? 'opacity-60 cursor-not-allowed bg-neutral-100' : ''
  const suffixClasses = suffix ? 'pr-10' : ''

  // Check if current value is out of range for error display
  const isOutOfRange =
    value !== undefined &&
    ((min !== undefined && value < min) || (max !== undefined && value > max))

  return (
    <div className="grid grid-cols-12 gap-3 items-center">
      {/* Label */}
      {label && (
        <div className="col-span-7 md:col-span-12">
          <label htmlFor={id} className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}

      {/* Input Control */}
      <div className={`${label ? 'col-span-5 md:col-span-12' : 'col-span-12'}`}>
        <div className="relative">
          <input
            ref={inputRef}
            id={id}
            value={draft}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel || label}
            aria-required={required}
            aria-invalid={invalid || isOutOfRange}
            className={`${baseClasses} ${stateClasses} ${disabledClasses} ${suffixClasses}`}
          />

          {suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
              {suffix}
            </span>
          )}
        </div>

        {/* Show inline error text */}
        {invalid && errorMessage && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errorMessage}
          </p>
        )}

        {/* Show inline error text when out of range, but do not block typing */}
        {!invalid && isOutOfRange && (
          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {min !== undefined && max !== undefined
              ? `Value must be between ${min} and ${max}`
              : min !== undefined
                ? `Value must be at least ${min}`
                : `Value must be at most ${max}`}
          </p>
        )}
      </div>
    </div>
  )
}
