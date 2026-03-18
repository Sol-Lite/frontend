/**
 * 위젯 편집 피커용 위젯 타입 & 사이즈 정의
 * colSpan: 1 | 2  (그리드 열 수)
 * rowSpan: 1 | 2  (그리드 행 수)
 * preview: 프리뷰 렌더러 키 (WidgetSizeList의 PreviewContent에서 switch)
 */
export const WIDGET_TYPES = [
  {
    id: 'balance',
    name: '계좌 잔고',
    category: '계좌',
    description: '총 평가자산 · 수익률',
    variants: [
      { id: 'balance-sm',  label: '소형',  colSpan: 1, rowSpan: 1, preview: 'balance-sm' },
      { id: 'balance-lg',  label: '와이드', colSpan: 2, rowSpan: 1, preview: 'balance-lg' },
      { id: 'balance-2x2', label: '대형',  colSpan: 2, rowSpan: 2, preview: 'balance-2x2' },
    ],
  },
  {
    id: 'stock-chart',
    name: '주가 / 차트',
    category: '시세',
    description: '종목 현재가 · 미니 차트',
    variants: [
      { id: 'stock-sm',   label: '카드형',    colSpan: 1, rowSpan: 1, preview: 'stock-sm' },
      { id: 'stock-tall', label: '차트형',    colSpan: 1, rowSpan: 1, preview: 'stock-tall' },
      { id: 'stock-2x2',  label: '대형 차트', colSpan: 2, rowSpan: 2, preview: 'stock-2x2' },
    ],
  },
  {
    id: 'ranking',
    name: '실시간 순위',
    category: '시세',
    description: '거래대금 · 상승률 · 거래량',
    variants: [
      { id: 'ranking-wide', label: '목록형', colSpan: 2, rowSpan: 1, preview: 'ranking-wide' },
      { id: 'ranking-lg',   label: '확장형', colSpan: 2, rowSpan: 2, preview: 'ranking-lg' },
    ],
  },
  {
    id: 'index',
    name: '주요 지수',
    category: '시세',
    description: 'KOSPI · KOSDAQ · NASDAQ',
    variants: [
      { id: 'index-sm',   label: '단일', colSpan: 1, rowSpan: 1, preview: 'index-sm' },
      { id: 'index-wide', label: '복합', colSpan: 2, rowSpan: 1, preview: 'index-wide' },
      { id: 'index-2x2',  label: '대형', colSpan: 2, rowSpan: 2, preview: 'index-2x2' },
    ],
  },
  {
    id: 'portfolio',
    name: '포트폴리오',
    category: '포트폴리오',
    description: '보유 종목 비중 파이차트',
    variants: [
      { id: 'portfolio-sm',   label: '파이차트', colSpan: 1, rowSpan: 1, preview: 'portfolio-sm' },
      { id: 'portfolio-wide', label: '상세',     colSpan: 2, rowSpan: 1, preview: 'portfolio-wide' },
      { id: 'portfolio-2x2',  label: '대형',     colSpan: 2, rowSpan: 2, preview: 'portfolio-2x2' },
    ],
  },
  {
    id: 'exchange',
    name: '환율',
    category: '기타',
    description: 'USD · JPY 실시간 환율',
    variants: [
      { id: 'exchange-sm',   label: '단일', colSpan: 1, rowSpan: 1, preview: 'exchange-sm' },
      { id: 'exchange-wide', label: '복합', colSpan: 2, rowSpan: 1, preview: 'exchange-wide' },
      { id: 'exchange-2x2',  label: '대형', colSpan: 2, rowSpan: 2, preview: 'exchange-2x2' },
    ],
  },
  {
    id: 'market-overview',
    name: '오늘의 시황',
    category: '기타',
    description: '주요 시황 뉴스 헤드라인',
    variants: [
      { id: 'market-sm',   label: '헤드라인', colSpan: 1, rowSpan: 1, preview: 'market-sm' },
      { id: 'market-wide', label: '상세',     colSpan: 2, rowSpan: 1, preview: 'market-wide' },
      { id: 'market-2x2',  label: '대형',     colSpan: 2, rowSpan: 2, preview: 'market-2x2' },
    ],
  },
  {
    id: 'watchlist',
    name: '관심종목',
    category: '기타',
    description: '등록된 관심 종목 리스트',
    variants: [
      { id: 'watchlist-sm',   label: '컴팩트', colSpan: 1, rowSpan: 1, preview: 'watchlist-sm' },
      { id: 'watchlist-wide', label: '목록형', colSpan: 2, rowSpan: 1, preview: 'watchlist-wide' },
      { id: 'watchlist-2x2',  label: '대형',   colSpan: 2, rowSpan: 2, preview: 'watchlist-2x2' },
    ],
  },
  {
    id: 'trade-history',
    name: '거래내역',
    category: '기타',
    description: '달력 · 리스트 뷰',
    variants: [
      { id: 'trade-list', label: '목록형', colSpan: 1, rowSpan: 1, preview: 'trade-list' },
      { id: 'trade-wide', label: '주간',   colSpan: 2, rowSpan: 1, preview: 'trade-wide' },
      { id: 'trade-cal',  label: '캘린더', colSpan: 2, rowSpan: 2, preview: 'trade-cal' },
    ],
  },
  {
    id: 'report',
    name: '증권사 리포트',
    category: '기타',
    description: '최신 증권사 리포트 목록',
    variants: [
      { id: 'report-sm',   label: '단일',   colSpan: 1, rowSpan: 1, preview: 'report-sm' },
      { id: 'report-wide', label: '목록형', colSpan: 2, rowSpan: 1, preview: 'report-wide' },
      { id: 'report-2x2',  label: '대형',   colSpan: 2, rowSpan: 2, preview: 'report-2x2' },
    ],
  },
]

export const WIDGET_CATEGORIES = ['전체', ...new Set(WIDGET_TYPES.map((w) => w.category))]
