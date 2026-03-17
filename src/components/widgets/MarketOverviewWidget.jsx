import WidgetCard from './WidgetCard'
import { MARKET_OVERVIEW } from '@/mocks/home'

export default function MarketOverviewWidget() {
  return (
    <WidgetCard>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
        <span className="text-[9px] text-foreground-disabled">{MARKET_OVERVIEW.time}</span>
      </div>
      <div className="flex-1 flex flex-col justify-between gap-1.5">
        <div className="flex gap-2 p-2 rounded-xl bg-primary-light border border-primary-dim">
          <div className="w-1 rounded-full bg-primary self-stretch shrink-0" />
          <p className="text-[10px] text-foreground-secondary leading-relaxed">{MARKET_OVERVIEW.headline}</p>
        </div>
        {MARKET_OVERVIEW.bullets.map((bullet) => (
          <div key={bullet} className="flex gap-2 items-start px-1">
            <div className="w-[4px] h-[4px] rounded-full bg-foreground-disabled mt-1 shrink-0" />
            <p className="text-[10px] text-foreground-disabled leading-relaxed">{bullet}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
