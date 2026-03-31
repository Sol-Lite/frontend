import {
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  BarChart2,
  Newspaper,
  PieChart,
  Heart,
  History,
} from 'lucide-react'

const WIDGET_SHORTCUTS = [
  {
    key: 'balance',
    label: '계좌 잔고',
    keywords: ['잔고', '계좌', '자산', '평가자산', '내계좌', '예수금', '투자자산', '계좌현황'],
    widgetTypeId: 'balance',
    Icon: Wallet,
    defaultQuery: '내 계좌 잔고 알려줘',
  },
  {
    key: 'exchange',
    label: '환율',
    keywords: ['환율', '달러', '엔', '유로', 'usd', 'jpy', 'eur', '원달러', '환전', '외화', '파운드', '위안'],
    widgetTypeId: 'exchange',
    Icon: ArrowLeftRight,
    defaultQuery: '현재 환율 알려줘',
  },
  {
    key: 'ranking',
    label: '실시간 순위',
    keywords: ['순위', '랭킹', '거래대금', '상승률', '거래량', '급등', '상한가', '인기종목', '하락률'],
    widgetTypeId: 'ranking',
    Icon: TrendingUp,
    defaultQuery: '실시간 종목 순위 알려줘',
  },
  {
    key: 'index',
    label: '주요 지수',
    keywords: ['지수', '코스피', '코스닥', '나스닥', 'kospi', 'kosdaq', 'nasdaq', '다우', 's&p', '에센피', '뉴욕', '증시'],
    widgetTypeId: 'index',
    Icon: BarChart2,
    defaultQuery: '주요 지수 알려줘',
  },
  {
    key: 'market-overview',
    label: '오늘의 시황',
    keywords: ['시황', '시장', '헤드라인', '뉴스', '증시뉴스', '장세', '오늘증시', '코스피', '코스닥', '나스닥', '에센피', 's&p', 'nasdaq', 'kospi', 'kosdaq', '다우', '뉴욕'],
    widgetTypeId: 'market-overview',
    Icon: Newspaper,
    defaultQuery: '오늘의 시황 알려줘',
  },
  {
    key: 'portfolio',
    label: '포트폴리오',
    keywords: ['포트폴리오', '포트', '비중', '보유종목', '보유주식', '내주식', '수익률', '손익', '평가손익', '자산배분'],
    widgetTypeId: 'portfolio',
    Icon: PieChart,
    defaultQuery: '내 포트폴리오 알려줘',
  },
  {
    key: 'watchlist',
    label: '관심종목',
    keywords: ['관심', '관심종목', '즐겨찾기', '찜', '위시'],
    widgetTypeId: 'watchlist',
    Icon: Heart,
    defaultQuery: '내 관심종목 알려줘',
  },
  {
    key: 'trade-history',
    label: '거래내역',
    keywords: ['거래내역', '매매', '주문내역', '체결', '내역', '거래기록', '주문', '체결내역', '매수내역', '매도내역'],
    widgetTypeId: 'trade-history',
    Icon: History,
    defaultQuery: '거래내역 알려줘',
  },
]

export default WIDGET_SHORTCUTS

export function getWidgetDefaultQuery(widgetTypeId, config = {}) {
  if (widgetTypeId === 'stock-chart') {
    const name = config.stockName ?? null
    return name ? `${name} 주가 알려줘` : '주가 차트 보여줘'
  }
  if (widgetTypeId === 'stock-news') {
    const name = config.stockName ?? null
    return name ? `${name} 종목 뉴스 알려줘` : '종목 뉴스 알려줘'
  }
  return WIDGET_SHORTCUTS.find((s) => s.widgetTypeId === widgetTypeId)?.defaultQuery ?? null
}
