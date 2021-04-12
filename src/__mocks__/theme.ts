import DEFAULT_THEME from '../defaultTheme.json'
import assert from 'assert'
import { Theme } from '../theme'
import { useState } from 'react'

export class ThemeManager {
  readonly theme: Readonly<Theme>
  readonly className: string = 'TestTheme'

  readonly style = document.createElement('style')

  constructor (theme?: Theme) {
    if (!theme) {
      theme = DEFAULT_THEME
    }
    this.theme = { ...theme }
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

  return [theme, theme => {
    setTheme(new ThemeManager(theme))
  }]
}
