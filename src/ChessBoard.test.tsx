// Setup code adapted from react docs
import { render, unmountComponentAtNode } from 'react-dom'
import ChessBoard from './ChessBoard'
import { getStartState, State, stateFromFen } from './logic/state'
import { act } from '@testing-library/react'
import React from 'react'
import { Pos } from './logic/util'
import {ThemeManager, useTheme} from "./theme";

jest.mock('./BoardSquare')
jest.mock('./theme')

let container: HTMLDivElement | null = null
const theme = new ThemeManager()
let state = getStartState()
let highlight: Pos | undefined
let board: Element | undefined
function changeHighlight (inHighlight: Pos | undefined) {
  highlight = inHighlight
  reRender()
}
function makeMove (inState: State) {
  state = inState
  reRender()
}
function reRender () {
  render(<ChessBoard makeMove={makeMove} highlightedPos={highlight} state={state} changeHighlight={changeHighlight} theme={theme}/>, container)
}

function clickOnSquare (pos: Pos) {
  const row = 7 - pos.rank
  const column = pos.file
  act(() => {
    board!.children[row * 8 + column].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

// Pos is relative to pawn
function clickOnPromoteMenu (pos: Pos, choice: number) {
  let row = 0
  if (pos.rank === 0) {
    row = 4
  }
  const column = pos.file
  act(() => {
    board!.children[row * 8 + column].children[0].children[choice].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement('div')
  document.body.appendChild(container)
  highlight = undefined
  state = getStartState()
  reRender()
  board = container?.firstElementChild?.firstElementChild!
})

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container!)
  container!.remove()
  container = null
})

test('Empty Board', () => {
  act(() => makeMove(stateFromFen('8/8/8/8/8/8/8/8 w - - 0 1')))
  expect(container).toMatchSnapshot()
})

test('Start Board', () => {
  expect(container).toMatchSnapshot()
})

/* Plays though the fastest checkmate
  PGN Equivalent:
  1. f4 e5 2. g4 Qh4# 0-1
 */
test('Fouls Mate', () => {
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(5, 1))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(5, 3))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 6))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 4))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(6, 1))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(6, 3))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(3, 7))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(7, 3))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3')
})

test('White Promote', () => {
  act(() => makeMove(stateFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(0, 6))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(0, 7))
  expect(container).toMatchSnapshot()
  act(() => {
    board!.children[0].children[0].children[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('Q3k3/8/8/8/8/8/8/4K3 b - - 0 1')
})

test('White Left Capture Promote', () => {
  act(() => makeMove(stateFromFen('n1n1k3/1P6/8/8/8/8/8/4K3 w - - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(1, 6))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(0, 7))
  expect(container).toMatchSnapshot()
  clickOnPromoteMenu(new Pos(0, 7), 0)
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('Q1n1k3/8/8/8/8/8/8/4K3 b - - 0 1')
})

test('White Right Capture Promote', () => {
  act(() => makeMove(stateFromFen('n1n1k3/1P6/8/8/8/8/8/4K3 w - - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(1, 6))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(2, 7))
  expect(container).toMatchSnapshot()
  clickOnPromoteMenu(new Pos(2, 7), 0)
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('n1Q1k3/8/8/8/8/8/8/4K3 b - - 0 1')
})

test('White King Side Castle by King Movement', () => {
  act(() => makeMove(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 0))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(6, 0))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1')
})

test('White King Side Castle by Rook Capture', () => {
  act(() => makeMove(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 0))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(7, 0))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1')
})

test('White Queen Side Castle by King Movement', () => {
  act(() => makeMove(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 0))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(2, 0))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1')
})

test('White Queen Side Castle by Rook Capture', () => {
  act(() => makeMove(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 0))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(0, 0))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1')
})

test('Black Promote', () => {
  act(() => makeMove(stateFromFen('4k3/8/8/8/8/8/p7/4K3 b - - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(0, 1))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(0, 0))
  expect(container).toMatchSnapshot()
  clickOnPromoteMenu(new Pos(0, 0), 0)
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('4k3/8/8/8/8/8/8/q3K3 w - - 0 2')
})

test('Black Left Capture Promote', () => {
  act(() => makeMove(stateFromFen('4k3/8/8/8/8/8/1p6/N1N1K3 b - - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(1, 1))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(0, 0))
  expect(container).toMatchSnapshot()
  clickOnPromoteMenu(new Pos(0, 0), 0)
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('4k3/8/8/8/8/8/8/q1N1K3 w - - 0 2')
})

test('Black Right Capture Promote', () => {
  act(() => makeMove(stateFromFen('4k3/8/8/8/8/8/1p6/N1N1K3 b - - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(1, 1))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(2, 0))
  expect(container).toMatchSnapshot()
  clickOnPromoteMenu(new Pos(2, 0), 0)
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('4k3/8/8/8/8/8/8/N1q1K3 w - - 0 2')
})

test('Black King Side Castle by King Movement', () => {
  act(() => makeMove(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 7))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(6, 7))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('r4rk1/8/8/8/8/8/8/R3K2R w KQ - 1 2')
})

test('Black King Side Castle by Rook Capture', () => {
  act(() => makeMove(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 7))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(7, 7))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('r4rk1/8/8/8/8/8/8/R3K2R w KQ - 1 2')
})

test('Black Queen Side Castle by King Movement', () => {
  act(() => makeMove(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 7))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(2, 7))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('2kr3r/8/8/8/8/8/8/R3K2R w KQ - 1 2')
})

test('Black Queen Side Castle by Rook Capture', () => {
  act(() => makeMove(stateFromFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1')))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(4, 7))
  expect(container).toMatchSnapshot()
  clickOnSquare(new Pos(0, 7))
  expect(container).toMatchSnapshot()
  expect(state.toFen()).toBe('2kr3r/8/8/8/8/8/8/R3K2R w KQ - 1 2')
})

test('Basic selection and deselection', () => {
  // Fill the board to make every square clickable
  act(() => makeMove(stateFromFen('rnbqkbnr/pppppppp/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP/RNBQKBNR w KQkq - 0 1')))
  for (let file = 0; file < 8; file++) {
    for (let rank = 0; rank < 8; rank++) {
      const pos = new Pos(file, rank)
      clickOnSquare(pos)
      expect(highlight).toBeDefined()
      expect(pos.compare(highlight!)).toBe(0)
      clickOnSquare(pos)
      expect(highlight).toBeUndefined()
    }
  }
})
