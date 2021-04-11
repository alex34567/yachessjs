import {render, unmountComponentAtNode} from "react-dom";
import {act} from "@testing-library/react";
import GameInfo from "./GameInfo";
import {getStartState, stateFromFen} from "./logic/state";
import React from "react";

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

test('Gameinfo', () => {
  const state = getStartState()
  const reset = jest.fn()
  const switchMode = jest.fn()
  act(() => {
    render(<GameInfo state={state} restart={reset} switchMode={switchMode}/>, container)
  })
})

test('Mate', () => {
  const state = stateFromFen('8/5KQk/8/8/8/8/8/8 b - - 0 1')
  const reset = jest.fn()
  const switchMode = jest.fn()
  act(() => {
    render(<GameInfo state={state} restart={reset} switchMode={switchMode}/>, container)
  })
})

test('StaleMate', () => {
  const state = stateFromFen('5K2/7k/5Q2/8/8/8/8/8 b - - 0 1')
  const reset = jest.fn()
  const switchMode = jest.fn()
  act(() => {
    render(<GameInfo state={state} restart={reset} switchMode={switchMode}/>, container)
  })
})