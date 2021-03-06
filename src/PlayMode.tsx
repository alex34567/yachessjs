import * as React from 'react'
import { useEffect, useState } from 'react'
import { LocalHuman, Player } from './player'
import { State } from './logic/state'
import { BLACK } from './logic/pieces'
import ChessBoard from './ChessBoard'
import GameInfo from './GameInfo'
import { Pos } from './logic/util'
import { useHistory, useLocation } from 'react-router-dom'
import { changeMode, getStateFromQuery } from './util'
import { ModeProps } from './App'
import PlayerInfo from './PlayerInfo'

interface Players {
  white: Player
  black: Player
}

export default function PlayMode (props: ModeProps) {
  const history = useHistory()
  const location = useLocation()
  const [players, setPlayers] = useState<Players>({ white: new LocalHuman(), black: new LocalHuman() })

  const [state, setState] = useState(() => getStateFromQuery(history))
  const [highlightedPos, setHighlightedPos] = useState<Pos>()
  const [flipBoard, setFlipBoard] = useState(false)
  const [selectedMove, setSelectedMove] = useState(state.getHistoryIndex())
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    // If someone pushes the reset button at the exact time a move is ready,
    // then the board will be corrupted with the move that has been canceled.
    // This variable blocks the board from updating in the promise handler,
    // preventing this race condition.
    const defaultState = getStateFromQuery(history)
    let stateValid = true
    let player1 = players.white
    let player2 = players.black
    if (defaultState.currTurn === BLACK) {
      const tmp = player1
      player1 = player2
      player2 = tmp
    }
    const makeMoveThen = (state: State): Promise<unknown> | undefined => {
      if (!stateValid) {
        return
      }
      let ret
      if (!state.isGameOver()) {
        const tmp = player1
        player1 = player2
        player2 = tmp
        ret = player1.makeMove(state).then(makeMoveThen)
      }
      setState(state)
      setSelectedMove(state.getHistoryIndex())
      return ret
    }
    player1.makeMove(defaultState).then(makeMoveThen)
    setState(defaultState)
    setSelectedMove(defaultState.getHistoryIndex())
    setForceUpdate(!forceUpdate)
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
    changeMode(history, location, state, '/setup.html', false)
  }

  function toggleBoardFlip () {
    setFlipBoard(!flipBoard)
  }

  let currPlayer = players.white
  if (state.currTurn === BLACK) {
    currPlayer = players.black
  }

  const boardState = state.getHistory(selectedMove)
  let makeMove
  if (selectedMove === state.getHistoryIndex()) {
    makeMove = currPlayer.getBoardClick()
  }

  let topPlayer = players.black
  let bottomPlayer = players.white
  if (flipBoard) {
    topPlayer = players.white
    bottomPlayer = players.black
  }

  return (
    <div className="App">
      <div className="GameArea">
        <PlayerInfo player={topPlayer}/>
        <div className="PlayChessBoardBox">
          <ChessBoard flipBoard={flipBoard} changeHighlight={setHighlightedPos} highlightedPos={highlightedPos} makeMove={makeMove} state={boardState} theme={props.theme}/>
        </div>
        <PlayerInfo player={bottomPlayer}/>
      </div>
      <GameInfo flipBoard={toggleBoardFlip} state={state} restart={restart} switchMode={switchMode}
                openTheme={props.openTheme} selectedMove={selectedMove} setSelectedMove={setSelectedMove}/>
    </div>
  )
}
