import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ServiceRequestActivityChange } from '@/lib/serviceRequestActivity'

function valueLabel(value: string | null): string {
  return value ? value.replace(/_/g, ' ') : '—'
}

export function ActivityChangeLine({
  change,
  className,
}: {
  change: ServiceRequestActivityChange
  className?: string
}) {
  if (change.eventType === 'created') {
    return <span className={className}>Request created</span>
  }

  const kind = change.eventType === 'priority_changed' ? 'Priority' : 'Status'

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2 leading-normal', className)}>
      <span className="shrink-0 font-medium">{kind}</span>
      <span className="inline-flex min-w-0 items-center gap-1 font-normal text-slate-600 dark:text-slate-300">
        <span>{valueLabel(change.fromValue)}</span>
        <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
        <span>{valueLabel(change.toValue)}</span>
      </span>
    </span>
  )
}
