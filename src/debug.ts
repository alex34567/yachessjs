import { stateFromFen } from './logic/state';

(window as any).YACHESS_DEBUG = {
  perft: (fen: string, depth: number): string => {
    let output = ''
    if (!Number.isInteger(depth) || depth < 1) {
      throw new Error('Invalid depth')
    }

    const state = stateFromFen(fen)
    const moves = state.moves().filter(x => !x.invalid())
    let nodeTotal = 0
    for (const move of moves) {
      const nodes = move.do().perft(depth - 1)
      nodeTotal += nodes
      output += `${move.toNotation().toString()} has ${nodes} nodes\n`
    }
    output += `There are ${nodeTotal} nodes in total`

    return output
  }
}
