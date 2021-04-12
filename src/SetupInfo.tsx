import { getStartState, State, stateFromFen } from './logic/state'
import * as React from 'react'
import { BLACK, Piece, WHITE } from './logic/pieces'
import LabelledTextBox from './LabelledTextbox'
import { ChangeEvent, useState } from 'react'
import BoardSquare from './BoardSquare'
import { Pos } from './logic/util'
import { changeMode } from './util'
import { useHistory, useLocation } from 'react-router-dom'
import { ThemeManager } from './theme'

export interface SetupInfoProps {
  state: State
  changeState: (state: State) => void
  selectedPiece?: Piece
  selectPiece: (piece?: Piece) => void
  theme: ThemeManager
  openTheme: () => void
}

export default function SetupInfo (props: SetupInfoProps) {
  const [inputFen, setInputFen] = useState(() => props.state.toFen())
  const [fenImportError, setImportError] = useState<string>()
  const history = useHistory()
  const location = useLocation()

  let errorKey = 0
  const errors: React.ReactElement[] = []
  let hasError = false
  function newError (condition: unknown, text: string | undefined | null) {
    if (condition) {
      hasError = true
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
  function onToggleWhiteKingSideCastle (event: ChangeEvent<HTMLInputElement>) {
    props.changeState(props.state.modify(newState => { newState.white.kingSideCastle = event.target.checked }))
  }
  function onToggleWhiteQueenSideCastle (event: ChangeEvent<HTMLInputElement>) {
    props.changeState(props.state.modify(newState => { newState.white.queenSideCastle = event.target.checked }))
  }
  function onToggleBlackKingSideCastle (event: ChangeEvent<HTMLInputElement>) {
    props.changeState(props.state.modify(newState => { newState.black.kingSideCastle = event.target.checked }))
  }
  function onToggleBlackQueenSideCastle (event: ChangeEvent<HTMLInputElement>) {
    props.changeState(props.state.modify(newState => { newState.black.queenSideCastle = event.target.checked }))
  }
  function onChangeFirstMove (event: ChangeEvent<HTMLSelectElement>) {
    let targetMove = WHITE
    if (event.target.value === 'black') {
      targetMove = BLACK
    }
    if (targetMove !== props.state.currTurn) {
      props.changeState(props.state.flipTurn())
    }
  }
  function onChangeEnPassantFile (event: ChangeEvent<HTMLSelectElement>) {
    props.changeState(props.state.modify(newState => {
      let enPassantRank = 5
      if (newState.currTurn === BLACK) {
        enPassantRank = 2
      }
      const enPassantPlayer = newState.getColor(newState.currTurn.OTHER_COLOR)
      if (event.target.value) {
        enPassantPlayer.enPassantPos = new Pos(Number(event.target.value), enPassantRank)
      }
    }))
  }
  function onPlay () {
    changeMode(history, location, props.state, '/play', false)
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
    return <BoardSquare key={key} piece={piece} highlighted={highlighted} onClick={onClick} theme={props.theme}/>
  }

  const blackPieces = [BLACK.PAWN, BLACK.KNIGHT, BLACK.BISHOP, BLACK.ROOK, BLACK.QUEEN, BLACK.KING].map(piecesToElement)
  const whitePieces = [WHITE.PAWN, WHITE.KNIGHT, WHITE.BISHOP, WHITE.ROOK, WHITE.QUEEN, WHITE.KING].map(piecesToElement)

  let selectedFirstMove = 'white'
  if (props.state.currTurn === BLACK) {
    selectedFirstMove = 'black'
  }

  let enPassantFile = ''
  if (props.state.white.enPassantPos) {
    enPassantFile = String(props.state.white.enPassantPos.file)
  } else if (props.state.black.enPassantPos) {
    enPassantFile = String(props.state.black.enPassantPos.file)
  }

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
      <div>
        <label>First Move: </label>
        <select value={selectedFirstMove} onChange={onChangeFirstMove}>
          <option value='white'>White</option>
          <option value='black'>Black</option>
        </select>
      </div>
      <div>
        <label>En-passant file: </label>
        <select value={enPassantFile} onChange={onChangeEnPassantFile}>
          <option value=''>-</option>
          <option value='0'>a</option>
          <option value='1'>b</option>
          <option value='2'>c</option>
          <option value='3'>d</option>
          <option value='4'>e</option>
          <option value='5'>f</option>
          <option value='6'>g</option>
          <option value='7'>h</option>
        </select>
      </div>
      <div>
        <label>White O-O: </label>
        <input type='checkbox' checked={props.state.white.kingSideCastle} onChange={onToggleWhiteKingSideCastle}/>
      </div>
      <div>
        <label>White O-O-O: </label>
        <input type='checkbox' checked={props.state.white.queenSideCastle} onChange={onToggleWhiteQueenSideCastle}/>
      </div>
      <div>
        <label>Black O-O: </label>
        <input type='checkbox' checked={props.state.black.kingSideCastle} onChange={onToggleBlackKingSideCastle}/>
      </div>
      <div>
        <label>Black O-O-O: </label>
        <input type='checkbox' checked={props.state.black.queenSideCastle} onChange={onToggleBlackQueenSideCastle}/>
      </div>
      <div>
        <button onClick={onImportFen}>Import Fen</button>
        <button onClick={onReset}>Reset</button>
        <button onClick={onClear}>Clear</button>
      </div>
      <button disabled={hasError} onClick={onPlay}>Play</button>
      <button onClick={props.openTheme}>Change Theme</button>
    </div>
  )
}
