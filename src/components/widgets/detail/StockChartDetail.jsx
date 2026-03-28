import { useState } from 'react'
import InvestStockOverview from '@/components/invest/InvestStockOverview'
import InvestOrderSection from '@/components/invest/InvestOrderSection'
import StockHoldingCard from './StockHoldingCard'
import useInvestMarketData from '@/features/invest/useInvestMarketData'
import {
  DISPLAY_CURRENCY,
  FALLBACK_USD_RATE,
  isForeignMarketType,
} from '@/features/invest/formatters'
import useCurrencyStore from '@/store/useCurrencyStore'
import { INVEST_STOCK } from '@/mocks/invest'

const WIDGET_PERIOD_MAP = {
  '1일': { initialPeriod: 'MINUTE', initialMinuteInterval: 5  },
  '1주': { initialPeriod: 'MINUTE', initialMinuteInterval: 30 },
  '1달': { initialPeriod: 'MINUTE', initialMinuteInterval: 60 },
  '3달': { initialPeriod: 'DAILY',  initialMinuteInterval: undefined },
}

export default function StockChartDetail({ config = {}, onClose }) {
  const stockCode     = config.stockCode ?? INVEST_STOCK.code
  const locationState = {
    stockName:    config.stockName  ?? null,
    stockNameEn:  null,
    marketType:   config.marketType ?? null,
    exchangeCode: null,
  }

  const periodInit = WIDGET_PERIOD_MAP[config.widgetPeriod] ?? {}

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
    orderBook,
    onChartPeriodChange,
    onLoadMoreChartHistory,
    onMinuteIntervalChange,
  } = useInvestMarketData(stockCode, locationState, { activeLeftTab: 'daily', ...periodInit })

  const marketType      = stockMeta.marketType ?? stockMeta.market
  const isForeignMarket = isForeignMarketType(marketType)
  const usdRate         = useCurrencyStore((s) => s.rates.USD?.rate ?? FALLBACK_USD_RATE)

  const [displayCurrencyOverrides, setDisplayCurrencyOverrides] = useState({})
  const displayCurrency = isForeignMarket
    ? (displayCurrencyOverrides[stockCode] ?? DISPLAY_CURRENCY.USD)
    : DISPLAY_CURRENCY.KRW

  function handleDisplayCurrencyChange(nextCurrency) {
    setDisplayCurrencyOverrides((prev) => ({ ...prev, [stockCode]: nextCurrency }))
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* 차트 + 호가창/주문 */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* 왼쪽: 차트 + 보유 현황 */}
        <div className="flex flex-col min-w-0 basis-0 flex-1 border-r border-stroke overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <InvestStockOverview
              hideSearch
              className="border-r-0"
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
          </div>
          <StockHoldingCard
            stockCode={stockCode}
            displayCurrency={displayCurrency}
            usdRate={usdRate}
          />
        </div>

        {/* 오른쪽: 호가창 + 주문 */}
        <InvestOrderSection
          key={stockCode}
          stockCode={stockCode}
          marketType={marketType}
          stockName={stockMeta.name}
          currentPrice={currentPrice}
          changeRate={changeRate}
          defaultPrice={currentPrice ?? stockMeta.price}
          orderBook={orderBook}
          displayCurrency={displayCurrency}
          usdRate={usdRate}
        />

      </div>

    </div>
  )
}
