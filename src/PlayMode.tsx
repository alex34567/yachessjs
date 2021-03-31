import * as React from 'react'
import { useEffect, useReducer, useState } from 'react'
import { Human, Player } from './player'
import { getStartState, State } from './logic/state'
import { BLACK } from './logic/pieces'
import PlayChessBoard from './PlayChessBoard'
import GameInfo from './GameInfo'

interface Players {
  white: Player
  black: Player
}

export default function PlayMode (props: {}) {
  const [players, setPlayers] = useState<Players>({ white: new Human(), black: new Human() })
  const beginState = getStartState()
  const [state, setState] = useState(beginState)
  const forceUpdate = useReducer(x => x + 1, 0)[1]

  useEffect(() => {
    // If someone pushes the reset button at the exact time a move is ready,
    // then the board will be corrupted with the move that have been be canceled.
    // This variable blocks the board from updating in the promise handler,
    // preventing this race condition.
    let stateValid = true
    let player1 = players.white
    let player2 = players.black
    const makeMoveThen = (state: State): Promise<unknown> | undefined => {
      if (!stateValid) {
        return
      }
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
    setState(beginState)
    forceUpdate()
    return () => {
      stateValid = false
      players.white.close()
      players.black.close()
    }
  }, [players])

  const restart = (white: Player, black: Player) => {
    setPlayers({ white, black })
  }

  let currPlayer = players.white
  if (state.currTurn === BLACK) {
    currPlayer = players.black
  }
  return (
    <div className="App">
      <PlayChessBoard makeMove={currPlayer.getBoardClick()} state={state}/>
      <GameInfo state={state} restart={restart}/>
    </div>
  )
}
