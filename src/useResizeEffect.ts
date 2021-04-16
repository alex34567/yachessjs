import { useEffect, useState } from 'react'

type Action = () => void

const RESIZE_HANDLERS = new Map<Symbol, Action>()

function onResize () {
  for (const handler of RESIZE_HANDLERS.values()) {
    handler()
  }
}

window.addEventListener('resize', onResize)

export default function useResizeEffect (handler: Action) {
  const resizeKey = useState(() => Symbol('Resize Key'))[0]

  useEffect(() => {
    RESIZE_HANDLERS.set(resizeKey, handler)
  }, [handler])

  useEffect(() => {
    return () => {
      RESIZE_HANDLERS.delete(resizeKey)
    }
  }, [])
}
