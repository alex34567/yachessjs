import { State } from './logic/state'
import { BLACK } from './logic/pieces'
import React from 'react'

export interface MoveHistoryProps {
  state: State
}

function autoScroll (div: HTMLDivElement | null) {
  if (div) {
    div.scrollIntoView(false)
  }
}

export default function MoveHistory (props: MoveHistoryProps) {
  const moves = []
  if (props.state.begin().currTurn === BLACK) {
    moves.push(<div key='Filler' className='ChessMove'/>)
  }

  for (let i = 0; i < props.state.moveHistory.size; i++) {
    const move = props.state.moveHistory.get(i)!
    const halfMove = move.state.halfMoveCount()
    let ref
    if (i === props.state.moveHistory.size - 1) {
      ref = autoScroll
    }
    moves.push(<div key={halfMove} className='ChessMove' ref={ref}>{move.toString()}</div>)
  }

  return (
    <div className='MoveHistory'>
      {moves}
    </div>
  )
}
