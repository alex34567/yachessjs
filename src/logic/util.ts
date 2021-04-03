function convertFileLetter (letter: string) {
  const charCode = letter.toLowerCase().charCodeAt(0)
  return charCode - 'a'.charCodeAt(0)
}

function convertRankLetter (letter: string) {
  return Number(letter) - 1
}

class Pos {
  file: number;
  rank: number;

  constructor (file: number, rank: number) {
    this.file = file
    this.rank = rank

    if (!Number.isInteger(rank) || !Number.isInteger(file) || rank < 0 || rank > 7 || file < 0 || file > 7) {
      throw new Error('Invalid board pos')
    }
    // Object.freeze(this)
  }

  // Returns null on out of bounds
  add (file: number, rank: number) {
    const newFile = this.file + file
    const newRank = this.rank + rank
    if (newFile < 0 || newFile > 7 || newRank < 0 || newRank > 7) {
      return null
    }
    return new Pos(newFile, newRank)
  }

  addFile (file: number) {
    return this.add(file, 0)
  }

  addRank (rank: number) {
    return this.add(0, rank)
  }

  toRaw () {
    return this.rank * 8 + this.file
  }

  static fromRaw (raw: number): Pos {
    const rank = Math.floor(raw / 8)
    const file = raw % 8
    return new Pos(file, rank)
  }

  toString () {
    const fileLetter = String.fromCharCode(this.file + 'a'.charCodeAt(0))
    const rankLetter = String(this.rank + 1)
    return fileLetter + rankLetter
  }

  compare (other: Pos) {
    const fileCompare = this.file - other.file
    if (fileCompare !== 0) {
      return fileCompare
    }
    return this.rank - other.rank
  }
}

class PgnMoveLineGen {
  currMoveStr: string;
  totalMoveStr: string;

  constructor () {
    this.currMoveStr = ''
    this.totalMoveStr = ''
  }

  addToken (token: string) {
    if (this.currMoveStr === '') {
      this.currMoveStr = token
    } else {
      const tmpMoveStr = this.currMoveStr + ' ' + token
      if (tmpMoveStr.length > 80) {
        this.totalMoveStr += '\n' + this.currMoveStr
        this.currMoveStr = token
      } else {
        this.currMoveStr = tmpMoveStr
      }
    }
  }

  done () {
    return this.totalMoveStr + '\n' + this.currMoveStr
  }
}

export {
  convertFileLetter,
  convertRankLetter,
  Pos,
  PgnMoveLineGen
}
