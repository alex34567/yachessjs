export {}

/* import { useTheme } from './theme'
import React, { useEffect } from 'react'
import assert from 'assert'

export default function BoardSquareTheme () {
  const theme = useTheme()
  useEffect(() => {
    // Validate that there are no special chars in css colors
    assert(/^[0-9a-zA-Z#]+$/.test(theme.board.whiteColor), 'Attempted xss')
    assert(/^[0-9a-zA-Z#]+$/.test(theme.board.blackColor), 'Attempted xss')
    const rawCss = `
      .ChessBoardSquareWhite {
        background-color: ${theme.board.whiteColor};
      }

      .ChessBoardSquareBlack {
       background-color: ${theme.board.blackColor};
      }
    `
    const style = document.createElement('style')
    style.textContent = rawCss
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  })

  return <></>
} */
