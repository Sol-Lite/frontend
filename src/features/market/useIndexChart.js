import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/api/market'

function toTime(item) {
  const raw = item.date ?? item.datetime ?? item.time
  if (typeof raw === 'number') return Math.floor(raw / 1000)
  return Math.floor(new Date(raw).getTime() / 1000)
}

function toLineData(items) {
  return items
    .map((d) => ({ time: toTime(d), value: Number(d.close) }))
    .sort((a, b) => a.time - b.time)
}

function toCandleData(items) {
  return items
    .map((d) => ({
      time:  toTime(d),
      open:  Number(d.open),
      high:  Number(d.high),
      low:   Number(d.low),
      close: Number(d.close),
    }))
    .sort((a, b) => a.time - b.time)
}

// '1D': 분봉(오늘 장중) / 나머지: 일봉
export default function useIndexChart(code, period = '3M') {
  const isIntraday = period === '1D'
  const count = period === '1M' ? 30 : period === '1Y' ? 250 : 90

  const { data, isLoading, error } = useQuery({
    queryKey: ['index', 'chart', code, period],
    queryFn: async () => {
      const res = isIntraday
        ? await marketApi.getIndexMinuteChart(code, { ncnt: 5 })
        : await marketApi.getIndexChart(code, { count })
      const items = res.data ?? []
      return {
        lineData:   toLineData(items),
        candleData: toCandleData(items),
      }
    },
    enabled: !!code && period !== null,
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
