import { MarketContent } from '@/pages/MarketPage'

export default function RankingDetail({ config = {} }) {
  return <MarketContent initialSortFilter={config.initialSortFilter} />
}
