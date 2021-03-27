import * as React from 'react'
import { useEffect, useState } from 'react'
import { Human, MrRandom, Player, Stockfish } from './player'

type PlayerSel = 'human' | 'random' | 'stockfish'

export interface PlayerSelectorProps {
  onPlayerChange: (playerCons: () => Player) => void
}

export default function PlayerSelector (props: PlayerSelectorProps) {
  const [currSel, setCurrSel] = useState<PlayerSel>('human')
  const [stockfishLevel, setStockfishLevel] = useState(0)

  useEffect(() => {
    let playerCons
    switch (currSel) {
      case 'human':
        playerCons = () => new Human()
        break
      case 'random':
        playerCons = () => new MrRandom()
        break
      case 'stockfish':
        playerCons = () => new Stockfish(stockfishLevel)
        break
    }

    props.onPlayerChange(playerCons)
  }, [currSel, stockfishLevel])

  const onSelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSel = event.target.value as PlayerSel
    setCurrSel(newSel)
  }

  const onDiffChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDiff = Number(event.target.value)
    setStockfishLevel(newDiff)
  }

  if (currSel !== 'stockfish' && stockfishLevel !== 0) {
    setStockfishLevel(0)
  }

  let stockfishDifficultySlider
  if (currSel === 'stockfish') {
    stockfishDifficultySlider =
      <>
        <br/>
        <label>Stockfish Level: {stockfishLevel}</label>
        <br/>
        <input type='range' min='0' max='20' onChange={onDiffChange} value={stockfishLevel}/>
      </>
  }

  return (
    <>
      <select value={currSel} onChange={onSelChange}>
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
      {stockfishDifficultySlider}
    </>
  )
}
