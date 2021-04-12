import { render, unmountComponentAtNode } from 'react-dom'
import { act } from '@testing-library/react'
import React from 'react'

import { ThemeManager } from './theme'
import SetupMode from './SetupMode'
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

test('Setup Mode', () => {
  const dummy = jest.fn()

  act(() => {
    render(
      <BrowserRouter>
        <SetupMode openTheme={dummy} theme={new ThemeManager()}/>
      </BrowserRouter>
      , container)
  })

  expect(container).toMatchSnapshot()
})
