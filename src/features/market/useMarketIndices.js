import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { marketApi } from '@/api/market'
import { subscribeTopic } from '@/lib/stomp'

// 백엔드 code → WebSocket topic 매핑
const INDEX_TOPICS = {
  '001':      '/topic/index/domestic/001',
  '101':      '/topic/index/domestic/101',
  'SPI@SPX':  '/topic/index/foreign/SPI@SPX',
  'NAS@IXIC': '/topic/index/foreign/NAS@IXIC',
}

export default function useMarketIndices() {
  const queryClient = useQueryClient()

  const { data: indices = [], isLoading } = useQuery({
    queryKey: ['market', 'indices'],
    queryFn: marketApi.getIndices,
    staleTime: 5 * 1000,
    refetchInterval: (query) => {
      // 4개 미만이면 5초마다 재시도, 다 채워지면 30초
      const count = query.state.data?.length ?? 0
      return count < 4 ? 5_000 : 30_000
    },
  })

  useEffect(() => {
    if (!indices.length) return

    const subscriptions = indices
      .filter((idx) => INDEX_TOPICS[idx.code])
      .map((idx) =>
        subscribeTopic(INDEX_TOPICS[idx.code], (msg) => {
          const body = JSON.parse(msg.body)
          queryClient.setQueryData(['market', 'indices'], (prev) =>
            prev?.map((item) =>
              item.code === idx.code
                ? {
                    ...item,
                    price:      Number(body.price ?? body.pricejisu ?? item.price),
                    change:     Number(body.change ?? body.drate ?? item.change),
                    changeRate: Number(body.changeRate ?? body.drate ?? item.changeRate),
                  }
                : item,
            ),
          )
        }),
      )

    return () => subscriptions.forEach((s) => s?.unsubscribe())
  }, [indices.length, queryClient])

  return { indices, isLoading }
}
