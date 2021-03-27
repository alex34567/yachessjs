import * as React from 'react'
import { useEffect, useReducer, useState } from 'react'
import './App.css'
import { BLACK } from './logic/pieces'
import { getStartState, State } from './logic/state'
import { Human, Player } from './player'
import ChessBoard from './ChessBoard'
import GameInfo from './GameInfo'

function App (props: {}) {
  const [white, setWhite] = useState<Player>(new Human())
  const [black, setBlack] = useState<Player>(new Human())
  const beginState = getStartState()
  const [state, setState] = useState(beginState)
  const forceUpdate = useReducer(x => x + 1, 0)[1]

  useEffect(() => {
    let player1 = white
    let player2 = black
    const makeMoveThen = (state: State): Promise<unknown> | undefined => {
      if (state.isGameOver()) {
        setState(state)
        return
      }
      const tmp = player1
      player1 = player2
      player2 = tmp
      const ret = player1.makeMove(state).then(makeMoveThen)
      setState(state)
      return ret
    }
    player1.makeMove(beginState).then(makeMoveThen)
    forceUpdate()
    return () => {
      white.close()
      black.close()
    }
  }, [white, black])

  const restart = (white: Player, black: Player) => {
    white.close()
    black.close()
    setWhite(white)
    setBlack(black)
    setState(beginState)
  }

  let currPlayer = white
  if (state.currTurn === BLACK) {
    currPlayer = black
  }
  return (
    <div className="App">
      <ChessBoard makeMove={currPlayer.getBoardClick()} state={state} />
      <GameInfo state={state} restart={restart} />
    </div>
  )
}

export default App
