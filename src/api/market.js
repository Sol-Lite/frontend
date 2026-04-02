const BASE = '/api/market'
const inFlightRequests = new Map()

function tryParseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function resolveErrorMessage(data, fallbackMessage) {
  const candidates = [
    data?.message,
    data?.error,
    data?.detail,
    data?.details,
    data?.errorMessage,
  ]

  const resolved = candidates.find((value) => typeof value === 'string' && value.trim())
  return resolved?.trim() || fallbackMessage
}

function createApiError(url, response, data, rawText, fallbackMessage) {
  const error = new Error(resolveErrorMessage(data, fallbackMessage))
  error.name = 'ApiError'
  error.status = response.status
  error.statusText = response.statusText
  error.url = url
  error.data = data
  error.rawText = rawText

  const code = data?.code ?? data?.errorCode ?? data?.resultCode ?? data?.rt_cd
  if (code != null) {
    error.code = code
  }

  return error
}

async function get(path, params, options = {}) {
  const filteredParams = params
    ? Object.fromEntries(Object.entries(params).filter(([, value]) => value != null))
    : null
  const query = filteredParams ? `?${new URLSearchParams(filteredParams).toString()}` : ''
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
    const data = text ? tryParseJson(text) : null

    if (!res.ok) {
      throw createApiError(url, res, data, text, '시장 데이터를 불러오지 못했습니다.')
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
  getIndexChart: (code, params) => get(`/indices/${encodeURIComponent(code)}/chart`, params),
  getIndexMinuteChart: (code, params) => get(`/indices/${encodeURIComponent(code)}/minute-chart`, params),
  getRanking: (params) => get('/stocks/ranking', params),
  getThemeRanking: (theme, params = { type: 'trading-value' }) => get(`/stocks/themes/${theme}/ranking`, params),
  getCurrentPrice: (stockCode) => get(`/stocks/${stockCode}/price`),
  getDailyPrice: (stockCode, params) => get(`/stocks/${stockCode}/daily`, params),
  getChart: (stockCode, params) => get(`/stocks/${stockCode}/chart`, params),
  getChartHistory: (stockCode, params) => get(`/stocks/${stockCode}/chart/history`, params),
  getMinuteChart: (stockCode, params) => get(`/stocks/${stockCode}/minute-chart`, params),
  getMinuteChartHistory: (stockCode, params) => get(`/stocks/${stockCode}/minute-chart/history`, params),
  getOrderBook: (stockCode) => get(`/stocks/${stockCode}/orderbook`),
  getOpinion: (stockCode) => get(`/stocks/${stockCode}/opinion`),
  getInvestor: (stockCode) => get(`/stocks/${stockCode}/investor`),
  getFinance: (stockCode) => get(`/stocks/${stockCode}/finance`),
  getStockInfo: (stockCode) => get(`/stocks/${stockCode}/info`),
  searchStocks: (keyword) => get('/stocks/search', { keyword }),
  getForexChart: (params) => get('/forex/chart', params),
}

export const foreignMarketApi = {
  getCurrentPrice: (symbol, exchcd) => get(`/foreign-stocks/${symbol}/price`, { exchcd }),
  getOrderBook: (symbol, exchcd) => get(`/foreign-stocks/${symbol}/orderbook`, { exchcd }),
  getInfo: (symbol, exchcd) => get(`/foreign-stocks/${symbol}/info`, { exchcd }),
  getChart: (symbol, exchcd, params) => get(`/foreign-stocks/${symbol}/chart-advanced`, { exchcd, ...params }),
  getMinuteChart: (symbol, exchcd, params) => get(`/foreign-stocks/${symbol}/chart-nmin`, { exchcd, ...params }),
  getForeignRanking: (params) => get('/foreign-stocks/ranking', params),
}

const EXCHCD_MAP = {
  NAS: '82',
  NYS: '81',
  AMS: '81',
}

export function getExchcd(exchangeCode) {
  return EXCHCD_MAP[exchangeCode] ?? '82'
}
