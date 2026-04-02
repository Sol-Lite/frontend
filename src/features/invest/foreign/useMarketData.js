import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
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

function resolveQueryErrorMessage(error, fallbackMessage) {
  const rawMessage = typeof error?.message === 'string' ? error.message.trim() : ''

  if (!rawMessage) return fallbackMessage
  if (rawMessage.startsWith('해외주식 API 호출 실패')) return fallbackMessage
  if (rawMessage === '시장 데이터를 불러오지 못했습니다.') return fallbackMessage

  return rawMessage
}

function useQueryErrorLogger(label, error, context) {
  const lastSignatureRef = useRef('')

  useEffect(() => {
    if (!error) {
      lastSignatureRef.current = ''
      return
    }

    const signature = [
      label,
      error.url ?? '',
      error.status ?? '',
      error.code ?? '',
      error.message ?? '',
      context.stockCode,
      context.exchcd,
    ].join('|')

    if (lastSignatureRef.current === signature) return
    lastSignatureRef.current = signature

    console.error(`[foreign-market] ${label} query failed`, {
      ...context,
      url: error.url ?? null,
      status: error.status ?? null,
      statusText: error.statusText ?? '',
      code: error.code ?? null,
      message: error.message ?? '',
      data: error.data ?? null,
      rawText: error.rawText ?? null,
      error,
    })
  }, [context, error, label])
}

export default function useForeignMarketData(stockCode, exchcd, { enabled, initialPeriod, initialMinuteInterval }) {
  const [selectedChartPeriod, setSelectedChartPeriod] = useState(
    () => initialPeriod ?? localStorage.getItem('invest.chartPeriod') ?? 'MINUTE',
  )
  const [selectedMinuteInterval, setSelectedMinuteInterval] = useState(
    () => initialMinuteInterval ?? (Number(localStorage.getItem('invest.minuteInterval')) || DEFAULT_MINUTE_INTERVAL),
  )

  const { endDate, startDate } = useMemo(() => {
    const end = new Date()
    return {
      endDate: formatApiDate(end),
      startDate: formatApiDate(new Date(end.getTime() - 180 * DAY_MS)),
    }
  }, [])

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

  const errorLogContext = useMemo(() => ({
    stockCode,
    exchcd,
  }), [exchcd, stockCode])

  useQueryErrorLogger('price', priceQuery.error, errorLogContext)
  useQueryErrorLogger('daily-chart', dailyChartQuery.error, errorLogContext)
  useQueryErrorLogger('minute-chart', minuteChartQuery.error, errorLogContext)
  useQueryErrorLogger('order-book', orderBookQuery.error, errorLogContext)

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
      const end = new Date()
      const start = new Date(end.getTime() - config.lookbackDays * DAY_MS)
      return foreignMarketApi.getChart(stockCode, exchcd, {
        period: config.foreignApiPeriod,
        startDate: formatApiDate(start),
        endDate: formatApiDate(end),
      })
    },
    enabled: needsCustomChart,
    staleTime: selectedChartPeriod === 'MINUTE' ? STALE.minuteChart : STALE.dailyChart,
  })

  useQueryErrorLogger('custom-chart', customChartQuery.error, {
    ...errorLogContext,
    chartPeriod: selectedChartPeriod,
    minuteInterval: selectedMinuteInterval,
  })

  const dailySeries = normalizeForeignDailySeries(dailyChartQuery.data?.dataPoints)
  const minuteSeries = normalizeForeignMinuteSeries(minuteChartQuery.data?.dataPoints)

  const priceData = priceQuery.data
    ? { currentPrice: priceQuery.data.price, changeAmount: priceQuery.data.diff, changeRate: priceQuery.data.rate }
    : null

  const marketError = priceQuery.error || dailyChartQuery.error || minuteChartQuery.error
  const marketErrorMessage = resolveQueryErrorMessage(marketError, '현재 해외주식 시세를 불러오지 못하고 있습니다.')
  const dailyErrorMessage = resolveQueryErrorMessage(dailyChartQuery.error, '현재 해외주식 일별 시세를 불러오지 못하고 있습니다.')
  const minuteErrorMessage = resolveQueryErrorMessage(minuteChartQuery.error, '현재 해외주식 실시간 시세를 불러오지 못하고 있습니다.')
  const orderBookErrorMessage = resolveQueryErrorMessage(orderBookQuery.error, '현재 해외주식 호가 정보를 불러오지 못하고 있습니다.')
  const customChartErrorMessage = resolveQueryErrorMessage(customChartQuery.error, '현재 해외주식 차트 데이터를 불러오지 못하고 있습니다.')

  const marketState = {
    isLoading: priceQuery.isLoading || dailyChartQuery.isLoading || minuteChartQuery.isLoading || orderBookQuery.isLoading,
    errorMessage: marketError ? marketErrorMessage : '',
    dailyLoading: dailyChartQuery.isLoading,
    dailyErrorMessage: dailyChartQuery.error ? dailyErrorMessage : '',
    minuteLoading: minuteChartQuery.isLoading,
    minuteErrorMessage: minuteChartQuery.error ? minuteErrorMessage : '',
    orderBookLoading: orderBookQuery.isLoading,
    orderBookErrorMessage: orderBookQuery.error ? orderBookErrorMessage : '',
    priceData,
    dailySeries,
    minuteSeries,
    orderBook: orderBookQuery.data ?? null,
  }

  const customSeries = useMemo(() => (
    customChartQuery.data
      ? (selectedChartPeriod === 'MINUTE'
          ? normalizeForeignMinuteSeries(customChartQuery.data?.dataPoints)
          : normalizeForeignDailySeries(customChartQuery.data?.dataPoints))
      : []
  ), [customChartQuery.data, selectedChartPeriod])

  const chartState = {
    isLoading: customChartQuery.isLoading,
    errorMessage: customChartQuery.error ? customChartErrorMessage : '',
    series: customSeries,
  }

  const liveOrderBook = useStompSubscription(enabled ? `/topic/foreign/quote/${stockCode}` : null)
  const orderBook = normalizeForeignOrderBook(liveOrderBook) ?? normalizeForeignOrderBook(marketState.orderBook)

  const previousClose = dailySeries.at(-2)?.close ?? null
  const dailyRows = useMemo(
    () => buildDailyRows(dailySeries),
    [dailySeries],
  )
  const realtimeRows = useMemo(
    () => buildRealtimeRows(getLatestMinuteSession(minuteSeries), previousClose),
    [minuteSeries, previousClose],
  )

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
    dailyLoading: dailyChartQuery.isLoading,
    realtimeLoading: minuteChartQuery.isLoading,
    setSelectedChartPeriod,
    handleMinuteIntervalChange,
  }
}
