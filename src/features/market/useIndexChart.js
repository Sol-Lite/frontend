import { useQuery } from '@tanstack/react-query'
import { marketApi } from '@/api/market'

function toTime(item, isIntraday) {
  if (!isIntraday) return String(item.date).slice(0, 10)
  return Math.floor(new Date(item.datetime).getTime() / 1000)
}

function toLineData(items, isIntraday) {
  return items
    .map((d) => ({ time: toTime(d, isIntraday), value: Number(d.close) }))
    .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))
}

function toCandleData(items, isIntraday) {
  return items
    .map((d) => ({
      time:  toTime(d, isIntraday),
      open:  Number(d.open),
      high:  Number(d.high),
      low:   Number(d.low),
      close: Number(d.close),
    }))
    .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0))
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
        lineData:   toLineData(items, isIntraday),
        candleData: toCandleData(items, isIntraday),
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
