import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('auto')
  const [mounted, setMounted] = useState(false)

  // Get the actual theme based on time or user preference
  const getActualTheme = (currentTheme: Theme): 'light' | 'dark' => {
    if (currentTheme === 'light') return 'light'
    if (currentTheme === 'dark') return 'dark'

    // Auto mode - determine based on time
    const hour = new Date().getHours()
    return hour >= 18 || hour < 6 ? 'dark' : 'light' // 6 PM to 6 AM = dark
  }

  const actualTheme = getActualTheme(theme)

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setThemeState(savedTheme)
    }
    setMounted(true)
  }, [])

  // Apply theme to document when it changes
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    if (actualTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [actualTheme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
