import { useState } from 'react'
import PriceChange from '@/components/ui/PriceChange'
import TabChip from '@/components/ui/TabChip'
import WidgetCard from './WidgetCard'
import useMarketRanking from '@/features/market/useMarketRanking'

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

  function handleTabChange(tab) {
    setActiveTab(tab)
    localStorage.setItem('rankingWidget.activeTab', tab)
  }
  const { stocks } = useMarketRanking(TAB_TO_SORT[activeTab], '')

  if (variant === 'ranking-lg') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-1.5 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">실시간 순위</span>
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
              className="flex items-center justify-between px-1 py-1 hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-bold w-4 text-center shrink-0 ${stock.rank === 1 ? 'text-primary' : 'text-foreground-disabled'}`}>
                  {stock.rank}
                </span>
                <span className="text-[10px] font-semibold text-foreground">{stock.name}</span>
              </div>
              <PriceChange value={stock.change} className="text-[10px]" />
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* ranking-wide (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">실시간 순위</span>
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
            className="flex items-center justify-between px-1.5 py-1.5 rounded-xl hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-bold w-3 text-center shrink-0 ${stock.rank === 1 ? 'text-primary' : 'text-foreground-disabled'}`}>
                {stock.rank}
              </span>
              <span className="text-[10px] font-semibold text-foreground">{stock.name}</span>
            </div>
            <PriceChange value={stock.change} className="text-[10px]" />
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
