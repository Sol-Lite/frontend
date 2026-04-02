import { useState, useEffect } from 'react'

export const COMPACT_BREAKPOINT          = 640  // MIN_DESKTOP(1280px)의 50% — 레이아웃 전환 기준
export const NAV_COMPACT_BREAKPOINT      = 640  // NavTabs 드롭다운 전환 기준 (홈 외 페이지)
export const NAV_COMPACT_BREAKPOINT_HOME = 760  // NavTabs 드롭다운 전환 기준 (홈 — 위젯편집 버튼 공간 확보)

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

export function useIsNavCompact(isHome = false) {
  const width = useWindowWidth()
  const breakpoint = isHome ? NAV_COMPACT_BREAKPOINT_HOME : NAV_COMPACT_BREAKPOINT
  return width <= breakpoint
}
