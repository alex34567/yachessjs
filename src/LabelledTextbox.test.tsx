// Setup code adapted from react docs
import { render, unmountComponentAtNode } from 'react-dom'
import { act } from '@testing-library/react'
import LabelledTextBox from './LabelledTextbox'
import React from 'react'

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

test('Textbox without class', () => {
  act(() => {
    render(<LabelledTextBox label='Hi' type='text'/>, container)
  })
  expect(container).toMatchSnapshot()
})

test('Textbox with class', () => {
  act(() => {
    render(<LabelledTextBox className='Test' label='Hi' type='text'/>, container)
  })
  expect(container).toMatchSnapshot()
})
