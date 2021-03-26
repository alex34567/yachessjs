import { State } from './logic/state'

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
