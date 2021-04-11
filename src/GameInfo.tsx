import { State } from './logic/state'
import { HumanFactory, Player, PlayerFactory } from './player'
import * as React from 'react'
import { useState } from 'react'
import PlayerSelector from './PlayerSelector'
import { changeTheme } from './theme'

interface GameInfoProps {
  state: State
  restart: (white: Player, black: Player) => void
  switchMode: () => void
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

  const onThemeChange = () => {
    changeTheme({
      piece: 'merida',
      board: {
        blackColor: 'darkGreen',
        whiteColor: 'white'
      }
    })
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
      <label>White Player </label>
      <PlayerSelector onPlayerChange={onWhiteChange} value={whiteFactory}/>
      <br/>
      <label>Black Player </label>
      <PlayerSelector onPlayerChange={onBlackChange} value={blackFactory}/>
      <br/>
      <button onClick={restartButton}>Restart</button>
      <button onClick={props.switchMode}>Setup</button>
      <button onClick={onThemeChange}>DEBUG: THEME CHANGE</button>
    </div>
  )
}
