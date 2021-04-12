import { useState } from 'react'
import { State } from './logic/state'
import ChessBoard from './ChessBoard'
import SetupInfo from './SetupInfo'
import * as React from 'react'
import { Pos } from './logic/util'
import { EMPTY, Piece } from './logic/pieces'
import { changeMode, getStateFromQuery } from './util'
import { useHistory, useLocation } from 'react-router-dom'
import { ModeProps } from './App'

export default function SetupMode (props: ModeProps) {
  const history = useHistory()
  const [highlightedPos, setHighlightedPos] = useState<Pos>()
  const [selectedPiece, setSelectedPiece] = useState<Piece>()
  const state = getStateFromQuery(history)
  const location = useLocation()

  function setState (newState: State) {
    changeMode(history, location, newState, '/setup', true)
  }

  const makeMove = (state: State) => setState(state)
  function changeHighlight (pos?: Pos) {
    setHighlightedPos(pos)
    setSelectedPiece(undefined)
  }
  function selectPiece (piece?: Piece) {
    if (highlightedPos) {
      setState(state.modify(newState => {
        newState.board = newState.board.set(highlightedPos, EMPTY)
      }))
    } else {
      setSelectedPiece(piece)
    }
    setHighlightedPos(undefined)
  }

  const setup = { setupPiece: selectedPiece }
  return (
    <div className='App'>
      <div className="PlayChessBoardBox">
        <ChessBoard changeHighlight={changeHighlight} highlightedPos={highlightedPos} state={state} setup={setup} makeMove={makeMove} theme={props.theme}/>
      </div>
      <SetupInfo changeState={makeMove} selectPiece={selectPiece} selectedPiece={selectedPiece} state={state} theme={props.theme} openTheme={props.openTheme}/>
    </div>
  )
}
