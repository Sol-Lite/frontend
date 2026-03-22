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
  const marketType = locationState?.marketType ?? known?.market ?? null
  const exchangeCode = locationState?.exchangeCode ?? null
  const isDomestic = exchangeCode == null
    ? (!marketType || ['KOSPI', 'KOSDAQ'].includes(marketType))
    : ['KOSPI', 'KOSDAQ'].includes(marketType)

  return {
    name: known?.name ?? locationState?.stockName ?? stockCode,
    nameEn: locationState?.stockNameEn ?? null,
    code: stockCode,
    market: known?.market ?? marketType ?? '-',
    exchangeCode,
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

// 날짜/시간 파싱 유틸 (domestic/foreign normalize에서 공유)
export function toLocalTimestamp(value, fallbackTime = '00:00:00') {
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

export function extractDateKey(value) {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  if (Array.isArray(value)) {
    const [year = 1970, month = 1, day = 1] = value
    return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`
  }

  return ''
}

export function computeDepth(entries, maxVolume) {
  return entries.map((entry) => ({
    ...entry,
    depth: maxVolume > 0 ? Math.round((entry.quantity / maxVolume) * 100) : 0,
  }))
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
