import { stateFromFen } from './state'

// Board positions and node counts from https://www.chessprogramming.org/Perft_Results

test('Start Pos perft', () => {
  const state = stateFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  expect(state.perft(1)).toBe(20)
  expect(state.perft(2)).toBe(400)
  expect(state.perft(3)).toBe(8902)
  expect(state.perft(4)).toBe(197281)
})

test('Perft position 2', () => {
  const state = stateFromFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1')
  expect(state.perft(1)).toBe(48)
  expect(state.perft(2)).toBe(2039)
  expect(state.perft(3)).toBe(97862)
})

test('Perft position 3', () => {
  const state = stateFromFen('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1')
  expect(state.perft(1)).toBe(14)
  expect(state.perft(2)).toBe(191)
  expect(state.perft(3)).toBe(2812)
  expect(state.perft(4)).toBe(43238)
})

test('Perft position 4', () => {
  const state = stateFromFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1')
  expect(state.perft(1)).toBe(6)
  expect(state.perft(2)).toBe(264)
  expect(state.perft(3)).toBe(9467)
  expect(state.perft(4)).toBe(422333)
})

test('Perft position 5', () => {
  const state = stateFromFen('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8')
  expect(state.perft(1)).toBe(44)
  expect(state.perft(2)).toBe(1486)
  expect(state.perft(3)).toBe(62379)
})

test('Perft position 6', () => {
  const state = stateFromFen('r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10')
  expect(state.perft(1)).toBe(46)
  expect(state.perft(2)).toBe(2079)
  expect(state.perft(3)).toBe(89890)
})
