export const LEFT_TABS = [
  { key: 'daily', label: '일별시세' },
  { key: 'realtime', label: '실시간시세' },
  { key: 'investor', label: '투자자' },
  { key: 'opinion', label: '투자의견' },
  { key: 'finance', label: '재무' },
]

export const RIGHT_TABS = [
  { key: 'exec', label: '체결내역' },
  { key: 'pending', label: '미체결' },
  { key: 'holding', label: '내 주식' },
]

export const QUICK_RATIOS = [
  { label: '10%', ratio: 0.1 },
  { label: '25%', ratio: 0.25 },
  { label: '50%', ratio: 0.5 },
  { label: '최대', ratio: 1 },
]

export const CHART_PERIOD_OPTIONS = [
  { key: 'DAILY', label: '일' },
  { key: 'WEEKLY', label: '주' },
  { key: 'MONTHLY', label: '월' },
  { key: 'YEARLY', label: '년' },
]

export const MINUTE_INTERVAL_OPTIONS = [1, 3, 5, 10, 15, 30, 60]

export const DEFAULT_MINUTE_INTERVAL = 5

export const CHART_PERIOD_CONFIG = {
  MINUTE: {
    periodLabel: '분봉 차트',
  },
  DAILY: {
    apiPeriod: 'DAILY',
    foreignApiPeriod: 'DAY',
    lookbackDays: 180,
    periodLabel: '일봉 차트',
  },
  WEEKLY: {
    apiPeriod: 'WEEKLY',
    foreignApiPeriod: 'WEEK',
    lookbackDays: 365 * 5,
    periodLabel: '주봉 차트',
  },
  MONTHLY: {
    apiPeriod: 'MONTHLY',
    foreignApiPeriod: 'MONTH',
    lookbackDays: 365 * 15,
    periodLabel: '월봉 차트',
  },
  YEARLY: {
    apiPeriod: 'YEARLY',
    foreignApiPeriod: 'YEAR',
    lookbackDays: 365 * 30,
    periodLabel: '년봉 차트',
  },
}

export const DAY_MS = 24 * 60 * 60 * 1000
