import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { marketApi } from '@/api/market'
import { DAY_MS, DEFAULT_MINUTE_INTERVAL } from '@/features/invest/constants'
import { formatApiDate } from '@/features/invest/formatters'
import {
  buildDailyRows,
  buildRealtimeRows,
  getChartPeriodConfig,
  getLatestMinuteSession,
} from '@/features/invest/marketData'
import { normalizeDailySeries, normalizeMinuteSeries, normalizeOrderBook } from '@/features/invest/domestic/normalize'
import useStompSubscription from '@/hooks/useStompSubscription'

const STALE = {
  price: 1000 * 5,
  minuteChart: 1000 * 30,
  dailyChart: 1000 * 60 * 5,
  orderBook: 1000 * 5,
  detail: 1000 * 60 * 60,
  finance: 1000 * 60 * 60,
}

export default function useDomesticMarketData(stockCode, { enabled }) {
  const [selectedChartPeriod, setSelectedChartPeriod] = useState(
    () => localStorage.getItem('invest.chartPeriod') ?? 'MINUTE',
  )
  const [selectedMinuteInterval, setSelectedMinuteInterval] = useState(
    () => Number(localStorage.getItem('invest.minuteInterval')) || DEFAULT_MINUTE_INTERVAL,
  )
  const [liveCandle, setLiveCandle] = useState(null)

  const endDate = formatApiDate(new Date())
  const startDate = formatApiDate(new Date(Date.now() - 180 * DAY_MS))

  const priceQuery = useQuery({
    queryKey: ['domestic', 'price', stockCode],
    queryFn: () => marketApi.getCurrentPrice(stockCode),
    enabled,
    staleTime: STALE.price,
  })

  const dailyChartQuery = useQuery({
    queryKey: ['domestic', 'chart', 'DAILY', stockCode, startDate, endDate],
    queryFn: () => marketApi.getChart(stockCode, { period: 'DAILY', startDate, endDate }),
    enabled,
    staleTime: STALE.dailyChart,
  })

  const minuteChartQuery = useQuery({
    queryKey: ['domestic', 'minuteChart', stockCode, DEFAULT_MINUTE_INTERVAL],
    queryFn: () => marketApi.getMinuteChart(stockCode, { ncnt: DEFAULT_MINUTE_INTERVAL }),
    enabled,
    staleTime: STALE.minuteChart,
  })

  const orderBookQuery = useQuery({
    queryKey: ['domestic', 'orderBook', stockCode],
    queryFn: () => marketApi.getOrderBook(stockCode),
    enabled,
    staleTime: STALE.orderBook,
  })

  const opinionQuery = useQuery({
    queryKey: ['domestic', 'opinion', stockCode],
    queryFn: () => marketApi.getOpinion(stockCode),
    enabled,
    staleTime: STALE.detail,
  })

  const investorQuery = useQuery({
    queryKey: ['domestic', 'investor', stockCode],
    queryFn: () => marketApi.getInvestor(stockCode),
    enabled,
    staleTime: STALE.detail,
  })

  const financeQuery = useQuery({
    queryKey: ['domestic', 'finance', stockCode],
    queryFn: () => marketApi.getFinance(stockCode),
    enabled,
    staleTime: STALE.finance,
  })

  const usesBaseMinuteData = selectedChartPeriod === 'MINUTE' && selectedMinuteInterval === DEFAULT_MINUTE_INTERVAL
  const needsCustomChart = enabled && !usesBaseMinuteData && selectedChartPeriod !== 'DAILY'

  const customChartQuery = useQuery({
    queryKey: selectedChartPeriod === 'MINUTE'
      ? ['domestic', 'minuteChart', stockCode, selectedMinuteInterval]
      : ['domestic', 'chart', selectedChartPeriod, stockCode],
    queryFn: () => {
      if (selectedChartPeriod === 'MINUTE') {
        return marketApi.getMinuteChart(stockCode, { ncnt: selectedMinuteInterval })
      }
      const config = getChartPeriodConfig(selectedChartPeriod)
      const end = formatApiDate(new Date())
      const start = formatApiDate(new Date(Date.now() - config.lookbackDays * DAY_MS))
      return marketApi.getChart(stockCode, { period: config.apiPeriod, startDate: start, endDate: end })
    },
    enabled: needsCustomChart,
    staleTime: selectedChartPeriod === 'MINUTE' ? STALE.minuteChart : STALE.dailyChart,
  })

  const dailySeries = normalizeDailySeries(dailyChartQuery.data?.data)
  const minuteSeries = normalizeMinuteSeries(minuteChartQuery.data?.data)

  const liveTrade = useStompSubscription(enabled ? `/topic/stock/trade/${stockCode}` : null)

  useEffect(() => {
    setLiveCandle(null)
  }, [stockCode, selectedMinuteInterval])

  useEffect(() => {
    if (!liveTrade) return
    const price = Number(liveTrade.price)
    const volume = Number(liveTrade.cvolume)
    if (!price || !volume) return

    const chetime = liveTrade.chetime ?? ''
    const hh = parseInt(chetime.slice(0, 2), 10)
    const mm = parseInt(chetime.slice(2, 4), 10)
    const bucketMm = Math.floor(mm / selectedMinuteInterval) * selectedMinuteInterval
    const now = new Date()
    const bucketTs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, bucketMm, 0).getTime()
    const sessionDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    setLiveCandle((prev) => {
      if (!prev || prev.timestamp !== bucketTs) {
        return { timestamp: bucketTs, sessionDate, open: price, high: price, low: price, close: price, volume }
      }
      return { ...prev, high: Math.max(prev.high, price), low: Math.min(prev.low, price), close: price, volume: prev.volume + volume }
    })
  }, [liveTrade, selectedMinuteInterval])

  const minuteSeriesWithLive = useMemo(() => {
    if (!liveCandle || minuteSeries.length === 0) return minuteSeries
    const last = minuteSeries.at(-1)
    if (liveCandle.timestamp === last.timestamp) {
      return [
        ...minuteSeries.slice(0, -1),
        { ...last, high: Math.max(last.high, liveCandle.high), low: Math.min(last.low, liveCandle.low), close: liveCandle.close, volume: last.volume + liveCandle.volume },
      ]
    }
    if (liveCandle.timestamp > last.timestamp) {
      return [...minuteSeries, liveCandle]
    }
    return minuteSeries
  }, [minuteSeries, liveCandle])

  const marketState = {
    isLoading: priceQuery.isLoading || dailyChartQuery.isLoading || minuteChartQuery.isLoading || orderBookQuery.isLoading,
    errorMessage: (priceQuery.error || dailyChartQuery.error || minuteChartQuery.error || orderBookQuery.error)?.message ?? '',
    priceData: priceQuery.data ?? null,
    dailySeries,
    minuteSeries: minuteSeriesWithLive,
    orderBook: orderBookQuery.data ?? null,
  }

  const customSeries = customChartQuery.data
    ? (selectedChartPeriod === 'MINUTE'
        ? normalizeMinuteSeries(customChartQuery.data?.data)
        : normalizeDailySeries(customChartQuery.data?.data))
    : []

  const chartState = {
    isLoading: customChartQuery.isLoading,
    errorMessage: customChartQuery.error?.message ?? '',
    series: customSeries,
  }

  const detailState = {
    isLoading: opinionQuery.isLoading || investorQuery.isLoading || financeQuery.isLoading,
    opinion: opinionQuery.data ?? null,
    investor: investorQuery.data ?? null,
    finance: financeQuery.data ?? null,
  }

  const liveOrderBook = useStompSubscription(enabled ? `/topic/asking/${stockCode}` : null)
  const orderBook = normalizeOrderBook(liveOrderBook) ?? normalizeOrderBook(marketState.orderBook)

  const previousClose = dailySeries.at(-2)?.close ?? null
  const dailyRows = buildDailyRows(dailySeries)
  const realtimeRows = buildRealtimeRows(getLatestMinuteSession(minuteSeriesWithLive), previousClose)

  useEffect(() => {
    localStorage.setItem('invest.chartPeriod', selectedChartPeriod)
  }, [selectedChartPeriod])

  useEffect(() => {
    localStorage.setItem('invest.minuteInterval', String(selectedMinuteInterval))
  }, [selectedMinuteInterval])

  function handleMinuteIntervalChange(nextMinuteInterval) {
    setSelectedMinuteInterval(nextMinuteInterval)
    setSelectedChartPeriod('MINUTE')
  }

  return {
    marketState,
    chartState,
    detailState,
    selectedChartPeriod,
    selectedMinuteInterval,
    orderBook,
    dailyRows,
    realtimeRows,
    setSelectedChartPeriod,
    handleMinuteIntervalChange,
  }
}
