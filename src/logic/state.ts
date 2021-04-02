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

class Board {
  raw: immutable.List<pieces.Square>

  constructor (raw: immutable.List<pieces.Square>) {
    this.raw = raw
  }

  get (pos: util.Pos): pieces.Square {
    const ret = this.raw.get(pos.toRaw())
    assert(ret)
    return ret
  }

  set (pos: util.Pos, piece: pieces.Square): Board {
    return new Board(this.raw.set(pos.toRaw(), piece))
  }

  reduce<ACC> (fun: (acc: ACC, piece: pieces.Square, pos: util.Pos, board: this) => ACC, acc: ACC) {
    for (let i = 0; i < this.raw.size; i++) {
      acc = fun(acc, this.raw.get(i)!, util.Pos.fromRaw(i), this)
    }
    return acc
  }

  withMutations (fn: (board: Board) => void) {
    const raw = this.raw.withMutations(raw => {
      fn(new Board(raw))
    })
    return new Board(raw)
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
    const enPassantPossible = this.moves().some(move => {
      // Convert the en-passant into a non-en-passant to allow pin detection without an infinite loop
      if (!move.isEnPassant()) {
        return false
      }
      const tmpState = this.modify(x => {
        x.white.enPassantPos = null
        x.black.enPassantPos = null
        // Hack the pawn back to its pos if the pawn only moved once
        x.board = x.board.withMutations(board => {
          board.set(move.toPos.addRank(-this.currTurn.PAWN_RANK_DIR)!, pieces.EMPTY)
          board.set(move.toPos, this.currTurn.OTHER_COLOR.PAWN)
        })
      })
      return tmpState.moves().some(x => x.isNormal() && x.toPos.compare(move.toPos) === 0 && !x.invalid())
    })
    const lastFenLst = this.toFen().split(' ')
    lastFenLst.pop()
    lastFenLst.pop()
    if (!enPassantPossible) {
      lastFenLst.pop()
    }
    return lastFenLst.join(' ')
  }

  modify (fn: (state: State) => void) {
    const newState = new State(this)
    fn(newState)
    Object.freeze(newState.white)
    Object.freeze(newState.black)
    return Object.freeze(newState)
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
    const tmpState = this.flipTurn()
    const moveList = tmpState.moves()
    return moveList.some(move => {
      if (!move.isNormal()) {
        return false
      }
      return this.board.get(move.toPos) === this.currTurn.KING
    })
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
    const board = new Array(64)
    for (let i = 0; i < 64; i++) {
      board[i] = pieces.EMPTY
    }
    board.splice(0, 8, pieces.WHITE.ROOK, pieces.WHITE.KNIGHT, pieces.WHITE.BISHOP, pieces.WHITE.QUEEN,
      pieces.WHITE.KING, pieces.WHITE.BISHOP, pieces.WHITE.KNIGHT, pieces.WHITE.ROOK)
    for (let i = 8; i < 16; i++) {
      board[i] = pieces.WHITE.PAWN
    }
    for (let i = 48; i < 56; i++) {
      board[i] = pieces.BLACK.PAWN
    }
    board.splice(56, 8, pieces.BLACK.ROOK, pieces.BLACK.KNIGHT, pieces.BLACK.BISHOP, pieces.BLACK.QUEEN,
      pieces.BLACK.KING, pieces.BLACK.BISHOP, pieces.BLACK.KNIGHT, pieces.BLACK.ROOK)
    STARTING_BOARD = new Board(immutable.List(board))
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
  const board = new Array(64)
  for (let i = 0; i < 64; i++) {
    board[i] = pieces.EMPTY
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
        board[new util.Pos(file, rank).toRaw()] = pieces.FROM_FEN.get(char)
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
  if (board[new util.Pos(4, 0).toRaw()] !== pieces.WHITE.KING) {
    white.kingSideCastle = false
    white.queenSideCastle = false
  }
  if (board[new util.Pos(0, 0).toRaw()] !== pieces.WHITE.ROOK) {
    white.kingSideCastle = false
  }
  if (board[new util.Pos(7, 0).toRaw()] !== pieces.WHITE.ROOK) {
    white.kingSideCastle = false
  }
  const black = new Player(pieces.BLACK)
  black.kingSideCastle = parsedFen[3].includes('k')
  black.queenSideCastle = parsedFen[3].includes('q')
  if (board[new util.Pos(4, 7).toRaw()] !== pieces.WHITE.KING) {
    black.kingSideCastle = false
    black.queenSideCastle = false
  }
  if (board[new util.Pos(0, 7).toRaw()] !== pieces.WHITE.ROOK) {
    black.kingSideCastle = false
  }
  if (board[new util.Pos(7, 7).toRaw()] !== pieces.WHITE.ROOK) {
    black.kingSideCastle = false
  }
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
    x.board = new Board(immutable.List(board))
    x.white = white
    x.black = black
    x.currTurn = currPlayer
    x.historyBegin = moveCount
    x.halfMove = halfMove
  })
}

export { State, getStartState, stateFromFen }
