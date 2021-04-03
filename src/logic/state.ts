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
  checks: number

  constructor (arg1: Player | Readonly<pieces.Color>) {
    if (arg1 instanceof Player) {
      const other = arg1
      this.color = other.color
      this.queenSideCastle = other.queenSideCastle
      this.kingSideCastle = other.kingSideCastle
      this.enPassantPos = other.enPassantPos
      this.checks = other.checks
    } else {
      this.color = arg1
      this.queenSideCastle = true
      this.kingSideCastle = true
      this.enPassantPos = null
      this.checks = 0
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
    x is set when this square is being attacked by the opponent
    p has multiple meanings depending on what kind of piece it is applied to:
        white piece: this piece is pinned (moving would put king in check)
        black piece: this piece is delivering check to white
        empty square: putting a piece here blocks check (except for double check where only the king can move)
    b is a set of bitflags of similar form to w but with black and white swapped
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

  isAttacked (pos: util.Pos): boolean {
    return (this.raw[pos.toRaw()] & 0x80) === 0x80
  }

  set (pos: util.Pos, piece: pieces.Square): Board {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= ~0xF
    rawValue |= piece.id
    if (this.mutable) {
      this.raw[pos.toRaw()] = rawValue
      return this
    } else {
      const newRaw = new Uint8Array(this.raw)
      newRaw[pos.toRaw()] = rawValue
      return new Board(newRaw, false)
    }
  }

  clearFlags (pos: util.Pos) {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= 0xF
    if (this.mutable) {
      this.raw[pos.toRaw()] = rawValue
      return this
    } else {
      const newRaw = new Uint8Array(this.raw)
      newRaw[pos.toRaw()] = rawValue
      return new Board(newRaw, false)
    }
  }

  setPinnedAxis (pos: util.Pos, axis: 0 | 1 | 2 | 3) {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= ~0x30
    rawValue |= axis << 4
    if (this.mutable) {
      this.raw[pos.toRaw()] = rawValue
      return this
    } else {
      const newRaw = new Uint8Array(this.raw)
      newRaw[pos.toRaw()] = rawValue
      return new Board(newRaw, false)
    }
  }

  setPinned (pos: util.Pos, pinned: boolean) {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= ~0x40
    rawValue |= Number(pinned) << 6
    if (this.mutable) {
      this.raw[pos.toRaw()] = rawValue
      return this
    } else {
      const newRaw = new Uint8Array(this.raw)
      newRaw[pos.toRaw()] = rawValue
      return new Board(newRaw, false)
    }
  }

  setAttacked (pos: util.Pos, attacked: boolean) {
    let rawValue = this.raw[pos.toRaw()]
    rawValue &= ~0x80
    rawValue |= Number(attacked) << 7
    if (this.mutable) {
      this.raw[pos.toRaw()] = rawValue
      return this
    } else {
      const newRaw = new Uint8Array(this.raw)
      newRaw[pos.toRaw()] = rawValue
      return new Board(newRaw, false)
    }
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
    }
  }

  moveCount () {
    return Math.floor((this.historyBegin + this.moveHistory.size) / 2)
  }

  commandPrompt () {
    let gameOverStr = ''
    if (this.isGameOver()) {
      gameOverStr = 'Game Over '
    }
    if (this.currTurn === pieces.WHITE) {
      return gameOverStr + `${this.moveCount()}. WHITE>`
    } else {
      return gameOverStr + `${this.moveCount()}. BLACK>`
    }
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

    newState.white.checks = 0
    newState.black.checks = 0
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

    const enPassantPossible = newState.moves().some(move => {
      // Convert the en-passant into a non-en-passant to allow pin detection without an infinite loop
      if (!move.isEnPassant()) {
        return false
      }
      const enPassantPiecePos = move.toPos.addRank(-this.currTurn.PAWN_RANK_DIR)!
      if (newState.board.get(enPassantPiecePos) !== newState.currTurn.OTHER_COLOR.PAWN) {
        return false
      }
      const tmpState = newState.modify(x => {
        x.white.enPassantPos = null
        x.black.enPassantPos = null
        // Hack the pawn back to its pos if the pawn only moved once
        x.board = x.board.withMutations(board => {
          board.set(enPassantPiecePos, pieces.EMPTY)
          board.set(move.toPos, this.currTurn.OTHER_COLOR.PAWN)
        })
      })
      return tmpState.moves().some(x => x.isNormal() && x.piece === newState.currTurn.PAWN && x.toPos.compare(move.toPos) === 0 && !x.invalid())
    })
    if (!enPassantPossible) {
      newState.white.enPassantPos = null
      newState.black.enPassantPos = null
    }
    let kingPos
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const pos = new util.Pos(file, rank)
        newState.board.clearFlags(pos)
        if (newState.board.get(pos) === newState.currTurn.KING) {
          kingPos = pos
        }
      }
    }

    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const pos = new util.Pos(file, rank)
        const piece = newState.board.get(pos)
        if (piece.isOccupied() && piece.color !== newState.currTurn) {
          if (piece === newState.currTurn.OTHER_COLOR.PAWN) {
            const leftDiag = pos.add(-1, -newState.currTurn.PAWN_RANK_DIR)
            if (leftDiag) {
              newState.board.isAttacked(leftDiag)
            }
            const rightDiag = pos.add(1, -newState.currTurn.PAWN_RANK_DIR)
            if (rightDiag) {
              newState.board.isAttacked(rightDiag)
            }
          } else {
            // Temp remove king so the king is not in the way of figuring out attacking squares
            if (kingPos) {
              newState.board.set(kingPos, pieces.EMPTY)
            }
            const moveList = piece.moves(newState, pos)
            for (const move of moveList) {
              if (move.isNormal()) {
                newState.board.setAttacked(move.toPos, true)
                if (kingPos && move.toPos.compare(kingPos) === 0) {
                  newState.getColor(newState.currTurn).checks++
                  newState.board.setPinned(pos, true)
                }
              }
            }
            if (kingPos) {
              newState.board.set(kingPos, newState.currTurn.KING)
            }
            piece.pin(newState, pos)
          }
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
    return this.getColor(this.currTurn).checks !== 0
  }

  isCheckmate () {
    return !this.moves().some(x => !x.invalid()) && this.isCheck()
  }

  back (): State {
    if (this.moveHistory.size === 0) {
      return this
    }
    return Object.freeze(new HistoryState(this.moveHistory.last(undefined)!.state, this.moveHistory, this.moveHistory.size - 1))
  }

  forward (): State {
    return this
  }

  endAltHistory (): State {
    return this
  }

  isHistory (): this is HistoryState {
    return false
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
    const exportState = this.endAltHistory().end()
    let result = '*'
    if (exportState.isGameOver()) {
      if (exportState.isDraw()) {
        result = '1/2-1/2'
      } else if (exportState.currTurn === pieces.WHITE) {
        result = '0-1'
      } else {
        result = '1-0'
      }
    }
    const pgnTags = [['Event', eventName], ['Site', siteName], ['Date', date], ['Round', round],
      ['White', whiteName], ['Black', blackName], ['Result', result]]
    const beginState = exportState.begin()
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
    for (const move of exportState.moveHistory) {
      if (moveCount % 2 === 0) {
        moveLineGen.addToken(`${Math.floor(moveCount / 2)}.`)
      }
      moveCount++
      moveLineGen.addToken(move.toNotation().toString())
    }
    moveLineGen.addToken(result)
    return outputStr + moveLineGen.done() + '\n'
  }

  begin () {
    let lastState: State = this
    let state = this.back()
    while (state !== lastState) {
      lastState = state
      state = state.back()
    }
    return state
  }

  end () {
    let lastState: State = this
    let state = this.forward()
    while (state !== lastState) {
      lastState = state
      state = state.forward()
    }
    return state
  }
}

class HistoryState extends State {
  moveIndex: number

  constructor (state: State, history: immutable.List<moves.Move>, moveIndex: number) {
    super(state)
    this.moveHistory = history
    this.moveIndex = moveIndex
  }

  moveCount () {
    return Math.floor((this.moveIndex + this.historyBegin) / 2)
  }

  back () {
    if (this.moveIndex === 0) {
      return this
    }
    const moveIndex = this.moveIndex - 1
    const lastState = this.moveHistory.get(moveIndex)!.state
    if (lastState.isHistory()) {
      return lastState
    }
    return Object.freeze(new HistoryState(lastState, this.moveHistory, moveIndex))
  }

  forward () {
    if (this.moveIndex >= this.moveHistory.size - 1) {
      return this.moveHistory.last(undefined)!.do()
    }
    const moveIndex = this.moveIndex + 1
    const forwardState = this.moveHistory.get(moveIndex)!.state
    if (forwardState.isHistory()) {
      return forwardState
    }
    return Object.freeze(new HistoryState(forwardState, this.moveHistory, moveIndex))
  }

  modify (fn: (state: State) => void) {
    const newState = new AltHistoryState(this, this.moveHistory, this.moveIndex)
    fn(newState)
    Object.freeze(newState.white)
    Object.freeze(newState.black)
    return Object.freeze(newState)
  }

  commandPrompt () {
    if (this.currTurn === pieces.WHITE) {
      return `History ${this.moveCount()}. WHITE>`
    } else {
      return `History ${this.moveCount()}. BLACK>`
    }
  }

  isHistory () {
    return true
  }
}

class AltHistoryState extends HistoryState {
  altBranch: State

  constructor (state: State, history: immutable.List<moves.Move>, moveIndex: number) {
    super(state, history, moveIndex)
    if (state instanceof AltHistoryState) {
      this.altBranch = state.altBranch
    } else {
      this.altBranch = state
    }
  }

  endAltHistory (): State {
    return this.altBranch
  }

  commandPrompt () {
    if (this.currTurn === pieces.WHITE) {
      return `Alt History ${this.moveCount()}. WHITE>`
    } else {
      return `Alt History ${this.moveCount()}. BLACK>`
    }
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
