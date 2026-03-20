import { INVEST_STOCK } from '@/mocks/invest'
import { CHART_PERIOD_CONFIG } from '@/features/invest/constants'
import {
  formatDisplayDate,
  formatNumber,
  formatTradeTime,
} from '@/features/invest/formatters'

const STOCK_META_BY_CODE = {
  [INVEST_STOCK.code]: INVEST_STOCK,
}

export function getChartPeriodConfig(periodKey) {
  return CHART_PERIOD_CONFIG[periodKey] ?? CHART_PERIOD_CONFIG.MINUTE
}

export function getChartPeriodLabel(periodKey, minuteInterval) {
  if (periodKey === 'MINUTE') {
    return `${minuteInterval}분 차트`
  }

  return getChartPeriodConfig(periodKey).periodLabel
}

export function resolveStockMeta(stockCode, locationState) {
  const known = STOCK_META_BY_CODE[stockCode]
  const isDomestic = !locationState?.marketType
    || ['KOSPI', 'KOSDAQ'].includes(locationState.marketType)

  return {
    name: known?.name ?? locationState?.stockName ?? stockCode,
    nameEn: locationState?.stockNameEn ?? null,
    code: stockCode,
    market: known?.market ?? locationState?.marketType ?? '-',
    exchangeCode: locationState?.exchangeCode ?? null,
    sector: known?.sector ?? '-',
    isDomestic,
    availableAmount: known?.availableAmount ?? INVEST_STOCK.availableAmount,
    price: known?.price ?? INVEST_STOCK.price,
    diff: known?.diff ?? 0,
    changeRate: known?.changeRate ?? 0,
    open: known?.open ?? null,
    high: known?.high ?? null,
    low: known?.low ?? null,
    previousClose: known?.previousClose ?? null,
  }
}

function toLocalTimestamp(value, fallbackTime = '00:00:00') {
  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : `${value}T${fallbackTime}`
    return new Date(normalized).getTime()
  }

  if (Array.isArray(value)) {
    const [year = 1970, month = 1, day = 1, hour = 0, minute = 0, second = 0] = value
    return new Date(year, month - 1, day, hour, minute, second).getTime()
  }

  return Number.NaN
}

function extractDateKey(value) {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  if (Array.isArray(value)) {
    const [year = 1970, month = 1, day = 1] = value
    return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
  }

  return ''
}

export function normalizeDailySeries(data) {
  return (data ?? [])
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

export function normalizeMinuteSeries(data) {
  const now = Date.now()
  const normalized = (data ?? [])
    .map((item) => ({
      timestamp: toLocalTimestamp(item.datetime),
      sessionDate: extractDateKey(item.datetime),
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

export function getLatestMinuteSession(minuteSeries) {
  const sessions = minuteSeries.reduce((acc, item) => {
    const current = acc.get(item.sessionDate) ?? []
    current.push(item)
    acc.set(item.sessionDate, current)
    return acc
  }, new Map())

  const targetSession = Array.from(sessions.keys())
    .sort()
    .reverse()
    .find((sessionDate) => (sessions.get(sessionDate) ?? []).some((item) => item.volume > 0))

  return targetSession ? sessions.get(targetSession) ?? [] : []
}

export function getRecentMinuteSessions(minuteSeries, sessionCount = 2) {
  const sessions = minuteSeries.reduce((acc, item) => {
    const current = acc.get(item.sessionDate) ?? []
    current.push(item)
    acc.set(item.sessionDate, current)
    return acc
  }, new Map())

  return Array.from(sessions.keys())
    .sort()
    .slice(-sessionCount)
    .flatMap((sessionDate) => sessions.get(sessionDate) ?? [])
}

export function buildDailyRows(dailySeries) {
  return dailySeries
    .map((row, index, source) => {
      const previousClose = index > 0 ? source[index - 1].close : null
      const changeRate = previousClose ? ((row.close - previousClose) / previousClose) * 100 : 0

      return {
        date: formatDisplayDate(row.date),
        close: row.close,
        changeRate,
        volume: formatNumber(row.volume),
        open: row.open,
        high: row.high,
        low: row.low,
      }
    })
    .reverse()
}

export function buildRealtimeRows(minuteSeries, previousClose) {
  let accumulatedVolume = 0

  const ascendingRows = minuteSeries.map((row, index, source) => {
    accumulatedVolume += row.volume
    const comparisonBase = previousClose ?? source[index - 1]?.close ?? row.close

    return {
      time: formatTradeTime(row.timestamp),
      price: row.close,
      diff: row.close - comparisonBase,
      volume: formatNumber(row.volume),
      accumulatedVolume: formatNumber(accumulatedVolume),
      strength: '-',
      isStrong: false,
    }
  })

  return ascendingRows.reverse()
}

function computeDepth(entries, maxVolume) {
  return entries.map((entry) => ({
    ...entry,
    depth: maxVolume > 0 ? Math.round((entry.quantity / maxVolume) * 100) : 0,
  }))
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
    asks = (raw.asks ?? []).map((entry) => ({
      price: entry.price,
      quantity: entry.volume,
    }))
    bids = (raw.bids ?? []).map((entry) => ({
      price: entry.price,
      quantity: entry.volume,
    }))
    askTotal = raw.offerTotal ?? raw.totalOfferVolume ?? 0
    bidTotal = raw.bidTotal ?? raw.totalBidVolume ?? 0
  }

  const maxVolume = Math.max(
    ...asks.map((a) => a.quantity),
    ...bids.map((b) => b.quantity),
    1,
  )

  return {
    askTotal,
    bidTotal,
    asks: computeDepth(asks, maxVolume),
    bids: computeDepth(bids, maxVolume),
  }
}

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

  const asks = (raw.asks ?? []).map((entry) => ({
    price: entry.price,
    quantity: entry.remaining,
  }))
  const bids = (raw.bids ?? []).map((entry) => ({
    price: entry.price,
    quantity: entry.remaining,
  }))

  const askTotal = asks.reduce((sum, a) => sum + a.quantity, 0)
  const bidTotal = bids.reduce((sum, b) => sum + b.quantity, 0)
  const maxVolume = Math.max(
    ...asks.map((a) => a.quantity),
    ...bids.map((b) => b.quantity),
    1,
  )

  return {
    askTotal,
    bidTotal,
    asks: computeDepth(asks, maxVolume),
    bids: computeDepth(bids, maxVolume),
  }
}
