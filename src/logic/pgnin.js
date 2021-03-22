'use strict'

const pieces = require('./pieces')
const state = require('./state')
const moveNotation = require('./move_notation')

const PGN_TOKEN_REGEX = /([[\].*()<>]|"(?:[^\\"]|\\"|\\\\)+"|$\d+|[A-Za-z0-9][A-Za-z0-9_+#=:\-!?/]*)|{.*?}|;.*$|^%.*|\s+/my
const TAGNAME_REGEX = /[a-zA-Z0-9_]+/

class PGNGame {
  constructor (tags, state) {
    this.tags = tags
    this.state = state
  }
}

function parsePgn (pgnStr) {
  const db = []
  const tokenStream = pgnStr.split(new RegExp(PGN_TOKEN_REGEX)).filter(x => x)
  let tokenIndex = 0

  while (tokenIndex < tokenStream.length) {
    const tags = []
    while (tokenStream[tokenIndex] === '[') {
      tokenIndex++
      const name = tokenStream[tokenIndex]
      tokenIndex++
      if (!TAGNAME_REGEX.test(name)) {
        throw new Error('PGN Parse Error')
      }
      const rawValue = tokenStream[tokenIndex]
      tokenIndex++
      if (rawValue[0] !== '"') {
        throw new Error('PGN never ending string')
      }
      const value = rawValue.substring(1, rawValue.length - 1)
      tags.push([name, value])
      if (tokenStream[tokenIndex] !== ']') {
        throw new Error('PGN Parse Error')
      }
      tokenIndex++
    }
    const setupIndex = tags.findIndex(x => x[0] === 'SetUp')
    const fenIndex = tags.findIndex(x => x[0] === 'FEN')
    let gameState = state.START_STATE
    if (setupIndex >= 0 && tags[setupIndex][1] === '1' && fenIndex >= 0) {
      gameState = state.stateFromFen(tags[fenIndex][1])
    }
    while (true) {
      tokenIndex++
      if (/^[0-9]+$/.test(tokenStream[tokenIndex - 1])) {
        if (String(gameState.moveCount()) !== tokenStream[tokenIndex - 1]) {
          throw new Error('Invalid game number enumeration')
        }
        continue
      }
      if (tokenStream[tokenIndex - 1][0] === '$') {
        continue
      }
      let done = false
      switch (tokenStream[tokenIndex - 1]) {
        case '(': {
          let depth = 1
          while (depth > 0) {
            if (tokenStream[tokenIndex] === '(') {
              depth++
            } else if (tokenStream[tokenIndex] === ')') {
              depth--
            }
            tokenIndex++
          }
          continue
        }
        case '.':
          continue
        case '1-0':
          if (gameState.currTurn !== pieces.BLACK) {
            throw new Error('Invalid result')
          }
          if (!gameState.isCheckmate()) {
            gameState = gameState.modify(x => { x.resign = true })
          }
          done = true
          break
        case '0-1':
          if (gameState.currTurn !== pieces.WHITE) {
            throw new Error('Invalid result')
          }
          if (!gameState.isCheckmate()) {
            gameState = gameState.modify(x => { x.resign = true })
          }
          done = true
          break
        case '1/2-1/2':
          if (!gameState.isDraw()) {
            gameState = gameState.modify(x => { x.agreeDraw = true })
          }
          done = true
          break
        case '*':
          done = true
          break
      }
      if (done) {
        break
      }
      const move = tokenStream[tokenIndex - 1]
      const parsedMove = moveNotation.MoveNotation.parseMove(gameState.currTurn, move)
      if (!parsedMove) {
        throw new Error('Move syntax error')
      }
      const possibleMoves = gameState.moves().filter(x => !x.invalid() && parsedMove.matches(x))
      if (possibleMoves.length === 0) {
        throw new Error('Invalid move tried to be played')
      }
      if (possibleMoves.length > 1) {
        throw new Error('Move ambiguity in PGN file')
      }
      gameState = possibleMoves[0].do()
    }
    db.push(new PGNGame(tags, gameState))
  }

  return db
}

Object.assign(module.exports, { parsePgn })
