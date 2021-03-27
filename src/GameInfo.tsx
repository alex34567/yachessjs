import { State } from './logic/state'
import { Human, Player } from './player'
import * as React from 'react'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'

interface GameInfoProps {
  state: State
  restart: (white: Player, black: Player) => void
}

export default function GameInfo (props: GameInfoProps) {
  const [[WhiteCons], setWhiteCons] = useState<[() => Player]>([() => new Human()])
  const [[BlackCons], setBlackCons] = useState<[() => Player]>([() => new Human()])

  const restartButton = () => {
    props.restart(WhiteCons(), BlackCons())
  }

  const onWhiteChange = (player: () => Player) => {
    setWhiteCons([player])
  }

  const onBlackChange = (player: () => Player) => {
    setBlackCons([player])
  }

  let checkmateText
  if (props.state.isCheckmate()) {
    checkmateText = 'Checkmate'
  } else if (props.state.isDraw()) {
    checkmateText = `Draw due to ${props.state.drawReason()}`
  }
  return (
    <div className='GameInfo'>
      {checkmateText}
      <br/>
      <button onClick={restartButton}>
        Restart
      </button>
      <br/>
      <label>White Player </label>
      <PlayerSelector onPlayerChange={onWhiteChange}/>
      <br/>
      <label>Black Player </label>
      <PlayerSelector onPlayerChange={onBlackChange}/>
    </div>
  )
}
