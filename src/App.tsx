import * as React from 'react'
import './App.css'
import { Pos } from './logic/util'
import { Square, WHITE, BLACK } from './logic/pieces'
import { getStartState, State } from './logic/state'
import { Move, Promotion } from './logic/moves'
import * as immutable from 'immutable'

interface BoardSquareProps {
  isBlack: boolean
  piece: Square
  onClick?: () => void
  highlighted: boolean
  canMoveTo: boolean
  children?: React.ReactNode | React.ReactNode[]
}

function getPieceName (piece: Square): string | undefined {
  switch (piece) {
    case WHITE.QUEEN:
      return 'White Queen'
    case WHITE.KING:
      return 'White King'
    case WHITE.BISHOP:
      return 'White Bishop'
    case WHITE.ROOK:
      return 'White Rook'
    case WHITE.KNIGHT:
      return 'White Knight'
    case WHITE.PAWN:
      return 'White Pawn'
    case BLACK.QUEEN:
      return 'Black Queen'
    case BLACK.KING:
      return 'Black King'
    case BLACK.BISHOP:
      return 'Black Bishop'
    case BLACK.ROOK:
      return 'Black Rook'
    case BLACK.KNIGHT:
      return 'Black Knight'
    case BLACK.PAWN:
      return 'Black Pawn'
  }
  return undefined
}

function getPieceImage (piece: Square): React.ReactNode | undefined {
  const name = getPieceName(piece)
  if (name) {
    return <img alt={name} className='ChessPiece' src={`pieces/cburnett/${name}.svg`} />
  }
  return undefined
}

function BoardSquare (props: BoardSquareProps) {
  let className = 'ChessBoardSquare'
  if (props.isBlack) {
    className += ' ChessBoardSquareBlack'
  } else {
    className += ' ChessBoardSquareWhite'
  }
  if (props.highlighted) {
    className += ' Highlighted'
  }
  const pieceImage = getPieceImage(props.piece)
  let moveIndicator
  if (props.canMoveTo && !pieceImage) {
    moveIndicator =
        <svg className='CaptureCircle' xmlns='http://www.w3.org/2000/svg'>
          <circle r='10%' cx='50%' cy='50%' />
        </svg>
  }
  if (props.canMoveTo && pieceImage) {
    moveIndicator =
        <svg className='CaptureCircle' xmlns='http://www.w3.org/2000/svg'>
          <circle r='47.5%' cx='50%' cy='50%' fill='none' stroke='black' strokeWidth='2.5%' />
        </svg>
  }
  return (
      <div className={className} onClick={props.onClick}>
        {pieceImage}
        {moveIndicator}
        {props.children}
      </div>
  )
}

interface PromoteMenuProps {
  moves: immutable.List<Promotion>,
  onPromote: (state: State) => void,
}

function PromoteMenu (props: PromoteMenuProps) {
  const promotes = []
  let key = 0
  for (const move of props.moves) {
    const onClick = () => {
      props.onPromote(move.do())
    }
    promotes.push(<BoardSquare key={key++} isBlack={false} piece={move.promoteChoice} highlighted={false} canMoveTo={false} onClick={onClick} />)
  }
  return (
      <div className='PromoteMenu'>
        {promotes}
      </div>
  )
}

interface ChessBoardState {
  state: State
  highlightedPos: Pos | null
  promotePos: Pos | null
}

class ChessBoard extends React.PureComponent<{}, ChessBoardState> {
  constructor (props: {}) {
    super(props)
    this.state = {
      state: getStartState(),
      highlightedPos: null,
      promotePos: null
    }
  }

  render (): React.ReactElement {
    const squares = []
    let isBlack = false
    let moves: Move[] = []
    const highlightedPos = this.state.highlightedPos
    let drawPromotePos = this.state.promotePos
    if (drawPromotePos && this.state.state.currTurn === BLACK) {
      drawPromotePos = drawPromotePos.addRank(3)
    }
    if (highlightedPos) {
      moves = this.state.state.moves().filter(move => {
        if (move.invalid()) {
          return false
        }
        if (move.isNormal()) {
          return move.fromPos.compare(highlightedPos) === 0
        }
        if (move.isCastle()) {
          return highlightedPos.rank === this.state.state.currTurn.KING_RANK && highlightedPos.file === 4
        }
        return false
      })
    }
    for (let i = 7; i >= 0; i--) {
      isBlack = !isBlack
      for (let j = 7; j >= 0; j--) {
        isBlack = !isBlack
        const pos = new Pos(j, i)
        const highlighted = Boolean(highlightedPos && pos.compare(highlightedPos) === 0)
        const piece = this.state.state.board.get(new Pos(j, i))
        const moveIndex = moves.findIndex(move => {
          if (move.isNormal()) {
            return move.toPos.compare(pos) === 0
          }
          if (move.isCastle()) {
            if (pos.rank !== this.state.state.currTurn.KING_RANK) {
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
          this.setState({ highlightedPos: null, promotePos: null })
        }
        const move = moves[moveIndex]
        if (moveIndex === -1 && piece.isOccupied()) {
          onClick = () => {
            this.setState({ highlightedPos: pos, promotePos: null })
          }
        } else if (moveIndex >= 0 && move.isNormal() && !move.isPromote()) {
          onClick = () => {
            this.setState({ highlightedPos: null, state: moves[moveIndex].do(), promotePos: null })
          }
        } else if (moveIndex >= 0 && move.isNormal() && move.isPromote() && !this.state.promotePos) {
          const promote = move
          onClick = () => {
            this.setState({ promotePos: promote.toPos })
          }
        }
        let promoteMenu
        if (drawPromotePos && pos.compare(drawPromotePos) === 0) {
          const onPromote = (state: State) => {
            this.setState({ state })
          }
          const that = this
          function PromoteFilter (move: Move): move is Promotion {
            if (!move.isNormal() || !that.state.promotePos || move.toPos.compare(that.state.promotePos) !== 0) {
              return false
            }
            return move.isPromote()
          }

          const promoteList = immutable.List(moves.filter<Promotion>(PromoteFilter))

          promoteMenu = <PromoteMenu moves={promoteList} onPromote={onPromote} />
        }
        const canMoveTo = moveIndex >= 0 && !this.state.promotePos
        squares.push(
            <BoardSquare key={i * 8 + j} canMoveTo={canMoveTo} isBlack={isBlack} piece={piece} highlighted={highlighted} onClick={onClick}>
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
}

function App () {
  return (
    <div className="App">
      <ChessBoard />
    </div>
  )
}

export default App
