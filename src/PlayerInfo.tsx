import React from 'react'
import { Player } from './player'
import ChessClock from './ChessClock'

export interface PlayerInfoProps {
  player: Player
}

export default function PlayerInfo (props: PlayerInfoProps) {
  return (
    <div className='PlayerInfo'>
      <div className='PlayerId'>
        <div className='PlayerName'>
          {props.player.name()}
        </div>
        <div className='PlayerRanking'>
          {props.player.ranking()}
        </div>
      </div>
      <ChessClock active={props.player.isActive()}></ChessClock>
    </div>
  )
}
