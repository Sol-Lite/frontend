import { useEffect } from 'react'
import useStompSubscription from '@/hooks/useStompSubscription'
import useCurrencyStore from '@/store/useCurrencyStore'

const TRACKED = ['USD']

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
  return TRACKED.map((code) => <CurrencySubscriber key={code} code={code} />)
}
