import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import StockChartDetail from './detail/StockChartDetail'
import BalanceDetail from './detail/BalanceDetail'
import { cn } from '@/lib/cn'

const DETAIL_MAP = {
  'stock-chart': StockChartDetail,
  'balance':     BalanceDetail,
}

const DRAG_CLOSE_THRESHOLD = 80

export default function WidgetDetailModal() {
  const { openWidget, close } = useWidgetDetailStore()
  const [isClosing, setIsClosing] = useState(false)
  const localWidget  = useRef(null)
  const closeTimer   = useRef(null)
  const sheetRef     = useRef(null)
  const dragStartY   = useRef(null)
  const dragCurrentY = useRef(0)

  if (openWidget) localWidget.current = openWidget

  useEffect(() => {
    if (openWidget) {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current)
        closeTimer.current = null
      }
      setIsClosing(false)
    }
  }, [openWidget])

  const handleClose = () => {
    setIsClosing(true)
    closeTimer.current = setTimeout(() => {
      close()
      setIsClosing(false)
    }, 240)
  }

  // ── 드래그 (DOM 직접 조작 — 리렌더 없음) ─────────────────
  const handlePointerDown = (e) => {
    dragStartY.current   = e.clientY
    dragCurrentY.current = 0
    e.currentTarget.setPointerCapture(e.pointerId)
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }

  const handlePointerMove = (e) => {
    if (dragStartY.current === null) return
    const delta = Math.max(0, e.clientY - dragStartY.current)
    dragCurrentY.current = delta
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`
  }

  const handlePointerUp = () => {
    if (dragStartY.current === null) return
    dragStartY.current = null

    if (dragCurrentY.current >= DRAG_CLOSE_THRESHOLD) {
      handleClose()
    } else {
      // 스냅백
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 200ms ease'
        sheetRef.current.style.transform  = ''
      }
      dragCurrentY.current = 0
    }
  }

  if (!openWidget && !isClosing) return null

  const DetailComp = localWidget.current ? DETAIL_MAP[localWidget.current.widgetTypeId] : null
  if (!DetailComp) return null

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end pointer-events-none">
      {/* 배경 딤 */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-auto transition-opacity duration-[240ms]',
          isClosing ? 'opacity-0' : 'opacity-100 bg-black/10',
        )}
        onClick={handleClose}
      />

      {/* 시트 */}
      <div
        ref={sheetRef}
        className={cn(
          'relative bg-surface rounded-t-[20px] shadow-modal flex flex-col pointer-events-auto',
          isClosing ? 'animate-slide-down' : 'animate-slide-up',
        )}
        style={{ height: '99%' }}
      >
        {/* 드래그 핸들 + 닫기 버튼 */}
        <div
          className="flex items-center justify-between pt-2.5 pb-1.5 px-4 shrink-0 cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <div className="w-6" />
          <div className="w-9 h-1 rounded-full bg-stroke" />
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4 text-foreground-tertiary" />
          </button>
        </div>

        <DetailComp
          config={localWidget.current.config}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
