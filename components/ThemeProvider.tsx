'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { persistTheme, syncThemeFromAccount, type Theme } from '@/lib/theme'

interface ThemeState {
  theme: Theme | null // null until the account/localStorage reconcile finishes
  setTheme: (next: Theme) => void
}

const ThemeContext = createContext<ThemeState>({ theme: null, setTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null)

  useEffect(() => {
    syncThemeFromAccount().then(setThemeState)
  }, [])

  function setTheme(next: Theme) {
    setThemeState(next)
    persistTheme(next)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
