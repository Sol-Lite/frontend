import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/api/market'

const PERIOD_MAP = {
  '1D': { interval: '5m', range: '1d'  },
  '1M': { interval: '1h', range: '1mo' },
  '3M': { interval: '1d', range: '3mo' },
  '1Y': { interval: '1d', range: '1y'  },
}

// 1d 미만 interval: Unix timestamp (초) — datetime 문자열
// 1d interval: "YYYY-MM-DD" 문자열 — 타임존 이슈 방지
function toTime(timeStr, isIntraday) {
  if (isIntraday) return Math.floor(new Date(timeStr).getTime() / 1000)
  if (typeof timeStr === 'number') return new Date(timeStr).toISOString().slice(0, 10)
  return String(timeStr).slice(0, 10)
}

function toLineData(candles, isIntraday) {
  return candles
    .map((c) => ({ time: toTime(c.time, isIntraday), value: Number(c.close) }))
    .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))
}

function toCandleData(candles, isIntraday) {
  return candles
    .map((c) => ({
      time:  toTime(c.time, isIntraday),
      open:  Number(c.open),
      high:  Number(c.high),
      low:   Number(c.low),
      close: Number(c.close),
    }))
    .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))
}

export default function useForexChart(symbol, period) {
  const isIntraday = period === '1D' || period === '1M'
  const { interval, range } = PERIOD_MAP[period] ?? PERIOD_MAP['3M']

  const { data, isLoading, error } = useQuery({
    queryKey: ['forex', 'chart', symbol, period],
    queryFn: async () => {
      const res = await marketApi.getForexChart({ symbol, interval, range })
      const candles = res.data ?? []
      return {
        lineData:   toLineData(candles, isIntraday),
        candleData: toCandleData(candles, isIntraday),
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
