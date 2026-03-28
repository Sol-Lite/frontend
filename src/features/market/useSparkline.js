import { useQuery } from '@tanstack/react-query'
import { marketApi, foreignMarketApi, getExchcd } from '@/api/market'
import { normalizeMinuteSeries } from '@/features/invest/domestic/normalize'
import { normalizeForeignMinuteSeries } from '@/features/invest/foreign/normalize'
import { isForeignMarketType } from '@/features/invest/formatters'

const EXCHANGE_CODE_BY_MARKET_TYPE = { NASDAQ: 'NAS', NYSE: 'NYS', AMEX: 'AMS' }
const MARKET_TYPE_BY_EXCHANGE_CODE  = { NAS: 'NASDAQ', NYS: 'NYSE', AMS: 'AMEX' }

export default function useSparkline(stockCode, marketType, exchangeCode, { enabled = true } = {}) {
  // exchangeCode(NAS/NYS/AMS)가 있으면 우선, 없으면 marketType으로 판별
  const resolvedMarketType = marketType ?? (exchangeCode ? MARKET_TYPE_BY_EXCHANGE_CODE[exchangeCode] : null)
  const isForeign = isForeignMarketType(resolvedMarketType)
  const resolvedExchangeCode = exchangeCode ?? (resolvedMarketType ? EXCHANGE_CODE_BY_MARKET_TYPE[resolvedMarketType] : null)
  const exchcd = isForeign ? getExchcd(resolvedExchangeCode) : null

  return useQuery({
    queryKey: ['sparkline', stockCode, resolvedMarketType],
    queryFn: async () => {
      if (isForeign) {
        const res = await foreignMarketApi.getMinuteChart(stockCode, exchcd, { ncnt: 5 })
        return normalizeForeignMinuteSeries(res?.data ?? [])
      }
      const res = await marketApi.getMinuteChart(stockCode, { ncnt: 5 })
      return normalizeMinuteSeries(res?.data ?? [])
    },
    staleTime: 1000 * 60,
    enabled: enabled && Boolean(stockCode),
  })
}
