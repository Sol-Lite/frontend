import { MarketContent } from '@/pages/MarketPage'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'

export default function RankingDetail({ config = {} }) {
  const openDetail = useWidgetDetailStore((s) => s.open)

  const handleStockClick = (stock) => {
    openDetail({ widgetTypeId: 'stock-chart', config: { stockCode: stock.stockCode, stockName: stock.name, marketType: stock.marketType ?? stock.market, exchangeCode: stock.exchangeCode } })
  }

  return <MarketContent initialSortFilter={config.initialSortFilter} initialMarketFilter={config.initialMarketFilter} onStockClick={handleStockClick} isModalMode={true} />
}
