import { render, unmountComponentAtNode } from 'react-dom'
import { act } from '@testing-library/react'
import React from 'react'
import PlayMode from './PlayMode'
import { ThemeManager } from './theme'
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

test('Play Mode', () => {
  const openTheme = jest.fn()

  act(() => {
    render(
      <BrowserRouter>
        <PlayMode theme={new ThemeManager()} openTheme={openTheme} />
      </BrowserRouter>
      , container
    )
  })

  expect(container).toMatchSnapshot()
})
