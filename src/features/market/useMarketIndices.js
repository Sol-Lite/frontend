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
  USD:        '/topic/currency/USD',
}

function toNumberOrFallback(value, fallback) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalizeSignedValue(sign, value, fallback) {
  const numeric = toNumberOrFallback(value, fallback)
  if (numeric == null || numeric === 0) return numeric
  if (sign === '4' || sign === '5') return numeric > 0 ? -numeric : numeric
  if (sign === '1' || sign === '2') return numeric < 0 ? -numeric : numeric
  return numeric
}

export default function useMarketIndices() {
  const queryClient = useQueryClient()

  const { data: indices = [], isLoading } = useQuery({
    queryKey: ['market', 'indices'],
    queryFn: marketApi.getIndices,
    staleTime: 5 * 1000,
    refetchInterval: 10_000,
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
                    sign: body.sign ?? item.sign,
                    price: toNumberOrFallback(body.jisu ?? body.price ?? body.pricejisu, item.price),
                    change: normalizeSignedValue(body.sign ?? item.sign, body.change, item.change),
                    changeRate: normalizeSignedValue(body.sign ?? item.sign, body.drate ?? body.uprate, item.changeRate),
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
