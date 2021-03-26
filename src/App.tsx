import * as React from 'react'
import './App.css'
import { Pos } from './logic/util'
import { Square, WHITE, BLACK } from './logic/pieces'
import { getStartState, State } from './logic/state'
import { Move, Promotion } from './logic/moves'
import * as immutable from 'immutable'
import { Human, MrRandom, Player, Stockfish } from './player'
import { useEffect, useReducer, useState } from 'react'

interface BoardSquareProps {
  isBlack?: boolean
  inCheck?: boolean
  piece: Square
  onClick?: () => void
  highlighted?: boolean
  canMoveTo?: boolean
  children?: React.ReactNode
}

function getPieceName (piece: Square): string | undefined {
  switch (piece) {
    case WHITE.QUEEN:
      return 'White Queen'
    case WHITE.KING:
      return 'White King'
    case WHITE.BISHOP:
      return 'White Bishop'
    case WHITE.ROOK:
      return 'White Rook'
    case WHITE.KNIGHT:
      return 'White Knight'
    case WHITE.PAWN:
      return 'White Pawn'
    case BLACK.QUEEN:
      return 'Black Queen'
    case BLACK.KING:
      return 'Black King'
    case BLACK.BISHOP:
      return 'Black Bishop'
    case BLACK.ROOK:
      return 'Black Rook'
    case BLACK.KNIGHT:
      return 'Black Knight'
    case BLACK.PAWN:
      return 'Black Pawn'
  }
  return undefined
}

function getPieceImage (piece: Square): React.ReactNode | undefined {
  const name = getPieceName(piece)
  if (name) {
    return <img alt={name} className='ChessPiece' src={`pieces/cburnett/${name}.svg`} />
  }
  return undefined
}

function BoardSquare (props: BoardSquareProps) {
  let className = 'ChessBoardSquare'
  if (props.isBlack) {
    className += ' ChessBoardSquareBlack'
  } else {
    className += ' ChessBoardSquareWhite'
  }
  let highlight
  if (props.highlighted) {
    highlight =
        <svg className='Overlay'>
          <rect width='100%' height='100%' fill='yellow' fillOpacity='.5' />
        </svg>
  }
  let checkHighlight
  if (props.inCheck) {
    checkHighlight =
        <svg className='Overlay'>
          <rect width='100%' height='100%' fill='red' fillOpacity='.5' />
        </svg>
  }
  const pieceImage = getPieceImage(props.piece)
  let moveIndicator
  if (props.canMoveTo && !pieceImage) {
    moveIndicator =
        <svg className='Overlay'>
          <circle r='10%' cx='50%' cy='50%' />
        </svg>
  }
  if (props.canMoveTo && pieceImage) {
    moveIndicator =
        <svg className='Overlay'>
          <circle r='47.5%' cx='50%' cy='50%' fill='none' stroke='black' strokeWidth='2.5%' />
        </svg>
  }
  return (
      <div className={className} onClick={props.onClick}>
        {highlight}
        {checkHighlight}
        {pieceImage}
        {moveIndicator}
        {props.children}
      </div>
  )
}

interface PromoteMenuProps {
  moves: immutable.List<Promotion>,
  onPromote: (state: State) => void,
}

function PromoteMenu (props: PromoteMenuProps) {
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

interface ChessBoardProps {
  state: State
  makeMove?: (state: State) => void
}

function ChessBoard (props: ChessBoardProps) {
  const [highlightedPos, setHighlightedPos] = useState<Pos | null>(null)
  const [promotePos, setPromotePos] = useState<Pos | null>(null)

  if (highlightedPos && !props.state.board.get(highlightedPos).isOccupied()) {
    setHighlightedPos(null)
  }

  const squares = []
  let isBlack = false
  let moves: Move[] = []
  let drawPromotePos = promotePos
  if (drawPromotePos && props.state.currTurn === BLACK) {
    drawPromotePos = drawPromotePos.addRank(3)
  }
  if (highlightedPos && props.makeMove) {
    moves = props.state.moves().filter(move => {
      if (move.invalid() || props.state.isGameOver()) {
        return false
      }
      if (move.isNormal()) {
        return move.fromPos.compare(highlightedPos) === 0
      }
      if (move.isCastle()) {
        return highlightedPos.rank === props.state.currTurn.KING_RANK && highlightedPos.file === 4
      }
      return false
    })
  }
  for (let i = 7; i >= 0; i--) {
    isBlack = !isBlack
    for (let j = 0; j < 8; j++) {
      isBlack = !isBlack
      const pos = new Pos(j, i)
      const highlighted = Boolean(highlightedPos && pos.compare(highlightedPos) === 0)
      const piece = props.state.board.get(new Pos(j, i))
      const inCheck = piece === props.state.currTurn.KING && props.state.isCheck()
      const moveIndex = moves.findIndex(move => {
        if (move.isNormal()) {
          return move.toPos.compare(pos) === 0
        }
        if (move.isCastle()) {
          if (pos.rank !== props.state.currTurn.KING_RANK) {
            return false
          }
          if (move.isKingSide) {
            return pos.file === 7 || pos.file === 6
          } else {
            return pos.file === 2 || pos.file === 0
          }
        }
        return false
      })
      let onClick = () => {
        setHighlightedPos(null)
        setPromotePos(null)
      }
      const move = moves[moveIndex]
      if (moveIndex === -1 && piece.isOccupied()) {
        onClick = () => {
          setHighlightedPos(pos)
          setPromotePos(null)
        }
      } else if (moveIndex >= 0 && ((move.isNormal() && !move.isPromote()) || move.isCastle())) {
        onClick = () => {
          props.makeMove!(moves[moveIndex].do())
          setHighlightedPos(null)
          setPromotePos(null)
        }
      } else if (moveIndex >= 0 && move.isNormal() && move.isPromote() && !promotePos) {
        const promote = move
        onClick = () => {
          setPromotePos(promote.toPos)
        }
      }
      let promoteMenu
      if (drawPromotePos && pos.compare(drawPromotePos) === 0) {
        const onPromote = (state: State) => {
          props.makeMove!(state)
          setHighlightedPos(null)
          setPromotePos(null)
        }
        function PromoteFilter (move: Move): move is Promotion {
          if (!move.isNormal() || !promotePos || move.toPos.compare(promotePos) !== 0) {
            return false
          }
          return move.isPromote()
        }

        const promoteList = immutable.List(moves.filter<Promotion>(PromoteFilter))

        promoteMenu = <PromoteMenu moves={promoteList} onPromote={onPromote} />
      }
      const canMoveTo = moveIndex >= 0 && !promotePos
      squares.push(
        <BoardSquare key={i * 8 + j} canMoveTo={canMoveTo} isBlack={isBlack} piece={piece} highlighted={highlighted} inCheck={inCheck} onClick={onClick}>
          {promoteMenu}
        </BoardSquare>
      )
    }
  }
  return (
    <div className="ChessBoard">
      {squares}
    </div>
  )
}

type PlayerSel = 'human' | 'random' | 'stockfish'

interface PlayerSelectorProps {
  onPlayerChange: (playerCons: () => Player) => void
}

function PlayerSelector (props: PlayerSelectorProps) {
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
        <input type='range' min='0' max='20' onChange={onDiffChange} value={stockfishLevel} />
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

interface GameInfoProps {
  state: State
  restart: (white: Player, black: Player) => void
}

function GameInfo (props: GameInfoProps) {
  const [[WhiteCons], setWhiteCons] = useState<[() => Player]>([() => new Human()])
  const [[BlackCons], setBlackCons] = useState<[() => Player]>([() => new Human()])

  const restartButton = () => {
    props.restart(WhiteCons(), BlackCons())
  }

  const onWhiteChange = (player: () => Player) => {
    setWhiteCons([player])
  }

  const onBlackChange = (player: () => Player) => {
    setBlackCons([player])
  }

  let checkmateText
  if (props.state.isCheckmate()) {
    checkmateText = 'Checkmate'
  } else if (props.state.isDraw()) {
    checkmateText = `Draw due to ${props.state.drawReason()}`
  }
  return (
    <div className='GameInfo'>
      {checkmateText}
      <br/>
      <button onClick={restartButton}>
        Restart
      </button>
      <br/>
      <label>White Player </label>
      <PlayerSelector onPlayerChange={onWhiteChange} />
      <br/>
      <label>Black Player </label>
      <PlayerSelector onPlayerChange={onBlackChange} />
    </div>
  )
}

function App (props: {}) {
  const [white, setWhite] = useState<Player>(new Human())
  const [black, setBlack] = useState<Player>(new Human())
  const beginState = getStartState()
  const [state, setState] = useState(beginState)
  const forceUpdate = useReducer(x => x + 1, 0)[1]

  useEffect(() => {
    let player1 = white
    let player2 = black
    const makeMoveThen = (state: State): Promise<unknown> | undefined => {
      if (state.isGameOver()) {
        setState(state)
        return
      }
      const tmp = player1
      player1 = player2
      player2 = tmp
      const ret = player1.makeMove(state).then(makeMoveThen)
      setState(state)
      return ret
    }
    player1.makeMove(beginState).then(makeMoveThen)
    forceUpdate()
    return () => {
      white.close()
      black.close()
    }
  }, [white, black])

  const restart = (white: Player, black: Player) => {
    white.close()
    black.close()
    setWhite(white)
    setBlack(black)
    setState(beginState)
  }

  let currPlayer = white
  if (state.currTurn === BLACK) {
    currPlayer = black
  }
  return (
    <div className="App">
      <ChessBoard makeMove={currPlayer.getBoardClick()} state={state} />
      <GameInfo state={state} restart={restart} />
    </div>
  )
}

export default App
