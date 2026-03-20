import { toLocalTimestamp, extractDateKey, computeDepth } from '@/features/invest/marketData'

export function normalizeForeignDailySeries(dataPoints) {
  return (dataPoints ?? [])
    .map((item) => ({
      date: extractDateKey(item.date),
      timestamp: toLocalTimestamp(item.date),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
    }))
    .sort((left, right) => left.timestamp - right.timestamp)
}

export function normalizeForeignMinuteSeries(dataPoints) {
  const now = Date.now()
  const normalized = (dataPoints ?? [])
    .map((item) => ({
      timestamp: toLocalTimestamp(item.dateTime),
      sessionDate: extractDateKey(item.dateTime),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
    }))
    .filter((item) => Number.isFinite(item.timestamp) && item.sessionDate)
    .sort((left, right) => left.timestamp - right.timestamp)

  const visibleItems = normalized.filter((item) => item.timestamp <= now)
  return visibleItems.length > 0 ? visibleItems : normalized
}

export function normalizeForeignOrderBook(raw) {
  if (!raw) return null

  const asks = (raw.asks ?? []).map((entry) => ({ price: entry.price, quantity: entry.remaining }))
  const bids = (raw.bids ?? []).map((entry) => ({ price: entry.price, quantity: entry.remaining }))

  const askTotal = asks.reduce((sum, a) => sum + a.quantity, 0)
  const bidTotal = bids.reduce((sum, b) => sum + b.quantity, 0)
  const maxVolume = Math.max(...asks.map((a) => a.quantity), ...bids.map((b) => b.quantity), 1)

  return {
    askTotal,
    bidTotal,
    asks: computeDepth(asks, maxVolume),
    bids: computeDepth(bids, maxVolume),
  }
}
