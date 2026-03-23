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
  getIndices: () => get('/indices'),
  getRanking: (params) => get('/stocks/ranking', params),
  getCurrentPrice: (stockCode) => get(`/stocks/${stockCode}/price`),
  getDailyPrice: (stockCode, params) => get(`/stocks/${stockCode}/daily`, params),
  getChart: (stockCode, params) => get(`/stocks/${stockCode}/chart`, params),
  getMinuteChart: (stockCode, params) => get(`/stocks/${stockCode}/minute-chart`, params),
  getOrderBook: (stockCode) => get(`/stocks/${stockCode}/orderbook`),
  getOpinion: (stockCode) => get(`/stocks/${stockCode}/opinion`),
  getInvestor: (stockCode) => get(`/stocks/${stockCode}/investor`),
  getFinance: (stockCode) => get(`/stocks/${stockCode}/finance`),
  searchStocks: (keyword) => get('/stocks/search', { keyword }),
}

export const foreignMarketApi = {
  getCurrentPrice: (symbol, exchcd) => get(`/foreign-stocks/${symbol}/price`, { exchcd }),
  getOrderBook: (symbol, exchcd) => get(`/foreign-stocks/${symbol}/orderbook`, { exchcd }),
  getInfo: (symbol, exchcd) => get(`/foreign-stocks/${symbol}/info`, { exchcd }),
  getChart: (symbol, exchcd, params) => get(`/foreign-stocks/${symbol}/chart-advanced`, { exchcd, ...params }),
  getMinuteChart: (symbol, exchcd, params) => get(`/foreign-stocks/${symbol}/chart-nmin`, { exchcd, ...params }),
}

const EXCHCD_MAP = {
  NAS: '82',
  NYS: '81',
  AMS: '81',
}

export function getExchcd(exchangeCode) {
  return EXCHCD_MAP[exchangeCode] ?? '82'
}
