import { useState } from 'react'
import PriceChange from '@/components/ui/PriceChange'
import TabChip from '@/components/ui/TabChip'
import WidgetCard from './WidgetCard'
import { HOME_INDICES } from '@/mocks/home'
import { cn } from '@/lib/cn'

const TABS = ['국내', '미국', '아시아']

export default function IndexWidget() {
  const [activeTab, setActiveTab] = useState('국내')

  return (
    <WidgetCard colSpan={2}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">주요 지수</span>
        <div className="flex gap-1">
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
      <div className="flex-1 grid grid-cols-5 gap-1 items-center">
        {HOME_INDICES.map((idx) => (
          <div
            key={idx.key}
            className={cn(
              'text-center py-2 rounded-xl border',
              idx.change > 0 ? 'bg-up-bg border-up-border' : 'bg-down-bg border-down-border',
            )}
          >
            <div className="text-[9px] text-foreground-disabled mb-0.5">{idx.label}</div>
            <div className="text-[13px] font-bold text-foreground">{idx.value}</div>
            <PriceChange value={idx.change} className="text-[10px]" />
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
