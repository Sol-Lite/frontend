import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import InvestBottomPanels from '@/components/invest/InvestBottomPanels'
import InvestOrderSection from '@/components/invest/InvestOrderSection'
import InvestStockOverview from '@/components/invest/InvestStockOverview'
import useInvestMarketData from '@/features/invest/useInvestMarketData'
import { INVEST_STOCK } from '@/mocks/invest'

export default function InvestPage() {
  const { stockCode: routeStockCode } = useParams()
  const { state: locationState } = useLocation()
  const stockCode = routeStockCode ?? INVEST_STOCK.code
  const [leftTab, setLeftTab] = useState('daily')
  const [rightTab, setRightTab] = useState('exec')

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
          />

          <InvestOrderSection
            key={stockCode}
            stockCode={stockCode}
            marketType={stockMeta.market}
            stockName={stockMeta.name}
            currentPrice={currentPrice}
            changeRate={changeRate}
            defaultPrice={currentPrice ?? stockMeta.price}
            orderBook={orderBook}
          />
        </div>

        <InvestBottomPanels
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
        />
      </div>
    </div>
  )
}
