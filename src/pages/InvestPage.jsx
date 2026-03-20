import { useState } from 'react'
import { useParams } from 'react-router-dom'
import InvestBottomPanels from '@/components/invest/InvestBottomPanels'
import InvestOrderSection from '@/components/invest/InvestOrderSection'
import InvestStockOverview from '@/components/invest/InvestStockOverview'
import useInvestMarketData from '@/features/invest/useInvestMarketData'
import { INVEST_STOCK } from '@/mocks/invest'

export default function InvestPage() {
  const { stockCode: routeStockCode } = useParams()
  const stockCode = routeStockCode ?? INVEST_STOCK.code
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
    marketLoading,
    marketErrorMessage,
    dailyRows,
    realtimeRows,
    availableAmount,
    onChartPeriodChange,
    onMinuteIntervalChange,
  } = useInvestMarketData(stockCode)

  const [leftTab, setLeftTab] = useState('daily')
  const [rightTab, setRightTab] = useState('exec')

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
            onChartPeriodChange={onChartPeriodChange}
            onMinuteIntervalChange={onMinuteIntervalChange}
            isLoading={marketLoading}
            errorMessage={marketErrorMessage}
          />

          <InvestOrderSection
            key={stockCode}
            stockName={stockMeta.name}
            availableAmount={availableAmount}
            currentPrice={currentPrice}
            changeRate={changeRate}
            defaultPrice={currentPrice ?? stockMeta.price}
          />
        </div>

        <InvestBottomPanels
          leftTab={leftTab}
          rightTab={rightTab}
          dailyRows={dailyRows}
          realtimeRows={realtimeRows}
          isLoading={marketLoading}
          errorMessage={marketErrorMessage}
          onLeftTabChange={setLeftTab}
          onRightTabChange={setRightTab}
        />
      </div>
    </div>
  )
}
