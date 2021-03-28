import { act } from '@testing-library/react'
import BoardSquare from './BoardSquare'
import * as Pieces from './logic/pieces'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

// Setup code adapted react docs
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

test('Empty Square', () => {
  act(() => {
    render(<BoardSquare piece={Pieces.EMPTY} />, container)
  })
  expect(container).toMatchSnapshot()
})

test('Empty Black Square', () => {
  act(() => {
    render(<BoardSquare piece={Pieces.EMPTY} isBlack />, container)
  })
  expect(container).toMatchSnapshot()
})

test('White Pawn', () => {
  act(() => {
    render(<BoardSquare piece={Pieces.WHITE.PAWN} />, container)
  })
  expect(container).toMatchSnapshot()
})

test('Selected Queen', () => {
  act(() => {
    render(<BoardSquare piece={Pieces.BLACK.QUEEN} highlighted />, container)
  })
  expect(container).toMatchSnapshot()
})

test('In check', () => {
  act(() => {
    render(<BoardSquare piece={Pieces.BLACK.KING} inCheck />, container)
  })
  expect(container).toMatchSnapshot()
})

test('Highlighted in check', () => {
  act(() => {
    render(
      <BoardSquare piece={Pieces.BLACK.KING} inCheck highlighted />,
      container
    )
  })
  expect(container).toMatchSnapshot()
})

test('Can Move To', () => {
  act(() => {
    render(<BoardSquare piece={Pieces.EMPTY} canMoveTo />, container)
  })
  expect(container).toMatchSnapshot()
})

test('Can capture', () => {
  act(() => {
    render(<BoardSquare piece={Pieces.WHITE.PAWN} canMoveTo />, container)
  })
  expect(container).toMatchSnapshot()
})

test('Clickable', () => {
  const click = jest.fn()
  act(() => {
    render(<BoardSquare onClick={click} piece={Pieces.EMPTY}/>, container)
  })

  const square = container?.firstElementChild
  expect(square).not.toBeNull()
  expect(click).not.toBeCalled()

  act(() => {
    square!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(click).toBeCalled()
})
