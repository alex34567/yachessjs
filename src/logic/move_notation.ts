import * as util from './util'
import * as moves from './moves'
import * as pieces from './pieces'

const NORMAL_MOVE_REGEX = /^([KQRBN]?)([a-h]?)([1-8]?)(x?)([a-h])([1-8])(?:=?([QRBN]))?(?:\+|#|)(?:\?\??|!!?|\?!|!\?|)$/

abstract class MoveNotation {
  protected constructor () {
    if (typeof this.matches !== 'function') {
      throw new Error('Matches function not defined')
    }
  }

  static parseMove (color: pieces.Color, move: string) {
    move = move.trim()
    if (move === 'O-O' || move === '0-0') {
      return new CastleMoveNotation(true)
    }
    if (move === 'O-O-O' || move === '0-0-0') {
      return new CastleMoveNotation(false)
    }
    const parsedMove = NORMAL_MOVE_REGEX.exec(move)
    if (!parsedMove) {
      return null
    }

    const pieceLetter = parsedMove[1]
    const piece = color.FROM_LETTER.get(pieceLetter)!
    const fromFileLetter = parsedMove[2]
    const fromFile = fromFileLetter ? util.convertFileLetter(fromFileLetter) : null
    const fromRankLetter = parsedMove[3]
    const fromRank = fromRankLetter ? util.convertRankLetter(fromRankLetter) : null
    const captures = parsedMove[4] === 'x'
    const toFile = util.convertFileLetter(parsedMove[5])
    const toRank = util.convertRankLetter(parsedMove[6])
    const toPos = new util.Pos(toFile, toRank)
    const promoteLetter = parsedMove[7]
    let promoteChoice = null
    if (promoteLetter) {
      promoteChoice = color.FROM_LETTER.get(promoteLetter)!
    }
    return new NormalMoveNotation(piece, captures, fromFile, fromRank, toPos, promoteChoice)
  }

  abstract matches (move: moves.Move): boolean
}

class CastleMoveNotation extends MoveNotation {
  isKingSide: boolean

  constructor (isKingSide: boolean) {
    super()
    this.isKingSide = isKingSide
  }

  toString () {
    if (this.isKingSide) {
      return 'O-O'
    } else {
      return 'O-O-O'
    }
  }

  matches (move: moves.Move): boolean {
    return move.isCastle() && this.isKingSide === move.isKingSide
  }
}

class NormalMoveNotation extends MoveNotation {
  piece: pieces.Piece
  captures: boolean
  fromFile: number | null
  fromRank: number | null
  toPos: util.Pos
  promoteChoice: pieces.Piece | null
  checkSymbol: string

  constructor (piece: pieces.Piece, captures: boolean, fromFile: number | null, fromRank: number | null, toPos: util.Pos, promoteChoice: pieces.Piece | null) {
    super()
    this.piece = piece
    this.captures = captures
    this.fromFile = fromFile
    this.fromRank = fromRank
    this.toPos = toPos
    this.promoteChoice = promoteChoice
    this.checkSymbol = ''
  }

  toString () {
    let captureLetter = ''
    if (this.captures) {
      captureLetter = 'x'
    }
    let fromFileLetter = ''
    if (this.fromFile !== null) {
      fromFileLetter = String.fromCharCode(this.fromFile + 'a'.charCodeAt(0))
    }
    let fromRankDigit = ''
    if (this.fromRank !== null) {
      fromRankDigit = String(this.fromRank + 1)
    }
    let promoteStr = ''
    if (this.promoteChoice) {
      promoteStr += '=' + this.promoteChoice.getPGNLetter()
    }
    return this.piece.getPGNLetter() + fromFileLetter + fromRankDigit + captureLetter + this.toPos.toString() + promoteStr + this.checkSymbol
  }

  matches (move: moves.Move): boolean {
    // Promotes are only valid for pawns
    if (this.piece !== move.state.currTurn.PAWN && this.promoteChoice) {
      return false
    }
    if (!move.isNormal()) {
      return false
    }
    // Be permissive in allowing a capture when not specified but require that a move like Qxe6 is a capture
    if (this.captures && !(move.state.board.get(this.toPos).canBeCaptured(move.piece) || move.isEnPassant())) {
      return false
    }
    if (move.isPromote() && this.promoteChoice !== move.promoteChoice) {
      return false
    }
    if (!move.isPromote() && this.promoteChoice) {
      return false
    }
    return move.piece === this.piece &&
            (this.fromFile === null || this.fromFile === move.fromPos.file) &&
            (this.fromRank === null || this.fromRank === move.fromPos.rank) &&
            move.toPos.compare(this.toPos) === 0
  }
}

export { CastleMoveNotation, MoveNotation, NormalMoveNotation }
