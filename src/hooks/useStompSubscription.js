import { useEffect, useRef, useState } from 'react'
import { subscribeTopic } from '@/lib/stomp'

export default function useStompSubscription(topic) {
  const [data, setData] = useState(null)
  const subRef = useRef(null)

  useEffect(() => {
    setData(null)
    if (!topic) return

    subRef.current = subscribeTopic(topic, (message) => {
      setData(JSON.parse(message.body))
    })

    return () => {
      subRef.current?.unsubscribe()
      subRef.current = null
    }
  }, [topic])

  return data
}
