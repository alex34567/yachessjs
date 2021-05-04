export function translateString (str: String) {
  switch (str) {
    case 'black_resign':
      return 'Black Resigns'
    case 'white_resign':
      return 'White Resigns'
    case 'checkmate':
      return 'Checkmate'
    case 'stalemate':
      return 'Stalemate'
    case 'threefold':
      return 'Draw to Three fold repetition'
    case 'fiftymove':
      return 'Draw to Fifty move rule'
    case 'draw_agree':
      return 'Draw by agreement'
    default:
      return str
  }
}
