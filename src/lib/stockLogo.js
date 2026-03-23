const LOGO_BASE_URL = ''

const LOGO_DIR_MAP = {
  KOSPI: 'KOSPI-logo',
  KOSDAQ: 'KOSDAQ-logo',
  NASDAQ: 'us-logo',
  NYSE: 'us-logo',
  AMEX: 'us-logo',
}

export function getStockLogoUrl(marketType, stockCode) {
  const dir = LOGO_DIR_MAP[marketType]
  if (!dir || !stockCode) return null
  return `${LOGO_BASE_URL}/${dir}/${stockCode}.png`
}
