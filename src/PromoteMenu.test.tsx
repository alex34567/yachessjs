import { render, unmountComponentAtNode } from 'react-dom'
import { stateFromFen } from './logic/state'
import { Promotion } from './logic/moves'
import { act } from '@testing-library/react'
import PromoteMenu from './PromoteMenu'
import * as immutable from 'immutable'
import React from 'react'
import { ThemeManager } from './theme'

jest.mock('./BoardSquare')
jest.mock('./theme')

let container: HTMLDivElement | null = null
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  // cleanup on exiting
  unmountComponentAtNode(container!)
  container!.remove()
  container = null
})

test('render white', () => {
  const state = stateFromFen('8/P6k/8/8/8/8/8/7K w - - 0 1')
  const moves = immutable.List(state.moves().filter(x => !x.invalid() && x.isNormal() && x.isPromote()) as Promotion[])
  const onPromote = jest.fn()
  act(() => {
    render(<PromoteMenu moves={moves} onPromote={onPromote} theme={new ThemeManager()} />, container)
  })
  expect(container).toMatchSnapshot()
})

test('render black', () => {
  const state = stateFromFen('8/7k/8/8/8/8/p7/7K b - - 0 1')
  const moves = immutable.List(state.moves().filter(x => !x.invalid() && x.isNormal() && x.isPromote()) as Promotion[])
  const onPromote = jest.fn()
  act(() => {
    render(<PromoteMenu moves={moves} onPromote={onPromote} theme={new ThemeManager()} />, container)
  })
  expect(container).toMatchSnapshot()
})

test('queen promote', () => {
  const state = stateFromFen('8/P6k/8/8/8/8/8/7K w - - 0 1')
  const moves = immutable.List(state.moves().filter(x => !x.invalid() && x.isNormal() && x.isPromote()) as Promotion[])
  const onPromote = jest.fn()
  act(() => {
    render(<PromoteMenu moves={moves} onPromote={onPromote} theme={new ThemeManager()} />, container)
  })

  act(() => {
    container?.firstElementChild?.children[0].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(onPromote.mock.calls.length).toBe(1)
  expect(onPromote.mock.calls[0][0].toFen()).toBe('Q7/7k/8/8/8/8/8/7K b - - 0 1')
})

test('knight promote', () => {
  const state = stateFromFen('8/P6k/8/8/8/8/8/7K w - - 0 1')
  const moves = immutable.List(state.moves().filter(x => !x.invalid() && x.isNormal() && x.isPromote()) as Promotion[])
  const onPromote = jest.fn()
  act(() => {
    render(<PromoteMenu moves={moves} onPromote={onPromote} theme={new ThemeManager()} />, container)
  })

  act(() => {
    container?.firstElementChild?.children[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(onPromote.mock.calls.length).toBe(1)
  expect(onPromote.mock.calls[0][0].toFen()).toBe('N7/7k/8/8/8/8/8/7K b - - 0 1')
})

test('rook promote', () => {
  const state = stateFromFen('8/P6k/8/8/8/8/8/7K w - - 0 1')
  const moves = immutable.List(state.moves().filter(x => !x.invalid() && x.isNormal() && x.isPromote()) as Promotion[])
  const onPromote = jest.fn()
  act(() => {
    render(<PromoteMenu moves={moves} onPromote={onPromote} theme={new ThemeManager()} />, container)
  })

  act(() => {
    container?.firstElementChild?.children[2].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(onPromote.mock.calls.length).toBe(1)
  expect(onPromote.mock.calls[0][0].toFen()).toBe('R7/7k/8/8/8/8/8/7K b - - 0 1')
})

test('bishop promote', () => {
  const state = stateFromFen('8/P6k/8/8/8/8/8/7K w - - 0 1')
  const moves = immutable.List(state.moves().filter(x => !x.invalid() && x.isNormal() && x.isPromote()) as Promotion[])
  const onPromote = jest.fn()
  act(() => {
    render(<PromoteMenu moves={moves} onPromote={onPromote} theme={new ThemeManager()} />, container)
  })

  act(() => {
    container?.firstElementChild?.children[3].dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(onPromote.mock.calls.length).toBe(1)
  expect(onPromote.mock.calls[0][0].toFen()).toBe('B7/7k/8/8/8/8/8/7K b - - 0 1')
})
