import { toLocalTimestamp, extractDateKey, computeDepth } from '@/features/invest/marketData'

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readOrderQuantity(entry) {
  return toNumber(entry?.remaining ?? entry?.volume ?? entry?.quantity)
}

function parseLsOrderBookEntries(raw, side, count = 10) {
  const entries = []

  for (let i = 1; i <= count; i += 1) {
    const price = toNumber(raw?.[`${side}ho${i}`])
    const quantity = toNumber(raw?.[`${side}rem${i}`])

    if (price > 0) {
      entries.push({ price, quantity })
    }
  }

  return entries
}

function isLsRawFormat(raw) {
  return raw?.offerho1 != null || raw?.bidho1 != null || raw?.totofferrem != null || raw?.totbidrem != null
}

function toExchangeLocalTimestamp(value, fallbackTime = '00:00:00') {
  if (typeof value === 'string') {
    const [datePart, timePart = fallbackTime] = value.includes('T')
      ? value.split('T')
      : [value, fallbackTime]
    const [year, month, day] = datePart.split('-').map(Number)
    const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number)

    return Date.UTC(year, (month ?? 1) - 1, day ?? 1, hour, minute, second)
  }

  if (Array.isArray(value)) {
    const [year = 1970, month = 1, day = 1, hour = 0, minute = 0, second = 0] = value
    return Date.UTC(year, month - 1, day, hour, minute, second)
  }

  return Number.NaN
}

export function normalizeForeignDailySeries(dataPoints) {
  return (dataPoints ?? [])
    .map((item) => ({
      date: extractDateKey(item.date),
      timestamp: toExchangeLocalTimestamp(item.date),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
    }))
    .sort((left, right) => left.timestamp - right.timestamp)
}

export function normalizeForeignMinuteSeries(dataPoints) {
  return (dataPoints ?? [])
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
}

export function normalizeForeignOrderBook(raw) {
  if (!raw) return null

  const asks = isLsRawFormat(raw)
    ? parseLsOrderBookEntries(raw, 'offer')
    : (raw.asks ?? []).map((entry) => ({
        price: toNumber(entry?.price),
        quantity: readOrderQuantity(entry),
      }))

  const bids = isLsRawFormat(raw)
    ? parseLsOrderBookEntries(raw, 'bid')
    : (raw.bids ?? []).map((entry) => ({
        price: toNumber(entry?.price),
        quantity: readOrderQuantity(entry),
      }))

  if (asks.length === 0 && bids.length === 0) {
    return null
  }

  const askTotal = toNumber(
    raw.askTotal ?? raw.totOfferRem ?? raw.totofferrem,
    asks.reduce((sum, a) => sum + a.quantity, 0),
  )
  const bidTotal = toNumber(
    raw.bidTotal ?? raw.totBidRem ?? raw.totbidrem,
    bids.reduce((sum, b) => sum + b.quantity, 0),
  )
  const maxVolume = Math.max(...asks.map((a) => a.quantity), ...bids.map((b) => b.quantity), 1)

  return {
    askTotal,
    bidTotal,
    asks: computeDepth(asks, maxVolume),
    bids: computeDepth(bids, maxVolume),
  }
}
