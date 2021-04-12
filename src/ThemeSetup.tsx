import { Theme, ThemeManager, useTheme } from './theme'
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import BOARD_THEMES from './boardThemes.json'
import PIECE_THEMES from './pieceThemes.json'
import ChessBoard from './ChessBoard'
import { getStartState } from './logic/state'

export interface ThemeSetupProps {
  theme: ThemeManager
  setTheme: (theme: Theme) => void
}

export default function ThemeSetup (props: ThemeSetupProps) {
  const [theme, setTheme] = useTheme(props.theme.theme)
  const [boardWidth, setBoardWidth] = useState(0)
  const boardRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    function onResize () {
      measureBoardWidth(boardRef.current)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  })

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

  function measureBoardWidth (board: HTMLDivElement | null | undefined) {
    if (board) {
      setBoardWidth(board.offsetHeight)
      boardRef.current = board
    } else {
      boardRef.current = null
    }
  }

  return (
    <div className='Window'>
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
        <div ref={measureBoardWidth} className='WindowChessBoardSizer'>
          <div className="WindowChessBoard" style={{ width: boardWidth - 16 }}>
            <ChessBoard state={getStartState()} theme={theme}/>
          </div>
        </div>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
