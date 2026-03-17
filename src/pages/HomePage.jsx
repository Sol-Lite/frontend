import LiveDot from '@/components/ui/LiveDot'
import BalanceWidget from '@/components/widgets/BalanceWidget'
import IndexWidget from '@/components/widgets/IndexWidget'
import PortfolioWidget from '@/components/widgets/PortfolioWidget'
import StockChartWidget from '@/components/widgets/StockChartWidget'
import RankingWidget from '@/components/widgets/RankingWidget'
import WatchlistWidget from '@/components/widgets/WatchlistWidget'
import MarketOverviewWidget from '@/components/widgets/MarketOverviewWidget'
import ExchangeWidget from '@/components/widgets/ExchangeWidget'
import AddWidgetSlot from '@/components/widgets/AddWidgetSlot'
import { HOME_STOCKS } from '@/mocks/home'

export default function HomePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-2.5">
      {/* 서브바 */}
      <div className="flex items-center justify-between shrink-0 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-foreground">나의 대시보드</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background border border-stroke">
            <LiveDot size="sm" />
            <span className="text-[10px] text-foreground-disabled">실시간 반영</span>
          </div>
        </div>
      </div>

      {/* 위젯 그리드: 4열 × 3행 */}
      <div className="grid grid-cols-4 grid-rows-3 gap-[10px] flex-1 min-h-0">
        {/* Row 1 */}
        <BalanceWidget />
        <IndexWidget />
        <PortfolioWidget />

        {/* Row 2 */}
        <StockChartWidget stock={HOME_STOCKS[0]} />
        <RankingWidget />
        <WatchlistWidget />

        {/* Row 3 */}
        <MarketOverviewWidget />
        <ExchangeWidget />
        <StockChartWidget stock={HOME_STOCKS[1]} />
        <AddWidgetSlot />
      </div>
    </div>
  )
}
