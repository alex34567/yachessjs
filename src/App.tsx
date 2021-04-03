import * as React from 'react'
import './App.css'
import SetupMode from './SetupMode'
import { getStartState, State } from './logic/state'
import { useState } from 'react'
import PlayMode from './PlayMode'

export interface ModeProps {
  switchMode: (isSetup: boolean) => void
  defaultState: State
  setDefaultState: (state: State) => void
}

function App (_props: {}) {
  const [defaultState, setDefaultState] = useState<State>(getStartState())
  const [isSetup, setIsSetup] = useState<boolean>(false)

  let mode
  if (isSetup) {
    mode = <SetupMode defaultState={defaultState} setDefaultState={setDefaultState} switchMode={setIsSetup}/>
  } else {
    mode = <PlayMode defaultState={defaultState} setDefaultState={setDefaultState} switchMode={setIsSetup}/>
  }

  return mode
}

export default App
