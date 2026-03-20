import { useEffect, useState } from 'react'
import { marketApi, foreignMarketApi, getExchcd } from '@/api/market'
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
  normalizeForeignDailySeries,
  normalizeForeignMinuteSeries,
  normalizeOrderBook,
  normalizeForeignOrderBook,
  resolveStockMeta,
} from '@/features/invest/marketData'
import useStompSubscription from '@/hooks/useStompSubscription'

const INITIAL_MARKET_STATE = {
  isLoading: true,
  errorMessage: '',
  priceData: null,
  dailySeries: [],
  minuteSeries: [],
  orderBook: null,
}

const INITIAL_CHART_STATE = {
  isLoading: true,
  errorMessage: '',
  series: [],
}

const INITIAL_DETAIL_STATE = {
  isLoading: true,
  opinion: null,
  investor: null,
  finance: null,
}

export default function useInvestMarketData(stockCode, locationState) {
  const stockMeta = resolveStockMeta(stockCode, locationState)
  const { isDomestic } = stockMeta
  const exchcd = isDomestic ? null : getExchcd(stockMeta.exchangeCode)

  const [marketState, setMarketState] = useState(INITIAL_MARKET_STATE)
  const [selectedChartPeriod, setSelectedChartPeriod] = useState('MINUTE')
  const [selectedMinuteInterval, setSelectedMinuteInterval] = useState(DEFAULT_MINUTE_INTERVAL)
  const [chartState, setChartState] = useState(INITIAL_CHART_STATE)
  const [detailState, setDetailState] = useState(INITIAL_DETAIL_STATE)

  // 국내주식 상세 데이터 (투자의견, 투자자, 재무)
  useEffect(() => {
    if (!isDomestic) {
      setDetailState({ isLoading: false, opinion: null, investor: null, finance: null })
      return
    }

    let isCancelled = false

    async function loadDetailData() {
      setDetailState(INITIAL_DETAIL_STATE)

      const [opinion, investor, finance] = await Promise.allSettled([
        marketApi.getOpinion(stockCode),
        marketApi.getInvestor(stockCode),
        marketApi.getFinance(stockCode),
      ])

      if (isCancelled) return

      setDetailState({
        isLoading: false,
        opinion: opinion.status === 'fulfilled' ? opinion.value : null,
        investor: investor.status === 'fulfilled' ? investor.value : null,
        finance: finance.status === 'fulfilled' ? finance.value : null,
      })
    }

    loadDetailData()

    return () => {
      isCancelled = true
    }
  }, [stockCode, isDomestic])

  // 시장 데이터 (현재가, 차트, 호가)
  useEffect(() => {
    let isCancelled = false

    async function loadDomesticData() {
      setMarketState(INITIAL_MARKET_STATE)

      try {
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 180 * DAY_MS)

        const [priceData, chartData, minuteChartData, orderBookData] = await Promise.all([
          marketApi.getCurrentPrice(stockCode),
          marketApi.getChart(stockCode, {
            period: 'DAILY',
            startDate: formatApiDate(startDate),
            endDate: formatApiDate(endDate),
          }),
          marketApi.getMinuteChart(stockCode, { ncnt: DEFAULT_MINUTE_INTERVAL }),
          marketApi.getOrderBook(stockCode),
        ])

        if (isCancelled) return

        setMarketState({
          isLoading: false,
          errorMessage: '',
          priceData,
          dailySeries: normalizeDailySeries(chartData?.data),
          minuteSeries: normalizeMinuteSeries(minuteChartData?.data),
          orderBook: orderBookData,
        })
      } catch (error) {
        if (isCancelled) return

        setMarketState({
          isLoading: false,
          errorMessage: error?.message ?? '시장 데이터를 불러오지 못했습니다.',
          priceData: null,
          dailySeries: [],
          minuteSeries: [],
          orderBook: null,
        })
      }
    }

    async function loadForeignData() {
      setMarketState(INITIAL_MARKET_STATE)

      try {
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 180 * DAY_MS)

        const [priceData, chartData, minuteChartData, orderBookData] = await Promise.all([
          foreignMarketApi.getCurrentPrice(stockCode, exchcd),
          foreignMarketApi.getChart(stockCode, exchcd, {
            period: 'DAY',
            startDate: formatApiDate(startDate),
            endDate: formatApiDate(endDate),
          }),
          foreignMarketApi.getMinuteChart(stockCode, exchcd, { nmin: DEFAULT_MINUTE_INTERVAL }),
          foreignMarketApi.getOrderBook(stockCode, exchcd),
        ])

        if (isCancelled) return

        setMarketState({
          isLoading: false,
          errorMessage: '',
          priceData: {
            currentPrice: priceData.price,
            changeAmount: priceData.diff,
            changeRate: priceData.rate,
          },
          dailySeries: normalizeForeignDailySeries(chartData?.dataPoints),
          minuteSeries: normalizeForeignMinuteSeries(minuteChartData?.dataPoints),
          orderBook: orderBookData,
        })
      } catch (error) {
        if (isCancelled) return

        setMarketState({
          isLoading: false,
          errorMessage: error?.message ?? '시장 데이터를 불러오지 못했습니다.',
          priceData: null,
          dailySeries: [],
          minuteSeries: [],
          orderBook: null,
        })
      }
    }

    if (isDomestic) {
      loadDomesticData()
    } else {
      loadForeignData()
    }

    return () => {
      isCancelled = true
    }
  }, [stockCode, isDomestic, exchcd])

  // 차트 기간 변경
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
          if (isDomestic) {
            const minuteChartData = await marketApi.getMinuteChart(stockCode, { ncnt: selectedMinuteInterval })
            nextSeries = normalizeMinuteSeries(minuteChartData?.data)
          } else {
            const minuteChartData = await foreignMarketApi.getMinuteChart(stockCode, exchcd, { nmin: selectedMinuteInterval })
            nextSeries = normalizeForeignMinuteSeries(minuteChartData?.dataPoints)
          }
        } else {
          const config = getChartPeriodConfig(selectedChartPeriod)
          const endDate = new Date()
          const startDate = new Date(endDate.getTime() - config.lookbackDays * DAY_MS)

          if (isDomestic) {
            const chartData = await marketApi.getChart(stockCode, {
              period: config.apiPeriod,
              startDate: formatApiDate(startDate),
              endDate: formatApiDate(endDate),
            })
            nextSeries = normalizeDailySeries(chartData?.data)
          } else {
            const chartData = await foreignMarketApi.getChart(stockCode, exchcd, {
              period: config.foreignApiPeriod,
              startDate: formatApiDate(startDate),
              endDate: formatApiDate(endDate),
            })
            nextSeries = normalizeForeignDailySeries(chartData?.dataPoints)
          }
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
  }, [stockCode, selectedChartPeriod, selectedMinuteInterval, isDomestic, exchcd])

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

  const stompTopic = isDomestic
    ? `/topic/asking/${stockCode}`
    : `/topic/foreign/quote/${stockCode}`
  const liveOrderBook = useStompSubscription(stompTopic)
  const normalizeOB = isDomestic ? normalizeOrderBook : normalizeForeignOrderBook
  const orderBook = normalizeOB(liveOrderBook) ?? normalizeOB(marketState.orderBook)

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
    orderBook,
    opinion: detailState.opinion,
    investor: detailState.investor,
    finance: detailState.finance,
    detailLoading: detailState.isLoading,
    defaultSelectedPrice: currentPrice ?? stockMeta.price,
    availableAmount: stockMeta.availableAmount,
    onChartPeriodChange: setSelectedChartPeriod,
    onMinuteIntervalChange: handleMinuteIntervalChange,
  }
}
