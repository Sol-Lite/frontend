export const STOCK_CODE_MAP = {
  samsung: '005930',
  skhynix: '000660',
}

export const PERIODS = ['1일', '1주', '1달', '3달']

export const PERIOD_CONFIG = {
  '1일': { type: 'minute', ncnt: 5                             },
  '1주': { type: 'daily',  period: 'DAILY',  days: 7          },
  '1달': { type: 'daily',  period: 'DAILY',  days: 30         },
  '3달': { type: 'weekly', period: 'WEEKLY', days: 90         },
}

export function fmtVolume(v) {
  if (v == null) return '-'
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000)      return `${Math.round(v / 10_000).toLocaleString('ko-KR')}만`
  return v.toLocaleString('ko-KR')
}
