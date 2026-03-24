import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { foreignMarketApi } from '@/api/market'
import { DAY_MS, DEFAULT_MINUTE_INTERVAL } from '@/features/invest/constants'
import { formatApiDate } from '@/features/invest/formatters'
import {
  buildDailyRows,
  buildRealtimeRows,
  getChartPeriodConfig,
  getLatestMinuteSession,
} from '@/features/invest/marketData'
import { normalizeForeignDailySeries, normalizeForeignMinuteSeries, normalizeForeignOrderBook } from '@/features/invest/foreign/normalize'
import useStompSubscription from '@/hooks/useStompSubscription'

const STALE = {
  price: 1000 * 5,
  minuteChart: 1000 * 30,
  dailyChart: 1000 * 60 * 5,
  orderBook: 1000 * 5,
}

export default function useForeignMarketData(stockCode, exchcd, { enabled }) {
  const [selectedChartPeriod, setSelectedChartPeriod] = useState(
    () => localStorage.getItem('invest.chartPeriod') ?? 'MINUTE',
  )
  const [selectedMinuteInterval, setSelectedMinuteInterval] = useState(
    () => Number(localStorage.getItem('invest.minuteInterval')) || DEFAULT_MINUTE_INTERVAL,
  )

  const endDate = formatApiDate(new Date())
  const startDate = formatApiDate(new Date(Date.now() - 180 * DAY_MS))

  const priceQuery = useQuery({
    queryKey: ['foreign', 'price', stockCode, exchcd],
    queryFn: () => foreignMarketApi.getCurrentPrice(stockCode, exchcd),
    enabled,
    staleTime: STALE.price,
  })

  const dailyChartQuery = useQuery({
    queryKey: ['foreign', 'chart', 'DAY', stockCode, exchcd, startDate, endDate],
    queryFn: () => foreignMarketApi.getChart(stockCode, exchcd, { period: 'DAY', startDate, endDate }),
    enabled,
    staleTime: STALE.dailyChart,
  })

  const minuteChartQuery = useQuery({
    queryKey: ['foreign', 'minuteChart', stockCode, exchcd, DEFAULT_MINUTE_INTERVAL],
    queryFn: () => foreignMarketApi.getMinuteChart(stockCode, exchcd, { nmin: DEFAULT_MINUTE_INTERVAL }),
    enabled,
    staleTime: STALE.minuteChart,
  })

  const orderBookQuery = useQuery({
    queryKey: ['foreign', 'orderBook', stockCode, exchcd],
    queryFn: () => foreignMarketApi.getOrderBook(stockCode, exchcd),
    enabled,
    staleTime: STALE.orderBook,
  })

  const usesBaseMinuteData = selectedChartPeriod === 'MINUTE' && selectedMinuteInterval === DEFAULT_MINUTE_INTERVAL
  const needsCustomChart = enabled && !usesBaseMinuteData && selectedChartPeriod !== 'DAILY'

  const customChartQuery = useQuery({
    queryKey: selectedChartPeriod === 'MINUTE'
      ? ['foreign', 'minuteChart', stockCode, exchcd, selectedMinuteInterval]
      : ['foreign', 'chart', selectedChartPeriod, stockCode, exchcd],
    queryFn: () => {
      if (selectedChartPeriod === 'MINUTE') {
        return foreignMarketApi.getMinuteChart(stockCode, exchcd, { nmin: selectedMinuteInterval })
      }
      const config = getChartPeriodConfig(selectedChartPeriod)
      const end = formatApiDate(new Date())
      const start = formatApiDate(new Date(Date.now() - config.lookbackDays * DAY_MS))
      return foreignMarketApi.getChart(stockCode, exchcd, { period: config.foreignApiPeriod, startDate: start, endDate: end })
    },
    enabled: needsCustomChart,
    staleTime: selectedChartPeriod === 'MINUTE' ? STALE.minuteChart : STALE.dailyChart,
  })

  const dailySeries = normalizeForeignDailySeries(dailyChartQuery.data?.dataPoints)
  const minuteSeries = normalizeForeignMinuteSeries(minuteChartQuery.data?.dataPoints)

  const priceData = priceQuery.data
    ? { currentPrice: priceQuery.data.price, changeAmount: priceQuery.data.diff, changeRate: priceQuery.data.rate }
    : null

  const marketState = {
    isLoading: priceQuery.isLoading || dailyChartQuery.isLoading || minuteChartQuery.isLoading || orderBookQuery.isLoading,
    errorMessage: (priceQuery.error || dailyChartQuery.error || minuteChartQuery.error || orderBookQuery.error)?.message ?? '',
    priceData,
    dailySeries,
    minuteSeries,
    orderBook: orderBookQuery.data ?? null,
  }

  const customSeries = customChartQuery.data
    ? (selectedChartPeriod === 'MINUTE'
        ? normalizeForeignMinuteSeries(customChartQuery.data?.dataPoints)
        : normalizeForeignDailySeries(customChartQuery.data?.dataPoints))
    : []

  const chartState = {
    isLoading: customChartQuery.isLoading,
    errorMessage: customChartQuery.error?.message ?? '',
    series: customSeries,
  }

  const liveOrderBook = useStompSubscription(enabled ? `/topic/foreign/quote/${stockCode}` : null)
  const orderBook = normalizeForeignOrderBook(liveOrderBook) ?? normalizeForeignOrderBook(marketState.orderBook)

  const previousClose = dailySeries.at(-2)?.close ?? null
  const dailyRows = buildDailyRows(dailySeries)
  const realtimeRows = buildRealtimeRows(getLatestMinuteSession(minuteSeries), previousClose)

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
    chartSeries: null,
    chartHistoryLoading: false,
    chartHistoryErrorMessage: '',
    hasMoreChartHistory: false,
    loadMoreChartHistory: async () => {},
    detailState: { isLoading: false, opinion: null, investor: null, finance: null },
    selectedChartPeriod,
    selectedMinuteInterval,
    orderBook,
    dailyRows,
    realtimeRows,
    setSelectedChartPeriod,
    handleMinuteIntervalChange,
  }
}
