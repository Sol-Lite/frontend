import { useState, useEffect } from 'react'

export const COMPACT_BREAKPOINT     = 640  // MIN_DESKTOP(1280px)의 50% — 레이아웃 전환 기준
export const NAV_COMPACT_BREAKPOINT = 640  // NavTabs 드롭다운 전환 기준

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

export function useIsNavCompact() {
  const width = useWindowWidth()
  return width <= NAV_COMPACT_BREAKPOINT
}
