import React from 'react'

export interface ChessClockProps {
  active: boolean
}

export default function ChessClock (props: ChessClockProps) {
  let className = 'ChessClock'
  if (props.active) {
    className += ' Active'
  }
  return (
    <div className={className}>∞</div>
  )
}
