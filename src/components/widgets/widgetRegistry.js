import BalanceWidget from './BalanceWidget'
import IndexWidget from './IndexWidget'
import PortfolioWidget from './PortfolioWidget'
import StockChartWidget from './StockChartWidget'
import RankingWidget from './RankingWidget'
import WatchlistWidget from './WatchlistWidget'
import MarketOverviewWidget from './MarketOverviewWidget'
import ExchangeWidget from './ExchangeWidget'
import TradeHistoryWidget from './TradeHistoryWidget'
import ReportWidget from './ReportWidget'

export const WIDGET_REGISTRY = {
  'balance':         BalanceWidget,
  'index':           IndexWidget,
  'portfolio':       PortfolioWidget,
  'stock-chart':     StockChartWidget,
  'ranking':         RankingWidget,
  'watchlist':       WatchlistWidget,
  'market-overview': MarketOverviewWidget,
  'exchange':        ExchangeWidget,
  'trade-history':   TradeHistoryWidget,
  'report':          ReportWidget,
}
