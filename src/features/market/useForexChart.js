import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/api/market'

const PERIOD_MAP = {
  '1D': { interval: '5m', range: '1d'  },
  '1M': { interval: '1h', range: '1mo' },
  '3M': { interval: '1d', range: '3mo' },
  '1Y': { interval: '1d', range: '1y'  },
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
      const candles = res.data ?? []
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
