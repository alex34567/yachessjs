import { useState } from 'react'
import { State } from './logic/state'
import ChessBoard from './ChessBoard'
import SetupInfo from './SetupInfo'
import * as React from 'react'
import { Pos } from './logic/util'
import { EMPTY, Piece } from './logic/pieces'
import { ModeProps } from './App'

export default function SetupMode (props: ModeProps) {
  const [highlightedPos, setHighlightedPos] = useState<Pos>()
  const [selectedPiece, setSelectedPiece] = useState<Piece>()

  const makeMove = (state: State) => props.setDefaultState(state)
  function changeHighlight (pos?: Pos) {
    setHighlightedPos(pos)
    setSelectedPiece(undefined)
  }
  function selectPiece (piece?: Piece) {
    if (highlightedPos) {
      props.setDefaultState(props.defaultState.modify(newState => {
        newState.board = newState.board.set(highlightedPos, EMPTY)
      }))
    } else {
      setSelectedPiece(piece)
    }
    setHighlightedPos(undefined)
  }

  const setup = { setupPiece: selectedPiece }
  return <div className='App'>
    <ChessBoard changeHighlight={changeHighlight} highlightedPos={highlightedPos} state={props.defaultState} setup={setup} makeMove={makeMove}/>
    <SetupInfo changeState={makeMove} selectPiece={selectPiece} selectedPiece={selectedPiece} switchMode={props.switchMode} state={props.defaultState}/>
  </div>
}
