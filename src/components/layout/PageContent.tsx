import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContentProps {
  children: ReactNode
  className?: string
  flush?: boolean
}

export function PageContent({ children, className, flush = false }: PageContentProps) {
  if (flush) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn('container mx-auto px-6 py-8', className)}>
      {children}
    </div>
  )
}
