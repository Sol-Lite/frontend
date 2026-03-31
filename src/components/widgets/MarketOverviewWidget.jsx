import { useState } from 'react'
import WidgetCard from './WidgetCard'
import useLatestNews from '@/features/market/useLatestNews'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import { cn } from '@/lib/cn'

const TABS = [
  { key: 'kr', label: '국내' },
  { key: 'us', label: '해외' },
]

function NewsCard({ item, showSummary = false, onClickNews }) {
  return (
    <div
      className="group flex flex-col gap-0.5 py-2 border-b border-stroke last:border-b-0 cursor-pointer pl-2 border-l-2 border-l-transparent hover:border-l-primary transition-colors"
      onClick={(e) => { e.stopPropagation(); onClickNews(item.newsId) }}
    >
      <p className="text-widget-11 font-semibold text-foreground leading-snug line-clamp-2">
        {item.title}
      </p>
      {showSummary && item.oneLineSummary && (
        <p className="text-[9.5px] text-foreground-secondary leading-relaxed line-clamp-2">
          {item.oneLineSummary}
        </p>
      )}
      <div className="flex items-center gap-1.5 mt-0.5">
        {item.source && (
          <span className="text-widget-9 text-foreground-disabled">{item.source}</span>
        )}
        {item.publishedAt && (
          <>
            {item.source && <span className="text-widget-9 text-stroke">·</span>}
            <span className="text-widget-9 text-foreground-disabled">{item.publishedAt}</span>
          </>
        )}
      </div>
    </div>
  )
}

function NewsListCompact({ items, onClickNews }) {
  return items.map((item, i) => (
    <div
      key={item.newsId ?? i}
      className="flex items-start gap-1.5 py-1 border-b border-stroke last:border-b-0 cursor-pointer pl-2 border-l-2 border-l-transparent hover:border-l-primary transition-colors"
      onClick={(e) => { e.stopPropagation(); onClickNews(item.newsId) }}
    >
      <span className="text-widget-9 font-bold text-primary mt-[1px] shrink-0">{i + 1}</span>
      <p className="text-widget-10 text-foreground leading-snug line-clamp-2">{item.title}</p>
    </div>
  ))
}

export default function MarketOverviewWidget({ variant = 'market-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const [tab, setTab] = useState('kr')
  const { krNews, usNews, isLoading } = useLatestNews(10)
  const items = tab === 'kr' ? krNews : usNews
  const openDetail = useWidgetDetailStore((s) => s.open)

  function handleWidgetClick() {
    openDetail({ widgetTypeId: 'market-overview', config: { tab } })
  }

  function handleNewsClick(newsId) {
    openDetail({ widgetTypeId: 'market-overview', config: { tab, newsId } })
  }

  const tabBar = (
    <div className="flex gap-1">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={(e) => { e.stopPropagation(); setTab(t.key) }}
          className={cn(
            'px-1.5 py-px font-semibold rounded transition-colors',
            tab === t.key
              ? 'bg-primary text-white'
              : 'text-foreground-disabled hover:text-foreground-secondary',
          )}
          style={{ fontSize: 'var(--text-widget-9)' }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )

  const empty = <div className="text-widget-10 text-foreground-disabled py-2">뉴스가 없습니다.</div>
  const loading = <div className="text-widget-10 text-foreground-disabled py-2">불러오는 중...</div>

  if (variant === 'market-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
          {tabBar}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? loading : !items.length ? empty : items.slice(0, 4).map((item, i) => (
            <NewsCard key={item.newsId ?? i} item={item} showSummary onClickNews={handleNewsClick} />
          ))}
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'market-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
          {tabBar}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? loading : !items.length ? empty : items.slice(0, 2).map((item, i) => (
            <NewsCard key={item.newsId ?? i} item={item} showSummary onClickNews={handleNewsClick} />
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* market-sm */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
      <div className="flex items-center justify-between mb-1 shrink-0">
        <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
        {tabBar}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? loading : !items.length ? empty : <NewsListCompact items={items} onClickNews={handleNewsClick} />}
      </div>
    </WidgetCard>
  )
}
