import React from 'react'
/** Small rounded status label used across the UI. */
export function Badge({
  kind = 'default',
  children,
}: {
  kind?: 'default' | 'pass' | 'fail' | 'info'
  children: React.ReactNode
}) {
  const styles: Record<string, string> = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    pass: 'bg-green-100 text-green-800 border-green-200',
    fail: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border ${styles[kind]}`}
    >
      {children}
    </span>
  )
}
