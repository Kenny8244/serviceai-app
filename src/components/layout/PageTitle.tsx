import { cn } from '@/lib/utils'

interface PageTitleProps {
  title: string
  subtitle?: string
  compact?: boolean
}

export function PageTitle({ title, subtitle, compact = false }: PageTitleProps) {
  return (
    <div className="min-w-0">
      <h1
        className={cn(
          'text-foreground',
          compact ? 'text-xl font-semibold' : 'text-2xl font-bold'
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  )
}
