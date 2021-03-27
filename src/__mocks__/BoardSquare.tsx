import React from 'react'
import { BoardSquareProps } from '../BoardSquare'

function falseToUndef (x: unknown): true | undefined {
  if (!x) {
    return
  }
  return true
}

export default function BoardSquare (props: BoardSquareProps) {
  let name
  if (props.piece.isOccupied()) {
    name = props.piece.fenLetter
  }
  return (
    <div
      data-name={name}
      data-isblack={falseToUndef(props.isBlack)}
      data-incheck={falseToUndef(props.inCheck)}
      data-canmoveto={falseToUndef(props.canMoveTo)}
      data-highlighted={falseToUndef(props.highlighted)}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  )
}
