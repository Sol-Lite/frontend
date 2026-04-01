import { useState, useRef, useLayoutEffect } from 'react'
import PriceChange from '@/components/ui/PriceChange'
import TabChip from '@/components/ui/TabChip'
import WidgetCard from './WidgetCard'
import useMarketRanking from '@/features/market/useMarketRanking'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import useUIStore from '@/store/useUIStore'

const TABS = ['거래대금', '급상승', '거래량']
const MARKET_TABS = [
  { key: 'kr', label: '국내' },
  { key: 'us', label: '해외' },
]

const TAB_TO_SORT = {
  '거래대금': 'volume_value',
  '급상승':   'rising',
  '거래량':   'volume',
}

export default function RankingWidget({ variant = 'ranking-wide', colSpan = 2, rowSpan = 1, onDelete }) {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('rankingWidget.activeTab') ?? '거래대금'
  )
  const [activeMarket, setActiveMarket] = useState(
    () => localStorage.getItem('rankingWidget.activeMarket') ?? 'kr'
  )
  const open     = useWidgetDetailStore((s) => s.open)

  const handleCardClick  = () => open({ widgetTypeId: 'ranking', config: { initialSortFilter: TAB_TO_SORT[activeTab], initialMarketFilter: activeMarket } })
  const handleStockClick = (e, stock) => {
    e.stopPropagation()
    open({ widgetTypeId: 'stock-chart', config: { stockCode: stock.stockCode, stockName: stock.name, marketType: stock.marketType ?? stock.market, exchangeCode: stock.exchangeCode } })
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    localStorage.setItem('rankingWidget.activeTab', tab)
  }

  function handleMarketChange(market) {
    setActiveMarket(market)
    localStorage.setItem('rankingWidget.activeMarket', market)
  }

  const { stocks } = useMarketRanking(TAB_TO_SORT[activeTab], activeMarket)
  const fontSize = useUIStore((s) => s.fontSize)

  const marketTabBar = (
    <div className="ml-auto pr-1 flex gap-1.5">
      {MARKET_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={(e) => { e.stopPropagation(); handleMarketChange(tab.key) }}
          className={
            activeMarket === tab.key
              ? 'px-2 py-0.5 text-widget-10 font-semibold rounded-md bg-primary text-white shadow-control'
              : 'px-2 py-0.5 text-widget-10 font-semibold rounded-md text-foreground-secondary bg-surface-muted/65 hover:bg-surface-muted hover:text-foreground transition-colors'
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  )

  // ── ranking-lg (2x2): 컨테이너 높이 실측 후 완전한 행만 표시 ──
  const lgListRef = useRef(null)
  const lgFirstRowRef = useRef(null)
  const [lgMax, setLgMax] = useState(undefined)

  // lgMax가 undefined일 때(= 컨테이너가 flex-1 자연 높이) 실측 후 설정
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

  if (variant === 'ranking-lg') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleCardClick}>
        <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">실시간 순위</span>
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <TabChip
                key={tab}
                isActive={activeTab === tab}
                onClick={(e) => { e.stopPropagation(); handleTabChange(tab) }}
              >
                {tab}
              </TabChip>
            ))}
          </div>
          {marketTabBar}
        </div>
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
              <div className="flex items-center gap-1.5">
                <span className={`text-widget-9 font-bold w-4 text-center shrink-0 ${stock.rank === 1 ? 'text-primary' : 'text-foreground-disabled'}`}>
                  {stock.rank}
                </span>
                <span className="text-widget-10 font-semibold text-foreground">{stock.name}</span>
              </div>
              <PriceChange value={stock.change} className="text-widget-10" />
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* ranking-wide (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleCardClick}>
      <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
        <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">실시간 순위</span>
        <div className="flex gap-0.5">
          {TABS.map((tab) => (
            <TabChip
              key={tab}
              isActive={activeTab === tab}
              onClick={(e) => { e.stopPropagation(); handleTabChange(tab) }}
            >
              {tab}
            </TabChip>
          ))}
        </div>
        {marketTabBar}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {stocks.map((stock) => (
          <div
            key={stock.id ?? stock.rank}
            className="flex items-center justify-between px-1.5 py-1 rounded-xl hover:bg-surface-subtle transition-colors cursor-pointer shrink-0"
            onClick={(e) => handleStockClick(e, stock)}
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-widget-9 font-bold w-3 text-center shrink-0 ${stock.rank === 1 ? 'text-primary' : 'text-foreground-disabled'}`}>
                {stock.rank}
              </span>
              <span className="text-widget-10 font-semibold text-foreground">{stock.name}</span>
            </div>
            <PriceChange value={stock.change} className="text-widget-10" />
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
