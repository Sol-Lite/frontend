import { useMemo } from 'react'
import useStompSubscription from '@/hooks/useStompSubscription'
import { isForeignMarketType } from '@/features/invest/formatters'

function toFiniteNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function resolveDirection(sign, fallbackValue = 0) {
  if (sign != null) {
    const normalizedSign = String(sign)
    if (['4', '5'].includes(normalizedSign)) return -1
    if (['1', '2'].includes(normalizedSign)) return 1
    if (normalizedSign === '3') return 0
  }

  const numeric = Number(fallbackValue)
  if (!Number.isFinite(numeric)) return 0
  return Math.sign(numeric)
}

function buildQuotePatch(raw, marketType) {
  if (!raw) return null

  const isForeign = isForeignMarketType(marketType)
  const currentPrice = toFiniteNumber(raw.currentPrice ?? raw.price)
  const changeRate = isForeign
    ? toFiniteNumber(raw.changeRate ?? raw.rate)
    : toFiniteNumber(raw.changeRate ?? raw.drate ?? raw.rate)
  const rawChangeAmount = isForeign
    ? toFiniteNumber(raw.changeAmount ?? raw.diff ?? raw.change)
    : toFiniteNumber(raw.changeAmount ?? raw.change ?? raw.diff)
  const direction = resolveDirection(raw.sign, changeRate ?? rawChangeAmount)
  const changeAmount = rawChangeAmount == null ? null : direction * Math.abs(rawChangeAmount)
  const volume = toFiniteNumber(raw.volume)

  const patch = {}
  if (currentPrice != null && currentPrice > 0) patch.currentPrice = currentPrice
  if (changeRate != null) patch.changeRate = changeRate
  if (changeAmount != null) {
    patch.changeAmount = changeAmount
    patch.change = changeAmount
  }
  if (volume != null) patch.volume = volume

  return Object.keys(patch).length > 0 ? patch : null
}

export default function useWatchlistQuote(item) {
  const marketType = item?.marketType ?? null
  const isForeign = isForeignMarketType(marketType)
  const topic = item?.stockCode
    ? (isForeign ? `/topic/foreign/quote/${item.stockCode}` : `/topic/stock/trade/${item.stockCode}`)
    : null

  const liveQuote = useStompSubscription(topic)

  return useMemo(() => {
    if (!item) return null

    const basePatch = buildQuotePatch(item, marketType)
    const livePatch = buildQuotePatch(liveQuote, marketType)

    return {
      ...item,
      ...(basePatch ?? {}),
      ...(livePatch ?? {}),
    }
  }, [item, liveQuote, marketType])
}
