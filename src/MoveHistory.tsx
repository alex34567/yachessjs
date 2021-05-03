import { State } from './logic/state'
import { BLACK } from './logic/pieces'
import React from 'react'

export interface MoveHistoryProps {
  state: State
  selectedMove: number
  setSelectedMove: (index: number) => void
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
    const id = move.state.getHistoryIndex()
    let ref
    let className = 'ChessMove'
    if (i === props.state.moveHistory.size - 1) {
      ref = autoScroll
    }
    if (i === props.selectedMove - 1) {
      className += ' Selected'
    }
    const onClick = () => {
      props.setSelectedMove(i + 1)
    }
    moves.push(<div key={id} className={className} ref={ref} onClick={onClick}>{move.toString()}</div>)
  }

  return (
    <div className='MoveHistory'>
      {moves}
    </div>
  )
}
