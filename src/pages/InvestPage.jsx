import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import InvestBottomPanels from '@/components/invest/InvestBottomPanels'
import InvestOrderSection from '@/components/invest/InvestOrderSection'
import InvestStockOverview from '@/components/invest/InvestStockOverview'
import {
  DISPLAY_CURRENCY,
  FALLBACK_USD_RATE,
  formatCurrency,
  isForeignMarketType,
} from '@/features/invest/formatters'
import { LAST_INVEST_PATH_KEY, LAST_INVEST_STATE_KEY } from '@/features/invest/navigation'
import useInvestMarketData from '@/features/invest/useInvestMarketData'
import { INVEST_STOCK } from '@/mocks/invest'
import useCurrencyStore from '@/store/useCurrencyStore'

const LEFT_TAB_KEY = 'invest.leftTab'
const RIGHT_TAB_KEY = 'invest.rightTab'

export default function InvestPage() {
  const { stockCode: routeStockCode } = useParams()
  const location = useLocation()
  const locationState = location.state
  const stockCode = routeStockCode ?? INVEST_STOCK.code
  const [leftTab, setLeftTab] = useState(() => localStorage.getItem(LEFT_TAB_KEY) ?? 'daily')
  const [rightTab, setRightTab] = useState(() => localStorage.getItem(RIGHT_TAB_KEY) ?? 'exec')

  const {
    stockMeta,
    currentPrice,
    changeAmount,
    changeRate,
    overview,
    chartSeries,
    chartPeriod,
    minuteInterval,
    chartLoading,
    chartErrorMessage,
    chartHistoryLoading,
    hasMoreChartHistory,
    marketLoading,
    marketErrorMessage,
    orderBookLoading,
    orderBookErrorMessage,
    dailyRows,
    realtimeRows,
    orderBook,
    opinion,
    investor,
    finance,
    detailLoading,
    dailyLoading,
    realtimeLoading,
    onChartPeriodChange,
    onLoadMoreChartHistory,
    onMinuteIntervalChange,
  } = useInvestMarketData(stockCode, locationState, { activeLeftTab: leftTab })
  const marketType = stockMeta.marketType ?? stockMeta.market
  const isForeignMarket = isForeignMarketType(marketType)
  const usdRate = useCurrencyStore((s) => s.rates.USD?.rate ?? FALLBACK_USD_RATE)
  const defaultDisplayCurrency = isForeignMarket ? DISPLAY_CURRENCY.USD : DISPLAY_CURRENCY.KRW
  const [displayCurrencyOverrides, setDisplayCurrencyOverrides] = useState({})
  const displayCurrency = isForeignMarket
    ? (displayCurrencyOverrides[stockCode] ?? defaultDisplayCurrency)
    : DISPLAY_CURRENCY.KRW

  function handleDisplayCurrencyChange(nextCurrency) {
    setDisplayCurrencyOverrides((prev) => ({
      ...prev,
      [stockCode]: nextCurrency,
    }))
  }

  useEffect(() => {
    localStorage.setItem(LEFT_TAB_KEY, leftTab)
  }, [leftTab])

  useEffect(() => {
    localStorage.setItem(RIGHT_TAB_KEY, rightTab)
  }, [rightTab])

  useEffect(() => {
    sessionStorage.setItem(LAST_INVEST_PATH_KEY, location.pathname)

    const nextState = {
      stockName: stockMeta.name,
      stockNameEn: stockMeta.nameEn ?? null,
      marketType,
      exchangeCode: stockMeta.exchangeCode ?? null,
    }
    sessionStorage.setItem(LAST_INVEST_STATE_KEY, JSON.stringify(nextState))
  }, [location.pathname, marketType, stockMeta.exchangeCode, stockMeta.name, stockMeta.nameEn])

  useEffect(() => {
    const stockName = stockMeta.name ?? '주문'
    const priceLabel = formatCurrency(currentPrice, { marketType, displayCurrency, usdRate })
    document.title = priceLabel === '-'
      ? stockName
      : `${stockName} | ${priceLabel}`
  }, [currentPrice, displayCurrency, marketType, stockMeta.name, usdRate])

  return (
    <div className="h-full overflow-x-auto bg-surface">
      <div className="flex h-full min-h-0 min-w-[900px] flex-col bg-surface">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <InvestStockOverview
            stockMeta={stockMeta}
            currentPrice={currentPrice}
            changeAmount={changeAmount}
            changeRate={changeRate}
            overview={overview}
            chartSeries={chartSeries}
            chartPeriod={chartPeriod}
            minuteInterval={minuteInterval}
            chartLoading={chartLoading}
            chartErrorMessage={chartErrorMessage}
            chartHistoryLoading={chartHistoryLoading}
            hasMoreChartHistory={hasMoreChartHistory}
            onChartPeriodChange={onChartPeriodChange}
            onLoadMoreChartHistory={onLoadMoreChartHistory}
            onMinuteIntervalChange={onMinuteIntervalChange}
            isLoading={marketLoading}
            errorMessage={marketErrorMessage}
            displayCurrency={displayCurrency}
            usdRate={usdRate}
            onDisplayCurrencyChange={handleDisplayCurrencyChange}
          />

          <InvestOrderSection
            key={stockCode}
            stockCode={stockCode}
            marketType={marketType}
            stockName={stockMeta.name}
            currentPrice={currentPrice}
            changeRate={changeRate}
            defaultPrice={currentPrice ?? stockMeta.price}
            orderBook={orderBook}
            orderBookLoading={orderBookLoading}
            orderBookErrorMessage={orderBookErrorMessage}
            displayCurrency={displayCurrency}
            usdRate={usdRate}
          />
        </div>

        <InvestBottomPanels
          stockCode={stockCode}
          leftTab={leftTab}
          rightTab={rightTab}
          dailyRows={dailyRows}
          realtimeRows={realtimeRows}
          opinion={opinion}
          investor={investor}
          finance={finance}
          detailLoading={detailLoading}
          dailyLoading={dailyLoading}
          realtimeLoading={realtimeLoading}
          errorMessage={marketErrorMessage}
          onLeftTabChange={setLeftTab}
          onRightTabChange={setRightTab}
          marketType={marketType}
          displayCurrency={displayCurrency}
          usdRate={usdRate}
        />
      </div>
    </div>
  )
}
