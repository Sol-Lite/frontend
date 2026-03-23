export const INVEST_STOCK = {
  name: '삼성전자',
  code: '005930',
  market: 'KOSPI',
  sector: '전기/전자',
  price: 75400,
  diff: 1200,
  changeRate: 1.62,
  open: 74200,
  high: 76100,
  low: 73900,
  previousClose: 74200,
  availableAmount: 99000000,
}

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

function roundPrice(value) {
  return Math.max(100, Math.round(value / 50) * 50)
}

function createCandleSeries({ startAt, points, stepMs, basePrice, amplitude, trendStep, volumeBase }) {
  let previousClose = basePrice

  return Array.from({ length: points }, (_, index) => {
    const timestamp = startAt + stepMs * index
    const open = roundPrice(previousClose + Math.sin(index / 2.6) * amplitude * 0.14)
    const drift = trendStep * index
    const swing = Math.sin(index / 3.4) * amplitude + Math.cos(index / 5.2) * amplitude * 0.42
    const close = roundPrice(basePrice + drift + swing)
    const high = roundPrice(Math.max(open, close) + Math.abs(Math.sin(index * 1.7)) * amplitude * 0.32)
    const low = roundPrice(Math.min(open, close) - Math.abs(Math.cos(index * 1.3)) * amplitude * 0.27)
    const volume = Math.round(
      volumeBase
      + Math.abs(Math.sin(index / 2.1)) * volumeBase * 0.38
      + (index % 9 === 0 ? volumeBase * 0.22 : 0),
    )

    previousClose = close

    return {
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    }
  })
}

function syncLastCandle(series, nextValues) {
  return series.map((point, index) => (
    index === series.length - 1
      ? { ...point, ...nextValues }
      : point
  ))
}

const DAILY_CHART_SERIES = syncLastCandle(
  createCandleSeries({
    startAt: Date.UTC(2025, 11, 20),
    points: 90,
    stepMs: DAY,
    basePrice: 69800,
    amplitude: 1650,
    trendStep: 68,
    volumeBase: 11200000,
  }),
  {
    open: INVEST_STOCK.open,
    high: INVEST_STOCK.high,
    low: INVEST_STOCK.low,
    close: INVEST_STOCK.price,
    volume: 18234512,
  },
)

const INTRADAY_CHART_SERIES = syncLastCandle(
  createCandleSeries({
    startAt: Date.UTC(2026, 2, 19, 0, 0),
    points: 78,
    stepMs: 5 * MINUTE,
    basePrice: 74500,
    amplitude: 540,
    trendStep: 11,
    volumeBase: 98000,
  }),
  {
    open: 75250,
    high: 75450,
    low: 75150,
    close: INVEST_STOCK.price,
    volume: 421330,
  },
)

export const ORDER_TYPE_OPTIONS = [
  { key: 'market', label: '시장가' },
  { key: 'limit', label: '지정가' },
  { key: 'current', label: '현재가' },
]

export const CONDITION_OPTIONS = [
  { key: 'normal', label: '일반' },
  { key: 'ioc', label: 'IOC' },
  { key: 'fok', label: 'FOK' },
]

export const CHART_PERIODS = ['1일', '1주', '1월', '3월']

export const CHART_STYLES = [
  { key: 'candle', label: '캔들' },
  { key: 'line', label: '라인' },
]

export const MOVING_AVERAGES = [
  {
    key: 'ma5',
    period: 5,
    label: 'MA5',
    colorClass: 'text-up',
    toneClass: 'bg-up-bg border-up',
    dotClass: 'bg-up',
    path: 'M0,158 L36,146 L73,132 L110,138 L146,112 L182,90 L219,66 L255,42 L292,16',
    stroke: 'var(--color-up)',
    opacity: 0.6,
    dashArray: '4,2.5',
    dashStyle: 'ShortDash',
  },
  {
    key: 'ma20',
    period: 20,
    label: 'MA20',
    colorClass: 'text-warning',
    toneClass: 'bg-warning-bg border-warning',
    dotClass: 'bg-warning',
    path: 'M0,164 L36,155 L73,147 L110,148 L146,128 L182,108 L219,86 L255,64 L292,45',
    stroke: 'var(--color-warning)',
    opacity: 0.85,
    dashStyle: 'Solid',
  },
  {
    key: 'ma60',
    period: 60,
    label: 'MA60',
    colorClass: 'text-down',
    toneClass: 'bg-down-bg border-down',
    dotClass: 'bg-down',
    path: 'M0,168 L36,163 L73,157 L110,156 L146,143 L182,130 L219,114 L255,96 L292,80',
    stroke: 'var(--color-down)',
    opacity: 0.75,
    dashStyle: 'ShortDot',
  },
]

export const CHART_SERIES = {
  intraday: INTRADAY_CHART_SERIES,
  daily: DAILY_CHART_SERIES,
}

export const PRICE_CHART = {
  fillPath: 'M0,160 L36,148 L73,134 L110,140 L146,114 L182,92 L219,68 L255,44 L292,18 L292,170 L0,170Z',
  linePath: 'M0,160 L36,148 L73,134 L110,140 L146,114 L182,92 L219,68 L255,44 L292,18',
  volumes: [
    { x: 1, y: 183, width: 9, height: 17, color: 'var(--color-foreground-disabled)', opacity: 0.9 },
    { x: 15, y: 178, width: 9, height: 22, color: 'var(--color-up)', opacity: 0.5 },
    { x: 29, y: 185, width: 9, height: 15, color: 'var(--color-foreground-disabled)', opacity: 0.9 },
    { x: 43, y: 174, width: 9, height: 26, color: 'var(--color-up)', opacity: 0.5 },
    { x: 57, y: 187, width: 9, height: 13, color: 'var(--color-foreground-disabled)', opacity: 0.9 },
    { x: 71, y: 180, width: 9, height: 20, color: 'var(--color-down)', opacity: 0.5 },
    { x: 85, y: 176, width: 9, height: 24, color: 'var(--color-up)', opacity: 0.5 },
    { x: 99, y: 189, width: 9, height: 11, color: 'var(--color-foreground-disabled)', opacity: 0.9 },
    { x: 113, y: 172, width: 9, height: 28, color: 'var(--color-up)', opacity: 0.55 },
    { x: 127, y: 182, width: 9, height: 18, color: 'var(--color-foreground-disabled)', opacity: 0.9 },
    { x: 141, y: 178, width: 9, height: 22, color: 'var(--color-down)', opacity: 0.5 },
    { x: 155, y: 174, width: 9, height: 26, color: 'var(--color-up)', opacity: 0.5 },
    { x: 169, y: 186, width: 9, height: 14, color: 'var(--color-foreground-disabled)', opacity: 0.9 },
    { x: 183, y: 179, width: 9, height: 21, color: 'var(--color-up)', opacity: 0.5 },
    { x: 197, y: 183, width: 9, height: 17, color: 'var(--color-foreground-disabled)', opacity: 0.9 },
    { x: 211, y: 176, width: 9, height: 24, color: 'var(--color-down)', opacity: 0.5 },
    { x: 225, y: 170, width: 9, height: 30, color: 'var(--color-up)', opacity: 0.6 },
    { x: 239, y: 180, width: 9, height: 20, color: 'var(--color-foreground-disabled)', opacity: 0.9 },
    { x: 253, y: 173, width: 9, height: 27, color: 'var(--color-up)', opacity: 0.6 },
    { x: 267, y: 167, width: 9, height: 33, color: 'var(--color-up)', opacity: 0.65 },
    { x: 281, y: 161, width: 9, height: 39, color: 'var(--color-up)', opacity: 0.7 },
  ],
}

export const ORDER_BOOK = {
  askTotal: 14118,
  bidTotal: 20276,
  asks: [
    { price: 76500, quantity: 324, depth: 8 },
    { price: 76400, quantity: 512, depth: 12 },
    { price: 76300, quantity: 892, depth: 21 },
    { price: 76200, quantity: 1204, depth: 29 },
    { price: 76100, quantity: 3410, depth: 81 },
    { price: 76000, quantity: 2187, depth: 52 },
    { price: 75900, quantity: 1562, depth: 37 },
    { price: 75800, quantity: 2048, depth: 48 },
    { price: 75700, quantity: 891, depth: 21 },
    { price: 75600, quantity: 1340, depth: 32 },
  ],
  bids: [
    { price: 75300, quantity: 2891, depth: 68 },
    { price: 75200, quantity: 1456, depth: 34 },
    { price: 75100, quantity: 987, depth: 23 },
    { price: 75000, quantity: 4230, depth: 100 },
    { price: 74900, quantity: 1728, depth: 41 },
    { price: 74800, quantity: 3104, depth: 73 },
    { price: 74700, quantity: 892, depth: 21 },
    { price: 74600, quantity: 1560, depth: 37 },
    { price: 74500, quantity: 2340, depth: 55 },
    { price: 74400, quantity: 1089, depth: 26 },
  ],
}

export const DAILY_PRICES = [
  { date: '03/15', close: 75400, changeRate: 1.62, volume: '18,234,512', open: 74200, high: 76100, low: 73900 },
  { date: '03/14', close: 74200, changeRate: -0.67, volume: '12,891,440', open: 74700, high: 75100, low: 73500 },
  { date: '03/13', close: 74700, changeRate: 1.22, volume: '20,345,891', open: 73600, high: 75200, low: 73400 },
  { date: '03/12', close: 73800, changeRate: -1.34, volume: '15,672,310', open: 74900, high: 75000, low: 73200 },
  { date: '03/11', close: 74800, changeRate: 2.05, volume: '24,189,003', open: 73100, high: 75300, low: 72900 },
  { date: '03/10', close: 73300, changeRate: -0.81, volume: '10,923,677', open: 73800, high: 74100, low: 72800 },
]

export const REALTIME_TRADES = [
  { time: '14:32:07', price: 75400, diff: 1200, volume: '2,341', accumulatedVolume: '18,234,512', strength: '124.5%' },
  { time: '14:31:55', price: 75300, diff: 1100, volume: '1,890', accumulatedVolume: '18,232,171', strength: '118.2%' },
  { time: '14:31:42', price: 75400, diff: 1200, volume: '3,102', accumulatedVolume: '18,230,281', strength: '131.7%' },
  { time: '14:31:30', price: 75200, diff: 1000, volume: '980', accumulatedVolume: '18,227,179', strength: '98.3%' },
]

export const EXECUTION_HISTORY = [
  { time: '14:32:07', name: '삼성전자', avatar: 'primary', side: 'buy', price: 74800, quantity: '50주', amount: '3,740,000' },
  { time: '13:58:44', name: 'SK하이닉스', avatar: 'warning', side: 'sell', price: 194500, quantity: '20주', amount: '3,890,000' },
  { time: '11:22:19', name: '삼성전자', avatar: 'primary', side: 'buy', price: 73100, quantity: '30주', amount: '2,193,000' },
  { time: '10:47:03', name: 'NAVER', avatar: 'green', side: 'sell', price: 211000, quantity: '10주', amount: '2,110,000' },
  { time: '09:35:51', name: 'LG에너지', avatar: 'green', side: 'buy', price: 378500, quantity: '5주', amount: '1,892,500' },
]

export const HOLDING_SUMMARY = [
  { label: '보유수량', value: '100주', tone: 'neutral' },
  { label: '평균매입가', value: '72,300', tone: 'neutral' },
  { label: '평가금액', value: '7,540,000', tone: 'accent' },
  { label: '평가손익', value: '+310,000', subValue: '+4.29%', tone: 'profit' },
]
