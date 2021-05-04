import { State } from './logic/state'
import { HumanFactory, Player, PlayerFactory } from './player'
import * as React from 'react'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import MoveHistory from './MoveHistory'
import { translateString } from './i18n'

interface GameInfoProps {
  state: State
  selectedMove: number
  setSelectedMove: (index: number) => void
  restart: (white: Player, black: Player) => void
  switchMode: () => void
  openTheme: () => void
  flipBoard: () => void
}

export default function GameInfo (props: GameInfoProps) {
  const [whiteFactory, setWhiteFactory] = useState<PlayerFactory>(new HumanFactory())
  const [blackFactory, setBlackFactory] = useState<PlayerFactory>(new HumanFactory())

  const restartButton = () => {
    props.restart(whiteFactory.build(), blackFactory.build())
  }

  const onWhiteChange = (player: PlayerFactory) => {
    setWhiteFactory(player)
  }

  const onBlackChange = (player: PlayerFactory) => {
    setBlackFactory(player)
  }

  let gameoverText
  if (props.state.gameOverReason) {
    gameoverText = translateString(props.state.gameOverReason)
  }
  return (
    <div className='GameInfo'>
      {gameoverText}
      <br/>
      <label>White Player </label>
      <PlayerSelector onPlayerChange={onWhiteChange} value={whiteFactory}/>
      <br/>
      <label>Black Player </label>
      <PlayerSelector onPlayerChange={onBlackChange} value={blackFactory}/>
      <br/>
      <button onClick={restartButton}>Restart</button>
      <button onClick={props.switchMode}>Setup</button>
      <br/>
      <button onClick={props.flipBoard}>Flip Board</button>
      <button onClick={props.openTheme}>Change Theme</button>
      <br/>
      <MoveHistory state={props.state} selectedMove={props.selectedMove} setSelectedMove={props.setSelectedMove}/>
    </div>
  )
}
