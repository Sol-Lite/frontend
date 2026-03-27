import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/fetchWithAuth'

function get(path, params) {
  const query = params ? '?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
  ).toString() : ''
  return fetchWithAuth(`${path}${query}`)
}

export const balanceApi = {
  // 예수금 조회 (통화별)
  getCashBalances: () => get('/api/balance/cash'),

  // 매수 가능 금액
  getBuyableAmount: (stockCode, marketType, orderPrice) =>
    get('/api/balance/buyable', { stockCode, marketType, orderPrice }),

  // 국내 보유 종목
  getDomesticHoldings: () => get('/api/balance/stocks'),

  // 해외 보유 종목
  getOverseasHoldings: () => get('/api/balance/stocks/overseas'),

  // 총 평가자산 요약
  getBalanceSummary: () => get('/api/balance/summary'),

  // 자산 흐름 시계열
  getAssetFlow: (range = '1M') => get('/api/balance/flow', { range }),

  // 포트폴리오 비중
  getPortfolio: () => get('/api/portfolio'),
}

// React Query hooks
export const useBuyableAmount = ({ stockCode, marketType, orderPrice, enabled = true }) =>
  useQuery({
    queryKey: ['balance', 'buyable', stockCode, marketType, orderPrice ?? null],
    queryFn: () => balanceApi.getBuyableAmount(stockCode, marketType, orderPrice),
    enabled: enabled && !!stockCode && !!marketType,
    staleTime: 1000 * 15,
  })

export const useDomesticHoldings = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['balance', 'holdings', 'domestic'],
    queryFn: () => balanceApi.getDomesticHoldings(),
    enabled,
    staleTime: 1000 * 30,
  })

export const useOverseasHoldings = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['balance', 'holdings', 'overseas'],
    queryFn: () => balanceApi.getOverseasHoldings(),
    enabled,
    staleTime: 1000 * 30,
  })

export const useBalanceSummary = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['balance', 'summary'],
    queryFn: balanceApi.getBalanceSummary,
    enabled,
    staleTime: 1000 * 30,
  })

export const useCashBalances = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['balance', 'cash'],
    queryFn: balanceApi.getCashBalances,
    enabled,
    staleTime: 1000 * 30,
  })

export const usePortfolioData = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['portfolio'],
    queryFn: balanceApi.getPortfolio,
    enabled,
    staleTime: 1000 * 30,
  })
