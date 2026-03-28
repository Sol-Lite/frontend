import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import useLatestNews from '@/features/market/useLatestNews'
import { newsApi } from '@/api/news'
import { cn } from '@/lib/cn'

const TABS = [
  { key: 'kr', label: '한국' },
  { key: 'us', label: '미국' },
]

function HighlightedText({ text }) {
  const parts = text.split(/(상승|하락)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '상승') return <span key={i} className="text-up font-bold">{part}</span>
        if (part === '하락') return <span key={i} className="text-down font-bold">{part}</span>
        return part
      })}
    </>
  )
}

/* ── 기사 본문 뷰 ──────────────────────────────────────────── */
function ArticleView({ newsId, onBack }) {
  const { data, isLoading } = useQuery({
    queryKey: ['news', 'detail', newsId],
    queryFn: () => newsApi.getNewsDetail(newsId),
    staleTime: 10 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm text-foreground-disabled">불러오는 중...</span>
      </div>
    )
  }

  if (!data) return null

  const paragraphs = data.content
    ? data.content.split(/\n{1,}/).map((p) => p.trim()).filter(Boolean)
    : []

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* 헤더 */}
      <div className="shrink-0 px-10 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 pb-3 border-b border-stroke">
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-lg hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground-secondary" />
          </button>
          <span className="text-xs font-semibold text-foreground-disabled">오늘의 시황</span>
        </div>
      </div>

      {/* 본문 스크롤 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-10 py-7">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* 제목 */}
        <h2 className="text-[22px] font-bold text-foreground leading-tight tracking-tight">
          {data.title}
        </h2>

        {/* 출처 · 날짜 */}
        <div className="flex items-center gap-2 pb-5 border-b border-stroke">
          {data.source && (
            <span className="text-sm font-semibold text-primary">{data.source}</span>
          )}
          {data.source && data.publishedAt && (
            <span className="text-sm text-stroke">·</span>
          )}
          {data.publishedAt && (
            <span className="text-sm text-foreground-disabled">{data.publishedAt}</span>
          )}
        </div>

        {/* 한줄 요약 — 강조 */}
        {data.oneLineSummary && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-foreground-disabled uppercase tracking-widest">한 줄 요약</span>
            <div className="rounded-2xl px-5 py-4 [background:var(--background-summary-card)]">
              <p className="text-[17px] font-semibold text-foreground leading-relaxed">
                <HighlightedText text={data.oneLineSummary} />
              </p>
            </div>
          </div>
        )}

        {/* 주요 이벤트 */}
        {data.marketEvents?.length > 0 && (
          <div className="bg-surface-subtle rounded-2xl px-5 py-4 flex flex-col gap-3">
            <span className="text-xs font-bold text-foreground-disabled uppercase tracking-widest">
              주요 이벤트
            </span>
            <ul className="flex flex-col gap-2.5">
              {data.marketEvents.map((ev, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-foreground leading-relaxed">
                  <span className="text-primary font-bold mt-[2px] shrink-0">•</span>
                  {ev}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 본문 카드 */}
        {paragraphs.length > 0 && (
          <div className="bg-surface-subtle rounded-2xl px-5 py-5 mb-6">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={`text-[15px] text-foreground leading-[1.85]${i < paragraphs.length - 1 ? ' mb-5' : ''}`}
              >
                {p}
              </p>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

/* ── 목록 뷰 (분리하여 useLatestNews가 기사 뷰에서 호출되지 않게 함) ── */
function ListView({ initialTab, onSelectNews }) {
  const [tab, setTab] = useState(initialTab)
  const { krNews, usNews, isLoading } = useLatestNews(20)
  const items = tab === 'kr' ? krNews : usNews

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 px-10 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between pb-3 border-b border-stroke">
          <h2 className="text-[15px] font-bold text-foreground">오늘의 시황</h2>
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-2.5 py-0.5 text-[11px] font-semibold rounded-lg transition-colors',
                  tab === t.key
                    ? 'bg-primary text-white'
                    : 'text-foreground-disabled hover:text-foreground-secondary',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-10 py-2">
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <span className="text-xs text-foreground-disabled">불러오는 중...</span>
          </div>
        ) : !items.length ? (
          <div className="flex items-center justify-center h-20">
            <span className="text-xs text-foreground-disabled">뉴스가 없습니다.</span>
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.newsId}
              onClick={() => onSelectNews(item.newsId)}
              className="w-full text-left flex flex-col gap-2 py-5 border-b border-stroke last:border-b-0 hover:opacity-75 transition-opacity"
            >
              {/* 출처 · 날짜 */}
              <div className="flex items-center gap-1.5">
                {item.source && (
                  <span className="text-[12px] font-semibold text-foreground-tertiary">{item.source}</span>
                )}
                {item.source && item.publishedAt && (
                  <span className="text-[12px] text-stroke">·</span>
                )}
                {item.publishedAt && (
                  <span className="text-[12px] text-foreground-disabled">{item.publishedAt}</span>
                )}
              </div>

              {/* 제목 */}
              <p className="text-[15px] font-bold text-foreground leading-snug line-clamp-2">
                {item.title}
              </p>

              {/* 본문 미리보기 */}
              {item.contentPreview && (
                <p className="text-[13px] text-foreground-secondary leading-relaxed line-clamp-3">
                  {item.contentPreview}
                </p>
              )}
            </button>
          ))
        )}
      </div>
      </div>
    </div>
  )
}

/* ── 메인 ──────────────────────────────────────────────────── */
export default function MarketNewsDetail({ config = {} }) {
  const [selectedNewsId, setSelectedNewsId] = useState(config.newsId ?? null)

  if (selectedNewsId) {
    return <ArticleView newsId={selectedNewsId} onBack={() => setSelectedNewsId(null)} />
  }

  return <ListView initialTab={config.tab ?? 'kr'} onSelectNews={setSelectedNewsId} />
}
