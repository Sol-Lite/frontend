import { useEffect, useState } from 'react'
import { marketApi } from '@/api/market'
import {
  DAY_MS,
  DEFAULT_MINUTE_INTERVAL,
} from '@/features/invest/constants'
import { formatApiDate } from '@/features/invest/formatters'
import {
  buildDailyRows,
  buildRealtimeRows,
  getLatestMinuteSession,
  getRecentMinuteSessions,
  getChartPeriodConfig,
  normalizeDailySeries,
  normalizeMinuteSeries,
  resolveStockMeta,
} from '@/features/invest/marketData'

const INITIAL_MARKET_STATE = {
  isLoading: true,
  errorMessage: '',
  priceData: null,
  dailySeries: [],
  minuteSeries: [],
}

const INITIAL_CHART_STATE = {
  isLoading: true,
  errorMessage: '',
  series: [],
}

export default function useInvestMarketData(stockCode) {
  const stockMeta = resolveStockMeta(stockCode)
  const [marketState, setMarketState] = useState(INITIAL_MARKET_STATE)
  const [selectedChartPeriod, setSelectedChartPeriod] = useState('MINUTE')
  const [selectedMinuteInterval, setSelectedMinuteInterval] = useState(DEFAULT_MINUTE_INTERVAL)
  const [chartState, setChartState] = useState(INITIAL_CHART_STATE)

  useEffect(() => {
    let isCancelled = false

    async function loadMarketData() {
      setMarketState(INITIAL_MARKET_STATE)

      try {
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 180 * DAY_MS)

        const [priceData, chartData, minuteChartData] = await Promise.all([
          marketApi.getCurrentPrice(stockCode),
          marketApi.getChart(stockCode, {
            period: 'DAILY',
            startDate: formatApiDate(startDate),
            endDate: formatApiDate(endDate),
          }),
          marketApi.getMinuteChart(stockCode, { ncnt: DEFAULT_MINUTE_INTERVAL }),
        ])

        if (isCancelled) return

        setMarketState({
          isLoading: false,
          errorMessage: '',
          priceData,
          dailySeries: normalizeDailySeries(chartData?.data),
          minuteSeries: normalizeMinuteSeries(minuteChartData?.data),
        })
      } catch (error) {
        if (isCancelled) return

        setMarketState({
          isLoading: false,
          errorMessage: error?.message ?? '시장 데이터를 불러오지 못했습니다.',
          priceData: null,
          dailySeries: [],
          minuteSeries: [],
        })
      }
    }

    loadMarketData()

    return () => {
      isCancelled = true
    }
  }, [stockCode])

  useEffect(() => {
    const usesBaseMinuteData = selectedChartPeriod === 'MINUTE'
      && selectedMinuteInterval === DEFAULT_MINUTE_INTERVAL

    if (usesBaseMinuteData || selectedChartPeriod === 'DAILY') {
      return
    }

    let isCancelled = false

    async function loadChartSeries() {
      setChartState(INITIAL_CHART_STATE)

      try {
        let nextSeries = []

        if (selectedChartPeriod === 'MINUTE') {
          const minuteChartData = await marketApi.getMinuteChart(stockCode, { ncnt: selectedMinuteInterval })
          nextSeries = normalizeMinuteSeries(minuteChartData?.data)
        } else {
          const config = getChartPeriodConfig(selectedChartPeriod)
          const endDate = new Date()
          const startDate = new Date(endDate.getTime() - config.lookbackDays * DAY_MS)
          const chartData = await marketApi.getChart(stockCode, {
            period: config.apiPeriod,
            startDate: formatApiDate(startDate),
            endDate: formatApiDate(endDate),
          })

          nextSeries = normalizeDailySeries(chartData?.data)
        }

        if (isCancelled) return

        setChartState({
          isLoading: false,
          errorMessage: '',
          series: nextSeries,
        })
      } catch (error) {
        if (isCancelled) return

        setChartState({
          isLoading: false,
          errorMessage: error?.message ?? '차트 데이터를 불러오지 못했습니다.',
          series: [],
        })
      }
    }

    loadChartSeries()

    return () => {
      isCancelled = true
    }
  }, [stockCode, selectedChartPeriod, selectedMinuteInterval])

  const latestDaily = marketState.dailySeries.at(-1)
  const previousClose = marketState.dailySeries.at(-2)?.close ?? stockMeta.previousClose
  const currentPrice = marketState.priceData?.currentPrice ?? latestDaily?.close ?? stockMeta.price
  const changeAmount = marketState.priceData?.changeAmount
    ?? (currentPrice != null && previousClose != null ? currentPrice - previousClose : stockMeta.diff)
  const changeRate = marketState.priceData?.changeRate
    ?? (previousClose ? (changeAmount / previousClose) * 100 : stockMeta.changeRate)

  const overview = {
    open: latestDaily?.open ?? stockMeta.open,
    high: latestDaily?.high ?? stockMeta.high,
    low: latestDaily?.low ?? stockMeta.low,
    previousClose,
  }

  const usesBaseChartData = (selectedChartPeriod === 'MINUTE'
    && selectedMinuteInterval === DEFAULT_MINUTE_INTERVAL)
    || selectedChartPeriod === 'DAILY'
  const minuteChartSeries = getRecentMinuteSessions(
    selectedMinuteInterval === DEFAULT_MINUTE_INTERVAL
      ? marketState.minuteSeries
      : chartState.series,
  )
  const chartSeries = selectedChartPeriod === 'MINUTE'
    ? minuteChartSeries
    : selectedChartPeriod === 'DAILY'
      ? marketState.dailySeries
      : chartState.series
  const chartLoading = usesBaseChartData ? marketState.isLoading : chartState.isLoading
  const chartErrorMessage = usesBaseChartData ? marketState.errorMessage : chartState.errorMessage

  function handleMinuteIntervalChange(nextMinuteInterval) {
    setSelectedMinuteInterval(nextMinuteInterval)
    setSelectedChartPeriod('MINUTE')
  }

  return {
    stockMeta,
    currentPrice,
    changeAmount,
    changeRate,
    overview,
    chartSeries,
    chartPeriod: selectedChartPeriod,
    minuteInterval: selectedMinuteInterval,
    chartLoading,
    chartErrorMessage,
    marketLoading: marketState.isLoading,
    marketErrorMessage: marketState.errorMessage,
    dailyRows: buildDailyRows(marketState.dailySeries),
    realtimeRows: buildRealtimeRows(getLatestMinuteSession(marketState.minuteSeries), previousClose),
    defaultSelectedPrice: currentPrice ?? stockMeta.price,
    availableAmount: stockMeta.availableAmount,
    onChartPeriodChange: setSelectedChartPeriod,
    onMinuteIntervalChange: handleMinuteIntervalChange,
  }
}
