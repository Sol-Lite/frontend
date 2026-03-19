import { useState } from 'react'
import PriceChange from '@/components/ui/PriceChange'
import TabChip from '@/components/ui/TabChip'
import WidgetCard from './WidgetCard'
import { HOME_INDICES } from '@/mocks/home'
import { cn } from '@/lib/cn'

const TABS = ['국내', '미국', '아시아']
const BARS = [50, 55, 48, 60, 52, 58, 54, 62]

export default function IndexWidget({ variant = 'index-wide', colSpan = 2, rowSpan = 1, onDelete }) {
  const [activeTab, setActiveTab] = useState('국내')

  if (variant === 'index-sm') {
    const kospi = HOME_INDICES[0]
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">주요 지수</span>
        <div className="flex-1 min-h-0 bg-background rounded-xl flex items-end px-1.5 pb-1.5 pt-2 gap-px my-1">
          {BARS.map((h, i) => (
            <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="shrink-0">
          <div className="text-[9px] text-foreground-disabled">{kospi.label}</div>
          <div className="text-[16px] font-bold text-foreground leading-tight">{kospi.value}</div>
          <PriceChange value={kospi.change} className="text-[10px]" />
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'index-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">주요 지수</span>
        </div>
        <div className="flex flex-col flex-1 gap-3">
          {HOME_INDICES.slice(0, 3).map((idx) => (
            <div key={idx.key} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-foreground-disabled">{idx.label}</div>
                <div className="text-[15px] font-bold text-foreground leading-tight">{idx.value}</div>
                <PriceChange value={idx.change} className="text-[10px]" />
              </div>
              <div className="flex items-end gap-px h-8 shrink-0">
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className={cn('w-1.5 rounded-sm', idx.change > 0 ? 'bg-up/50' : 'bg-down/50')}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* index-wide (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
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
