import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GradientIconProps {
  icon: LucideIcon
  from?: string
  to?: string
  className?: string
}

export function GradientIcon({
  icon: Icon,
  from = 'from-blue-500',
  to = 'to-purple-600',
  className,
}: GradientIconProps) {
  return (
    <div
      className={cn(
        'w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center flex-shrink-0',
        from,
        to,
        className
      )}
    >
      <Icon className="h-6 w-6 text-white" />
    </div>
  )
}
