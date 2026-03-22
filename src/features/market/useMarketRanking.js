import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { marketApi } from '@/api/market'
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

function formatVolume(shares) {
  const n = Number(shares)
  if (!n) return null
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억주`
  if (n >= 100_000) return `${Math.floor(n / 10_000)}만주`
  return `${n.toLocaleString('ko-KR')}주`
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

  let volume = null
  if (sortFilter === 'volume') {
    volume = formatVolume(item.volume)
  } else if (sortFilter === 'volume_value') {
    volume = formatMoney(item.tradingValue)
  } else if (sortFilter === 'market_cap') {
    // marketCap은 억원 단위로 내려옴
    volume = item.marketCap != null ? formatMoney(item.marketCap * 100_000_000) : null
  }

  return {
    id: item.stockCode,
    rank: item.rank,
    name: item.name,
    label: item.name.slice(0, 2),
    color: pickColor(item.stockCode),
    price: `${Number(item.price).toLocaleString('ko-KR')}원`,
    change: item.changeRate,
    volume,
    consecutiveDays: item.consecutiveDays ?? null,
    buyRatio,
    sellRatio,
    stockCode: item.stockCode,
  }
}

export default function useMarketRanking(sortFilter, marketFilter) {
  const [livePrices, setLivePrices] = useState({})

  const { data, isLoading, error } = useQuery({
    queryKey: ['market', 'ranking', sortFilter, marketFilter],
    queryFn: () => marketApi.getRanking({ type: TYPE_MAP[sortFilter] ?? 'trading-value', market: marketFilter }),
    refetchInterval: 30 * 1000,
    staleTime: 0,
  })

  const stockCodes = useMemo(
    () => (data ?? []).map((item) => item.stockCode).filter(Boolean).join(','),
    [data],
  )

  useEffect(() => {
    if (!stockCodes) return

    const codes = stockCodes.split(',')
    const subscriptions = codes.map((code) =>
      subscribeTopic(`/topic/stock/trade/${code}`, (msg) => {
        const body = JSON.parse(msg.body)
        setLivePrices((prev) => ({
          ...prev,
          [code]: {
            price: `${Number(body.price).toLocaleString('ko-KR')}원`,
            change: Number(body.drate),
          },
        }))
      }),
    )

    return () => subscriptions.forEach((s) => s.unsubscribe())
  }, [stockCodes])

  const stocks = useMemo(
    () =>
      (data ?? []).map((item) => {
        const base = normalizeItem(item, sortFilter)
        const live = livePrices[item.stockCode]
        return live ? { ...base, price: live.price, change: live.change } : base
      }),
    [data, livePrices, sortFilter],
  )

  return { stocks, isLoading, errorMessage: error?.message ?? '' }
}
