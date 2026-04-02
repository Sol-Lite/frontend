import { useState, useRef, useLayoutEffect } from 'react'
import PriceChange from '@/components/ui/PriceChange'
import TabChip from '@/components/ui/TabChip'
import WidgetCard from './WidgetCard'
import useMarketRanking from '@/features/market/useMarketRanking'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import useUIStore from '@/store/useUIStore'

const TABS = ['거래대금', '급상승', '거래량']

const TAB_TO_SORT = {
  '거래대금': 'volume_value',
  '급상승': 'rising',
  '거래량': 'volume',
}

export default function RankingWidget({ variant = 'ranking-wide', colSpan = 2, rowSpan = 1, onDelete }) {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('rankingWidget.activeTab') ?? '거래대금'
  )
  const [activeMarket, setActiveMarket] = useState(
    () => localStorage.getItem('rankingWidget.activeMarket') ?? 'kr'
  )
  const [isCompactHeader, setIsCompactHeader] = useState(false)

  const open = useWidgetDetailStore((s) => s.open)
  const fontSize = useUIStore((s) => s.fontSize)

  const headerMeasureWrapRef = useRef(null)
  const headerMeasureRowRef = useRef(null)

  const lgListRef = useRef(null)
  const lgFirstRowRef = useRef(null)
  const [lgMax, setLgMax] = useState(undefined)

  const handleCardClick = () => {
    open({
      widgetTypeId: 'ranking',
      config: {
        initialSortFilter: TAB_TO_SORT[activeTab],
        initialMarketFilter: activeMarket,
      },
    })
  }

  const handleStockClick = (e, stock) => {
    e.stopPropagation()
    open({
      widgetTypeId: 'stock-chart',
      config: {
        stockCode: stock.stockCode,
        stockName: stock.name,
        marketType: stock.marketType ?? stock.market,
        exchangeCode: stock.exchangeCode,
      },
    })
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    localStorage.setItem('rankingWidget.activeTab', tab)
  }

  function handleMarketChange(market) {
    setActiveMarket(market)
    localStorage.setItem('rankingWidget.activeMarket', market)
  }

  function handleMarketToggle(e) {
    e.stopPropagation()
    const next = activeMarket === 'kr' ? 'us' : 'kr'
    handleMarketChange(next)
  }

  const { stocks } = useMarketRanking(TAB_TO_SORT[activeTab], activeMarket)

  // 기본은 탭 전체 노출, 실제로 한 줄이 깨질 때만 compact 헤더로 전환
  useLayoutEffect(() => {
    const wrapEl = headerMeasureWrapRef.current
    const rowEl = headerMeasureRowRef.current
    if (!wrapEl || !rowEl) return

    const updateCompact = () => {
      const available = wrapEl.clientWidth
      const required = rowEl.scrollWidth
      setIsCompactHeader(required > available + 1)
    }

    updateCompact()

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateCompact)
      ro.observe(wrapEl)
      ro.observe(rowEl)
      return () => ro.disconnect()
    }

    window.addEventListener('resize', updateCompact)
    return () => window.removeEventListener('resize', updateCompact)
  }, [variant, fontSize, activeTab, activeMarket])

  useLayoutEffect(() => {
    if (lgMax !== undefined) return
    const container = lgListRef.current
    const firstRow = lgFirstRowRef.current
    if (!container || !firstRow || !stocks.length) return

    const containerH = container.getBoundingClientRect().height
    const rowH = firstRow.getBoundingClientRect().height
    if (rowH <= 0 || containerH <= 0) return

    const gapPx = 2 // gap-0.5 = 0.125rem = 2px
    const n = Math.floor(containerH / (rowH + gapPx))
    setLgMax(`${Math.floor(n * (rowH + gapPx) - gapPx)}px`)
  }, [lgMax, stocks.length])

  const marketToggle = (
    <button
      type="button"
      onClick={handleMarketToggle}
      className="ml-auto px-2 py-0.5 text-widget-10 font-semibold rounded-md bg-primary text-white shadow-control whitespace-nowrap shrink-0"
    >
      {activeMarket === 'kr' ? '국내' : '해외'}
    </button>
  )

  const fullMarketTabs = (
    <div className="ml-auto flex gap-1 shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleMarketChange('kr')
        }}
        className={
          activeMarket === 'kr'
            ? 'px-2 py-0.5 text-widget-10 font-semibold rounded-md bg-primary text-white shadow-control whitespace-nowrap'
            : 'px-2 py-0.5 text-widget-10 font-semibold rounded-md text-foreground-secondary bg-surface-muted/65 hover:bg-surface-muted hover:text-foreground transition-colors whitespace-nowrap'
        }
      >
        국내
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleMarketChange('us')
        }}
        className={
          activeMarket === 'us'
            ? 'px-2 py-0.5 text-widget-10 font-semibold rounded-md bg-primary text-white shadow-control whitespace-nowrap'
            : 'px-2 py-0.5 text-widget-10 font-semibold rounded-md text-foreground-secondary bg-surface-muted/65 hover:bg-surface-muted hover:text-foreground transition-colors whitespace-nowrap'
        }
      >
        해외
      </button>
    </div>
  )

  const fullHeaderTabs = (
    <div className="flex gap-0.5 shrink-0 whitespace-nowrap">
      {TABS.map((tab) => (
        <TabChip
          key={tab}
          isActive={activeTab === tab}
          onClick={(e) => {
            e.stopPropagation()
            handleTabChange(tab)
          }}
        >
          <span className="whitespace-nowrap">{tab}</span>
        </TabChip>
      ))}
    </div>
  )

  const header = (
    <>
      <div className="relative mb-1.5 shrink-0" ref={headerMeasureWrapRef}>
        {/* 실측 전용: 항상 풀 탭 레이아웃의 필요 폭을 측정 */}
        <div className="absolute inset-0 h-0 overflow-hidden pointer-events-none opacity-0">
          <div ref={headerMeasureRowRef} className="inline-flex w-max items-center gap-1.5 whitespace-nowrap">
            <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase whitespace-nowrap">실시간 순위</span>
            {fullHeaderTabs}
            {fullMarketTabs}
          </div>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase whitespace-nowrap">실시간 순위</span>
          {fullHeaderTabs}
          {isCompactHeader ? marketToggle : fullMarketTabs}
        </div>
      </div>
    </>
  )

  if (variant === 'ranking-lg') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleCardClick}>
        {header}
        <div
          key={fontSize}
          ref={lgListRef}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5"
          style={{ maxHeight: lgMax }}
        >
          {stocks.map((stock, i) => (
            <div
              key={stock.id ?? stock.rank}
              ref={i === 0 ? lgFirstRowRef : undefined}
              className="flex items-center justify-between px-1 py-1 hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer shrink-0"
              onClick={(e) => handleStockClick(e, stock)}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`text-widget-9 font-bold w-4 text-center shrink-0 ${stock.rank === 1 ? 'text-primary' : 'text-foreground-disabled'}`}>
                  {stock.rank}
                </span>
                <span className="text-widget-10 font-semibold text-foreground truncate">{stock.name}</span>
              </div>
              <PriceChange value={stock.change} className="text-widget-10" />
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleCardClick}>
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {stocks.map((stock) => (
          <div
            key={stock.id ?? stock.rank}
            className="flex items-center justify-between px-1.5 py-1 rounded-xl hover:bg-surface-subtle transition-colors cursor-pointer shrink-0"
            onClick={(e) => handleStockClick(e, stock)}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`text-widget-9 font-bold w-3 text-center shrink-0 ${stock.rank === 1 ? 'text-primary' : 'text-foreground-disabled'}`}>
                {stock.rank}
              </span>
              <span className="text-widget-10 font-semibold text-foreground truncate">{stock.name}</span>
            </div>
            <PriceChange value={stock.change} className="text-widget-10" />
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
