import WidgetCard from './WidgetCard'
import { MARKET_OVERVIEW } from '@/mocks/home'

export default function MarketOverviewWidget({ variant = 'market-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { news } = MARKET_OVERVIEW

  if (variant === 'market-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {news.slice(0, 3).map((item, i) => (
            <div
              key={i}
              className={`px-2.5 py-2 rounded-xl border-l-[3px] ${
                i === 0
                  ? 'bg-primary-light border-primary'
                  : 'bg-surface-subtle border-stroke'
              }`}
            >
              <p className="text-widget-11 font-bold text-foreground leading-snug">{item.title}</p>
              <p className="text-widget-9 text-foreground-disabled leading-relaxed mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'market-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
        </div>
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
          {news.slice(0, 2).map((item, i) => (
            <div
              key={i}
              className={`flex-1 px-2 py-1.5 rounded-lg border-l-[3px] ${
                i === 0
                  ? 'bg-primary-light border-primary'
                  : 'bg-surface-subtle border-stroke'
              }`}
            >
              <p className="text-widget-10 font-bold text-foreground leading-snug">{item.title}</p>
              <p className="text-widget-9 text-foreground-disabled leading-relaxed mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* market-sm (default) — 헤드라인 3줄 */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
        {news.slice(0, 3).map((item, i) => (
          <p
            key={i}
            className={`text-widget-10 leading-snug truncate ${
              i === 0 ? 'font-bold text-foreground' : 'text-foreground-disabled'
            }`}
          >
            {item.title}
          </p>
        ))}
      </div>
    </WidgetCard>
  )
}
