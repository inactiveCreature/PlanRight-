import React from 'react'
import { Switch, SwitchProps } from '../ui/Switch'

export interface SwitchFieldProps extends Omit<SwitchProps, 'ariaLabel'> {
  label: string
  description?: string
  invalid?: boolean
  errorMessage?: string
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  description,
  invalid = false,
  errorMessage,
  id,
  ...switchProps
}) => {
  const fieldId = id || `switch-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="grid grid-cols-12 items-center gap-3">
      {/* Label and Description */}
      <div className="col-span-7 md:col-span-9">
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        {invalid && errorMessage && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Switch Control */}
      <div className="col-span-5 md:col-span-3 flex md:justify-end">
        <Switch
          {...switchProps}
          id={fieldId}
          ariaLabel={label}
          className={invalid ? 'ring-2 ring-red-500 ring-offset-2' : ''}
        />
      </div>
    </div>
  )
}
