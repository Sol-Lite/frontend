export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('ko-KR').format(Math.round(value))
}

export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return `₩${formatNumber(value)}`
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
  return dateText.slice(5).replace('-', '/')
}

export function formatTradeTime(timestamp) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(timestamp)
}
