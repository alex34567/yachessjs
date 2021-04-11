import * as React from 'react'
import './App.css'
import SetupMode from './SetupMode'
import PlayMode from './PlayMode'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import BoardSquareTheme from './BoardSquareTheme'

function App (_props: {}) {
  return (
    <>
      <BoardSquareTheme/>
      <BrowserRouter>
        <Switch>
          <Redirect exact from='/' to='/play'/>
          <Route path='/play'>
            <PlayMode/>
          </Route>
          <Route path='/setup'>
            <SetupMode/>
          </Route>
        </Switch>
      </BrowserRouter>
    </>
  )
}

export default App
