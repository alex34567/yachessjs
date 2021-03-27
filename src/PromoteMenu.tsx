import * as immutable from 'immutable'
import { Promotion } from './logic/moves'
import { State } from './logic/state'
import BoardSquare from './BoardSquare'
import * as React from 'react'

interface PromoteMenuProps {
  moves: immutable.List<Promotion>,
  onPromote: (state: State) => void,
}

export default function PromoteMenu (props: PromoteMenuProps) {
  const promotes = []
  let key = 0
  for (const move of props.moves) {
    const onClick = () => {
      props.onPromote(move.do())
    }
    promotes.push(<BoardSquare key={key++} piece={move.promoteChoice} onClick={onClick} />)
  }
  return (
    <div className='PromoteMenu'>
      {promotes}
    </div>
  )
}
