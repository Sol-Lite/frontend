import { useRef } from 'react'
import { Drawer } from 'vaul'
import { X, ChevronLeft } from 'lucide-react'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'
import StockChartDetail from './detail/StockChartDetail'
import BalanceDetail from './detail/BalanceDetail'
import RankingDetail from './detail/RankingDetail'
import IndexDetail from './detail/IndexDetail'
import MarketNewsDetail from './detail/MarketNewsDetail'
import StockNewsDetail from './detail/StockNewsDetail'
import WatchlistDetail from './detail/WatchlistDetail'
import ExchangeDetail from './detail/ExchangeDetail'
import TradeHistoryDetail from './detail/TradeHistoryDetail'

const DETAIL_MAP = {
  'stock-chart':     StockChartDetail,
  'balance':         BalanceDetail,
  'ranking':         RankingDetail,
  'index':           IndexDetail,
  'market-overview': MarketNewsDetail,
  'stock-news':      StockNewsDetail,
  'watchlist':       WatchlistDetail,
  'exchange':        ExchangeDetail,
  'trade-history':   TradeHistoryDetail,
}

export default function WidgetDetailModal() {
  const { openWidget, close, back, history } = useWidgetDetailStore()
  const canGoBack = history.length > 0

  // 닫힘 애니메이션 중에도 마지막 위젯 유지
  const localWidget = useRef(null)
  if (openWidget) localWidget.current = openWidget

  const DetailComp = localWidget.current ? DETAIL_MAP[localWidget.current.widgetTypeId] : null

  return (
    <Drawer.Root
      open={!!openWidget}
      onOpenChange={(open) => { if (!open) close() }}
      noBodyStyles
    >
      {/* 오버레이 — main 영역에만 국한 */}
      <Drawer.Overlay className="absolute inset-0 z-40 bg-black/10" />

      {/* 시트 — Portal 없이 main 안에서 absolute */}
      <Drawer.Content className="absolute inset-x-0 bottom-0 z-40 h-[99%] bg-surface rounded-t-[20px] shadow-modal flex flex-col outline-none">
        {/* 헤더 (드래그 핸들 영역) */}
        <div className="relative flex items-center justify-between pt-2.5 pb-1.5 px-4 shrink-0">
          <Drawer.Handle className="!absolute !left-1/2 !top-3 !-translate-x-1/2 !w-9 !h-1 !rounded-full !bg-stroke !opacity-100" />
          {canGoBack ? (
            <button
              onClick={back}
              className="p-1 rounded-lg hover:bg-surface-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-foreground-tertiary" />
            </button>
          ) : (
            <div className="w-6" />
          )}
          <button
            onClick={() => close()}
            className="p-1 rounded-lg hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4 text-foreground-tertiary" />
          </button>
        </div>

        {DetailComp && localWidget.current && (
          <DetailComp
            config={localWidget.current.config}
            onClose={() => close()}
          />
        )}
      </Drawer.Content>
    </Drawer.Root>
  )
}
