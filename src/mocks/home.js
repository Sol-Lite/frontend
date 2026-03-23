export const BALANCE = {
  total: '84,320,000',
  profit: '+2,140,000',
  profitRate: '+2.61%',
  krw: '72,100,000',
  usd: '$8,924',
  invested: '82,168,000',
  available: '74,780,000',
}

export const HOME_INDICES = [
  { key: 'kospi',  label: 'KOSPI',   value: '2,685', change: 0.46 },
  { key: 'kosdaq', label: 'KOSDAQ',  value: '842',   change: -0.63 },
  { key: 'nasdaq', label: 'NASDAQ',  value: '16,274',change: -0.92 },
  { key: 'sp500',  label: 'S&P 500', value: '5,234', change: -0.55 },
  { key: 'dow',    label: 'DOW',     value: '38,921',change: 0.11 },
]

export const PORTFOLIO = {
  returnRate: '+5.2%',
  items: [
    { name: '삼성전자', ratio: 34, color: 'var(--color-chart-1)', barWidth: '28px' },
    { name: 'SK하이닉스', ratio: 20, color: 'var(--color-chart-2)', barWidth: '16px' },
    { name: 'NAVER',    ratio: 15, color: 'var(--color-chart-3)', barWidth: '12px' },
    { name: '기타',     ratio: 31, color: 'var(--color-chart-5)', barWidth: '25px' },
  ],
}

export const HOME_STOCKS = [
  {
    id: 'samsung',
    name: '삼성전자',
    label: '삼성',
    code: '005930',
    market: 'KOSPI',
    color: 'primary',
    price: '75,400',
    change: 1.62,
    changeAmt: '1,200',
    open: '74,200', high: '76,100', low: '73,900',
    sparkPath: 'M0,18 L12,16 L24,14 L36,16 L48,10 L60,12 L72,7 L84,5 L96,3 L108,1.5 L120,1',
    fillPath:  'M0,18 L12,16 L24,14 L36,16 L48,10 L60,12 L72,7 L84,5 L96,3 L108,1.5 L120,1 L120,22 L0,22Z',
    week52Low: '54,700', week52High: '89,800', week52Pct: 59,
    volume: '18.2M', marketCap: '450.2조', per: '13.2x', pbr: '1.08x', turnover: '1.37조',
  },
  {
    id: 'skhynix',
    name: 'SK하이닉스',
    label: 'SK',
    code: '000660',
    market: 'KOSPI',
    color: 'warning',
    price: '195,500',
    change: 2.35,
    changeAmt: '4,500',
    open: '191,500', high: '197,000', low: '190,500',
    sparkPath: 'M0,20 L12,18 L24,20 L36,14 L48,16 L60,10 L72,12 L84,7 L96,5 L108,3 L120,1',
    fillPath:  'M0,20 L12,18 L24,20 L36,14 L48,16 L60,10 L72,12 L84,7 L96,5 L108,3 L120,1 L120,22 L0,22Z',
    week52Low: '120,000', week52High: '250,000', week52Pct: 58,
    volume: '8.4M', marketCap: '142.1조', per: '18.5x', pbr: '2.12x', turnover: '1.64조',
  },
]

export const RANKING = [
  { rank: 1,  name: '삼성전자',      label: '삼성', color: 'primary', price: '75,400',  change: 1.62,  volume: '5.2조' },
  { rank: 2,  name: 'SK하이닉스',   label: 'SK',    color: 'warning', price: '195,500', change: 2.35,  volume: '3.8조' },
  { rank: 3,  name: 'NAVER',         label: 'N',     color: 'green',   price: '210,000', change: -0.94, volume: '1.4조' },
  { rank: 4,  name: '카카오',        label: 'K',     color: 'yellow',  price: '44,150',  change: -1.23, volume: '0.9조' },
  { rank: 5,  name: 'LG에너지솔루션',label: 'LG에',  color: 'green',   price: '382,000', change: 0.79,  volume: '0.7조' },
]

export const WATCHLIST = [
  { name: '현대차',   label: 'H',   color: 'primary', price: '₩205,000', change: -0.82 },
  { name: 'LG에너지', label: 'LG',  color: 'green',   price: '₩382,000', change: 1.20 },
  { name: '셀트리온', label: '셀트', color: 'teal',    price: '₩172,300', change: 0.34 },
]

export const MARKET_OVERVIEW = {
  time: '14:32',
  news: [
    { title: '美 CPI 예상치 하회… 나스닥 1% 상승, 반도체 강세', desc: '인플레이션 둔화 신호로 긴축 우려 완화. AI 관련주 중심 반등.' },
    { title: '外人 순매수 4,200억 · 반도체↑', desc: '3거래일 연속 외국인 매수세 유입. 삼성전자·SK하이닉스 강세.' },
    { title: '원달러 1,378원 소폭 하락 마감', desc: '美 금리 인하 기대감 반영. 수출주 수혜 예상.' },
    { title: 'SK하이닉스 목표가 상향 조정', desc: 'HBM3E 공급 확대 기대. 증권사 12개사 목표가 상향.' },
  ],
}

export const EXCHANGE = [
  { flag: '🇺🇸', pair: 'USD / KRW', rate: '1,378.50', change: -2.30, pct: '-0.17%' },
  { flag: '🇯🇵', pair: 'JPY / KRW', rate: '9.18',     change:  0.05, pct: '+0.54%' },
]
