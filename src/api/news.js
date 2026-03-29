const BASE = '/api/news'
const STOCK_BASE = '/api/stock-news'

export const newsApi = {
  getLatestNews: (params) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return fetch(`${BASE}${query}`, { credentials: 'include' }).then((r) => r.json())
  },
  getStockNews: (stockCode, size = 5) => {
    const query = new URLSearchParams({ stockCode, size }).toString()
    return fetch(`${STOCK_BASE}?${query}`, { credentials: 'include' }).then((r) => r.json())
  },
  getNewsDetail: (newsId) =>
    fetch(`${BASE}/${encodeURIComponent(newsId)}`, { credentials: 'include' }).then((r) => r.json()),
  getStockNewsDetail: (newsId) =>
    fetch(`${STOCK_BASE}/${encodeURIComponent(newsId)}`, { credentials: 'include' }).then((r) => r.json()),
}
