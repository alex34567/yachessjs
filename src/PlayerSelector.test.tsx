import { render, unmountComponentAtNode } from 'react-dom'
import { act } from '@testing-library/react'
import React from 'react'
import PlayerSelector from './PlayerSelector'
import { HumanFactory } from './player'
import { BrowserRouter } from 'react-router-dom'

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

test('Player Selector', () => {
  const onPlayerChange = jest.fn()

  act(() => {
    render(
      <BrowserRouter>
        <PlayerSelector value={new HumanFactory()} onPlayerChange={onPlayerChange} />
      </BrowserRouter>
      , container)
  })

  expect(container).toMatchSnapshot()
})
