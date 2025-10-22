import React from 'react'

export interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  id?: string
  name?: string
  className?: string
  ariaLabel?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  id,
  name,
  className = '',
  ariaLabel,
}) => {
  const sizeConfig = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      translate: checked ? 'translate-x-4' : 'translate-x-0',
      padding: 'p-2',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: checked ? 'translate-x-5' : 'translate-x-0',
      padding: 'p-2',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: checked ? 'translate-x-6' : 'translate-x-0',
      padding: 'p-2',
    },
  }

  const config = sizeConfig[size]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) {
        onChange(!checked)
      }
    }
  }

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      name={name}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex items-center justify-center
        ${config.padding}
        ${config.track}
        rounded-full
        transition-colors duration-200
        focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600
        ${checked ? 'bg-blue-600 hover:bg-blue-700' : 'bg-neutral-300 hover:bg-neutral-400'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Thumb */}
      <span
        className={`
          absolute left-0.5 top-0.5
          ${config.thumb}
          ${config.translate}
          rounded-full
          bg-white
          shadow-sm
          ring-1
          ring-black/5
          transition-transform duration-200
        `}
      />
    </button>
  )
}
