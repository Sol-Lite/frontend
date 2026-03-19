import WidgetCard from './WidgetCard'
import { MARKET_OVERVIEW } from '@/mocks/home'

const NEWS_LIST = [
  '美 CPI 예상치 하회… 나스닥 1% 상승',
  'SK하이닉스 목표가 상향 조정',
  '원/달러 환율 1,378원 하락 마감',
  '코스피 외국인 순매수 이틀 연속',
  '반도체 업황 긍정적… HBM 수요 증가',
]

export default function MarketOverviewWidget({ variant = 'market-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const news = variant === 'market-2x2' ? NEWS_LIST : NEWS_LIST.slice(0, 4)

  if (variant === 'market-wide' || variant === 'market-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
          <span className="text-[9px] text-foreground-disabled">{MARKET_OVERVIEW.time}</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          {news.map((item, i) => (
            <div key={i} className="flex items-start gap-2 px-1">
              <span className="text-[10px] font-semibold text-primary shrink-0 mt-px">{i + 1}</span>
              <p className="text-[10px] text-foreground-secondary leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* market-sm (default) */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
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
