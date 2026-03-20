import BalanceWidget from './BalanceWidget'
import IndexWidget from './IndexWidget'
import PortfolioWidget from './PortfolioWidget'
import StockChartWidget from './StockChartWidget'
import RankingWidget from './RankingWidget'
import WatchlistWidget from './WatchlistWidget'
import MarketOverviewWidget from './MarketOverviewWidget'
import StockNewsWidget from './StockNewsWidget'
import ExchangeWidget from './ExchangeWidget'
import TradeHistoryWidget from './TradeHistoryWidget'

export const WIDGET_REGISTRY = {
  'balance':         BalanceWidget,
  'index':           IndexWidget,
  'portfolio':       PortfolioWidget,
  'stock-chart':     StockChartWidget,
  'ranking':         RankingWidget,
  'watchlist':       WatchlistWidget,
  'market-overview': MarketOverviewWidget,
  'stock-news':      StockNewsWidget,
  'exchange':        ExchangeWidget,
  'trade-history':   TradeHistoryWidget,
}
