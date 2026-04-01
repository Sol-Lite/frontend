import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/api/news'

const KR_INDICES = ['KOSPI', 'KOSDAQ']
const US_INDICES = ['NASDAQ', 'S&P500', 'DOW']
const US_KEYWORDS = ['뉴욕', '미국', '나스닥', 's&p', '다우', '월가', 'fomc']

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function inferStockIndex(item) {
  if (item.stockIndex) return item.stockIndex
  if (item.market === 'us' || item.nation === 'us' || item.country === 'us') return 'NASDAQ'
  if (item.market === 'kr' || item.nation === 'kr' || item.country === 'kr') return 'KOSPI'

  const haystack = [
    item.title,
    item.oneLineSummary,
    item.one_line_summary,
    ...asArray(item.market_event),
    ...asArray(item.sectors),
    ...asArray(item.stocks?.up),
    ...asArray(item.stocks?.down),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return US_KEYWORDS.some((keyword) => haystack.includes(keyword)) ? 'NASDAQ' : 'KOSPI'
}

function normalizeSummaryNews(item) {
  if (!item || typeof item !== 'object') return null

  const summary = item.oneLineSummary ?? item.one_line_summary ?? ''
  const marketEvents = asArray(item.market_event)
  const sectors = asArray(item.sectors)
  const upStocks = asArray(item.stocks?.up)
  const downStocks = asArray(item.stocks?.down)
  const contentParts = [
    ...marketEvents,
    sectors.length ? `섹터: ${sectors.join(', ')}` : '',
    upStocks.length ? `상승 종목: ${upStocks.join(', ')}` : '',
    downStocks.length ? `하락 종목: ${downStocks.join(', ')}` : '',
  ].filter(Boolean)

  return {
    ...item,
    newsId: item.newsId ?? item._id ?? item.id ?? null,
    title: item.title ?? summary ?? marketEvents[0] ?? '오늘의 시황',
    oneLineSummary: summary,
    publishedAt: item.publishedAt ?? item.date ?? '',
    contentPreview: item.contentPreview ?? marketEvents[0] ?? summary,
    content: item.content ?? contentParts.join('\n\n'),
    source: item.source ?? '시장 요약',
    stockIndex: inferStockIndex(item),
  }
}

function normalizeLatestNews(data) {
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (item && typeof item === 'object' && !Array.isArray(item) && !item.title && (item.one_line_summary || item.market_event)) {
          return normalizeSummaryNews(item)
        }
        return item
      })
      .filter(Boolean)
  }

  if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) return normalizeLatestNews(data.items)
    if (Array.isArray(data.news)) return normalizeLatestNews(data.news)
    const normalized = normalizeSummaryNews(data)
    return normalized ? [normalized] : []
  }

  return []
}

export default function useLatestNews(size = 10) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['news', 'latest', size],
    queryFn: () => newsApi.getLatestNews({ size }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const all = normalizeLatestNews(data)
  const kr  = all.filter((n) => !n.stockIndex || KR_INDICES.includes(n.stockIndex))
  const us  = all.filter((n) => US_INDICES.includes(n.stockIndex))

  return { news: all, krNews: kr, usNews: us, isLoading, error }
}
