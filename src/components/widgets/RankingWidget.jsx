import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PriceChange from '@/components/ui/PriceChange'
import TabChip from '@/components/ui/TabChip'
import WidgetCard from './WidgetCard'
import useMarketRanking from '@/features/market/useMarketRanking'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'

const TABS = ['거래대금', '급상승', '거래량']

const TAB_TO_SORT = {
  '거래대금': 'volume_value',
  '급상승':   'rising',
  '거래량':   'volume',
}

export default function RankingWidget({ variant = 'ranking-wide', colSpan = 2, rowSpan = 1, onDelete }) {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('rankingWidget.activeTab') ?? '거래대금'
  )
  const open     = useWidgetDetailStore((s) => s.open)
  const navigate = useNavigate()

  const handleCardClick  = () => open({ widgetTypeId: 'ranking', config: { initialSortFilter: TAB_TO_SORT[activeTab] } })
  const handleStockClick = (e, stock) => {
    e.stopPropagation()
    navigate(`/invest/${stock.stockCode}`, { state: { stockName: stock.name, marketType: stock.marketType ?? stock.market } })
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    localStorage.setItem('rankingWidget.activeTab', tab)
  }
  const { stocks } = useMarketRanking(TAB_TO_SORT[activeTab], '')

  if (variant === 'ranking-lg') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleCardClick}>
        <div className="flex items-center justify-between mb-1.5 shrink-0">
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
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
          {stocks.map((stock) => (
            <div
              key={stock.id ?? stock.rank}
              className="flex items-center justify-between px-1 py-1 rounded-r-lg border-l-2 border-transparent hover:border-primary hover:bg-surface-subtle transition-colors cursor-pointer"
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
      <div className="flex items-center justify-between mb-1.5 shrink-0">
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
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
        {stocks.map((stock) => (
          <div
            key={stock.id ?? stock.rank}
            className="flex items-center justify-between px-1.5 py-1.5 rounded-r-xl border-l-2 border-transparent hover:border-primary hover:bg-surface-subtle transition-colors cursor-pointer"
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
