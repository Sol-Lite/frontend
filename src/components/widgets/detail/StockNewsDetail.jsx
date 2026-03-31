import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import useStockNews from '@/features/market/useStockNews'
import { newsApi } from '@/api/news'

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
function ArticleView({ newsId, stockName, onBack }) {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-news', 'detail', newsId],
    queryFn: () => newsApi.getStockNewsDetail(newsId),
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
          <span className="text-xs font-semibold text-foreground-disabled">
            {stockName ?? '종목별 뉴스'}
          </span>
        </div>
      </div>

      {/* 본문 스크롤 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-10 py-5">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {/* 제목 */}
          <h2 className="text-[18px] font-bold text-foreground leading-tight tracking-tight">
            {data.title}
          </h2>

          {/* 출처 · 날짜 */}
          <div className="flex items-center gap-2 pb-4 border-b border-stroke">
            {data.source && (
              <span className="text-xs font-semibold text-primary">{data.source}</span>
            )}
            {data.source && data.publishedAt && <span className="text-xs text-stroke">·</span>}
            {data.publishedAt && (
              <span className="text-xs text-foreground-disabled">{data.publishedAt}</span>
            )}
            {data.market && (
              <span className="ml-auto text-[10px] font-semibold text-foreground-disabled bg-surface-muted px-2 py-0.5 rounded-md">
                {data.market}
              </span>
            )}
          </div>

          {/* 한줄 요약 */}
          {data.summary && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-foreground-disabled uppercase tracking-widest">한 줄 요약</span>
              <div className="rounded-xl px-4 py-3 [background:var(--background-summary-card)]">
                <p className="text-[14px] font-semibold text-foreground leading-relaxed">
                  <HighlightedText text={data.summary} />
                </p>
              </div>
            </div>
          )}

          {/* 썸네일 */}
          {data.thumbnailUrl && (
            <img
              src={data.thumbnailUrl}
              alt=""
              className="w-full h-80 object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          )}

          {/* 본문 카드 */}
          {paragraphs.length > 0 && (
            <div className="bg-surface-subtle rounded-xl px-4 py-4 mb-4">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={`text-[13px] text-foreground leading-[1.8]${i < paragraphs.length - 1 ? ' mb-4' : ''}`}
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

/* ── 목록 뷰 ──────────────────────────────────────────────── */
function ListView({ stockCode, stockName, onSelectNews }) {
  const { news, isLoading } = useStockNews(stockCode, 20)

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="shrink-0 px-10 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between pb-3 border-b border-stroke">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-bold text-foreground">{stockName ?? '종목별 뉴스'}</h2>
            {stockCode && (
              <span className="text-[11px] text-foreground-disabled">{stockCode}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-10 py-2">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-xs text-foreground-disabled">불러오는 중...</span>
            </div>
          ) : !news.length ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-xs text-foreground-disabled">뉴스가 없습니다.</span>
            </div>
          ) : (
            news.map((item) => (
              <button
                key={item.newsId}
                onClick={() => onSelectNews(item.newsId)}
                className="w-full text-left flex gap-4 py-5 border-b border-stroke last:border-b-0 hover:opacity-75 transition-opacity"
              >
                {/* 텍스트 */}
                <div className="flex-1 flex flex-col gap-2">
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
                  <p className="text-[15px] font-bold text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  {item.contentPreview && (
                    <p className="text-[13px] text-foreground-secondary leading-relaxed line-clamp-3">
                      {item.contentPreview}
                    </p>
                  )}
                </div>

                {/* 썸네일 */}
                {item.thumbnailUrl && (
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="w-20 h-20 object-cover rounded-xl shrink-0 self-start"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
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
export default function StockNewsDetail({ config = {} }) {
  const [selectedNewsId, setSelectedNewsId] = useState(config.newsId ?? null)

  if (selectedNewsId) {
    return (
      <ArticleView
        newsId={selectedNewsId}
        stockName={config.stockName}
        onBack={() => setSelectedNewsId(null)}
      />
    )
  }

  return (
    <ListView
      stockCode={config.stockCode}
      stockName={config.stockName}
      onSelectNews={setSelectedNewsId}
    />
  )
}
