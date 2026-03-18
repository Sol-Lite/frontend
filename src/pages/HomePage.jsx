import { useEffect, useRef } from 'react'
import { Pencil } from 'lucide-react'
import LiveDot from '@/components/ui/LiveDot'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import { cn } from '@/lib/cn'
import BalanceWidget from '@/components/widgets/BalanceWidget'
import IndexWidget from '@/components/widgets/IndexWidget'
import PortfolioWidget from '@/components/widgets/PortfolioWidget'
import StockChartWidget from '@/components/widgets/StockChartWidget'
import RankingWidget from '@/components/widgets/RankingWidget'
import WatchlistWidget from '@/components/widgets/WatchlistWidget'
import MarketOverviewWidget from '@/components/widgets/MarketOverviewWidget'
import ExchangeWidget from '@/components/widgets/ExchangeWidget'
import AddWidgetSlot from '@/components/widgets/AddWidgetSlot'
import { HOME_STOCKS } from '@/mocks/home'
import { GRID_COLS, GRID_ROWS, GRID_GAP, MIN_GRID_WIDTH, MIN_GRID_HEIGHT, MIN_CELL_WIDTH, MIN_CELL_HEIGHT } from '@/lib/gridConstants'

export default function HomePage() {
  const { isEditMode } = useEditModeStore()
  const { setCellSize } = useGridStore()
  const gridRef = useRef(null)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return

    // ResizeObserver 콜백은 비동기 → 초기값을 MIN으로 설정해 측정 전 공백 방지
    setCellSize(MIN_CELL_WIDTH, MIN_CELL_HEIGHT)

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const cellWidth = (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
      const cellHeight = (height - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS
      setCellSize(cellWidth, cellHeight)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [setCellSize])

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-2.5">
      {/* 서브바 */}
      <div className="flex items-center justify-between shrink-0 px-1 h-7">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-foreground">나의 대시보드</span>
          {isEditMode ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-light border border-primary-border">
              <Pencil className="w-2.5 h-2.5 text-primary" strokeWidth={2.5} />
              <span className="text-[10px] text-primary font-semibold">편집 중</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-stroke">
              <LiveDot size="sm" />
              <span className="text-[10px] text-foreground-disabled">실시간 반영</span>
            </div>
          )}
        </div>
        {isEditMode && (
          <div className="flex items-center gap-2">
            {/* 페이지 인디케이터 */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-1.5 rounded-full bg-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-stroke-input" />
              <div className="w-1.5 h-1.5 rounded-full bg-stroke-input" />
            </div>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stroke-input bg-surface text-foreground-tertiary text-[11px] font-medium hover:border-primary hover:text-primary hover:bg-primary-light transition-all duration-[150ms]">
              <svg className="w-[11px] h-[11px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              페이지 편집
            </button>
          </div>
        )}
      </div>

      {/* 스크롤 래퍼: 최솟값 이하로 줄어들면 스크롤 */}
      <div className={cn(
        'flex-1 min-h-0',
        isEditMode ? 'overflow-visible' : 'overflow-auto',
      )}>
        {/* 위젯 그리드: 4열 × 3행, 뷰포트 채움 / 최솟값 이하면 고정 */}
        <div
          ref={gridRef}
          className="grid grid-cols-4 grid-rows-3 gap-[10px] w-full h-full"
          style={{
            minWidth: `${MIN_GRID_WIDTH}px`,
            minHeight: `${MIN_GRID_HEIGHT}px`,
          }}
        >
          {/* Row 1 */}
          <BalanceWidget />
          <IndexWidget />
          <PortfolioWidget />

          {/* Row 2 */}
          <StockChartWidget stock={HOME_STOCKS[0]} />
          <RankingWidget />
          <WatchlistWidget />

          {/* Row 3 */}
          <MarketOverviewWidget />
          <ExchangeWidget />
          <StockChartWidget stock={HOME_STOCKS[1]} />
          {!isEditMode && <AddWidgetSlot />}
        </div>
      </div>
    </div>
  )
}
