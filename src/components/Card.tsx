import React from 'react'

interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'warning' | 'error'
  className?: string
}

/**
 * Consistent card component with variants
 * Default: rounded-2xl border border-neutral-200 bg-white shadow-sm p-6
 * Variants: warning | error (border + bg tokens only)
 */
export default function Card({ children, variant = 'default', className = '' }: CardProps) {
  const baseClasses = 'rounded-2xl border bg-white shadow-sm p-6'

  const variantClasses = {
    default: 'border-neutral-200',
    warning: 'border-amber-300 bg-amber-50',
    error: 'border-red-300 bg-red-50',
  }

  return <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</div>
}
