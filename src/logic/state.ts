import * as util from './util'
import * as pieces from './pieces'
import * as moves from './moves'
import * as immutable from 'immutable'
import { strict as assert } from 'assert'

class Player {
  color: Readonly<pieces.Color>
  queenSideCastle: boolean
  kingSideCastle: boolean
  enPassantPos: util.Pos | null

  constructor (arg1: Player | Readonly<pieces.Color>) {
    if (arg1 instanceof Player) {
      const other = arg1
      this.color = other.color
      this.queenSideCastle = other.queenSideCastle
      this.kingSideCastle = other.kingSideCastle
      this.enPassantPos = other.enPassantPos
    } else {
      this.color = arg1
      this.queenSideCastle = true
      this.kingSideCastle = true
      this.enPassantPos = null
    }
  }
}

/* Board format uses an array of 64 8 bit ints as so:
  The mapping from (file, rank) to index is done according to rank * 8 + file.
  Every square is an int in the form of pxaaciii where:
    i is an int from 0 - 7 where:
      0: empty
      1: pawn
      2: knight
      3: bishop
      4: rook
      5: queen
      6: king
    c is 1 for black 0 for white.
    a is an int from 0 - 3 representing the axis that a piece can move when it's pinned where:
      0: vertical (unpinned)
      1: horizontal
      2: Left-Up/Right-Down
      3: Left-Down/Right-Up
    x is set when the king can not move to this square because a piece is protecting it
    p has multiple meanings depending on what kind of piece it is applied to:
        current player's piece: this piece is pinned (moving would put king in check)
        next player's piece: this piece is delivering check to the other player
        empty square: putting a piece here blocks check (except for double check where only the king can move)
 */
export class Board {
  private readonly raw: Uint8Array
  private readonly mutable: boolean

  constructor (raw: Uint8Array, mutable: boolean) {
    this.raw = raw
    this.mutable = mutable
  }

  get (pos: util.Pos): pieces.Square {
    const rawPiece = this.raw[pos.toRaw()] & 0xF
    switch (rawPiece) {
      case 0:
        return pieces.EMPTY
      case 1:
        return pieces.WHITE.PAWN
      case 2:
        return pieces.WHITE.KNIGHT
      case 3:
        return pieces.WHITE.BISHOP
      case 4:
        return pieces.WHITE.ROOK
      case 5:
        return pieces.WHITE.QUEEN
      case 6:
        return pieces.WHITE.KING
      case 9:
        return pieces.BLACK.PAWN
      case 10:
        return pieces.BLACK.KNIGHT
      case 11:
        return pieces.BLACK.BISHOP
      case 12:
        return pieces.BLACK.ROOK
      case 13:
        return pieces.BLACK.QUEEN
      case 14:
        return pieces.BLACK.KING
      default:
        assert(false)
    }
  }

  getPinnedAxis (pos: util.Pos): 0 | 1 | 2 | 3 {
    return ((this.raw[pos.toRaw()] >>> 4) & 0x3) as 0 | 1 | 2 | 3
  }

  isPinned (pos: util.Pos): boolean {
    return (this.raw[pos.toRaw()] & 0x40) === 0x40
  }

  isProtected (pos: util.Pos): boolean {
    return (this.raw[pos.toRaw()] & 0x80) === 0x80
  }

  set (pos: util.Pos, piece: pieces.Square): Board {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= ~0xF
    rawValue |= piece.id
    return this.rawSet(pos, rawValue)
  }

  clearFlags (pos: util.Pos) {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= 0xF
    return this.rawSet(pos, rawValue)
  }

  private rawSet (pos: util.Pos, raw: number) {
    if (this.mutable) {
      this.raw[pos.toRaw()] = raw
      return this
    } else {
      const newRaw = new Uint8Array(this.raw)
      newRaw[pos.toRaw()] = raw
      return new Board(newRaw, false)
    }
  }

  setPinnedAxis (pos: util.Pos, axis: 0 | 1 | 2 | 3) {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= ~0x30
    rawValue |= axis << 4
    return this.rawSet(pos, rawValue)
  }

  setPinned (pos: util.Pos, pinned: boolean) {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= ~0x40
    rawValue |= Number(pinned) << 6
    return this.rawSet(pos, rawValue)
  }

  setProtected (pos: util.Pos, attacked: boolean) {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= ~0x80
    rawValue |= Number(attacked) << 7
    return this.rawSet(pos, rawValue)
  }

  reduce<ACC> (fun: (acc: ACC, piece: pieces.Square, pos: util.Pos, board: this) => ACC, acc: ACC) {
    for (let i = 0; i < this.raw.length; i++) {
      const pos = util.Pos.fromRaw(i)
      acc = fun(acc, this.get(pos), pos, this)
    }
    return acc
  }

  asMutable () {
    return new Board(new Uint8Array(this.raw), true)
  }

  withMutations (fn: (board: Board) => void) {
    const raw = new Uint8Array(this.raw)
    fn(new Board(raw, true))
    return new Board(new Uint8Array(raw), false)
  }
}

class State {
  board: Board
  white: Player
  black: Player
  currTurn: Readonly<pieces.Color>
  moveHistory: immutable.List<moves.Move>
  historyBegin: number
  halfMove: number
  threeFoldDetect: immutable.Map<string, number>
  resign: boolean
  agreeDraw: boolean
  checks: number

  constructor (state?: State) {
    if (typeof state !== 'object') {
      this.board = getStartingBoard()
      this.white = new Player(pieces.WHITE)
      this.black = new Player(pieces.BLACK)
      this.currTurn = pieces.WHITE
      this.moveHistory = immutable.List()
      this.historyBegin = 2
      this.halfMove = 0
      this.threeFoldDetect = immutable.Map()
      this.resign = false
      this.agreeDraw = false
      this.checks = 0
    } else {
      this.board = state.board
      this.white = new Player(state.white)
      this.black = new Player(state.black)
      this.currTurn = state.currTurn
      this.moveHistory = state.moveHistory
      this.historyBegin = state.historyBegin
      this.halfMove = state.halfMove
      this.threeFoldDetect = state.threeFoldDetect
      this.resign = state.resign
      this.agreeDraw = state.agreeDraw
      this.checks = state.checks
    }
  }

  begin (): State {
    if (this.moveHistory.size) {
      return this.moveHistory.get(0)?.state!
    }
    return this
  }

  getHistory (index: number): State {
    if (index >= this.moveHistory.size) {
      return this
    }
    return this.moveHistory.get(index)?.state!
  }

  getHistoryIndex (): number {
    return this.moveHistory.size
  }

  halfMoveCount () {
    return this.historyBegin + this.moveHistory.size
  }

  moveCount () {
    return Math.floor(this.halfMoveCount() / 2)
  }

  toFen () {
    let fen = ''
    for (let rank = 7; rank >= 0; rank--) {
      let emptyRun = 0
      if (rank !== 7) {
        fen += '/'
      }
      for (let file = 0; file < 8; file++) {
        const piece = this.board.get(new util.Pos(file, rank))
        if (piece.isOccupied()) {
          if (emptyRun) {
            fen += String(emptyRun)
            emptyRun = 0
          }
          fen += piece.fenLetter
        } else {
          emptyRun++
        }
      }
      if (emptyRun) {
        fen += String(emptyRun)
      }
    }
    fen += ' '
    if (this.currTurn === pieces.WHITE) {
      fen += 'w'
    } else {
      fen += 'b'
    }
    fen += ' '
    if (this.white.kingSideCastle) {
      fen += 'K'
    }
    if (this.white.queenSideCastle) {
      fen += 'Q'
    }
    if (this.black.kingSideCastle) {
      fen += 'k'
    }
    if (this.black.queenSideCastle) {
      fen += 'q'
    }
    if (!(this.white.kingSideCastle || this.white.queenSideCastle || this.black.kingSideCastle || this.black.queenSideCastle)) {
      fen += '-'
    }
    fen += ' '
    if (this.white.enPassantPos) {
      fen += this.white.enPassantPos.toString()
    } else if (this.black.enPassantPos) {
      fen += this.black.enPassantPos.toString()
    } else {
      fen += '-'
    }
    fen += ' '
    fen += String(this.halfMove)
    fen += ' '
    fen += String(this.moveCount())
    return fen
  }

  toAbvFen () {
    const lastFenLst = this.toFen().split(' ')
    lastFenLst.pop()
    lastFenLst.pop()
    return lastFenLst.join(' ')
  }

  modify (fn: (state: State) => void) {
    const newState = new State(this)
    newState.board = newState.board.asMutable()
    fn(newState)
    newState.board = newState.board.asMutable()

    newState.checks = 0
    if (newState.board.get(new util.Pos(4, 0)) !== pieces.WHITE.KING) {
      newState.white.kingSideCastle = false
      newState.white.queenSideCastle = false
    }
    if (newState.board.get(new util.Pos(0, 0)) !== pieces.WHITE.ROOK) {
      newState.white.queenSideCastle = false
    }
    if (newState.board.get(new util.Pos(7, 0)) !== pieces.WHITE.ROOK) {
      newState.white.kingSideCastle = false
    }

    if (newState.board.get(new util.Pos(4, 7)) !== pieces.BLACK.KING) {
      newState.black.kingSideCastle = false
      newState.black.queenSideCastle = false
    }
    if (newState.board.get(new util.Pos(0, 7)) !== pieces.BLACK.ROOK) {
      newState.black.queenSideCastle = false
    }
    if (newState.board.get(new util.Pos(7, 7)) !== pieces.BLACK.ROOK) {
      newState.black.kingSideCastle = false
    }

    let enPassantPossible = false
    let enPassantPos = newState.white.enPassantPos
    if (newState.black.enPassantPos) {
      enPassantPos = newState.black.enPassantPos
    }
    do {
      if (!enPassantPos) {
        break
      }
      if (newState.board.get(enPassantPos) !== pieces.EMPTY) {
        break
      }
      if (enPassantPos.rank !== newState.currTurn.OTHER_COLOR.PAWN_RANK - newState.currTurn.PAWN_RANK_DIR) {
        break
      }
      const enPassantPiecePos = enPassantPos.addRank(-this.currTurn.PAWN_RANK_DIR)!
      if (newState.board.get(enPassantPiecePos) !== newState.currTurn.OTHER_COLOR.PAWN) {
        break
      }
      const enPassPos = enPassantPos
      const tmpState = newState.modify(tmpState => {
        tmpState.white.enPassantPos = null
        tmpState.black.enPassantPos = null
        tmpState.board.set(enPassantPiecePos, pieces.EMPTY)
        tmpState.board.set(enPassPos, this.currTurn.OTHER_COLOR.PAWN)
      })
      const leftDiag = enPassantPiecePos.addFile(-1)
      if (leftDiag) {
        const leftPawnPinned = tmpState.board.isPinned(leftDiag) && tmpState.board.getPinnedAxis(leftDiag) !== 3
        if (tmpState.board.get(leftDiag) === this.currTurn.PAWN && !leftPawnPinned) {
          enPassantPossible = true
          break
        }
      }

      const rightDiag = enPassantPiecePos.addFile(1)
      if (rightDiag) {
        const rightPawnPinned = tmpState.board.isPinned(rightDiag) && tmpState.board.getPinnedAxis(rightDiag) !== 2
        if (tmpState.board.get(rightDiag) === this.currTurn.PAWN && !rightPawnPinned) {
          enPassantPossible = true
        }
      }
    } while (false)

    if (!enPassantPossible) {
      newState.white.enPassantPos = null
      newState.black.enPassantPos = null
    }
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const pos = new util.Pos(file, rank)
        newState.board.clearFlags(pos)
      }
    }

    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const pos = new util.Pos(file, rank)
        const piece = newState.board.get(pos)
        if (piece.isOccupied() && piece.color !== newState.currTurn) {
          const protects = piece.protects(newState, pos)
          for (const prot of protects) {
            newState.board.setProtected(prot, true)
            if (newState.board.get(prot) === newState.currTurn.KING) {
              newState.checks++
              newState.board.setPinned(pos, true)
            }
          }
          piece.pin(newState, pos)
        }
      }
    }

    newState.board = newState.board.withMutations(() => {})
    return newState
  }

  getColor (color: pieces.Color) {
    switch (color) {
      case pieces.WHITE:
        return this.white
      case pieces.BLACK:
        return this.black
      default:
        throw new Error('Not a color')
    }
  }

  flipTurn () {
    return this.modify(newState => {
      newState.currTurn = newState.currTurn.OTHER_COLOR
      newState.getColor(newState.currTurn).enPassantPos = null
      return newState
    })
  }

  moves () {
    let moveList: moves.Move[] = []
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const pos = new util.Pos(file, rank)
        const piece = this.board.get(pos)
        if (piece.isOccupied() && piece.color === this.currTurn) {
          moveList = moveList.concat(piece.moves(this, pos))
        }
      }
    }
    moveList.push(new moves.Castle(this, true), new moves.Castle(this, false))
    return moveList
  }

  isDraw () {
    return this.agreeDraw || (!this.isCheckmate() && !this.moves().some(x => !x.invalid())) || this.isThreeFold() || this.halfMove >= 100
  }

  isGameOver () {
    return !this.moves().some(x => !x.invalid()) || this.isDraw() || this.resign
  }

  drawReason () {
    if (this.isThreeFold()) {
      return 'three fold repetition'
    } else if (this.halfMove >= 100) {
      return '50 move rule'
    } else {
      return 'stalemate'
    }
  }

  isThreeFold () {
    const fen = this.toAbvFen()
    const count = Number(this.threeFoldDetect.get(fen))
    return count >= 2
  }

  isCheck () {
    return this.checks !== 0
  }

  isCheckmate () {
    return !this.moves().some(x => !x.invalid()) && this.isCheck()
  }

  perft (depth: number) {
    if (depth === 0) {
      return 1
    }

    const moves = this.moves().filter(x => !x.invalid())
    let nodes = 0
    for (const move of moves) {
      nodes += move.do().perft(depth - 1)
    }
    return nodes
  }

  toPGN (gameStartTime: Date, eventName: string, siteName: string, round: string, whiteName: string, blackName: string) {
    eventName = eventName.trim()
    if (eventName === '') {
      eventName = 'Casual Game'
    }
    siteName = siteName.trim()
    if (siteName === '') {
      siteName = 'Local Game'
    }
    round = round.trim()
    if (round === '') {
      round = '-'
    }
    whiteName = whiteName.trim()
    if (whiteName === '') {
      whiteName = 'Unknown'
    }
    blackName = blackName.trim()
    if (blackName === '') {
      blackName = 'Unknown'
    }
    const date = `${gameStartTime.getFullYear()}.${gameStartTime.getMonth()}.${gameStartTime.getDate()}`
    let result = '*'
    if (this.isGameOver()) {
      if (this.isDraw()) {
        result = '1/2-1/2'
      } else if (this.currTurn === pieces.WHITE) {
        result = '0-1'
      } else {
        result = '1-0'
      }
    }
    const pgnTags = [['Event', eventName], ['Site', siteName], ['Date', date], ['Round', round],
      ['White', whiteName], ['Black', blackName], ['Result', result]]
    const beginState = this.begin()
    if (beginState.toFen() !== getStartState().toFen()) {
      pgnTags.push(['SetUp', '1'])
      pgnTags.push(['FEN', beginState.toFen()])
    }
    let outputStr = ''
    for (const tag of pgnTags) {
      const tagLine = `[${tag[0]} "${tag[1]}"]\n`
      outputStr += tagLine
    }
    const moveLineGen = new util.PgnMoveLineGen()
    let moveCount = beginState.historyBegin
    // If game state starts from black
    if (moveCount % 2 === 1) {
      moveLineGen.addToken(`${Math.floor(moveCount / 2)}...`)
    }
    for (const move of this.moveHistory) {
      if (moveCount % 2 === 0) {
        moveLineGen.addToken(`${Math.floor(moveCount / 2)}.`)
      }
      moveCount++
      moveLineGen.addToken(move.toNotation().toString())
    }
    moveLineGen.addToken(result)
    return outputStr + moveLineGen.done() + '\n'
  }
}

let START_STATE: State | null = null
let STARTING_BOARD: Board | null = null

function getStartingBoard (): Board {
  if (!STARTING_BOARD) {
    const board = new Uint8Array(64)
    for (let i = 0; i < 64; i++) {
      board[i] = pieces.EMPTY.id
    }
    board.set([pieces.WHITE.ROOK.id, pieces.WHITE.KNIGHT.id, pieces.WHITE.BISHOP.id, pieces.WHITE.QUEEN.id,
      pieces.WHITE.KING.id, pieces.WHITE.BISHOP.id, pieces.WHITE.KNIGHT.id, pieces.WHITE.ROOK.id], 0)
    for (let i = 8; i < 16; i++) {
      board[i] = pieces.WHITE.PAWN.id
    }
    for (let i = 48; i < 56; i++) {
      board[i] = pieces.BLACK.PAWN.id
    }
    board.set([pieces.BLACK.ROOK.id, pieces.BLACK.KNIGHT.id, pieces.BLACK.BISHOP.id, pieces.BLACK.QUEEN.id,
      pieces.BLACK.KING.id, pieces.BLACK.BISHOP.id, pieces.BLACK.KNIGHT.id, pieces.BLACK.ROOK.id], 56)
    STARTING_BOARD = new Board(board, false)
  }
  return STARTING_BOARD
}

function getStartState (): State {
  if (!START_STATE) {
    START_STATE = new State().modify(x => x)
  }
  return START_STATE
}

const FEN_REGEX = /^((?:[kqnbrpKQNBRP1-8]+\/){7}[kqnbrpKQNBRP1-8]+)\s+([bw])\s+(KQ?k?q?|Qk?q?|kq?|q|-)\s+((?:[a-h][36])|-)\s+(\d+)\s+(\d+)$/

function stateFromFen (fen: string) {
  const board = new Uint8Array(64)
  for (let i = 0; i < 64; i++) {
    board[i] = pieces.EMPTY.id
  }
  let rank = 7
  const parsedFen = FEN_REGEX.exec(fen.trim())
  if (!parsedFen) {
    throw new Error('Fen syntax error')
  }
  const rawBoard = parsedFen[1].split('/')
  for (const rawRow of rawBoard) {
    let file = 0
    for (const char of rawRow) {
      if (file >= 8) {
        throw new Error('Fen board has too many pieces on one row')
      }
      const asNum = Number(char)
      if (asNum) {
        file += asNum
      } else {
        board[new util.Pos(file, rank).toRaw()] = pieces.FROM_FEN.get(char)!.id
        file++
      }
    }
    if (file < 7) {
      throw new Error('Fen board has too little pieces on one row')
    }
    if (file > 8) {
      throw new Error('Fen board has too many pieces on one row')
    }
    rank--
  }
  let currPlayer = pieces.WHITE
  if (parsedFen[2] === 'b') {
    currPlayer = pieces.BLACK
  }
  const white = new Player(pieces.WHITE)
  white.kingSideCastle = parsedFen[3].includes('K')
  white.queenSideCastle = parsedFen[3].includes('Q')
  const black = new Player(pieces.BLACK)
  black.kingSideCastle = parsedFen[3].includes('k')
  black.queenSideCastle = parsedFen[3].includes('q')

  const enPassantPos = parsedFen[4]
  if (enPassantPos !== '-') {
    let enPassantPlayer = black
    if (currPlayer === pieces.BLACK) {
      enPassantPlayer = white
    }
    const file = util.convertFileLetter(enPassantPos[0])
    const rank = util.convertRankLetter(enPassantPos[1])
    enPassantPlayer.enPassantPos = new util.Pos(file, rank)
  }
  const halfMove = Number(parsedFen[5])
  let moveCount = Number(parsedFen[6]) * 2
  if (moveCount === 0) {
    throw new Error('Chess games start on move 1')
  }
  if (currPlayer === pieces.BLACK) {
    moveCount++
  }
  return getStartState().modify(x => {
    x.board = new Board(board, false)
    x.white = white
    x.black = black
    x.currTurn = currPlayer
    x.historyBegin = moveCount
    x.halfMove = halfMove
  })
}

export { State, getStartState, stateFromFen }
