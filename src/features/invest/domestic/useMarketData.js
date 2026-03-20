import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
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
  const [selectedChartPeriod, setSelectedChartPeriod] = useState('MINUTE')
  const [selectedMinuteInterval, setSelectedMinuteInterval] = useState(DEFAULT_MINUTE_INTERVAL)

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

  const marketState = {
    isLoading: priceQuery.isLoading || dailyChartQuery.isLoading || minuteChartQuery.isLoading || orderBookQuery.isLoading,
    errorMessage: (priceQuery.error || dailyChartQuery.error || minuteChartQuery.error || orderBookQuery.error)?.message ?? '',
    priceData: priceQuery.data ?? null,
    dailySeries,
    minuteSeries,
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
  const realtimeRows = buildRealtimeRows(getLatestMinuteSession(minuteSeries), previousClose)

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
