import { fetchWithAuth } from '@/lib/fetchWithAuth'

function get(path, params) {
  const query = params
    ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString()
    : ''
  return fetchWithAuth(`/api/exchange${path}${query}`)
}

function post(path, body) {
  return fetchWithAuth(`/api/exchange${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export const exchangeApi = {
  // 환전 가능 금액 / 예상 수령액 조회
  // fromCurrency: 'KRW'|'USD', toCurrency: 'USD'|'KRW', requestAmount?: number
  getAvailable: (fromCurrency, toCurrency, requestAmount) =>
    get('/available', { fromCurrency, toCurrency, requestAmount }),

  // 환전 실행
  // body: { fromCurrency, toCurrency, requestAmount }
  exchange: (fromCurrency, toCurrency, requestAmount) =>
    post('', { fromCurrency, toCurrency, requestAmount }),
}
