import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import useStompSubscription from '@/hooks/useStompSubscription'
import useCurrencyStore from '@/store/useCurrencyStore'
import { marketApi } from '@/api/market'

const TRACKED = ['USD', 'JPY', 'EUR']

// STOMP 연결 전 USD 초기값을 Yahoo Finance에서 받아 store에 채움
function UsdInitializer() {
  const setRate = useCurrencyStore((s) => s.setRate)
  const hasRate = useCurrencyStore((s) => s.rates['USD'] != null)

  useQuery({
    queryKey: ['currency', 'initial', 'USD'],
    queryFn: async () => {
      const res = await marketApi.getForexChart({ symbol: 'USDKRW=X', interval: '5m', range: '5d' })
      const candles = res.data ?? []
      if (!candles.length) return null
      const rate = Number(candles[candles.length - 1].close)
      if (!rate) return null
      setRate('USD', { rate, change: null, drate: null, offer: null, bid: null })
      return rate
    },
    enabled: !hasRate,
    staleTime: Infinity,
    retry: false,
  })

  return null
}

function CurrencySubscriber({ code }) {
  const msg = useStompSubscription(`/topic/currency/${code}`)
  const setRate = useCurrencyStore((s) => s.setRate)

  useEffect(() => {
    if (!msg) return
    setRate(code, {
      rate: Number(msg.price),
      change: Number(msg.change),
      drate: Number(msg.drate),
      offer: Number(msg.offer),
      bid: Number(msg.bid),
    })
  }, [msg, code, setRate])

  return null
}

export default function CurrencySync() {
  return (
    <>
      <UsdInitializer />
      {TRACKED.map((code) => <CurrencySubscriber key={code} code={code} />)}
    </>
  )
}
