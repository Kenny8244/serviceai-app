import React from 'react'
import { cn } from '../../lib/utils'
import { Label } from './label'

export const nativeSelectClassName = cn(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive'
)

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  className,
  children,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
