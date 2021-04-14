import { Theme, ThemeManager, useTheme } from './theme'
import React, { ChangeEvent, useEffect, useState } from 'react'
import BOARD_THEMES from './boardThemes.json'
import PIECE_THEMES from './pieceThemes.json'
import ChessBoard from './ChessBoard'
import { getStartState } from './logic/state'
import useResizeEffect from './useResizeEffect'

export interface ThemeSetupProps {
  theme: ThemeManager
  setTheme: (theme: Theme) => void
}

export default function ThemeSetup (props: ThemeSetupProps) {
  const [theme, setTheme] = useTheme(props.theme.theme)
  const [windowHeight, setWindowHeight] = useState(0)
  const [windowWidth, setWindowWidth] = useState(0)

  function resizeWindow () {
    const height = document.body.offsetHeight
    const width = document.body.offsetWidth
    if (height !== windowHeight) {
      setWindowHeight(height)
    }

    if (width !== windowWidth) {
      setWindowWidth(width)
    }
  }

  useEffect(resizeWindow)
  useResizeEffect(resizeWindow)

  const boardThemes = []
  for (const theme of BOARD_THEMES) {
    boardThemes.push(<option value={theme.id} key={theme.id}>{theme.name}</option>)
  }

  const pieceThemes = []
  for (const theme of PIECE_THEMES) {
    pieceThemes.push(<option value={theme.prefix} key={theme.prefix}>{theme.name}</option>)
  }

  function onChangeBoardTheme (event: ChangeEvent<HTMLSelectElement>) {
    const boardTheme = BOARD_THEMES.find(theme => theme.id === event.target.value)!
    const newTheme = { ...theme.theme }
    newTheme.boardSquare = { ...boardTheme }
    setTheme(newTheme)
  }

  function onChangePieceTheme (event: ChangeEvent<HTMLSelectElement>) {
    const pieceTheme = PIECE_THEMES.find(theme => theme.prefix === event.target.value)!
    const newTheme = { ...theme.theme }
    newTheme.piece = { ...pieceTheme }
    setTheme(newTheme)
  }

  function onConfirm () {
    props.setTheme(theme.theme)
  }

  function onCancel () {
    props.setTheme(props.theme.theme)
  }

  return (
    <div className='Window' style={{ width: windowWidth, height: windowHeight }}>
      <div className='WindowCover' onClick={onCancel}/>
      <div className='WindowContents'>
        <h1>Theme Setup</h1>
        <label>Board Theme:</label>
        <select onChange={onChangeBoardTheme} value={theme.theme.boardSquare.id}>
          {boardThemes}
        </select>
        <label>Piece Theme:</label>
        <select onChange={onChangePieceTheme} value={theme.theme.piece.prefix}>
          {pieceThemes}
        </select>
        <div className="WindowChessBoard">
          <ChessBoard state={getStartState()} theme={theme}/>
        </div>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
