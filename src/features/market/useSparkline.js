import { useQuery } from '@tanstack/react-query'
import { marketApi, foreignMarketApi, getExchcd } from '@/api/market'
import { normalizeMinuteSeries } from '@/features/invest/domestic/normalize'
import { isForeignMarketType } from '@/features/invest/formatters'

const EXCHANGE_CODE_BY_MARKET_TYPE = { NASDAQ: 'NAS', NYSE: 'NYS', AMEX: 'AMS' }

export default function useSparkline(stockCode, marketType, { enabled = true } = {}) {
  const isForeign = isForeignMarketType(marketType)
  const exchcd    = isForeign ? getExchcd(EXCHANGE_CODE_BY_MARKET_TYPE[marketType]) : null

  return useQuery({
    queryKey: ['sparkline', stockCode, marketType],
    queryFn: async () => {
      const res = isForeign
        ? await foreignMarketApi.getMinuteChart(stockCode, exchcd, { ncnt: 5 })
        : await marketApi.getMinuteChart(stockCode, { ncnt: 5 })
      return normalizeMinuteSeries(res?.data ?? [])
    },
    staleTime: 1000 * 60,
    enabled: enabled && Boolean(stockCode),
  })
}
