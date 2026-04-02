import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { foreignMarketApi, getExchcd, marketApi } from '@/api/market'
import { DEFAULT_MINUTE_INTERVAL } from '@/features/invest/constants'
import {
  getRecentMinuteSessions,
  resolveStockMeta,
} from '@/features/invest/marketData'
import useDomesticMarketData from '@/features/invest/domestic/useMarketData'
import useForeignMarketData from '@/features/invest/foreign/useMarketData'

export default function useInvestMarketData(stockCode, locationState, { activeLeftTab = 'daily', initialPeriod, initialMinuteInterval } = {}) {
  const baseStockMeta = resolveStockMeta(stockCode, locationState)
  const { isDomestic } = baseStockMeta
  const exchcd = isDomestic ? null : getExchcd(baseStockMeta.exchangeCode)

  const infoQuery = useQuery({
    queryKey: isDomestic
      ? ['domestic', 'info', stockCode]
      : ['foreign', 'info', stockCode, exchcd],
    queryFn: () => (isDomestic
      ? marketApi.getStockInfo(stockCode)
      : foreignMarketApi.getInfo(stockCode, exchcd)),
    enabled: isDomestic || Boolean(exchcd),
    staleTime: 1000 * 60 * 60 * 24,
  })

  const stockMeta = useMemo(() => {
    if (isDomestic) {
      const resolvedName = locationState?.stockName
        ?? infoQuery.data?.companyName
        ?? infoQuery.data?.stockName
        ?? infoQuery.data?.name
        ?? infoQuery.data?.htsKorIsnm
        ?? infoQuery.data?.prdtName
        ?? baseStockMeta.name
      const resolvedMarket = infoQuery.data?.marketName ?? baseStockMeta.market
      return {
        ...baseStockMeta,
        name: resolvedName,
        marketType: resolvedMarket,
        market: resolvedMarket,
        sector: infoQuery.data?.sector ?? baseStockMeta.sector,
      }
    }

    // exchangeName은 표시용(예: '나스닥'), marketType은 API 파라미터용(NASDAQ/NYSE/AMEX)
    const MARKET_TYPE_BY_EXCHCD = { '82': 'NASDAQ', '81': 'NYSE' }
    const resolvedMarketType = baseStockMeta.market ?? MARKET_TYPE_BY_EXCHCD[exchcd] ?? 'NASDAQ'
    return {
      ...baseStockMeta,
      marketType: resolvedMarketType,
      name: infoQuery.data?.korname ?? baseStockMeta.name,
      nameEn: infoQuery.data?.engname ?? baseStockMeta.nameEn,
      market: infoQuery.data?.exchangeName ?? baseStockMeta.market,
      sector: infoQuery.data?.induname ?? baseStockMeta.sector,
    }
  }, [baseStockMeta, infoQuery.data, isDomestic])

  const domestic = useDomesticMarketData(stockCode, { enabled: isDomestic, activeDetailTab: activeLeftTab, initialPeriod, initialMinuteInterval })
  const foreign = useForeignMarketData(stockCode, exchcd, { enabled: !isDomestic, activeDetailTab: activeLeftTab, initialPeriod, initialMinuteInterval })

  const active = isDomestic ? domestic : foreign
  const { marketState, chartState, detailState, selectedChartPeriod, selectedMinuteInterval } = active

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

  const minuteChartSeries = useMemo(() => getRecentMinuteSessions(
    selectedMinuteInterval === DEFAULT_MINUTE_INTERVAL
      ? marketState.minuteSeries
      : chartState.series,
  ), [
    chartState.series,
    marketState.minuteSeries,
    selectedMinuteInterval,
  ])

  const fallbackChartSeries = useMemo(() => (
    selectedChartPeriod === 'MINUTE'
      ? minuteChartSeries
      : selectedChartPeriod === 'DAILY'
        ? marketState.dailySeries
        : chartState.series
  ), [
    chartState.series,
    marketState.dailySeries,
    minuteChartSeries,
    selectedChartPeriod,
  ])
  const resolvedChartSeries = active.chartSeries ?? fallbackChartSeries

  const chartLoading = usesBaseChartData
    ? selectedChartPeriod === 'DAILY'
      ? marketState.dailyLoading
      : marketState.minuteLoading
    : chartState.isLoading
  const chartErrorMessage = usesBaseChartData
    ? selectedChartPeriod === 'DAILY'
      ? marketState.dailyErrorMessage
      : marketState.minuteErrorMessage
    : chartState.errorMessage

  return {
    stockMeta,
    currentPrice,
    changeAmount,
    changeRate,
    overview,
    chartSeries: resolvedChartSeries,
    chartPeriod: selectedChartPeriod,
    minuteInterval: selectedMinuteInterval,
    chartLoading,
    chartErrorMessage,
    chartHistoryLoading: active.chartHistoryLoading ?? false,
    chartHistoryErrorMessage: active.chartHistoryErrorMessage ?? '',
    hasMoreChartHistory: active.hasMoreChartHistory ?? false,
    marketLoading: marketState.isLoading,
    marketErrorMessage: marketState.errorMessage,
    dailyRows: active.dailyRows,
    realtimeRows: active.realtimeRows,
    orderBook: active.orderBook,
    opinion: detailState.opinion,
    investor: detailState.investor,
    finance: detailState.finance,
    detailLoading: detailState.isLoading,
    dailyLoading: active.dailyLoading ?? marketState.dailyLoading ?? false,
    realtimeLoading: active.realtimeLoading ?? marketState.minuteLoading ?? false,
    defaultSelectedPrice: currentPrice ?? stockMeta.price,
    availableAmount: stockMeta.availableAmount,
    onChartPeriodChange: active.setSelectedChartPeriod,
    onLoadMoreChartHistory: active.loadMoreChartHistory ?? (async () => {}),
    onMinuteIntervalChange: active.handleMinuteIntervalChange,
  }
}
