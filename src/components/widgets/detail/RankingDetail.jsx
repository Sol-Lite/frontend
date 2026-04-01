import { useState } from 'react'
import { MarketContent } from '@/pages/MarketPage'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'

export default function RankingDetail({ config = {} }) {
  const openDetail = useWidgetDetailStore((s) => s.open)

  const handleStockClick = (stock) => {
    openDetail({ widgetTypeId: 'stock-chart', config: { stockCode: stock.stockCode, stockName: stock.name, marketType: stock.marketType } })
  }

  return <MarketContent initialSortFilter={config.initialSortFilter} onStockClick={handleStockClick} isModalMode={true} />
}
