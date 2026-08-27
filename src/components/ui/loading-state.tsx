import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'spinner' | 'skeleton'
  label?: string
  children?: ReactNode
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('bg-slate-200 dark:bg-slate-700 rounded animate-pulse', className)} />
}

export function LoadingState({
  variant = 'spinner',
  label = 'Loading…',
  className,
  children,
  ...props
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div
        className={className}
        role="status"
        aria-busy="true"
        aria-label={label}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className="h-10 w-10 mb-3 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 animate-spin" />
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  )
}
