import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext, type ThemeMode } from './theme-context'

const THEME_STORAGE_KEY = 'ai-study-hub-theme'
const FORCED_THEME: ThemeMode = 'light'

function readInitialTheme(): ThemeMode {
  return FORCED_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readInitialTheme)

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    const effectiveTheme = nextTheme === 'dark' ? FORCED_THEME : nextTheme
    setThemeState(effectiveTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, effectiveTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState(FORCED_THEME)
    window.localStorage.setItem(THEME_STORAGE_KEY, FORCED_THEME)
  }, [])

  useEffect(() => {
    const root = document.documentElement

    root.dataset.theme = theme
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
