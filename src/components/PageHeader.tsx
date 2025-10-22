import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode // Optional primary CTA slot
}

/**
 * Consistent page header with title/subtitle on left and optional CTA on right
 * Enforces vertical rhythm: 8px grid (8/12/16/24/32)
 */
export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {children && <div className="ml-6 flex-shrink-0">{children}</div>}
    </div>
  )
}
