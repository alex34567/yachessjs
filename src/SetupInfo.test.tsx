import { render, unmountComponentAtNode } from 'react-dom'
import { act } from '@testing-library/react'
import React from 'react'

import { ThemeManager } from './theme'
import SetupInfo from './SetupInfo'
import { getStartState } from './logic/state'
import { BrowserRouter } from 'react-router-dom'

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

test('Setup info', () => {
  const dummy = jest.fn()

  act(() => {
    render(
      <BrowserRouter>
        <SetupInfo openTheme={dummy} theme={new ThemeManager()} selectPiece={dummy} changeState={dummy} state={getStartState()}/>
      </BrowserRouter>
      , container)
  })

  expect(container).toMatchSnapshot()
})
