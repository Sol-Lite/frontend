export const LAST_INVEST_PATH_KEY = 'invest.lastPath'
export const LAST_INVEST_STATE_KEY = 'invest.lastState'

const EXCHANGE_CODE_BY_MARKET_TYPE = {
  NASDAQ: 'NAS',
  NYSE: 'NYS',
  AMEX: 'AMS',
}

export function buildInvestNavigationState(stock) {
  const marketType = stock?.marketType ?? null

  return {
    stockName: stock?.stockName ?? null,
    stockNameEn: stock?.stockNameEn ?? null,
    marketType,
    exchangeCode: stock?.exchangeCode ?? EXCHANGE_CODE_BY_MARKET_TYPE[marketType] ?? null,
  }
}
