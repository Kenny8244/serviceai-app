import type { ReactNode } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface SuccessBannerProps {
  children: ReactNode
  onDismiss?: () => void
  className?: string
}

export function SuccessBanner({ children, onDismiss, className }: SuccessBannerProps) {
  return (
    <Alert
      className={cn('bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', className)}
      role="status"
    >
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800 dark:text-green-200 pr-8">
        {children}
      </AlertDescription>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-md p-1 text-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </Alert>
  )
}
