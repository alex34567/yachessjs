import { useEffect, useState } from 'react'
import DEFAULT_THEME from './defaultTheme.json'
import assert from 'assert'

export interface BoardSquareTheme {
  name: string,
  id: string,
  // Must be an css color
  blackColor: string,
  whiteColor: string,
}

export interface PieceTheme {
  prefix: string,
  name: string,
}

export interface Theme {
  piece: PieceTheme
  boardSquare: BoardSquareTheme,
}

let CLASSNAME_SUFFIX = 0

export class ThemeManager {
  readonly theme: Readonly<Theme>
  readonly className: string

  readonly style = document.createElement('style')

  constructor (theme?: Theme) {
    if (!theme) {
      theme = DEFAULT_THEME
    }
    this.theme = { ...theme }
    this.className = `ChessTheme-${CLASSNAME_SUFFIX}`
    CLASSNAME_SUFFIX++
    assert(/^[0-9a-zA-Z#]+$/.test(this.theme.boardSquare.whiteColor), 'Attempted xss')
    assert(/^[0-9a-zA-Z#]+$/.test(this.theme.boardSquare.blackColor), 'Attempted xss')
    this.style.textContent = `
      .ChessBoardSquareWhite.${this.className} {
        background-color: ${this.theme.boardSquare.whiteColor};
      }

      .ChessBoardSquareBlack.${this.className} {
       background-color: ${this.theme.boardSquare.blackColor};
      }
    `
  }
}

export function useTheme (defaultTheme?: Theme): [ThemeManager, (theme: Theme) => void] {
  const [theme, setTheme] = useState(new ThemeManager(defaultTheme))
  useEffect(() => {
    document.head.append(theme.style)
    return () => {
      theme.style.remove()
    }
  }, [theme])

  return [theme, theme => {
    setTheme(new ThemeManager(theme))
  }]
}
