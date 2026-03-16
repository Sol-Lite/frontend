export const MARKET_INDICES = [
  { key: 'kospi',   label: 'KOSPI',   value: '2,685.40', change: 0.46,  path: 'M0,22 L9,20 L18,18 L27,14 L36,10 L45,6 L56,3' },
  { key: 'kosdaq',  label: 'KOSDAQ',  value: '842.15',   change: -0.63, path: 'M0,6 L9,7 L18,8 L27,11 L36,14 L45,18 L56,22' },
  { key: 'usdkrw',  label: '달러/원', value: '1,342.50', change: 1.2,   path: 'M0,20 L9,18 L18,22 L27,16 L36,12 L45,8 L56,5' },
  { key: 'nasdaq',  label: '나스닥',  value: '17,754.8', change: -0.92, path: 'M0,8 L9,6 L18,10 L27,12 L36,16 L45,20 L56,22' },
  { key: 'sp500',   label: 'S&P 500', value: '5,614.3',  change: -0.45, path: 'M0,10 L9,8 L18,9 L27,13 L36,15 L45,18 L56,20' },
]

export const MARKET_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'kr',  label: '🇰🇷 국내' },
  { key: 'us',  label: '🇺🇸 미국' },
]

export const SORT_FILTERS = [
  { key: 'volume_value', label: '거래대금' },
  { key: 'volume',       label: '거래량' },
  { key: 'rising',       label: '급상승' },
  { key: 'falling',      label: '급하락' },
  { key: 'market_cap',   label: '시가총액' },
]

export const STOCKS = [
  { id: 1, rank: 1,  name: '삼성전자',        label: '삼성', color: 'primary', price: '75,400',   change: 1.62,  volume: '1.37조', buyRatio: 68, sellRatio: 32 },
  { id: 2, rank: 2,  name: 'SK하이닉스',       label: 'SK',   color: 'warning', price: '195,500',  change: 2.35,  volume: '9,834억', buyRatio: 83, sellRatio: 17 },
  { id: 3, rank: 3,  name: 'NAVER',            label: 'N',    color: 'green',   price: '210,000',  change: -0.94, volume: '7,124억', buyRatio: 41, sellRatio: 59 },
  { id: 4, rank: 4,  name: '카카오',           label: 'K',    color: 'yellow',  price: '44,150',   change: -1.23, volume: '5,612억', buyRatio: 29, sellRatio: 71 },
  { id: 5, rank: 5,  name: 'LG에너지솔루션',   label: 'LG에', color: 'green',   price: '382,000',  change: 0.79,  volume: '4,892억', buyRatio: 55, sellRatio: 45 },
  { id: 6, rank: 6,  name: '현대차',           label: '현대', color: 'primary', price: '205,000',  change: -0.82, volume: '3,781억', buyRatio: 7,  sellRatio: 93 },
  { id: 7, rank: 7,  name: '셀트리온',         label: '셀트', color: 'teal',    price: '172,300',  change: 0.35,  volume: '2,943억', buyRatio: 63, sellRatio: 37 },
  { id: 8, rank: 8,  name: 'POSCO홀딩스',      label: '포스코',color: 'red',    price: '396,000',  change: 2.19,  volume: '2,104억', buyRatio: 79, sellRatio: 21 },
  { id: 9, rank: 9,  name: 'KB금융',           label: 'KB',   color: 'purple',  price: '76,200',   change: -0.52, volume: '1,837억', buyRatio: 44, sellRatio: 56 },
  { id: 10, rank: 10, name: '신한지주',        label: '신한', color: 'orange',  price: '44,850',   change: 0.79,  volume: '1,523억', buyRatio: 58, sellRatio: 42 },
]
