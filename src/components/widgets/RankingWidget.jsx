import { useState } from 'react'
import PriceChange from '@/components/ui/PriceChange'
import StockAvatar from '@/components/ui/StockAvatar'
import TabChip from '@/components/ui/TabChip'
import WidgetCard from './WidgetCard'
import { RANKING } from '@/mocks/home'

const TABS = ['거래대금', '급상승', '거래량', '🇺🇸 미국']

const RANKING_EXTENDED = [
  ...RANKING,
  { rank: 6,  name: '카카오',        label: 'K',   color: 'yellow',  price: '44,150',  change:  0.38, volume: '0.4조' },
  { rank: 7,  name: 'NAVER',         label: 'N',   color: 'green',   price: '210,000', change: -0.92, volume: '0.3조' },
  { rank: 8,  name: 'KB금융',        label: 'KB',  color: 'primary', price: '82,400',  change:  1.15, volume: '0.3조' },
  { rank: 9,  name: '셀트리온',      label: '셀트', color: 'teal',   price: '172,300', change:  2.40, volume: '0.2조' },
  { rank: 10, name: '기아',          label: '기',  color: 'warning', price: '128,000', change:  0.76, volume: '0.2조' },
]

export default function RankingWidget({ variant = 'ranking-wide', colSpan = 2, rowSpan = 1, onDelete }) {
  const [activeTab, setActiveTab] = useState('거래대금')
  const items = variant === 'ranking-lg' ? RANKING_EXTENDED : RANKING

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">실시간 순위</span>
        <div className="flex gap-0.5">
          {TABS.map((tab) => (
            <TabChip
              key={tab}
              isActive={activeTab === tab}
              onClick={(e) => { e.stopPropagation(); setActiveTab(tab) }}
            >
              {tab}
            </TabChip>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-0.5">
        {items.map((stock) => (
          <div
            key={stock.rank}
            className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-xl hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <span className={`text-[11px] font-bold w-4 text-center shrink-0 ${stock.rank === 1 ? 'text-primary' : 'text-foreground-disabled'}`}>
              {stock.rank}
            </span>
            <StockAvatar name={stock.label} color={stock.color} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-foreground leading-none truncate">{stock.name}</div>
              <div className="text-[9px] text-foreground-disabled mt-0.5">거래대금 {stock.volume}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-bold text-primary">{stock.price}</div>
              <PriceChange value={stock.change} className="text-[9px]" />
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
