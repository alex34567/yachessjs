import * as React from 'react'
import { useState } from 'react'
import { Pos } from './logic/util'
import { Move, Promotion } from './logic/moves'
import { BLACK, EMPTY, Piece } from './logic/pieces'
import { State } from './logic/state'
import * as immutable from 'immutable'
import PromoteMenu from './PromoteMenu'
import BoardSquare from './BoardSquare'
import { ThemeManager } from './theme'

export interface ChessBoardSetup {
  setupPiece?: Piece
}

export interface ChessBoardProps {
  state: State
  setup?: ChessBoardSetup
  highlightedPos?: Pos
  changeHighlight?: (pos: Pos | undefined) => void
  makeMove?: (state: State) => void
  theme: ThemeManager
}

export default function ChessBoard (props: ChessBoardProps) {
  const [promotePos, setPromotePos] = useState<Pos | null>(null)
  const highlightedPos = props.highlightedPos

  if (props.changeHighlight && highlightedPos && (!props.state.board.get(highlightedPos).isOccupied() || props.setup?.setupPiece)) {
    props.changeHighlight(undefined)
  }
  if (!highlightedPos && promotePos) {
    setPromotePos(null)
  }

  const squares = []
  let isBlack = false
  let moves: Move[] = []
  let drawPromotePos = promotePos
  if (drawPromotePos && props.state.currTurn === BLACK) {
    drawPromotePos = drawPromotePos.addRank(3)
  }
  if (highlightedPos && props.makeMove) {
    const moveFilter = (move: Move) => {
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
    }
    moves = props.state.moves().filter(moveFilter)
    // Display black's moves as well
    if (props.setup) {
      moves = moves.concat(props.state.flipTurn().moves().filter(moveFilter))
    }
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
        props.changeHighlight && props.changeHighlight(undefined)
        setPromotePos(null)
      }
      const move = moves[moveIndex]
      if (highlightedPos && pos.compare(highlightedPos) === 0) {
        // deselect on selecting the same piece twice
      } else if (highlightedPos && props.makeMove && props.setup) {
        const makeMove = props.makeMove
        onClick = () => {
          makeMove(props.state.modify(state => {
            const piece = state.board.get(highlightedPos)
            state.board = state.board.set(highlightedPos, EMPTY)
            state.board = state.board.set(pos, piece)
          }))
          props.changeHighlight && props.changeHighlight(undefined)
          setPromotePos(null)
        }
      } else if (props.setup && props.setup.setupPiece && props.makeMove) {
        const makeMove = props.makeMove
        const setupPiece = props.setup.setupPiece
        onClick = () => {
          makeMove(props.state.modify(state => {
            state.board = state.board.set(pos, setupPiece)
          }))
          props.changeHighlight && props.changeHighlight(undefined)
        }
      } else if (moveIndex === -1 && piece.isOccupied()) {
        onClick = () => {
          props.changeHighlight && props.changeHighlight(pos)
          setPromotePos(null)
        }
      } else if (moveIndex >= 0 && ((move.isNormal() && !move.isPromote()) || move.isCastle())) {
        onClick = () => {
          props.makeMove!(moves[moveIndex].do())
          props.changeHighlight && props.changeHighlight(undefined)
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
          props.changeHighlight && props.changeHighlight(undefined)
          setPromotePos(null)
        }

        function PromoteFilter (move: Move): move is Promotion {
          if (!move.isNormal() || !promotePos || move.toPos.compare(promotePos) !== 0) {
            return false
          }
          return move.isPromote()
        }

        const promoteList = immutable.List(moves.filter<Promotion>(PromoteFilter))

        promoteMenu = <PromoteMenu moves={promoteList} onPromote={onPromote} theme={props.theme}/>
      }
      const canMoveTo = moveIndex >= 0 && !promotePos
      squares.push(
        <BoardSquare key={i * 8 + j} canMoveTo={canMoveTo} isBlack={isBlack} piece={piece} highlighted={highlighted}
                     inCheck={inCheck} onClick={onClick} theme={props.theme}>
          {promoteMenu}
        </BoardSquare>
      )
    }
  }
  return (
    <div className="Square">
      <div className="ChessBoard">
        {squares}
      </div>
    </div>
  )
}
