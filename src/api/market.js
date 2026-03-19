const BASE = '/api/market'
const inFlightRequests = new Map()

async function get(path, params, options = {}) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : ''
  const url = `${BASE}${path}${query}`
  const requestKey = `${options.method ?? 'GET'}:${url}`

  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)
  }

  const requestPromise = (async () => {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
    })

    const text = await res.text()
    let data = null

    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { message: text }
      }
    }

    if (!res.ok) {
      throw data ?? { message: '시장 데이터를 불러오지 못했습니다.' }
    }

    return data
  })()

  inFlightRequests.set(requestKey, requestPromise)

  try {
    return await requestPromise
  } finally {
    inFlightRequests.delete(requestKey)
  }
}

export const marketApi = {
  getCurrentPrice: (stockCode) => get(`/stocks/${stockCode}/price`),
  getDailyPrice: (stockCode, date) => get(`/stocks/${stockCode}/daily`, { date }),
  getChart: (stockCode, params) => get(`/stocks/${stockCode}/chart`, params),
  getMinuteChart: (stockCode, params) => get(`/stocks/${stockCode}/minute-chart`, params),
}
