import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/api/market'

const PERIOD_MAP = {
  '1D': { interval: '5m', range: '5d'  },
  '1M': { interval: '1h', range: '1mo' },
  '3M': { interval: '1d', range: '3mo' },
  '1Y': { interval: '1d', range: '1y'  },
}

function toKstDateKey(timeValue) {
  const date = new Date(typeof timeValue === 'number' ? timeValue : new Date(timeValue).getTime())
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function pickLatestTradingDay(candles) {
  if (!Array.isArray(candles) || candles.length === 0) return []

  const latest = candles.reduce((max, candle) => {
    const time = typeof candle?.time === 'number' ? candle.time : new Date(candle?.time).getTime()
    return Number.isFinite(time) && time > max ? time : max
  }, -Infinity)

  if (!Number.isFinite(latest) || latest < 0) return candles

  const latestDateKey = toKstDateKey(latest)
  const filtered = candles.filter((candle) => toKstDateKey(candle.time) === latestDateKey)
  return filtered.length > 0 ? filtered : candles
}

function toTime(timeStr) {
  if (typeof timeStr === 'number') return Math.floor(timeStr / 1000)
  return Math.floor(new Date(timeStr).getTime() / 1000)
}

function toLineData(candles) {
  return candles
    .map((c) => ({ time: toTime(c.time), value: Number(c.close) }))
    .sort((a, b) => a.time - b.time)
}

function toCandleData(candles) {
  return candles
    .map((c) => ({
      time:  toTime(c.time),
      open:  Number(c.open),
      high:  Number(c.high),
      low:   Number(c.low),
      close: Number(c.close),
    }))
    .sort((a, b) => a.time - b.time)
}

export default function useForexChart(symbol, period) {
  const isIntraday = period === '1D'
  const { interval, range } = PERIOD_MAP[period] ?? PERIOD_MAP['3M']

  const { data, isLoading, error } = useQuery({
    queryKey: ['forex', 'chart', symbol, period],
    queryFn: async () => {
      const res = await marketApi.getForexChart({ symbol, interval, range })
      const rawCandles = res.data ?? []
      const candles = isIntraday ? pickLatestTradingDay(rawCandles) : rawCandles
      return {
        lineData:   toLineData(candles),
        candleData: toCandleData(candles),
      }
    },
    enabled: !!symbol && !!period,
    staleTime: isIntraday ? 30 * 1000 : 5 * 60 * 1000,
    retry: false,
  })

  return {
    lineData:   data?.lineData   ?? [],
    candleData: data?.candleData ?? [],
    isLoading,
    isIntraday,
    error,
  }
}
