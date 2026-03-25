import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { marketApi } from '@/api/market'
import { subscribeTopic } from '@/lib/stomp'

const DEBUG_MARKET_INDICES = import.meta.env.DEV

// 백엔드 code → WebSocket topic 매핑
const INDEX_TOPICS = {
  '001':      '/topic/index/domestic/001',
  '301':      '/topic/index/domestic/301',
  'SPI@SPX':  '/topic/index/foreign/SPI@SPX',
  'NAS@IXIC': '/topic/index/foreign/NAS@IXIC',
  USD:        '/topic/currency/USD',
}

function summarizeIndex(item) {
  return {
    code: item.code,
    sign: item.sign,
    price: item.price,
    change: item.change,
    changeRate: item.changeRate,
  }
}

function logMarketIndices(event, payload) {
  if (!DEBUG_MARKET_INDICES) return
  console.debug(`[market:indices] ${event}`, payload)
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
    queryFn: async () => {
      const response = await marketApi.getIndices()
      logMarketIndices('REST response', response.map(summarizeIndex))
      return response
    },
    staleTime: 5 * 1000,
    refetchInterval: 10_000,
  })

  const subscriptionSignature = indices
    .map((idx) => idx.code)
    .filter((code) => INDEX_TOPICS[code])
    .join('|')

  const subscriptionTargets = useMemo(() => (
    subscriptionSignature
      ? subscriptionSignature.split('|').map((code) => ({
          code,
          topic: INDEX_TOPICS[code],
        }))
      : []
  ), [subscriptionSignature])

  useEffect(() => {
    if (!subscriptionTargets.length) return

    logMarketIndices('WS subscribe', subscriptionTargets)

    const subscriptions = subscriptionTargets
      .map((target) =>
        subscribeTopic(target.topic, (msg) => {
          const body = JSON.parse(msg.body)
          queryClient.setQueryData(['market', 'indices'], (prev) =>
            prev?.map((item) =>
              item.code === target.code
                ? (() => {
                    const nextItem = {
                    ...item,
                    sign: body.sign ?? item.sign,
                    price: toNumberOrFallback(body.jisu ?? body.price ?? body.pricejisu, item.price),
                    change: normalizeSignedValue(body.sign ?? item.sign, body.change, item.change),
                    changeRate: normalizeSignedValue(body.sign ?? item.sign, body.drate ?? body.uprate, item.changeRate),
                    }
                    logMarketIndices('WS message', {
                      code: target.code,
                      topic: target.topic,
                      raw: body,
                      next: summarizeIndex(nextItem),
                    })
                    return nextItem
                  })()
                : item,
            ),
          )
        }),
      )

    return () => {
      logMarketIndices('WS unsubscribe', subscriptionTargets)
      subscriptions.forEach((s) => s?.unsubscribe())
    }
  }, [queryClient, subscriptionTargets])

  return { indices, isLoading }
}
