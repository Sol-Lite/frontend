import { Client } from '@stomp/stompjs'
import useAuthStore from '@/store/useAuthStore'

let client = null
const pendingSubscriptions = []

export function getStompClient() {
  if (client) return client

  const token = useAuthStore.getState().accessToken

  if (!token) {
    console.warn('[STOMP] 토큰 없음 — 연결 생략')
    return null
  }

  client = new Client({
    brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
    connectHeaders: { Authorization: `Bearer ${token}` },
    beforeConnect: () => {
      const freshToken = useAuthStore.getState().accessToken
      if (freshToken) {
        client.connectHeaders = { Authorization: `Bearer ${freshToken}` }
      } else {
        client.deactivate()
      }
    },
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: (msg) => {
      console.log('[STOMP]', msg)
    },
    onConnect: () => {
      console.log('[STOMP] 연결 성공')
      pendingSubscriptions.forEach((fn) => fn())
      pendingSubscriptions.length = 0
    },
    onStompError: (frame) => {
      console.error('[STOMP] 에러:', frame.headers.message)
    },
    onWebSocketError: (event) => {
      console.error('[STOMP] WebSocket 에러:', event)
    },
    onDisconnect: () => {
      console.log('[STOMP] 연결 종료')
    },
  })

  client.activate()
  return client
}

export function subscribeTopic(topic, callback) {
  const stompClient = getStompClient()

  if (!stompClient) return { unsubscribe: () => {} }

  if (stompClient.connected) {
    return stompClient.subscribe(topic, callback)
  }

  let subscription = null
  let cancelled = false

  const pending = () => {
    if (!cancelled) {
      subscription = stompClient.subscribe(topic, callback)
    }
  }

  pendingSubscriptions.push(pending)

  return {
    unsubscribe: () => {
      cancelled = true
      subscription?.unsubscribe()
      const idx = pendingSubscriptions.indexOf(pending)
      if (idx !== -1) pendingSubscriptions.splice(idx, 1)
    },
  }
}

export function deactivateStompClient() {
  if (client) {
    client.deactivate()
    client = null
  }
}
