import * as React from 'react'
import './App.css'
import { Pos } from './logic/util'
import { Square, WHITE, BLACK } from './logic/pieces'
import { getStartState, State } from './logic/state'
import { Move, Promotion } from './logic/moves'
import * as immutable from 'immutable'
import { Human, MrRandom, Player } from './player'

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

interface ChessBoardState {
  highlightedPos: Pos | null
  promotePos: Pos | null
}

interface ChessBoardProps {
  state: State
  makeMove?: (state: State) => void
}

class ChessBoard extends React.PureComponent<ChessBoardProps, ChessBoardState> {
  constructor (props: ChessBoardProps) {
    super(props)
    this.state = {
      highlightedPos: null,
      promotePos: null
    }
  }

  static getDerivedStateFromProps (props: ChessBoardProps, state: ChessBoardState) {
    if (state.highlightedPos && !props.state.board.get(state.highlightedPos).isOccupied()) {
      return { highlightedPos: null }
    }
    return null
  }

  render (): React.ReactElement {
    const squares = []
    let isBlack = false
    let moves: Move[] = []
    const highlightedPos = this.state.highlightedPos
    let drawPromotePos = this.state.promotePos
    if (drawPromotePos && this.props.state.currTurn === BLACK) {
      drawPromotePos = drawPromotePos.addRank(3)
    }
    if (highlightedPos && this.props.makeMove) {
      moves = this.props.state.moves().filter(move => {
        if (move.invalid() || this.props.state.isGameOver()) {
          return false
        }
        if (move.isNormal()) {
          return move.fromPos.compare(highlightedPos) === 0
        }
        if (move.isCastle()) {
          return highlightedPos.rank === this.props.state.currTurn.KING_RANK && highlightedPos.file === 4
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
        const piece = this.props.state.board.get(new Pos(j, i))
        const inCheck = piece === this.props.state.currTurn.KING && this.props.state.isCheck()
        const moveIndex = moves.findIndex(move => {
          if (move.isNormal()) {
            return move.toPos.compare(pos) === 0
          }
          if (move.isCastle()) {
            if (pos.rank !== this.props.state.currTurn.KING_RANK) {
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
          this.setState({ highlightedPos: null, promotePos: null })
        }
        const move = moves[moveIndex]
        if (moveIndex === -1 && piece.isOccupied()) {
          onClick = () => {
            this.setState({ highlightedPos: pos, promotePos: null })
          }
        } else if (moveIndex >= 0 && ((move.isNormal() && !move.isPromote()) || move.isCastle())) {
          onClick = () => {
            this.props.makeMove!(moves[moveIndex].do())
            this.setState({ highlightedPos: null, promotePos: null })
          }
        } else if (moveIndex >= 0 && move.isNormal() && move.isPromote() && !this.state.promotePos) {
          const promote = move
          onClick = () => {
            this.setState({ promotePos: promote.toPos })
          }
        }
        let promoteMenu
        if (drawPromotePos && pos.compare(drawPromotePos) === 0) {
          const onPromote = (state: State) => {
            this.props.makeMove!(state)
            this.setState({ highlightedPos: null, promotePos: null })
          }
          const that = this
          function PromoteFilter (move: Move): move is Promotion {
            if (!move.isNormal() || !that.state.promotePos || move.toPos.compare(that.state.promotePos) !== 0) {
              return false
            }
            return move.isPromote()
          }

          const promoteList = immutable.List(moves.filter<Promotion>(PromoteFilter))

          promoteMenu = <PromoteMenu moves={promoteList} onPromote={onPromote} />
        }
        const canMoveTo = moveIndex >= 0 && !this.state.promotePos
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
}

type PlayerSel = 'human' | 'random'

interface PlayerSelectorProps {
  onPlayerChange: (playerCons: new () => Player) => void
}

interface PlayerSelectorState {
  currSel: PlayerSel
}

class PlayerSelector extends React.PureComponent<PlayerSelectorProps, PlayerSelectorState> {
  constructor (props: PlayerSelectorProps) {
    super(props)
    this.state = {
      currSel: 'human'
    }
    this.onChange = this.onChange.bind(this)
  }

  onChange (event: React.ChangeEvent<HTMLSelectElement>) {
    const newSel = event.target.value as PlayerSel
    this.setState({ currSel: newSel })
    let playerCons
    switch (newSel) {
      case 'human':
        playerCons = Human
        break
      case 'random':
        playerCons = MrRandom
        break
    }

    this.props.onPlayerChange(playerCons)
  }

  render () {
    return (
      <select value={this.state.currSel} onChange={this.onChange}>
        <option value='human'>
          Human
        </option>
        <option value='random'>
          MrRandom
        </option>
      </select>
    )
  }
}

interface GameInfoProps {
  state: State
  restart: (white: Player, black: Player, state: State) => void
}

interface GameInfoState {
  WhiteCons: new () => Player,
  BlackCons: new () => Player,
}

class GameInfo extends React.Component<GameInfoProps, GameInfoState> {
  constructor (props: GameInfoProps) {
    super(props)
    this.state = {
      WhiteCons: Human,
      BlackCons: Human
    }
    this.restartButton = this.restartButton.bind(this)
    this.onWhiteChange = this.onWhiteChange.bind(this)
    this.onBlackChange = this.onBlackChange.bind(this)
  }

  onWhiteChange (player: new () => Player) {
    this.setState({ WhiteCons: player })
  }

  onBlackChange (player: new () => Player) {
    this.setState({ BlackCons: player })
  }

  restartButton () {
    this.props.restart(new this.state.WhiteCons(), new this.state.BlackCons(), getStartState())
  }

  render (): React.ReactElement {
    let checkmateText
    if (this.props.state.isCheckmate()) {
      checkmateText = 'Checkmate'
    } else if (this.props.state.isDraw()) {
      checkmateText = `Draw due to ${this.props.state.drawReason()}`
    }
    return (
      <div className='GameInfo'>
        {checkmateText}
        <br/>
        <button onClick={this.restartButton}>
          Restart
        </button>
        <br/>
        <label>White Player </label>
        <PlayerSelector onPlayerChange={this.onWhiteChange} />
        <br/>
        <label>Black Player </label>
        <PlayerSelector onPlayerChange={this.onBlackChange} />
      </div>
    )
  }
}

interface AppState {
  white: Player
  black: Player
  state: State
}

class App extends React.Component<{}, AppState> {
  constructor (props: {}) {
    super(props)
    const white = new Human()
    const black = new Human()
    const state = getStartState()
    this.state = {
      state: state,
      white,
      black
    }
    this.restart = this.restart.bind(this)
  }

  restart (white: Player, black: Player, state: State) {
    this.state.white.close()
    this.state.black.close()
    this.initPlayer(white, black, state)
    this.setState({ white, black, state })
  }

  initPlayer (player1: Player, player2: Player, start: State) {
    const makeMoveThen = (state: State): Promise<unknown> | undefined => {
      if (state.isGameOver()) {
        this.setState({ state })
        return
      }
      const tmp = player1
      player1 = player2
      player2 = tmp
      const ret = player1.makeMove(state).then(makeMoveThen)
      this.setState({ state })
      return ret
    }
    player1.makeMove(start).then(makeMoveThen)
  }

  render () {
    let currPlayer = this.state.white
    if (this.state.state.currTurn === BLACK) {
      currPlayer = this.state.black
    }
    return (
        <div className="App">
          <ChessBoard makeMove={currPlayer.getBoardClick()} state={this.state.state} />
          <GameInfo state={this.state.state} restart={this.restart} />
        </div>
    )
  }

  componentDidMount () {
    this.initPlayer(this.state.white, this.state.black, this.state.state)
    this.forceUpdate()
  }

  componentWillUnmount () {
    this.state.white.close()
    this.state.black.close()
  }
}

export default App
