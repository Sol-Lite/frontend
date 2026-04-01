import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/api/news'

const KR_INDICES = ['KOSPI', 'KOSDAQ']
const US_INDICES = ['NASDAQ', 'S&P500', 'DOW']

export default function useLatestNews(size = 10) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['news', 'latest', size],
    queryFn: () => newsApi.getLatestNews({ size }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const all = Array.isArray(data) ? data : []
  const kr  = all.filter((n) => !n.stockIndex || KR_INDICES.includes(n.stockIndex))
  const us  = all.filter((n) => US_INDICES.includes(n.stockIndex))

  return { news: all, krNews: kr, usNews: us, isLoading, error }
}
