import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PageTitle } from './PageTitle'
import { ActionArea } from './ActionArea'

interface AppHeaderProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  flush?: boolean
  compact?: boolean
}

export function AppHeader({
  title,
  subtitle,
  icon,
  actions,
  flush = false,
  compact = false,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'border-b',
        flush
          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          : 'bg-card border-border'
      )}
    >
      <div
        className={cn(
          flush ? 'p-4' : 'container mx-auto px-6 py-4'
        )}
      >
        <div
          className={cn(
            flush
              ? 'flex items-center justify-between gap-4'
              : 'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'
          )}
        >
          <div className="flex items-center space-x-3 min-w-0">
            {icon}
            <PageTitle title={title} subtitle={subtitle} compact={compact || flush} />
          </div>

          {actions ? <ActionArea flush={flush}>{actions}</ActionArea> : null}
        </div>
      </div>
    </header>
  )
}
