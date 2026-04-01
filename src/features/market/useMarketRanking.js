import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { foreignMarketApi, marketApi } from '@/api/market'
import { subscribeTopic } from '@/lib/stomp'

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
]

function pickColor(code) {
  const sum = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function formatMoney(won) {
  const n = Number(won)
  if (!n) return null
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}조원`
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`
  if (n >= 10_000) return `${Math.floor(n / 10_000).toLocaleString('ko-KR')}만원`
  return `${n.toLocaleString('ko-KR')}원`
}

function formatUSD(value) {
  const n = Number(value)
  if (!n) return null
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString('en-US')}`
}

function formatVolume(shares) {
  const n = Number(shares)
  if (!n) return null
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억주`
  if (n >= 100_000) return `${Math.floor(n / 10_000)}만주`
  return `${n.toLocaleString('ko-KR')}주`
}

function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
}

// 프론트 sortFilter key → 백엔드 type 파라미터
const TYPE_MAP = {
  volume_value: 'trading-value',
  volume:       'trading-volume',
  rising:       'rising',
  falling:      'falling',
  market_cap:   'market-cap',
}

function normalizeItem(item, sortFilter) {
  const buyRatio = item.buyRatio != null ? item.buyRatio : null
  const sellRatio = buyRatio != null ? 100 - buyRatio : null

  const metricValue = sortFilter === 'volume'
    ? formatVolume(item.volume)
    : sortFilter === 'volume_value'
      ? formatMoney(item.tradingValue)
      : sortFilter === 'market_cap'
        ? item.marketCap != null ? formatMoney(item.marketCap * 100_000_000) : null
        : null

  const secondaryMetric = sortFilter === 'volume_value'
    ? {
        label: '전일 거래대금',
        value: item.prevTradingValue != null ? formatMoney(item.prevTradingValue) : '—',
      }
    : sortFilter === 'volume'
      ? {
          label: '전일 거래량',
          value: item.prevVolume != null ? formatVolume(item.prevVolume) : '—',
        }
      : sortFilter === 'market_cap'
        ? {
            label: '시장점유율',
            value: item.marketShareRate != null ? formatPercent(item.marketShareRate) : '—',
          }
        : {
            label: '거래 비율',
            value: buyRatio != null ? null : '—',
            buyRatio,
            sellRatio,
          }

  return {
    id: item.stockCode,
    rank: item.rank,
    name: item.name,
    stockNameEn: item.stockNameEn ?? null,
    label: item.name.slice(0, 2),
    color: pickColor(item.stockCode),
    price: `${Number(item.price).toLocaleString('ko-KR')}원`,
    change: item.changeRate,
    metricValue,
    secondaryMetric,
    consecutiveDays: item.consecutiveDays ?? null,
    buyRatio,
    sellRatio,
    stockCode: item.stockCode,
    market: item.market ?? item.marketType ?? null,
    exchangeCode: item.exchangeCode ?? null,
  }
}

const EXCHANGE_TO_MARKET_TYPE = { NAS: 'NASDAQ', NYS: 'NYSE', AMS: 'AMEX' }

function normalizeForeignItem(item, sortFilter) {
  const marketType = EXCHANGE_TO_MARKET_TYPE[item.exchangeCode] ?? 'NASDAQ'
  const metricValue = sortFilter === 'volume'
    ? formatVolume(item.volume)
    : sortFilter === 'volume_value'
      ? formatUSD(item.tradingValue)
      : sortFilter === 'market_cap'
        ? formatUSD(item.marketCap)
        : null

  const secondaryMetric = sortFilter === 'volume_value'
    ? { label: '평균 거래대금', value: item.avgTradingValue != null ? formatUSD(item.avgTradingValue) : '—' }
    : sortFilter === 'volume'
      ? { label: '평균 거래량', value: item.avgVolume != null ? formatVolume(item.avgVolume) : '—' }
      : sortFilter === 'market_cap'
        ? { label: '시장비중', value: item.marketShareRate != null ? formatPercent(item.marketShareRate) : '—' }
        : null  // rising/falling: 칼럼 자체 제거

  const priceFormatted = `$${Number(item.price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

  return {
    id: item.stockCode,
    rank: item.rank,
    name: item.name,
    stockNameEn: item.nameEn ?? null,
    label: (item.nameEn ?? item.name ?? '').slice(0, 2),
    color: pickColor(item.stockCode),
    price: priceFormatted,
    change: item.changeRate,
    metricValue,
    secondaryMetric,
    consecutiveDays: null,
    buyRatio: null,
    sellRatio: null,
    stockCode: item.stockCode,
    market: marketType,       // 'NASDAQ' / 'NYSE' → StockAvatar 로고 경로용
    exchangeCode: item.exchangeCode,  // NAS / NYS → StockRow navigate state로 전달
  }
}

export default function useMarketRanking(sortFilter, marketFilter) {
  const isForeign = marketFilter === 'us'
  const [livePrices, setLivePrices] = useState({})
  const subscriptionsRef = useRef(new Map())

  const { data, isLoading, error } = useQuery({
    queryKey: isForeign
      ? ['market', 'foreign-ranking', sortFilter]
      : ['market', 'ranking', sortFilter, marketFilter],
    queryFn: isForeign
      ? () => foreignMarketApi.getForeignRanking({ type: TYPE_MAP[sortFilter] ?? 'trading-value', exchange: 'NAS' })
      : () => marketApi.getRanking({ type: TYPE_MAP[sortFilter] ?? 'trading-value', market: marketFilter }),
    refetchInterval: isForeign ? 60 * 1000 : 30 * 1000,
    staleTime: 0,
  })

  // 국내 전용 - 실시간 WebSocket 구독
  useEffect(() => {
    if (isForeign) return

    const nextCodes = new Set((data ?? []).map((item) => item.stockCode).filter(Boolean))
    const subscriptions = subscriptionsRef.current

    subscriptions.forEach((subscription, code) => {
      if (nextCodes.has(code)) return
      subscription.unsubscribe()
      subscriptions.delete(code)
    })

    nextCodes.forEach((code) => {
      if (subscriptions.has(code)) return
      const subscription = subscribeTopic(`/topic/stock/trade/${code}`, (msg) => {
        const body = JSON.parse(msg.body)
        setLivePrices((prev) => ({
          ...prev,
          [code]: {
            price: `${Number(body.price).toLocaleString('ko-KR')}원`,
            change: Number(body.drate),
          },
        }))
      })
      subscriptions.set(code, subscription)
    })
  }, [data, isForeign])

  useEffect(() => {
    const subscriptions = subscriptionsRef.current
    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe())
      subscriptions.clear()
    }
  }, [])

  const stocks = useMemo(
    () =>
      (data ?? []).map((item) => {
        if (isForeign) return normalizeForeignItem(item, sortFilter)
        const base = normalizeItem(item, sortFilter)
        const live = livePrices[item.stockCode]
        return live ? { ...base, price: live.price, change: live.change } : base
      }),
    [data, livePrices, sortFilter, isForeign],
  )

  return { stocks, isLoading, errorMessage: error?.message ?? '' }
}
