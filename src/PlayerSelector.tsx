import * as React from 'react'
import { HumanFactory, PlayerFactory, RandomFactory, StockfishFactory } from './player'

export interface PlayerSelectorProps {
  value: PlayerFactory
  onPlayerChange: (playerFactory: PlayerFactory) => void
}

export default function PlayerSelector (props: PlayerSelectorProps) {
  const onSelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let newSel
    switch (event.target.value) {
      case 'human':
        newSel = new HumanFactory()
        break
      case 'random':
        newSel = new RandomFactory()
        break
      case 'stockfish':
        newSel = new StockfishFactory()
        break
      default:
        return
    }
    props.onPlayerChange(newSel)
  }

  const onDiffChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDiff = Number(event.target.value)
    props.onPlayerChange(props.value.setDifficulty(newDiff))
  }

  let difficultySlider
  if (props.value.difficulty() !== undefined) {
    difficultySlider =
      <>
        <br/>
        <label>{props.value.name()} Level: {props.value.difficulty()}</label>
        <br/>
        <input type='range' min={props.value.minDifficulty()} max={props.value.maxDifficulty()} onChange={onDiffChange} value={props.value.difficulty()}/>
      </>
  }

  return (
    <>
      <select value={props.value.id()} onChange={onSelChange}>
        <option value='human'>
          Human
        </option>
        <option value='random'>
          MrRandom
        </option>
        <option value='stockfish'>
          Stockfish
        </option>
      </select>
      {difficultySlider}
    </>
  )
}
