import * as pieces from './pieces'
import * as util from './util'
import * as moveNotation from './move_notation'
import * as state from './state'
import * as immmutable from 'immutable'
import { State } from './state'

abstract class Move {
  state: state.State

  protected constructor (state: state.State) {
    this.state = state
    if (typeof this.toNotation !== 'function') {
      throw new Error('To notation function not defined')
    }
  }

  isNormal (): this is NormalMove {
    return false
  }

  isCastle (): this is Castle {
    return false
  }

  isEnPassant (): this is EnPassant {
    return false
  }

  do () {
    return this.state.flipTurn().modify(newState => this.doChain(newState))
  }

  protected doChain (state: State) {
    if (state.isHistory()) {
      state.moveHistory = state.moveHistory.setSize(state.moveIndex)
      state.moveIndex++
    }
    state.halfMove++
    state.moveHistory = state.moveHistory.push(this)
    const lastFen = this.state.toAbvFen()
    let stateCount = state.threeFoldDetect.get(lastFen)
    if (!stateCount) {
      stateCount = 0
    }
    stateCount++
    state.threeFoldDetect = state.threeFoldDetect.set(lastFen, stateCount)
  }

  invalid (): string | false {
    const afterState = this.do()
    if (afterState.flipTurn().isCheck()) {
      return 'Check'
    }
    return false
  }

  abstract toNotation(): moveNotation.MoveNotation
}

class NormalMove extends Move {
  piece: pieces.Piece
  fromPos: util.Pos
  toPos: util.Pos

  constructor (state: state.State, piece: pieces.Piece, fromPos: util.Pos, toPos: util.Pos) {
    super(state)
    this.piece = piece
    this.fromPos = fromPos
    this.toPos = toPos
  }

  isNormal () {
    return true
  }

  isPromote (): this is Promotion {
    return false
  }

  isCapture () {
    return this.state.board.get(this.toPos).isOccupied()
  }

  toNotation () {
    let promoteChoice = null
    if (this.isPromote()) {
      promoteChoice = this.promoteChoice
    }
    const notation = new moveNotation.NormalMoveNotation(this.piece, this.isCapture(), null, null, this.toPos, promoteChoice)
    let possibleMoves = this.state.moves().filter(x => notation.matches(x) && !x.invalid())
    if (possibleMoves.length > 1 || (this.isCapture() && this.piece === this.piece.color.PAWN)) {
      notation.fromFile = this.fromPos.file
      possibleMoves = this.state.moves().filter(x => notation.matches(x) && !x.invalid())
      if (possibleMoves.length > 1) {
        notation.fromFile = null
        notation.fromRank = this.fromPos.rank
        possibleMoves = this.state.moves().filter(x => notation.matches(x) && !x.invalid())
        if (possibleMoves.length > 1) {
          notation.fromFile = this.fromPos.file
          notation.fromRank = this.fromPos.rank
        }
      }
    }
    const doneMove = this.do()
    if (doneMove.isCheckmate()) {
      notation.checkSymbol = '#'
    } else if (doneMove.isCheck()) {
      notation.checkSymbol = '+'
    }
    return notation
  }

  protected doChain (state: State) {
    super.doChain(state)
    state.board = state.board.set(this.fromPos, pieces.EMPTY)
    state.board = state.board.set(this.toPos, this.piece)
    if (this.state.board.get(this.toPos).isOccupied() || this.piece === this.state.currTurn.PAWN) {
      state.halfMove = 0
      state.threeFoldDetect = immmutable.Map()
    }
  }
}

class FirstPawn extends NormalMove {
  protected doChain (state: State) {
    super.doChain(state)
    const myColor = state.getColor(this.piece.color)
    myColor.enPassantPos = this.fromPos.addRank(this.piece.color.PAWN_RANK_DIR)
  }
}

class EnPassant extends NormalMove {
  isEnPassant () {
    return true
  }

  isCapture () {
    return true
  }

  protected doChain (state: State) {
    super.doChain(state)
    const passedPawn = this.toPos.addRank(-this.piece.color.PAWN_RANK_DIR)
    console.assert(passedPawn)

    state.board = state.board.set(passedPawn!, pieces.EMPTY)
  }
}

class Promotion extends NormalMove {
  promoteChoice: pieces.Piece

  constructor (state: state.State, piece: pieces.Piece, fromPos: util.Pos, toPos: util.Pos, promoteChoice: pieces.Piece) {
    super(state, piece, fromPos, toPos)
    this.promoteChoice = promoteChoice
  }

  isPromote () {
    return true
  }

  doChain (state: State) {
    super.doChain(state)
    state.board = state.board.set(this.toPos, this.promoteChoice)
  }
}

class Castle extends Move {
  isKingSide: boolean

  constructor (state: state.State, isKingSide: boolean) {
    super(state)
    this.isKingSide = isKingSide
  }

  toNotation () {
    return new moveNotation.CastleMoveNotation(this.isKingSide)
  }

  isCastle () {
    return true
  }

  doChain (state: State) {
    super.doChain(state)
    const myRook = this.state.currTurn.ROOK
    const myKing = this.state.currTurn.KING
    const myRank = this.state.currTurn.KING_RANK

    state.board = state.board.withMutations(board => {
      board.set(new util.Pos(4, myRank), pieces.EMPTY)
      if (this.isKingSide) {
        board.set(new util.Pos(5, myRank), myRook)
        board.set(new util.Pos(6, myRank), myKing)
        board.set(new util.Pos(7, myRank), pieces.EMPTY)
      } else {
        board.set(new util.Pos(3, myRank), myRook)
        board.set(new util.Pos(2, myRank), myKing)
        board.set(new util.Pos(0, myRank), pieces.EMPTY)
      }
    })
  }

  invalid () {
    // Can't castle into check
    if (super.invalid()) {
      return "Can't castle into check"
    }

    const myColor = this.state.getColor(this.state.currTurn)
    const myRank = this.state.currTurn.KING_RANK

    const betweenRookKing = []
    if (this.isKingSide) {
      if (!myColor.kingSideCastle) {
        return "Can't castle on king side"
      }

      betweenRookKing.push(new util.Pos(5, myRank), new util.Pos(6, myRank))
    } else {
      if (!myColor.queenSideCastle) {
        return "Can't castle on queen side"
      }

      betweenRookKing.push(new util.Pos(1, myRank), new util.Pos(2, myRank), new util.Pos(3, myRank))
    }

    for (const pos of betweenRookKing) {
      if (this.state.board.get(pos).isOccupied()) {
        return 'Pieces are between rook and king'
      }
    }

    // Can't castle out of check
    const badPos = [new util.Pos(4, myRank)]
    if (this.isKingSide) {
      // Can't castle though check
      badPos.push(new util.Pos(5, myRank))
    } else {
      badPos.push(new util.Pos(3, myRank))
    }

    const attacked = this.state.flipTurn().modify(tmpState => {
      tmpState.board = tmpState.board.withMutations(board => {
        for (const pos of badPos) {
          // Pawns need a piece to be present to capture
          // Create fake piece to allow this
          board.set(pos, this.state.currTurn.WALL)
        }
      })
    }).moves().some(move => {
      if (!move.isNormal()) {
        return false
      }

      for (const pos of badPos) {
        if (move.toPos.compare(pos) === 0) {
          return true
        }
      }
      return false
    })
    if (attacked) {
      return "Can't castle out of or through check"
    }
    return false
  }
}

export { Castle, Move, EnPassant, NormalMove, FirstPawn, Promotion }
