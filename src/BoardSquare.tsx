import { BLACK, Square, WHITE } from './logic/pieces'
import * as React from 'react'
import { Theme, ThemeManager } from './theme'

export interface BoardSquareProps {
  isBlack?: boolean
  inCheck?: boolean
  piece: Square
  onClick?: () => void
  highlighted?: boolean
  canMoveTo?: boolean
  children?: React.ReactNode
  theme: ThemeManager
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

function getPieceImage (theme: Theme, piece: Square): React.ReactNode | undefined {
  const name = getPieceName(piece)
  if (name) {
    return <img alt={name} className='ChessPiece' src={process.env.PUBLIC_URL + `pieces/${theme.piece.prefix}/${name}.svg`} />
  }
  return undefined
}

export default function BoardSquare (props: BoardSquareProps) {
  let className = `ChessBoardSquare ${props.theme.className}`
  if (props.isBlack) {
    className += ' ChessBoardSquareBlack'
  } else {
    className += ' ChessBoardSquareWhite'
  }
  let highlight
  if (props.highlighted) {
    highlight =
      <svg className='Overlay'>
        <rect width='100%' height='100%' fill='yellow' fillOpacity='.5' />
      </svg>
  }
  let checkHighlight
  if (props.inCheck) {
    checkHighlight =
      <svg className='Overlay'>
        <rect width='100%' height='100%' fill='red' fillOpacity='.5' />
      </svg>
  }
  const pieceImage = getPieceImage(props.theme.theme, props.piece)
  let moveIndicator
  if (props.canMoveTo && !pieceImage) {
    moveIndicator =
      <svg className='Overlay'>
        <circle r='10%' cx='50%' cy='50%' />
      </svg>
  }
  if (props.canMoveTo && pieceImage) {
    moveIndicator =
      <svg className='Overlay'>
        <circle r='47.5%' cx='50%' cy='50%' fill='none' stroke='black' strokeWidth='2.5%' />
      </svg>
  }
  return (
    <div className={className} onClick={props.onClick}>
      {highlight}
      {checkHighlight}
      {pieceImage}
      {moveIndicator}
      {props.children}
    </div>
  )
}
