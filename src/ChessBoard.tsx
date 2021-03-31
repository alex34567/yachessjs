import * as React from 'react'
import { Pos } from './logic/util'
import { State } from './logic/state'
import BoardSquare from './BoardSquare'

export interface PotentialMove {
  circle?: boolean
  onClick: () => void
}

export interface PromotePlusLoc {
  menu: React.ReactElement
  pos: Pos
}

export interface ChessBoardProps {
  state: State
  moveInfo?: (to: Pos) => (PotentialMove | undefined | null)
  promote?: PromotePlusLoc
  highlightedPos?: Pos | null
}

export default function ChessBoard (props: ChessBoardProps) {
  const squares = []
  let isBlack = false
  for (let i = 7; i >= 0; i--) {
    isBlack = !isBlack
    for (let j = 0; j < 8; j++) {
      isBlack = !isBlack
      const pos = new Pos(j, i)
      const highlighted = Boolean(props.highlightedPos && pos.compare(props.highlightedPos) === 0)
      const piece = props.state.board.get(new Pos(j, i))
      const inCheck = piece === props.state.currTurn.KING && props.state.isCheck()
      let move: PotentialMove | undefined | null
      if (props.moveInfo) {
        move = props.moveInfo(pos)
      }
      const onClick = () => {
        move && move.onClick()
      }
      let promoteMenu
      if (props.promote && pos.compare(props.promote.pos) === 0) {
        promoteMenu = props.promote.menu
      }
      const canMoveTo = Boolean(move && move.circle)
      squares.push(
        <BoardSquare key={i * 8 + j} canMoveTo={canMoveTo} isBlack={isBlack} piece={piece} highlighted={highlighted}
                     inCheck={inCheck} onClick={onClick}>
          {promoteMenu}
        </BoardSquare>
      )
    }
  }
  return (
    <div className="ChessBoard">
      {squares}
    </div>
  )
}
