import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { marketApi } from '@/api/market'
import { DAY_MS, DEFAULT_MINUTE_INTERVAL } from '@/features/invest/constants'
import { formatApiDate } from '@/features/invest/formatters'
import {
  buildDailyRows,
  buildTickRows,
  buildRealtimeRows,
  getChartPeriodConfig,
  getLatestMinuteSession,
} from '@/features/invest/marketData'
import { normalizeDailySeries, normalizeMinuteSeries, normalizeOrderBook } from '@/features/invest/domestic/normalize'
import useStompSubscription from '@/hooks/useStompSubscription'

const DAILY_HISTORY_LIMIT = 200
const MINUTE_HISTORY_LIMIT = 500

const STALE = {
  price: 1000 * 5,
  minuteChart: 1000 * 30,
  dailyChart: 1000 * 60 * 5,
  orderBook: 1000 * 5,
  detail: 1000 * 60 * 60,
  finance: 1000 * 60 * 60,
}

function mergeSeriesByTimestamp(...seriesGroups) {
  const merged = new Map()

  seriesGroups
    .flat()
    .forEach((point) => {
      if (!point || !Number.isFinite(point.timestamp)) return
      merged.set(point.timestamp, point)
    })

  return Array.from(merged.values())
    .sort((left, right) => left.timestamp - right.timestamp)
}

function applyLiveCandle(minuteSeries, liveCandle) {
  if (!liveCandle || minuteSeries.length === 0) return minuteSeries

  const last = minuteSeries.at(-1)
  if (!last) return minuteSeries

  if (liveCandle.timestamp === last.timestamp) {
    return [
      ...minuteSeries.slice(0, -1),
      {
        ...last,
        high: Math.max(last.high, liveCandle.high),
        low: Math.min(last.low, liveCandle.low),
        close: liveCandle.close,
        volume: last.volume + liveCandle.volume,
      },
    ]
  }

  if (liveCandle.timestamp > last.timestamp) {
    return [...minuteSeries, liveCandle]
  }

  return minuteSeries
}

function applyLiveDailyPrice(dailySeries, livePrice) {
  if (!livePrice || dailySeries.length === 0) return dailySeries

  const last = dailySeries.at(-1)
  if (!last) return dailySeries

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayTs = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).getTime()

  const price = livePrice.currentPrice
  const open  = livePrice.todayOpen  ?? price
  const high  = livePrice.todayHigh  ?? price
  const low   = livePrice.todayLow   ?? price
  const vol   = livePrice.todayVolume ?? 0

  const liveChangeRate = livePrice.changeRate ?? null

  // 오늘 행이 이미 있으면 실시간 업데이트
  if (last.date === todayKey) {
    return [
      ...dailySeries.slice(0, -1),
      {
        ...last,
        open,
        high: Math.max(last.high, high),
        low:  Math.min(last.low,  low),
        close: price,
        volume: vol > 0 ? vol : last.volume,
        liveChangeRate,
      },
    ]
  }

  // 오늘 행이 없으면 (REST가 어제까지만 줬을 때) 새로 추가
  return [
    ...dailySeries,
    { date: todayKey, timestamp: todayTs, open, high, low, close: price, volume: vol, liveChangeRate },
  ]
}

function formatLocalDateTime(timestamp) {
  const date = new Date(timestamp)
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`
}

export default function useDomesticMarketData(stockCode, { enabled, activeDetailTab = 'daily', initialPeriod, initialMinuteInterval }) {
  const [selectedChartPeriod, setSelectedChartPeriod] = useState(
    () => initialPeriod ?? localStorage.getItem('invest.chartPeriod') ?? 'MINUTE',
  )
  const [selectedMinuteInterval, setSelectedMinuteInterval] = useState(
    () => initialMinuteInterval ?? (Number(localStorage.getItem('invest.minuteInterval')) || DEFAULT_MINUTE_INTERVAL),
  )
  const [liveCandle, setLiveCandle] = useState(null)
  const [liveTrades, setLiveTrades] = useState([])
  const [livePrice, setLivePrice] = useState(null)
  const [chartHistorySeries, setChartHistorySeries] = useState([])
  const [chartHistoryLoading, setChartHistoryLoading] = useState(false)
  const [chartHistoryErrorMessage, setChartHistoryErrorMessage] = useState('')
  const [hasMoreChartHistory, setHasMoreChartHistory] = useState(true)
  const historyLoadingRef = useRef(false)

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
    enabled: enabled && activeDetailTab === 'opinion',
    staleTime: STALE.detail,
  })

  const investorQuery = useQuery({
    queryKey: ['domestic', 'investor', stockCode],
    queryFn: () => marketApi.getInvestor(stockCode),
    enabled: enabled && activeDetailTab === 'investor',
    staleTime: STALE.detail,
  })

  const financeQuery = useQuery({
    queryKey: ['domestic', 'finance', stockCode],
    queryFn: () => marketApi.getFinance(stockCode),
    enabled: enabled && activeDetailTab === 'finance',
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
    setLiveTrades([])
    setLivePrice(null)
  }, [stockCode, selectedMinuteInterval])

  useEffect(() => {
    historyLoadingRef.current = false
    setChartHistorySeries([])
    setChartHistoryLoading(false)
    setChartHistoryErrorMessage('')
    setHasMoreChartHistory(true)
  }, [stockCode, selectedChartPeriod, selectedMinuteInterval])

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

    setLiveTrades((prev) => [{
      chetime,
      price,
      cvolume: volume,
      isBuy: liveTrade.cgubun === '+',
      drate: Number(liveTrade.drate ?? 0),
      totalVolume: Number(liveTrade.volume ?? 0),
    }, ...prev].slice(0, 300))

    const changeRate = Number(liveTrade.drate ?? 0)
    // LS US3: change는 절댓값, sign(1/2=상승 3=보합 4/5=하락) 또는 drate 부호로 방향 결정
    const sign = liveTrade.sign
    const changeDir = sign
      ? (['4', '5'].includes(String(sign)) ? -1 : ['1', '2'].includes(String(sign)) ? 1 : 0)
      : Math.sign(changeRate)
    const changeAmount = changeDir * Math.abs(Number(liveTrade.change ?? 0))

    setLivePrice((prev) => ({
      currentPrice: price,
      changeAmount,
      changeRate,
      todayOpen: prev?.todayOpen ?? price,
      todayHigh: Math.max(prev?.todayHigh ?? price, price),
      todayLow: Math.min(prev?.todayLow ?? price, price),
      todayVolume: Number(liveTrade.volume ?? 0),
    }))
  }, [liveTrade, selectedMinuteInterval])

  const customSeries = useMemo(() => (
    customChartQuery.data
      ? (selectedChartPeriod === 'MINUTE'
          ? normalizeMinuteSeries(customChartQuery.data?.data)
          : normalizeDailySeries(customChartQuery.data?.data))
      : []
  ), [customChartQuery.data, selectedChartPeriod])

  const minuteSeriesWithLive = useMemo(
    () => applyLiveCandle(minuteSeries, liveCandle),
    [minuteSeries, liveCandle],
  )

  const customMinuteSeriesWithLive = useMemo(
    () => applyLiveCandle(selectedChartPeriod === 'MINUTE' ? customSeries : [], liveCandle),
    [customSeries, liveCandle, selectedChartPeriod],
  )

  const dailySeriesWithLive = useMemo(
    () => applyLiveDailyPrice(dailySeries, livePrice ?? priceQuery.data ?? null),
    [dailySeries, livePrice, priceQuery.data],
  )

  const baseChartSeries = useMemo(() => {
    if (selectedChartPeriod === 'MINUTE') {
      return usesBaseMinuteData ? minuteSeriesWithLive : customMinuteSeriesWithLive
    }

    if (selectedChartPeriod === 'DAILY') {
      return dailySeriesWithLive
    }

    return customSeries
  }, [
    customMinuteSeriesWithLive,
    customSeries,
    dailySeriesWithLive,
    minuteSeriesWithLive,
    selectedChartPeriod,
    usesBaseMinuteData,
  ])

  const chartSeries = useMemo(
    () => mergeSeriesByTimestamp(chartHistorySeries, baseChartSeries),
    [chartHistorySeries, baseChartSeries],
  )

  const marketState = {
    isLoading: priceQuery.isLoading || dailyChartQuery.isLoading || minuteChartQuery.isLoading || orderBookQuery.isLoading,
    errorMessage: (priceQuery.error || dailyChartQuery.error || minuteChartQuery.error || orderBookQuery.error)?.message ?? '',
    dailyLoading: dailyChartQuery.isLoading,
    dailyErrorMessage: dailyChartQuery.error?.message ?? '',
    minuteLoading: minuteChartQuery.isLoading,
    minuteErrorMessage: minuteChartQuery.error?.message ?? '',
    priceData: livePrice ?? priceQuery.data ?? null,
    dailySeries: dailySeriesWithLive,
    minuteSeries: minuteSeriesWithLive,
    orderBook: orderBookQuery.data ?? null,
  }

  const chartState = {
    isLoading: customChartQuery.isLoading,
    errorMessage: customChartQuery.error?.message ?? '',
    series: customSeries,
  }

  const detailState = {
    isLoading: activeDetailTab === 'opinion'
      ? opinionQuery.isLoading
      : activeDetailTab === 'investor'
        ? investorQuery.isLoading
        : activeDetailTab === 'finance'
          ? financeQuery.isLoading
          : false,
    opinion: opinionQuery.data ?? null,
    investor: investorQuery.data ?? null,
    finance: financeQuery.data ?? null,
  }

  const liveOrderBook = useStompSubscription(enabled ? `/topic/asking/${stockCode}` : null)
  const orderBook = normalizeOrderBook(liveOrderBook) ?? normalizeOrderBook(marketState.orderBook)

  const previousClose = dailySeriesWithLive.at(-2)?.close ?? null
  const dailyRows = useMemo(
    () => buildDailyRows(dailySeriesWithLive),
    [dailySeriesWithLive],
  )
  const realtimeRows = useMemo(
    () => (liveTrades.length > 0
      ? buildTickRows(liveTrades)
      : buildRealtimeRows(getLatestMinuteSession(minuteSeriesWithLive), previousClose)),
    [liveTrades, minuteSeriesWithLive, previousClose],
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

  async function loadMoreChartHistory() {
    if (!enabled || historyLoadingRef.current || !hasMoreChartHistory || chartSeries.length === 0) {
      return
    }

    const earliestPoint = chartSeries[0]
    if (!earliestPoint) return

    historyLoadingRef.current = true
    setChartHistoryLoading(true)
    setChartHistoryErrorMessage('')

    try {
      if (selectedChartPeriod === 'MINUTE') {
        const response = await marketApi.getMinuteChartHistory(stockCode, {
          ncnt: selectedMinuteInterval,
          before: formatLocalDateTime(earliestPoint.timestamp),
          limit: MINUTE_HISTORY_LIMIT,
        })

        const fetchedSeries = normalizeMinuteSeries(response?.data)
        const olderSeries = fetchedSeries.filter((point) => point.timestamp < earliestPoint.timestamp)

        if (olderSeries.length === 0) {
          setHasMoreChartHistory(false)
          return
        }

        setChartHistorySeries((prev) => mergeSeriesByTimestamp(prev, olderSeries))

        if (fetchedSeries.length < MINUTE_HISTORY_LIMIT) {
          setHasMoreChartHistory(false)
        }
        return
      }

      const response = await marketApi.getChartHistory(stockCode, {
        period: selectedChartPeriod,
        before: earliestPoint.date,
        limit: DAILY_HISTORY_LIMIT,
      })

      const fetchedSeries = normalizeDailySeries(response?.data)
      const olderSeries = fetchedSeries.filter((point) => point.timestamp < earliestPoint.timestamp)

      if (olderSeries.length === 0) {
        setHasMoreChartHistory(false)
        return
      }

      setChartHistorySeries((prev) => mergeSeriesByTimestamp(prev, olderSeries))

      if (fetchedSeries.length < DAILY_HISTORY_LIMIT) {
        setHasMoreChartHistory(false)
      }
    } catch (error) {
      setChartHistoryErrorMessage(error?.message ?? '과거 차트 데이터를 불러오지 못했습니다.')
    } finally {
      historyLoadingRef.current = false
      setChartHistoryLoading(false)
    }
  }

  return {
    marketState,
    chartState,
    detailState,
    chartSeries,
    chartHistoryLoading,
    chartHistoryErrorMessage,
    hasMoreChartHistory,
    loadMoreChartHistory,
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
