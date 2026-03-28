import MarketPage from '@/pages/MarketPage'

export default function RankingDetail({ config = {} }) {
  return <MarketPage initialSortFilter={config.initialSortFilter} />
}
