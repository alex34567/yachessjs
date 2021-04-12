import { State } from './logic/state'
import { convertFileLetter, convertRankLetter, Pos } from './logic/util'
import { Piece } from './logic/pieces'

export abstract class Player {
    abstract makeMove(state: State): Promise<State>
    abstract name(): string

    getBoardClick (): undefined | ((state: State) => void) {
      return undefined
    }

    close (): void {}
    newGame (): void {}
}

export class Human extends Player {
    promiseRes?: (state: State) => void

    makeMove (state: State): Promise<State> {
      return new Promise<State>(resolve => {
        this.promiseRes = resolve
      })
    }

    name () {
      return 'Human'
    }

    getBoardClick (): ((state: State) => void) | undefined {
      return this.promiseRes
    }
}

export class MrRandom extends Player {
  timeoutID?: number

  makeMove (state: State): Promise<State> {
    const moves = state.moves().filter(move => !move.invalid())
    const move = moves[Math.floor(Math.random() * moves.length)]
    return new Promise<State>(resolve => {
      this.timeoutID = window.setTimeout(() => resolve(move.do()), 100)
    })
  }

  name () {
    return 'MrRandom'
  }

  close () {
    clearTimeout(this.timeoutID)
  }
}

export class Stockfish extends Player {
  stockfishHandle?: Worker
  state?: State
  resolve?: (state: State) => void
  level: number

  constructor (level: number) {
    super()
    this.level = level
    this.parseStockfishLine = this.parseStockfishLine.bind(this)
  }

  name () {
    return 'Stockfish'
  }

  makeMove (state: State): Promise<State> {
    return new Promise(resolve => {
      this.state = state
      if (!this.stockfishHandle) {
        const wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))
        this.stockfishHandle = new Worker(wasmSupported ? process.env.PUBLIC_URL + '/stockfish.js/stockfish.wasm.js' : process.env.PUBLIC_URL + '/stockfish.js/stockfish.js')
        this.stockfishHandle.addEventListener('message', this.parseStockfishLine)
        this.stockfishHandle.postMessage('uci')
      } else {
        this.giveStateToStockfish()
      }
      this.resolve = resolve
    })
  }

  giveStateToStockfish () {
    this.stockfishHandle!.postMessage(`position fen ${this.state?.toFen()}`)
    this.stockfishHandle!.postMessage('go movetime 5000')
  }

  parseStockfishLine (event: MessageEvent<string>) {
    const line = event.data
    // console.log(line)
    const command = line.split(/\s+/).map(x => x.trim()).filter(x => x)
    switch (command[0]) {
      case 'uciok':
        this.stockfishHandle!.postMessage(`setoption name Skill Level value ${this.level}`)
        this.stockfishHandle!.postMessage('ucinewgame')
        this.giveStateToStockfish()
        break
      case 'bestmove': {
        const rawMove = command[1]
        const fromPos = new Pos(convertFileLetter(rawMove[0]), convertRankLetter(rawMove[1]))
        const toPos = new Pos(convertFileLetter(rawMove[2]), convertRankLetter(rawMove[3]))
        let promoteChoice: Piece | undefined
        if (rawMove[4]) {
          promoteChoice = this.state!.currTurn.FROM_LETTER.get(rawMove[4].toUpperCase())
        }
        const moves = this.state!.moves().filter(x => {
          if (x.isCastle() && fromPos.rank === this.state!.currTurn.KING_RANK && toPos.rank === fromPos.rank && fromPos.file === 4) {
            if (x.isKingSide && toPos.file === 6) {
              return true
            } else if (!x.isKingSide && toPos.file === 2) {
              return true
            }
          }
          if (x.isNormal() && x.fromPos.compare(fromPos) === 0 && x.toPos.compare(toPos) === 0) {
            if (x.isPromote()) {
              return promoteChoice === x.promoteChoice
            }
            return true
          }
          return false
        })
        this.resolve!(moves[0].do())
        break
      }
    }
  }

  close () {
    if (this.stockfishHandle) {
      this.stockfishHandle.terminate()
    }
  }
}

export abstract class PlayerFactory {
  abstract name (): string
  abstract build (): Player
  abstract id (): string
  difficulty (): number | undefined {
    return undefined
  }

  setDifficulty (x: number): PlayerFactory {
    return this
  }

  minDifficulty (): number | undefined {
    return undefined
  }

  maxDifficulty (): number | undefined {
    return undefined
  }
}

export class HumanFactory extends PlayerFactory {
  name (): string {
    return 'Human'
  }

  build (): Player {
    return new Human()
  }

  id (): string {
    return 'human'
  }
}

export class RandomFactory extends PlayerFactory {
  name (): string {
    return 'Mr. Random'
  }

  build (): Player {
    return new MrRandom()
  }

  id (): string {
    return 'random'
  }
}

export class StockfishFactory extends PlayerFactory {
  rawDifficulty: number

  constructor (difficulty?: number) {
    super()
    this.rawDifficulty = difficulty || 0
  }

  difficulty (): number | undefined {
    return this.rawDifficulty
  }

  minDifficulty (): number | undefined {
    return 0
  }

  maxDifficulty (): number | undefined {
    return 20
  }

  setDifficulty (x: number): PlayerFactory {
    return new StockfishFactory(x)
  }

  name (): string {
    return 'Stockfish'
  }

  build (): Player {
    return new Stockfish(this.rawDifficulty)
  }

  id (): string {
    return 'stockfish'
  }
}
