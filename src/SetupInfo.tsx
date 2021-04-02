import { getStartState, State, stateFromFen } from './logic/state'
import * as React from 'react'
import { BLACK, Piece, WHITE } from './logic/pieces'
import LabelledTextBox from './LabelledTextbox'
import { ChangeEvent, useState } from 'react'
import BoardSquare from './BoardSquare'

export interface SetupInfoProps {
  state: State
  changeState: (state: State) => void
  selectedPiece?: Piece
  selectPiece: (piece?: Piece) => void
}

export default function SetupInfo (props: SetupInfoProps) {
  const [inputFen, setInputFen] = useState(() => props.state.toFen())
  const [fenImportError, setImportError] = useState<string>()

  let errorKey = 0
  const errors: React.ReactElement[] = []
  function newError (condition: unknown, text: string | undefined | null) {
    if (condition) {
      errors.push(
        <p className='ErrorText' key={errorKey}>
          {text}
        </p>
      )
    }
    errorKey++
  }
  function onInputFenChange (event: ChangeEvent<HTMLInputElement>) {
    setInputFen(event.target.value)
  }
  function onImportFen () {
    try {
      props.changeState(stateFromFen(inputFen))
      setImportError(undefined)
    } catch (e) {
      setImportError(e.toString())
    }
  }
  function onReset () {
    props.changeState(getStartState())
  }
  function onClear () {
    props.changeState(stateFromFen('8/8/8/8/8/8/8/8 w - - 0 1'))
  }

  newError(fenImportError, fenImportError)
  newError(props.state.isCheckmate(), 'Setup state is mate')
  newError(props.state.flipTurn().isCheck(), 'The king is captured')
  const whiteKingCount = props.state.board.reduce((acc, piece) => acc + Number(piece === WHITE.KING), 0)
  const blackKingCount = props.state.board.reduce((acc, piece) => acc + Number(piece === BLACK.KING), 0)
  newError(whiteKingCount === 0, 'White needs a king')
  newError(whiteKingCount > 1, 'White has more than one king')
  newError(blackKingCount === 0, 'Black needs a king')
  newError(blackKingCount > 1, 'Black has more than one king')
  const backRankPawns = props.state.board.reduce((acc, piece, pos) => {
    return acc + Number((pos.rank === 0 || pos.rank === 7) && (piece === WHITE.PAWN || piece === BLACK.PAWN))
  }, 0)
  newError(backRankPawns === 1, 'There is a pawn on the back rank')
  newError(backRankPawns > 1, `There are ${backRankPawns} pawns on the back rank`)

  function piecesToElement (piece: Piece, key: number): React.ReactElement {
    function onClick () {
      if (piece === props.selectedPiece) {
        props.selectPiece()
      } else {
        props.selectPiece(piece)
      }
    }
    const highlighted = piece === props.selectedPiece
    return <BoardSquare key={key} piece={piece} highlighted={highlighted} onClick={onClick}/>
  }

  const blackPieces = [BLACK.PAWN, BLACK.KNIGHT, BLACK.BISHOP, BLACK.ROOK, BLACK.QUEEN, BLACK.KING].map(piecesToElement)
  const whitePieces = [WHITE.PAWN, WHITE.KNIGHT, WHITE.BISHOP, WHITE.ROOK, WHITE.QUEEN, WHITE.KING].map(piecesToElement)

  return (
    <div className='SetupInfo'>
      <div className='SetupErrorBox'>
        {errors}
      </div>
      <div className='SetupPieceBox'>
        {blackPieces}
      </div>
      <div className='SetupPieceBox'>
        {whitePieces}
      </div>
      <LabelledTextBox value={props.state.toFen()} type='text' readOnly label='Current Fen:'/>
      <LabelledTextBox label='Input Fen:' onChange={onInputFenChange} value={inputFen}/>
      <button onClick={onImportFen}>Import Fen</button>
      <button onClick={onReset}>Reset</button>
      <button onClick={onClear}>Clear</button>
    </div>
  )
}
