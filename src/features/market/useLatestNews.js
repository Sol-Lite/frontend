import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { newsApi } from '@/api/news'

const KR_INDICES = ['KOSPI', 'KOSDAQ']
const US_INDICES = ['NASDAQ', 'S&P500', 'DOW']
const US_KEYWORDS = ['뉴욕', '미국', '나스닥', 's&p', '다우', '월가', 'fomc']
const DATE_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})/

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function getLocalDateKey(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function extractPublishedDateKey(value) {
  if (typeof value !== 'string') return ''

  const trimmed = value.trim()
  if (!trimmed) return ''

  const prefixMatch = trimmed.match(DATE_PREFIX_REGEX)
  if (prefixMatch) {
    return prefixMatch[1]
  }

  const parsed = Date.parse(trimmed.replace(' ', 'T'))
  if (Number.isNaN(parsed)) return ''

  return getLocalDateKey(new Date(parsed))
}

function getPublishedTimestamp(value) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Date.parse(trimmed.replace(' ', 'T'))
  if (!Number.isNaN(parsed)) {
    return parsed
  }

  const dateKey = extractPublishedDateKey(trimmed)
  if (!dateKey) return null

  const fallbackParsed = Date.parse(`${dateKey}T00:00:00`)
  return Number.isNaN(fallbackParsed) ? null : fallbackParsed
}

function sortLatestNews(items) {
  return items
    .map((item, index) => ({
      item,
      index,
      timestamp: getPublishedTimestamp(item?.publishedAt ?? item?.date ?? ''),
    }))
    .sort((left, right) => {
      if (left.timestamp != null && right.timestamp != null && left.timestamp !== right.timestamp) {
        return right.timestamp - left.timestamp
      }
      if (left.timestamp != null && right.timestamp == null) return -1
      if (left.timestamp == null && right.timestamp != null) return 1
      return left.index - right.index
    })
    .map(({ item }) => item)
}

function selectTodayNews(items, todayKey) {
  const todayItems = items.filter((item) => extractPublishedDateKey(item?.publishedAt ?? item?.date ?? '') === todayKey)
  return todayItems.length > 0 ? todayItems : items
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

  const { all, kr, us, krDisplay, usDisplay } = useMemo(() => {
    const normalized = sortLatestNews(normalizeLatestNews(data))
    const krNews = normalized.filter((n) => !n.stockIndex || KR_INDICES.includes(n.stockIndex))
    const usNews = normalized.filter((n) => US_INDICES.includes(n.stockIndex))
    const todayKey = getLocalDateKey(new Date())

    return {
      all: normalized,
      kr: krNews,
      us: usNews,
      krDisplay: selectTodayNews(krNews, todayKey),
      usDisplay: selectTodayNews(usNews, todayKey),
    }
  }, [data])

  return {
    news: all,
    krNews: kr,
    usNews: us,
    krDisplayNews: krDisplay,
    usDisplayNews: usDisplay,
    isLoading,
    error,
  }
}
