import { getStartState, State, stateFromFen } from './logic/state'
import { History, Location } from 'history'

export function getStateFromQuery (history: History) {
  const query = new URLSearchParams(history.location.search)
  const rawState = query.get('fen')
  if (rawState) {
    try {
      return stateFromFen(rawState)
      // Ignore bad fen strings
    } catch (e) {}
  }
  return getStartState()
}

export function changeMode (history: History, location: Location, state: State, path: string, replace: boolean) {
  const newLoc = { ...location }
  const query = new URLSearchParams(newLoc.search)
  const fen = state.toFen()
  newLoc.pathname = path
  if (fen === getStartState().toFen()) {
    query.delete('fen')
  } else {
    query.set('fen', state.toFen())
  }
  newLoc.search = query.toString()
  if (replace) {
    history.replace(newLoc)
  } else {
    history.push(newLoc)
  }
}
