import * as React from 'react'
import { useEffect, useState } from 'react'
import { Human, Player } from './player'
import { State } from './logic/state'
import { BLACK } from './logic/pieces'
import ChessBoard from './ChessBoard'
import GameInfo from './GameInfo'
import { Pos } from './logic/util'
import { ModeProps } from './App'

interface Players {
  white: Player
  black: Player
}

export default function PlayMode (props: ModeProps) {
  const [players, setPlayers] = useState<Players>({ white: new Human(), black: new Human() })
  const [state, setState] = useState(props.defaultState)
  const [highlightedPos, setHighlightedPos] = useState<Pos>()

  useEffect(() => {
    // If someone pushes the reset button at the exact time a move is ready,
    // then the board will be corrupted with the move that have been be canceled.
    // This variable blocks the board from updating in the promise handler,
    // preventing this race condition.
    let stateValid = true
    let player1 = players.white
    let player2 = players.black
    if (props.defaultState.currTurn === BLACK) {
      const tmp = player1
      player1 = player2
      player2 = tmp
    }
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
    player1.makeMove(props.defaultState).then(makeMoveThen)
    setState(props.defaultState)
    return () => {
      stateValid = false
      players.white.close()
      players.black.close()
    }
  }, [players])

  const restart = (white: Player, black: Player) => {
    setPlayers({ white, black })
  }

  const switchMode = () => {
    props.setDefaultState(state)
    props.switchMode(true)
  }

  let currPlayer = players.white
  if (state.currTurn === BLACK) {
    currPlayer = players.black
  }
  return (
    <div className="App">
      <ChessBoard changeHighlight={setHighlightedPos} highlightedPos={highlightedPos} makeMove={currPlayer.getBoardClick()} state={state}/>
      <GameInfo state={state} restart={restart} switchMode={switchMode}/>
    </div>
  )
}
