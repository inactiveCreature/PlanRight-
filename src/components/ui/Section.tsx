import React from 'react'
/** Enhanced section with title, optional description, and card container. */
export function Section({ title, description, children, right, className }: { 
  title: string, 
  description?: string, 
  children: React.ReactNode, 
  right?: React.ReactNode,
  className?: string 
}) {
  return (
    <div className={`mb-8 ${className || ''}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
          {description && (
            <p className="text-slate-600 text-sm leading-relaxed max-w-prose">
              {description}
            </p>
          )}
        </div>
        {right && (
          <div className="flex-shrink-0">
            {right}
          </div>
        )}
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        {children}
      </div>
    </div>
  )
}