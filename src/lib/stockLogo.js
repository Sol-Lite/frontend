const LOGO_BASE_URL = ''

const LOGO_DIR_MAP = {
  KOSPI: 'KOSPI-logo',
  KOSDAQ: 'KOSDAQ-logo',
  NASDAQ: 'us-logo',
  NYSE: 'us-logo',
  AMEX: 'us-logo',
}

const LOGO_CODE_ALIASES = {
  '005935': '005930', // 삼성전자우 -> 삼성전자 로고 재사용
}

export function getStockLogoUrl(marketType, stockCode) {
  const dir = LOGO_DIR_MAP[marketType]
  if (!dir || !stockCode) return null
  const resolvedCode = LOGO_CODE_ALIASES[stockCode] ?? stockCode
  return `${LOGO_BASE_URL}/${dir}/${resolvedCode}.png`
}
