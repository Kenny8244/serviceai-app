import { Button } from './button'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '../../lib/theme'

interface ThemeToggleProps {
  className?: string
  compact?: boolean
  quiet?: boolean
}

export function ThemeToggle({ className, compact = false, quiet = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const getThemeIcon = (currentTheme: Theme) => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'auto':
        return <Monitor className="h-4 w-4" />
    }
  }

  const getThemeLabel = (currentTheme: Theme, short: boolean) => {
    switch (currentTheme) {
      case 'light':
        return short ? 'Light' : 'Light Mode'
      case 'dark':
        return short ? 'Dark' : 'Dark Mode'
      case 'auto':
        return short ? 'Auto' : 'Auto Mode'
    }
  }

  const label = getThemeLabel(theme, quiet)
  const fullLabel = getThemeLabel(theme, false)

  return (
    <Button
      variant={quiet || compact ? 'ghost' : 'outline'}
      size="sm"
      onClick={toggleTheme}
      className={`flex items-center shrink-0 ${
        compact ? 'h-9 w-9 px-0' : quiet ? 'h-8 gap-1.5 px-2 text-xs' : 'gap-2'
      } ${className ?? ''}`}
      aria-label={fullLabel}
      title={compact ? undefined : fullLabel}
    >
      {getThemeIcon(theme)}
      {!compact && <span className={quiet ? 'whitespace-nowrap' : 'hidden sm:inline'}>{label}</span>}
    </Button>
  )
}
