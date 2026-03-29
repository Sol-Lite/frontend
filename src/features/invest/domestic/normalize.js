import { toLocalTimestamp, extractDateKey, computeDepth } from '@/features/invest/marketData'

export function normalizeDailySeries(data) {
  return (data ?? [])
    .map((item) => ({
      date: extractDateKey(item.time),
      timestamp: toLocalTimestamp(item.time),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
    }))
    .sort((left, right) => left.timestamp - right.timestamp)
}

export function normalizeMinuteSeries(data) {
  const now = Date.now()
  const normalized = (data ?? [])
    .map((item) => ({
      timestamp: toLocalTimestamp(item.time),
      sessionDate: extractDateKey(item.time),
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

function parseLsOrderBookEntries(raw, side, count = 10) {
  const isUH1 = raw.unt_offerrem1 != null
  const entries = []
  for (let i = 1; i <= count; i++) {
    const price = Number(raw[`${side}ho${i}`] ?? 0)
    const quantity = isUH1
      ? Number(raw[`unt_${side}rem${i}`] ?? 0)
      : Number(raw[`${side}rem${i}`] ?? 0)
    const krx = isUH1 ? Number(raw[`krx_${side}rem${i}`] ?? 0) : null
    const nxt = isUH1 ? Number(raw[`nxt_${side}rem${i}`] ?? 0) : null
    if (price > 0) entries.push({ price, quantity, krx, nxt })
  }
  return entries
}

function isLsRawFormat(raw) {
  return raw.offerho1 != null || raw.shcode != null
}

export function normalizeOrderBook(raw) {
  if (!raw) return null

  let asks
  let bids
  let askTotal
  let bidTotal

  if (isLsRawFormat(raw)) {
    asks = parseLsOrderBookEntries(raw, 'offer')
    bids = parseLsOrderBookEntries(raw, 'bid')
    const isUH1 = raw.unt_totofferrem != null
    askTotal = Number((isUH1 ? raw.unt_totofferrem : raw.totofferrem) ?? 0)
    bidTotal = Number((isUH1 ? raw.unt_totbidrem : raw.totbidrem) ?? 0)
  } else {
    asks = (raw.asks ?? []).map((entry) => ({ price: entry.price, quantity: entry.volume }))
    bids = (raw.bids ?? []).map((entry) => ({ price: entry.price, quantity: entry.volume }))
    askTotal = raw.offerTotal ?? raw.totalOfferVolume ?? 0
    bidTotal = raw.bidTotal ?? raw.totalBidVolume ?? 0
  }

  const maxVolume = Math.max(...asks.map((a) => a.quantity), ...bids.map((b) => b.quantity), 1)

  return {
    askTotal,
    bidTotal,
    asks: computeDepth(asks, maxVolume),
    bids: computeDepth(bids, maxVolume),
  }
}
