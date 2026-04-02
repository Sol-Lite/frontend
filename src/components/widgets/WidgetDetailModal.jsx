import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, ChevronLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import useRightPanelStore from '@/store/useRightPanelStore'
import StockChartDetail from './detail/StockChartDetail'
import BalanceDetail from './detail/BalanceDetail'
import RankingDetail from './detail/RankingDetail'
import IndexDetail from './detail/IndexDetail'
import MarketNewsDetail from './detail/MarketNewsDetail'
import StockNewsDetail from './detail/StockNewsDetail'
import WatchlistDetail from './detail/WatchlistDetail'
import ExchangeDetail from './detail/ExchangeDetail'
import TradeHistoryDetail from './detail/TradeHistoryDetail'

const DETAIL_MAP = {
  'stock-chart':     StockChartDetail,
  'balance':         BalanceDetail,
  'ranking':         RankingDetail,
  'index':           IndexDetail,
  'market-overview': MarketNewsDetail,
  'stock-news':      StockNewsDetail,
  'watchlist':       WatchlistDetail,
  'exchange':        ExchangeDetail,
  'trade-history':   TradeHistoryDetail,
}

const CLOSE_DRAG_THRESHOLD = 120

export default function WidgetDetailModal() {
  const { pathname } = useLocation()
  const rightPanelMode = useRightPanelStore((s) => s.mode)
  const { openWidget, close, back, history } = useWidgetDetailStore()
  const canGoBack = history.length > 0

  // 닫힘 애니메이션 중에도 마지막 위젯 유지
  const [closingWidget, setClosingWidget] = useState(null)
  const [isShown, setIsShown] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartYRef = useRef(0)
  const pointerIdRef = useRef(null)
  const headerRef = useRef(null)
  const prevPathRef = useRef(pathname)
  const prevPanelModeRef = useRef(rightPanelMode)
  const visibleWidget = openWidget ?? closingWidget
  const isOpen = !!openWidget
  const DetailComp = useMemo(
    () => (visibleWidget ? DETAIL_MAP[visibleWidget.widgetTypeId] : null),
    [visibleWidget],
  )

  const handleClose = useCallback(() => {
    if (openWidget) {
      setClosingWidget(openWidget)
    }
    setIsShown(false)
    setDragOffset(0)
    setIsDragging(false)
    close()
  }, [close, openWidget])

  useEffect(() => {
    if (!openWidget) return
    const frameId = window.requestAnimationFrame(() => {
      setIsShown(true)
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [openWidget])

  useEffect(() => {
    const pathChanged = prevPathRef.current !== pathname
    const panelModeChanged = prevPanelModeRef.current !== rightPanelMode

    prevPathRef.current = pathname
    prevPanelModeRef.current = rightPanelMode

    if (!openWidget) return
    if (!pathChanged && !panelModeChanged) return

    const frameId = window.requestAnimationFrame(() => {
      handleClose()
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [handleClose, openWidget, pathname, rightPanelMode])

  function handleTransitionEnd() {
    if (!isShown) {
      setClosingWidget(null)
      setDragOffset(0)
      setIsDragging(false)
    }
  }

  function handleDragStart(event) {
    if (!isOpen) return
    if (event.target instanceof Element && event.target.closest('button')) return
    dragStartYRef.current = event.clientY
    pointerIdRef.current = event.pointerId
    setIsDragging(true)
    headerRef.current?.setPointerCapture?.(event.pointerId)
  }

  function handleDragMove(event) {
    if (!isDragging || pointerIdRef.current !== event.pointerId) return
    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current)
    setDragOffset(nextOffset)
  }

  function handleDragEnd(event) {
    if (pointerIdRef.current !== null && pointerIdRef.current !== event.pointerId) return
    if (dragOffset >= CLOSE_DRAG_THRESHOLD) {
      handleClose()
    } else {
      setDragOffset(0)
      setIsDragging(false)
    }
    if (pointerIdRef.current !== null) {
      headerRef.current?.releasePointerCapture?.(pointerIdRef.current)
    }
    pointerIdRef.current = null
  }

  if (!visibleWidget || !DetailComp) return null

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <button
        type="button"
        aria-label="상세 모달 닫기"
        onClick={handleClose}
        className={[
          'absolute inset-0 bg-black/10 transition-opacity duration-200 pointer-events-auto',
          isShown ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />

      <div
        onTransitionEnd={handleTransitionEnd}
        className={[
          'absolute inset-x-0 bottom-0 h-[99%] bg-surface rounded-t-[20px] shadow-modal flex flex-col outline-none pointer-events-auto',
          'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          isDragging ? '' : 'will-change-transform',
        ].join(' ')}
        style={{
          transform: isShown
            ? `translateY(${dragOffset}px)`
            : `translateY(calc(100% + ${dragOffset}px))`,
        }}
      >
        <div
          ref={headerRef}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          className="relative flex items-center justify-between pt-2.5 pb-1.5 px-4 shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          <div
            className="absolute left-1/2 top-1.5 -translate-x-1/2 touch-none pointer-events-none"
          >
            <div className="w-9 h-4 flex items-center justify-center">
              <div className="w-9 h-1 rounded-full bg-stroke" />
            </div>
          </div>

          {canGoBack ? (
            <button
              onClick={back}
              className="p-1 rounded-lg hover:bg-surface-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground-tertiary" />
            </button>
          ) : (
            <div className="w-6" />
          )}
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4 text-foreground-tertiary" />
          </button>
        </div>

        <DetailComp
          config={visibleWidget.config}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
