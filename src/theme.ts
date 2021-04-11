import { useEffect, useState } from 'react'
import DEFAULT_THEME from './defaultTheme.json'

export interface BoardSquareTheme {
  // Must be an css color
  blackColor: string,
  whiteColor: string,
}

export interface Theme {
  piece: string,
  board: BoardSquareTheme,
}

let CURRENT_THEME = DEFAULT_THEME

type ThemeSet = (theme: Theme) => void

const THEME_USES = new Map<Symbol, ThemeSet>()

export function changeTheme (newTheme: Theme) {
  CURRENT_THEME = newTheme
  for (const use of THEME_USES.values()) {
    use(newTheme)
  }
}

export function useTheme (): Theme {
  const changedKey = useState(() => Symbol('Key'))[0]
  const [theme, setTheme] = useState(CURRENT_THEME)
  useEffect(() => {
    THEME_USES.set(changedKey, theme => setTheme(theme))
    return () => {
      THEME_USES.delete(changedKey)
    }
  }, [])

  return theme
}
