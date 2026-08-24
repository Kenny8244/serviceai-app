import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ActionAreaProps {
  children: ReactNode
  flush?: boolean
}

export function ActionArea({ children, flush = false }: ActionAreaProps) {
  return (
    <div className={cn('flex items-center flex-wrap', flush ? 'gap-2' : 'gap-3')}>
      {children}
    </div>
  )
}
