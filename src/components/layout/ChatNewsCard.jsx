/**
 * 종목 뉴스 / 보유 종목 뉴스 전용 카드
 * - 백엔드 format_stock_news / format_holdings_news 마크다운 텍스트를 파싱해 렌더링
 */
import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/api/news'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'

// 줄에서 숫자 키캡 이모지(1️⃣ … 9️⃣)를 제거하고 타이틀을 추출
function parseNewsText(text) {
  const lines = text.split('\n')

  // 헤더: 📰 포함된 첫 줄
  const headerLine = lines.find(l => l.includes('📰')) ?? ''
  const header = headerLine.replace(/\*\*/g, '').replace('📰', '').trim()

  const items = []
  let cur = null

  for (const line of lines) {
    const t = line.trim()
    if (!t || /^━/.test(t) || t.includes('📰')) continue

    // 제목 줄: 숫자 키캡 이모지(\u20E3) 포함
    if (t.includes('\u20E3')) {
      if (cur) items.push(cur)
      const content = t.replace(/\*\*/g, '')
      const dateMatch = content.match(/\(([^)]+)\)\s*$/)
      const date = dateMatch ? dateMatch[1] : ''
      const title = content
        .replace(/\s*\([^)]+\)\s*$/, '')   // 날짜 제거
        .replace(/^\d\uFE0F?\u20E3\s*/, '') // 숫자 이모지 제거
        .trim()
      cur = { title, date, desc: '' }
      continue
    }

    // 보유 종목 뉴스의 종목명 헤더 (bold로 시작, • 없음)
    if (/^\*\*[^*]+\*\*/.test(t) && !t.startsWith('•') && !t.includes('💡')) {
      if (cur) items.push(cur)
      const content = t.replace(/\*\*/g, '')
      const dateMatch = content.match(/\(([^)]+)\)\s*$/)
      const date = dateMatch ? dateMatch[1] : ''
      const title = content.replace(/\s*\([^)]+\)\s*$/, '').trim()
      cur = { title, date, desc: '' }
      continue
    }

    // 뉴스 제목 줄 (• 로 시작)
    if (t.startsWith('•') && cur && !cur.desc) {
      cur.title = (cur.title ? cur.title + ' ' : '') + t.replace(/^•\s*/, '').trim()
      continue
    }

    // 설명 줄 (💡 로 시작)
    if (t.startsWith('💡') && cur) {
      cur.desc = t.replace(/^💡\s*/, '').trim()
      continue
    }
  }
  if (cur) items.push(cur)

  return { header, items }
}

export default function ChatNewsCard({ text, stockCode, stockName }) {
  const { header, items } = parseNewsText(text)
  const openDetail = useWidgetDetailStore((s) => s.open)

  // StockNewsDetail과 동일한 쿼리키 → 캐시 공유
  const { data: springNews = [] } = useQuery({
    queryKey: ['stock-news', stockCode, 20],
    queryFn: () => newsApi.getStockNews(stockCode, 20),
    enabled: !!stockCode,
    staleTime: 5 * 60 * 1000,
  })

  const openList = () => {
    if (!stockCode) return
    openDetail({ widgetTypeId: 'stock-news', config: { stockCode, stockName: stockName ?? '' } })
  }

  const handleItemClick = (title) => {
    if (!stockCode) return
    const matched = springNews.find((n) => n.title === title)
    openDetail({
      widgetTypeId: 'stock-news',
      config: { stockCode, stockName: stockName ?? '', newsId: matched?.newsId },
    })
  }

  const clickable = !!stockCode

  return (
    <div
      onClick={clickable ? openList : undefined}
      className={['bg-surface border border-stroke rounded-[16px] p-3 flex flex-col gap-0', clickable ? 'cursor-pointer' : ''].join(' ')}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-stroke">
        <span className="text-[14px]">📰</span>
        <span className="text-[12px] font-semibold text-foreground">{header}</span>
      </div>

      {/* 뉴스 아이템 */}
      {items.length === 0 ? (
        <p className="text-[11px] text-foreground-disabled py-2">뉴스가 없습니다.</p>
      ) : (
        items.map((item, idx) => (
          <div
            key={idx}
            onClick={clickable ? (e) => { e.stopPropagation(); handleItemClick(item.title) } : undefined}
            className={[
              'py-2.5 border-b border-stroke-subtle last:border-b-0 pl-2 border-l-2',
              clickable ? 'cursor-pointer border-l-transparent hover:border-l-primary transition-colors' : 'border-l-transparent',
            ].join(' ')}
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-medium text-foreground leading-snug line-clamp-2">
                {item.title}
              </p>
              {item.date && (
                <span className="text-[9px] text-foreground-disabled">{item.date}</span>
              )}
              {item.desc && (
                <p className="text-[10px] text-foreground-secondary leading-relaxed line-clamp-2 mt-0.5">
                  {item.desc}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
