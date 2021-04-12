import * as React from 'react'
import './App.css'
import SetupMode from './SetupMode'
import PlayMode from './PlayMode'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import { Theme, ThemeManager, useTheme } from './theme'
import { useState } from 'react'
import ThemeSetup from './ThemeSetup'

export interface ModeProps {
  theme: ThemeManager
  openTheme: () => void
}

function App (_props: {}) {
  const [theme, setTheme] = useTheme()
  const [themeOpen, setThemeOpen] = useState(false)

  function onSetTheme (theme: Theme) {
    setTheme(theme)
    setThemeOpen(false)
  }

  function openTheme () {
    setThemeOpen(true)
  }

  let themeSetup
  if (themeOpen) {
    themeSetup = <ThemeSetup theme={theme} setTheme={onSetTheme}/>
  }

  return (
    <>
      {themeSetup}
      <BrowserRouter>
        <Switch>
          <Redirect exact from={process.env.PUBLIC_URL + '/'} to={process.env.PUBLIC_URL + '/play'}/>
          <Route path={process.env.PUBLIC_URL + '/play'}>
            <PlayMode theme={theme} openTheme={openTheme}/>
          </Route>
          <Route path={process.env.PUBLIC_URL + '/setup'}>
            <SetupMode theme={theme} openTheme={openTheme}/>
          </Route>
        </Switch>
      </BrowserRouter>
    </>
  )
}

export default App
