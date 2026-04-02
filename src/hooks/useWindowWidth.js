import { useState, useEffect } from 'react'

export const COMPACT_BREAKPOINT = 768   // MIN_DESKTOP(1280px)의 약 60%

export default function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth)

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width
}

export function useIsCompact() {
  const width = useWindowWidth()
  return width <= COMPACT_BREAKPOINT
}
