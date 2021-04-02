import { useState } from 'react'
import { getStartState, State } from './logic/state'
import ChessBoard from './ChessBoard'
import SetupInfo from './SetupInfo'
import * as React from 'react'
import { Pos } from './logic/util'
import { EMPTY, Piece } from './logic/pieces'

export default function SetupMode (_props: {}) {
  const [state, setState] = useState<State>(getStartState)
  const [highlightedPos, setHighlightedPos] = useState<Pos>()
  const [selectedPiece, setSelectedPiece] = useState<Piece>()

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
  return <div className='App'>
    <ChessBoard changeHighlight={changeHighlight} highlightedPos={highlightedPos} state={state} setup={setup} makeMove={makeMove}/>
    <SetupInfo changeState={makeMove} selectPiece={selectPiece} selectedPiece={selectedPiece} state={state}/>
  </div>
}
