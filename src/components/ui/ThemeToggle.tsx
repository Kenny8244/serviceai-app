import { Button } from './button'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '../../lib/theme'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
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

  const getThemeLabel = (currentTheme: Theme) => {
    switch (currentTheme) {
      case 'light':
        return 'Light Mode'
      case 'dark':
        return 'Dark Mode'
      case 'auto':
        return 'Auto Mode'
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={`flex items-center gap-2 ${className}`}
      title={getThemeLabel(theme)}
    >
      {getThemeIcon(theme)}
      <span className="hidden sm:inline">{getThemeLabel(theme)}</span>
    </Button>
  )
}
