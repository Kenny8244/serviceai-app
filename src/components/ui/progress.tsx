import React from 'react'
import { cn } from '../../lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
}

export function Progress({ className, value, max = 100, ...props }: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-gray-200',
        className
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-blue-600 transition-all"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
}
