import { useQuery } from '@tanstack/react-query'
import { newsApi } from '@/api/news'

export default function useStockNews(stockCode, size = 5) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-news', stockCode, size],
    queryFn: () => newsApi.getStockNews(stockCode, size),
    enabled: !!stockCode,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return { news: data ?? [], isLoading, error }
}
