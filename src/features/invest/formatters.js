export const DISPLAY_CURRENCY = {
  KRW: 'KRW',
  USD: 'USD',
}

export const FOREIGN_MARKET_TYPES = ['NASDAQ', 'NYSE', 'AMEX']
export const FALLBACK_USD_RATE = 1350

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('ko-KR').format(Math.round(value))
}

function toFiniteNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function isForeignMarketType(marketType) {
  return FOREIGN_MARKET_TYPES.includes(marketType)
}

export function resolveUsdRate(usdRate) {
  const rate = toFiniteNumber(usdRate)
  return rate != null && rate > 0 ? rate : FALLBACK_USD_RATE
}

export function getDisplayCurrencySymbol({
  marketType,
  displayCurrency = DISPLAY_CURRENCY.KRW,
} = {}) {
  return isForeignMarketType(marketType) && displayCurrency === DISPLAY_CURRENCY.USD ? '$' : '₩'
}

export function getDisplayPriceUnitLabel({
  marketType,
  displayCurrency = DISPLAY_CURRENCY.KRW,
} = {}) {
  return isForeignMarketType(marketType) && displayCurrency === DISPLAY_CURRENCY.USD ? '달러' : '원'
}

export function convertMarketValue(
  value,
  {
    marketType,
    displayCurrency = DISPLAY_CURRENCY.KRW,
    usdRate = FALLBACK_USD_RATE,
  } = {},
) {
  const numeric = toFiniteNumber(value)
  if (numeric == null) return null
  if (!isForeignMarketType(marketType) || displayCurrency === DISPLAY_CURRENCY.USD) {
    return numeric
  }
  return numeric * resolveUsdRate(usdRate)
}

export function convertDisplayValueToMarketValue(
  value,
  {
    marketType,
    displayCurrency = DISPLAY_CURRENCY.KRW,
    usdRate = FALLBACK_USD_RATE,
  } = {},
) {
  const numeric = toFiniteNumber(value)
  if (numeric == null) return null
  if (!isForeignMarketType(marketType) || displayCurrency === DISPLAY_CURRENCY.USD) {
    return numeric
  }
  return numeric / resolveUsdRate(usdRate)
}

function getFractionDigits({
  marketType,
  displayCurrency = DISPLAY_CURRENCY.KRW,
} = {}) {
  return isForeignMarketType(marketType) && displayCurrency === DISPLAY_CURRENCY.USD ? 2 : 0
}

function formatConvertedValue(value, options = {}) {
  const converted = convertMarketValue(value, options)
  if (converted == null) return '-'
  const fractionDigits = getFractionDigits(options)
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(converted)
}

export function formatDisplayPrice(value, options = {}) {
  return formatConvertedValue(value, options)
}

export function toDisplayPriceInputValue(value, options = {}) {
  const converted = convertMarketValue(value, options)
  if (converted == null) return ''
  const fractionDigits = getFractionDigits(options)
  return fractionDigits === 0 ? Math.round(converted) : Number(converted.toFixed(fractionDigits))
}

export function formatCurrency(value, options = {}) {
  const formatted = formatConvertedValue(value, options)
  if (formatted === '-') return '-'
  return `${getDisplayCurrencySymbol(options)}${formatted}`
}

export function formatSignedDisplayPrice(value, options = {}) {
  const numeric = toFiniteNumber(value)
  if (numeric == null) return '-'
  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : ''
  return `${sign}${formatDisplayPrice(Math.abs(numeric), options)}`
}

export function formatSignedCurrency(value, options = {}) {
  const numeric = toFiniteNumber(value)
  if (numeric == null) return '-'
  const sign = numeric > 0 ? '+' : numeric < 0 ? '-' : ''
  return `${sign}${formatCurrency(Math.abs(numeric), options)}`
}

export function formatVisiblePrice(value, options = {}) {
  return isForeignMarketType(options.marketType)
    ? formatCurrency(value, options)
    : formatDisplayPrice(value, options)
}

export function formatSignedVisiblePrice(value, options = {}) {
  return isForeignMarketType(options.marketType)
    ? formatSignedCurrency(value, options)
    : formatSignedDisplayPrice(value, options)
}

export function formatSignedNumber(value) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatNumber(Math.abs(value))}`
}

export function formatSignedPercent(value) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

export function getDirectionClass(value) {
  if (value > 0) return 'text-up'
  if (value < 0) return 'text-down'
  return 'text-foreground-disabled'
}

export function formatApiDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDisplayDate(dateText) {
  if (!dateText) return '-'
  const s = String(dateText)
  if (s.length === 8 && !s.includes('-')) {
    return `${s.slice(4, 6)}/${s.slice(6, 8)}`
  }
  return s.slice(5).replace('-', '/')
}

export function formatTradeTime(timestamp) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp)
}
