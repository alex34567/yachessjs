import * as React from 'react'
import { useState } from 'react'
import { Pos } from './logic/util'
import { Move, Promotion } from './logic/moves'
import { BLACK } from './logic/pieces'
import { State } from './logic/state'
import * as immutable from 'immutable'
import PromoteMenu from './PromoteMenu'
import BoardSquare from './BoardSquare'

export interface ChessBoardProps {
  state: State
  makeMove?: (state: State) => void
}

export default function ChessBoard (props: ChessBoardProps) {
  const [highlightedPos, setHighlightedPos] = useState<Pos | null>(null)
  const [promotePos, setPromotePos] = useState<Pos | null>(null)

  if (highlightedPos && !props.state.board.get(highlightedPos).isOccupied()) {
    setHighlightedPos(null)
  }

  const squares = []
  let isBlack = false
  let moves: Move[] = []
  let drawPromotePos = promotePos
  if (drawPromotePos && props.state.currTurn === BLACK) {
    drawPromotePos = drawPromotePos.addRank(3)
  }
  if (highlightedPos && props.makeMove) {
    moves = props.state.moves().filter(move => {
      if (move.invalid() || props.state.isGameOver()) {
        return false
      }
      if (move.isNormal()) {
        return move.fromPos.compare(highlightedPos) === 0
      }
      if (move.isCastle()) {
        return highlightedPos.rank === props.state.currTurn.KING_RANK && highlightedPos.file === 4
      }
      return false
    })
  }
  for (let i = 7; i >= 0; i--) {
    isBlack = !isBlack
    for (let j = 0; j < 8; j++) {
      isBlack = !isBlack
      const pos = new Pos(j, i)
      const highlighted = Boolean(highlightedPos && pos.compare(highlightedPos) === 0)
      const piece = props.state.board.get(new Pos(j, i))
      const inCheck = piece === props.state.currTurn.KING && props.state.isCheck()
      const moveIndex = moves.findIndex(move => {
        if (move.isNormal()) {
          return move.toPos.compare(pos) === 0
        }
        if (move.isCastle()) {
          if (pos.rank !== props.state.currTurn.KING_RANK) {
            return false
          }
          if (move.isKingSide) {
            return pos.file === 7 || pos.file === 6
          } else {
            return pos.file === 2 || pos.file === 0
          }
        }
        return false
      })
      let onClick = () => {
        setHighlightedPos(null)
        setPromotePos(null)
      }
      const move = moves[moveIndex]
      if (highlightedPos && pos.compare(highlightedPos) === 0) {
        // deselect on selecting the same piece twice
      } else if (moveIndex === -1 && piece.isOccupied()) {
        onClick = () => {
          setHighlightedPos(pos)
          setPromotePos(null)
        }
      } else if (moveIndex >= 0 && ((move.isNormal() && !move.isPromote()) || move.isCastle())) {
        onClick = () => {
          props.makeMove!(moves[moveIndex].do())
          setHighlightedPos(null)
          setPromotePos(null)
        }
      } else if (moveIndex >= 0 && move.isNormal() && move.isPromote() && !promotePos) {
        const promote = move
        onClick = () => {
          setPromotePos(promote.toPos)
        }
      }
      let promoteMenu
      if (drawPromotePos && pos.compare(drawPromotePos) === 0) {
        const onPromote = (state: State) => {
          props.makeMove!(state)
          setHighlightedPos(null)
          setPromotePos(null)
        }

        function PromoteFilter (move: Move): move is Promotion {
          if (!move.isNormal() || !promotePos || move.toPos.compare(promotePos) !== 0) {
            return false
          }
          return move.isPromote()
        }

        const promoteList = immutable.List(moves.filter<Promotion>(PromoteFilter))

        promoteMenu = <PromoteMenu moves={promoteList} onPromote={onPromote}/>
      }
      const canMoveTo = moveIndex >= 0 && !promotePos
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
