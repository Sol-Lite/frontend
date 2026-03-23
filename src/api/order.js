import { fetchWithAuth } from '@/lib/fetchWithAuth'

const BASE = '/api/orders'

function request(path, method = 'GET', body = null) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  return fetchWithAuth(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

export const orderApi = {
  // 주문 접수
  // body: { stockCode, marketType, orderSide, orderKind, orderChannel, orderPrice?, orderQuantity, idempotencyKey? }
  placeOrder: (body) => request('', 'POST', body),

  // 주문 목록 조회
  // status: 'ALL' | 'PENDING' | 'FILLED' | 'CANCELLED'
  getOrders: (status = 'ALL') => request(`?status=${status}`, 'GET'),

  // 주문 단건 + 체결내역
  getOrder: (orderId) => request(`/${orderId}`, 'GET'),

  // 주문 정정 (PENDING 상태만)
  amendOrder: (orderId, body) => request(`/${orderId}`, 'PATCH', body),

  // 주문 취소 (단건)
  cancelOrder: (orderId) => request(`/${orderId}`, 'DELETE'),

  // 미체결 전체 취소
  cancelAllPending: () => request('/pending/all', 'DELETE'),
}

// orderSide / orderKind 프론트 → 백엔드 변환
export const ORDER_SIDE = { buy: 'BUY', sell: 'SELL' }
export const ORDER_KIND = { market: 'MARKET', limit: 'LIMIT', current: 'CURRENT_PRICE' }
