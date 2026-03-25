import { Client } from '@stomp/stompjs'
import useAuthStore from '@/store/useAuthStore'

let client = null
let subscriptionSeq = 0
const activeSubscriptions = new Map()

function subscribeEntry(stompClient, entry) {
  if (!stompClient?.connected) return
  entry.liveSubscription = stompClient.subscribe(entry.topic, entry.callback)
}

export function getStompClient() {
  if (client) return client

  client = new Client({
    brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
    connectHeaders: {},
    beforeConnect: () => {
      const freshToken = useAuthStore.getState().accessToken
      if (freshToken) {
        client.connectHeaders = { Authorization: `Bearer ${freshToken}` }
      } else {
        client.connectHeaders = {}
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
      activeSubscriptions.forEach((entry) => {
        subscribeEntry(client, entry)
      })
    },
    onStompError: (frame) => {
      console.error('[STOMP] 에러:', frame.headers.message)
    },
    onWebSocketError: (event) => {
      console.error('[STOMP] WebSocket 에러:', event)
    },
    onWebSocketClose: () => {
      activeSubscriptions.forEach((entry) => {
        entry.liveSubscription = null
      })
    },
    onDisconnect: () => {
      console.log('[STOMP] 연결 종료')
      activeSubscriptions.forEach((entry) => {
        entry.liveSubscription = null
      })
    },
  })

  client.activate()
  return client
}

export function subscribeTopic(topic, callback) {
  const stompClient = getStompClient()
  const id = ++subscriptionSeq
  const entry = { topic, callback, liveSubscription: null }
  activeSubscriptions.set(id, entry)

  if (stompClient?.connected) {
    subscribeEntry(stompClient, entry)
  }

  return {
    unsubscribe: () => {
      const current = activeSubscriptions.get(id)
      current?.liveSubscription?.unsubscribe()
      activeSubscriptions.delete(id)
    },
  }
}

export function deactivateStompClient() {
  if (client) {
    activeSubscriptions.forEach((entry) => {
      entry.liveSubscription = null
    })
    client.deactivate()
    client = null
  }
}
