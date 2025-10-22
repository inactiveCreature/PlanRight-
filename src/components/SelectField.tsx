import React, { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectFieldProps {
  id: string
  label: string
  value: string | undefined
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  description?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  description,
  error,
  required = false,
  disabled = false,
  className = '',
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find((option) => option.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder
  const hasError = !!error

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setHighlightedIndex(0)
        } else {
          setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0))
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setHighlightedIndex(options.length - 1)
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1))
        }
        break

      case 'Enter':
        event.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value)
          setIsOpen(false)
          setHighlightedIndex(-1)
        } else if (!isOpen) {
          setIsOpen(true)
          setHighlightedIndex(0)
        }
        break

      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break

      case 'Tab':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setHighlightedIndex(-1)
    }
  }

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const optionElement = listboxRef.current.children[highlightedIndex] as HTMLElement
      if (optionElement) {
        optionElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const baseClasses =
    'w-full px-3 py-2 text-sm border rounded-xl transition-all duration-200 focus:outline-none'
  const stateClasses = hasError
    ? 'border-red-500 focus-visible:outline-red-600 bg-red-50'
    : 'border-neutral-300 focus-visible:outline-blue-600 hover:border-neutral-400'
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer'

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative" ref={selectRef}>
        <button
          type="button"
          id={id}
          className={`${baseClasses} ${stateClasses} ${disabledClasses} text-left flex items-center justify-between`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={hasError}
          aria-describedby={error ? `${id}-error` : description ? `${id}-description` : undefined}
        >
          <span className={selectedOption ? 'text-slate-900' : 'text-slate-500'}>
            {displayValue}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <ul
            ref={listboxRef}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-xl shadow-lg max-h-60 overflow-y-auto"
            aria-labelledby={id}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-slate-900 hover:bg-slate-50'
                } ${option.value === value ? 'bg-blue-100 font-medium' : ''}`}
                onClick={() => handleOptionClick(option.value)}
                aria-selected={option.value === value}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {description && !error && (
        <p id={`${id}-description`} className="text-xs text-slate-500">
          {description}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
