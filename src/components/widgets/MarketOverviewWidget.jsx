import { useState } from 'react'
import WidgetCard from './WidgetCard'
import useLatestNews from '@/features/market/useLatestNews'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import useWidgetStore from '@/store/useWidgetStore'
import { cn } from '@/lib/cn'

const STORAGE_KEY_ACTIVE_TAB = 'marketOverviewWidget.activeTab'
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

function NewsSingleCompact({ item, onClickNews }) {
  return (
    <div
      className="flex items-start py-1.5 border-b border-stroke last:border-b-0 cursor-pointer pl-2 border-l-2 border-l-transparent hover:border-l-primary transition-colors"
      onClick={(e) => { e.stopPropagation(); onClickNews(item.newsId) }}
    >
      <p className="text-widget-10 text-foreground leading-snug line-clamp-6">{item.title}</p>
    </div>
  )
}

export default function MarketOverviewWidget({ instanceId, variant = 'market-sm', colSpan = 1, rowSpan = 1, config = {}, onDelete }) {
  const [tab, setTab] = useState(
    () => localStorage.getItem(STORAGE_KEY_ACTIVE_TAB) ?? config.tab ?? 'kr'
  )
  const { krDisplayNews, usDisplayNews, isLoading } = useLatestNews(10)
  const items = tab === 'kr' ? krDisplayNews : usDisplayNews
  const openDetail = useWidgetDetailStore((s) => s.open)
  const updateWidgetConfig = useWidgetStore((s) => s.updateWidgetConfig)

  function handleTabChange(nextTab) {
    setTab(nextTab)
    localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, nextTab)
    if (instanceId) updateWidgetConfig(instanceId, { tab: nextTab })
  }

  function handleWidgetClick() {
    openDetail({ widgetTypeId: 'market-overview', config: { tab } })
  }

  function handleNewsClick(newsId, nextTab = tab) {
    openDetail({ widgetTypeId: 'market-overview', config: { tab: nextTab, newsId } })
  }

  const tabBar = (
    <div className="flex gap-1">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={(e) => { e.stopPropagation(); handleTabChange(t.key) }}
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

  const empty = <div className="text-widget-10 text-foreground-disabled py-2 opacity-50 group-hover:opacity-75 transition-opacity">뉴스가 없습니다.</div>
  const loading = <div className="text-widget-10 text-foreground-disabled py-2 opacity-50 group-hover:opacity-75 transition-opacity">불러오는 중...</div>

  if (variant === 'market-2x2') {
    const krTop = krDisplayNews[0] ?? null
    const usTop = usDisplayNews[0] ?? null
    const sectionTitleClass = 'text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase'
    const sectionCardClass = 'flex flex-col gap-0.5 py-2 border-b border-stroke last:border-b-0 cursor-pointer pl-2 border-l-2 border-l-transparent hover:border-l-primary transition-colors'
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
        <div className="flex items-center gap-1.5 mb-1 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
          <section>
            <h4 className={sectionTitleClass}>국내 시황</h4>
            <div className="mt-0.5">
              {isLoading ? loading : !krTop ? empty : (
                <div className={sectionCardClass} onClick={(e) => { e.stopPropagation(); handleNewsClick(krTop.newsId, 'kr') }}>
                  <p className="text-widget-11 font-semibold text-foreground leading-snug line-clamp-2">{krTop.title}</p>
                  {krTop.oneLineSummary && <p className="text-[9.5px] text-foreground-secondary leading-relaxed line-clamp-2">{krTop.oneLineSummary}</p>}
                </div>
              )}
            </div>
          </section>
          <section>
            <h4 className={sectionTitleClass}>해외 시황</h4>
            <div className="mt-0.5">
              {isLoading ? loading : !usTop ? empty : (
                <div className={sectionCardClass} onClick={(e) => { e.stopPropagation(); handleNewsClick(usTop.newsId, 'us') }}>
                  <p className="text-widget-11 font-semibold text-foreground leading-snug line-clamp-2">{usTop.title}</p>
                  {usTop.oneLineSummary && <p className="text-[9.5px] text-foreground-secondary leading-relaxed line-clamp-2">{usTop.oneLineSummary}</p>}
                </div>
              )}
            </div>
          </section>
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'market-wide') {
    const wideItems = items.slice(0, 2)
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
        <div className="flex items-center gap-1.5 mb-1 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
          {tabBar}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? loading : !wideItems.length ? empty : wideItems.map((item, i) => (
            <NewsCard key={item.newsId ?? i} item={item} showSummary onClickNews={handleNewsClick} />
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* market-sm */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
      <div className="flex items-center gap-1.5 mb-1 shrink-0">
        <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">오늘의 시황</span>
        {tabBar}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? loading : !items.length ? empty : <NewsSingleCompact item={items[0]} onClickNews={handleNewsClick} />}
      </div>
    </WidgetCard>
  )
}
