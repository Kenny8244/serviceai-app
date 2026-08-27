import type { HTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title = "We couldn't load this",
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center text-center py-12 px-4', className)}
      role="alert"
      {...props}
    >
      <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md">{message}</p>
      {onRetry ? <Button onClick={onRetry}>{retryLabel}</Button> : null}
    </div>
  )
}
