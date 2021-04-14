import { useEffect, useState } from 'react'
import './debug'

type Action = () => void

const RESIZE_HANDLERS = new Map<Symbol, Action>()

const anyWindow = window as any

anyWindow.YACHESS_DEBUG.RESIZE_HANDLERS = RESIZE_HANDLERS

function onResize () {
  for (const handler of RESIZE_HANDLERS.values()) {
    handler()
  }
}

window.addEventListener('resize', onResize)

export default function useResizeEffect (hander: Action) {
  const resizeKey = useState(() => Symbol('Resize Key'))[0]

  useEffect(() => {
    RESIZE_HANDLERS.set(resizeKey, hander)
  }, [hander])

  useEffect(() => {
    return () => {
      RESIZE_HANDLERS.delete(resizeKey)
    }
  }, [])
}
