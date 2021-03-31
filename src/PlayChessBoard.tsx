import * as React from 'react'
import { useState } from 'react'
import { Pos } from './logic/util'
import { Move, Promotion } from './logic/moves'
import { BLACK } from './logic/pieces'
import { State } from './logic/state'
import * as immutable from 'immutable'
import PromoteMenu from './PromoteMenu'
import ChessBoard from './ChessBoard'

export interface ChessBoardProps {
  state: State
  makeMove?: (state: State) => void
}

export default function PlayChessBoard (props: ChessBoardProps) {
  const [highlightedPos, setHighlightedPos] = useState<Pos | null>(null)
  const [promotePos, setPromotePos] = useState<Pos | null>(null)

  if (highlightedPos && !props.state.board.get(highlightedPos).isOccupied()) {
    setHighlightedPos(null)
  }

  let moves: Move[] = []
  if (highlightedPos) {
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
  let drawPromotePos = promotePos
  if (drawPromotePos && props.state.currTurn === BLACK) {
    drawPromotePos = drawPromotePos.addRank(3)
  }
  const moveInfo = (to: Pos) => {
    const moveIndex = moves.findIndex(move => {
      if (move.isNormal()) {
        return move.toPos.compare(to) === 0
      }
      if (move.isCastle()) {
        if (to.rank !== props.state.currTurn.KING_RANK) {
          return false
        }
        if (move.isKingSide) {
          return to.file === 7 || to.file === 6
        } else {
          return to.file === 2 || to.file === 0
        }
      }
      return false
    })

    let onClick = () => {
      setHighlightedPos(null)
      setPromotePos(null)
    }
    let circle = false
    const move = moves[moveIndex]
    const piece = props.state.board.get(to)
    if (highlightedPos && to.compare(highlightedPos) === 0) {
      // deselect on selecting the same piece twice
    } else if (moveIndex === -1 && piece.isOccupied()) {
      onClick = () => {
        setHighlightedPos(to)
        setPromotePos(null)
      }
    } else if (moveIndex >= 0 && ((move.isNormal() && !move.isPromote()) || move.isCastle())) {
      onClick = () => {
        props.makeMove!(moves[moveIndex].do())
        setHighlightedPos(null)
        setPromotePos(null)
      }
      circle = true
    } else if (moveIndex >= 0 && move.isNormal() && move.isPromote() && !promotePos) {
      const promote = move
      onClick = () => {
        setPromotePos(promote.toPos)
      }
      circle = true
    }

    return { onClick, circle }
  }
  let promote
  if (drawPromotePos) {
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

    const menu = <PromoteMenu moves={promoteList} onPromote={onPromote}/>

    promote = { menu, pos: drawPromotePos }
  }

  return (
    <ChessBoard state={props.state} highlightedPos={highlightedPos} moveInfo={moveInfo} promote={promote}/>
  )
}
