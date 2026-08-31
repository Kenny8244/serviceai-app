import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AppHeader } from './AppHeader'
import { PageContent } from './PageContent'
import { useLayoutSlots } from './LayoutSlots'
import { cn } from '@/lib/utils'

interface PageShellProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  flush?: boolean
  compact?: boolean
  className?: string
  children: ReactNode
}

export function PageShell({
  title,
  subtitle,
  icon,
  actions,
  flush = false,
  compact = false,
  className,
  children,
}: PageShellProps) {
  const slots = useLayoutSlots()
  const headerHost = slots?.headerHost ?? null

  const header = (
    <AppHeader
      title={title}
      subtitle={subtitle}
      icon={icon}
      actions={actions}
      flush={flush}
      compact={compact}
    />
  )

  const renderedHeader = slots
    ? headerHost
      ? createPortal(header, headerHost)
      : null
    : header

  return (
    <>
      {renderedHeader}
      {flush ? (
        <div className={cn('flex flex-1 flex-col min-h-0', className)}>{children}</div>
      ) : (
        <PageContent className={className}>{children}</PageContent>
      )}
    </>
  )
}
