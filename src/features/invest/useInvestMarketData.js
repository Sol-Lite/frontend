import { getExchcd } from '@/api/market'
import { DEFAULT_MINUTE_INTERVAL } from '@/features/invest/constants'
import {
  getChartPeriodConfig,
  getRecentMinuteSessions,
  resolveStockMeta,
} from '@/features/invest/marketData'
import useDomesticMarketData from '@/features/invest/domestic/useMarketData'
import useForeignMarketData from '@/features/invest/foreign/useMarketData'

export default function useInvestMarketData(stockCode, locationState) {
  const stockMeta = resolveStockMeta(stockCode, locationState)
  const { isDomestic } = stockMeta
  const exchcd = isDomestic ? null : getExchcd(stockMeta.exchangeCode)

  const domestic = useDomesticMarketData(stockCode, { enabled: isDomestic })
  const foreign = useForeignMarketData(stockCode, exchcd, { enabled: !isDomestic })

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
    dailyRows: active.dailyRows,
    realtimeRows: active.realtimeRows,
    orderBook: active.orderBook,
    opinion: detailState.opinion,
    investor: detailState.investor,
    finance: detailState.finance,
    detailLoading: detailState.isLoading,
    defaultSelectedPrice: currentPrice ?? stockMeta.price,
    availableAmount: stockMeta.availableAmount,
    onChartPeriodChange: active.setSelectedChartPeriod,
    onMinuteIntervalChange: active.handleMinuteIntervalChange,
  }
}
