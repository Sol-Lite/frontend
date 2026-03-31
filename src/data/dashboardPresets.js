/**
 * 대시보드 프리셋
 *
 * positionX → gridCol, positionY → gridRow, width → colSpan, height → rowSpan
 * configJson.variantId → variantId
 */

export const DASHBOARD_PRESETS = [
  // ── 프리셋 1: 종합형 (dashboard_id=324, order=1) ──────────────────
  {
    id:          'preset-standard',
    name:        '종합형',
    description: '잔고 · 차트 · 뉴스 · 거래내역',
    imageId:     'comprehensive',
    widgets: [
      { widgetTypeId: 'balance',         variantId: 'balance-sm',     gridCol: 1, gridRow: 1, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'index',           variantId: 'index-3x1',      gridCol: 2, gridRow: 1, colSpan: 3, rowSpan: 1 },
      { widgetTypeId: 'exchange',        variantId: 'exchange-sm',    gridCol: 5, gridRow: 1, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'portfolio',       variantId: 'portfolio-sm',   gridCol: 6, gridRow: 1, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-wide',     gridCol: 1, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'market-overview', variantId: 'market-wide',    gridCol: 3, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-wide',     gridCol: 5, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-sm',       gridCol: 1, gridRow: 3, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-sm',       gridCol: 2, gridRow: 3, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-sm',       gridCol: 3, gridRow: 3, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-sm',       gridCol: 4, gridRow: 3, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'watchlist',       variantId: 'watchlist-sm',   gridCol: 5, gridRow: 3, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'stock-news',      variantId: 'stock-news-sm',  gridCol: 6, gridRow: 3, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'trade-history',   variantId: 'trade-wide',     gridCol: 1, gridRow: 4, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-wide',     gridCol: 3, gridRow: 4, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'ranking',         variantId: 'ranking-wide',   gridCol: 5, gridRow: 4, colSpan: 2, rowSpan: 1 },
    ],
  },

  // ── 프리셋 2: 차트 중심형 (dashboard_id=325, order=2) ─────────────
  {
    id:          'preset-chart',
    name:        '거래 분석형',
    description: '여러 차트 · 포트폴리오 · 거래내역',
    imageId:     'trading-analysis',
    widgets: [
      { widgetTypeId: 'balance',       variantId: 'balance-3x1',    gridCol: 1, gridRow: 1, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'stock-chart',   variantId: 'stock-sm',       gridCol: 3, gridRow: 1, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',   variantId: 'stock-sm',       gridCol: 4, gridRow: 1, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'portfolio',     variantId: 'portfolio-2x2',  gridCol: 5, gridRow: 1, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'stock-chart',   variantId: 'stock-wide',     gridCol: 3, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'watchlist',     variantId: 'watchlist-wide', gridCol: 1, gridRow: 3, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',   variantId: 'stock-sm',       gridCol: 3, gridRow: 3, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'trade-history', variantId: 'trade-3x2',      gridCol: 4, gridRow: 3, colSpan: 3, rowSpan: 2 },
      { widgetTypeId: 'index',         variantId: 'index-3x1',      gridCol: 1, gridRow: 4, colSpan: 3, rowSpan: 1 },
    ],
  },

  // ── 프리셋 3: 시황·뉴스형 (dashboard_id=326, order=3) ─────────────
  {
    id:          'preset-market',
    name:        '시황·뉴스형',
    description: '시황 · 순위 · 뉴스 · 환율 · 지수',
    imageId:     'market-news',
    widgets: [
      { widgetTypeId: 'stock-news',    variantId: 'stock-news-sm',  gridCol: 1, gridRow: 1, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'ranking',       variantId: 'ranking-lg',     gridCol: 2, gridRow: 1, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'stock-chart',   variantId: 'stock-3x2',      gridCol: 4, gridRow: 1, colSpan: 3, rowSpan: 2 },
      { widgetTypeId: 'exchange',      variantId: 'exchange-sm',    gridCol: 1, gridRow: 2, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'market-overview', variantId: 'market-2x2',  gridCol: 1, gridRow: 3, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'stock-news',    variantId: 'stock-news-2x2', gridCol: 3, gridRow: 3, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'watchlist',     variantId: 'watchlist-wide', gridCol: 5, gridRow: 3, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'index',         variantId: 'index-wide',     gridCol: 5, gridRow: 4, colSpan: 2, rowSpan: 1 },
    ],
  },

  // ── 프리셋 4: 자산 관리형 (dashboard_id=327, order=4) ─────────────
  {
    id:          'preset-asset',
    name:        '자산 관리형',
    description: '잔고 · 포트폴리오 · 지수 · 시황 · 순위',
    imageId:     'asset-management',
    widgets: [
      { widgetTypeId: 'balance',         variantId: 'balance-lg',      gridCol: 1, gridRow: 1, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-news',      variantId: 'stock-news-sm',   gridCol: 3, gridRow: 1, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'index',           variantId: 'index-wide',      gridCol: 4, gridRow: 1, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'exchange',        variantId: 'exchange-sm',     gridCol: 6, gridRow: 1, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'portfolio',       variantId: 'portfolio-wide',  gridCol: 1, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'watchlist',       variantId: 'watchlist-wide',  gridCol: 3, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'market-overview', variantId: 'market-wide',     gridCol: 5, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-2x2',       gridCol: 1, gridRow: 3, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'trade-history',   variantId: 'trade-wide',      gridCol: 3, gridRow: 3, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'ranking',         variantId: 'ranking-lg',      gridCol: 5, gridRow: 3, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'stock-chart',     variantId: 'stock-wide',      gridCol: 3, gridRow: 4, colSpan: 2, rowSpan: 1 },
    ],
  },

  // ── 프리셋 5: 차트 집중형 (dashboard_id=328, order=5) ─────────────
  {
    id:          'preset-charts-only',
    name:        '차트 집중형',
    description: '다수 차트 · 포트폴리오 · 관심종목',
    imageId:     'charts-focus',
    widgets: [
      { widgetTypeId: 'portfolio',   variantId: 'portfolio-wide', gridCol: 1, gridRow: 1, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart', variantId: 'stock-2x2',      gridCol: 3, gridRow: 1, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'watchlist',   variantId: 'watchlist-wide', gridCol: 5, gridRow: 1, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart', variantId: 'stock-wide',     gridCol: 1, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart', variantId: 'stock-wide',     gridCol: 5, gridRow: 2, colSpan: 2, rowSpan: 1 },
      { widgetTypeId: 'stock-chart', variantId: 'stock-sm',       gridCol: 1, gridRow: 3, colSpan: 1, rowSpan: 1 },
      { widgetTypeId: 'stock-chart', variantId: 'stock-3x2',      gridCol: 2, gridRow: 3, colSpan: 3, rowSpan: 2 },
      { widgetTypeId: 'stock-chart', variantId: 'stock-2x2',      gridCol: 5, gridRow: 3, colSpan: 2, rowSpan: 2 },
      { widgetTypeId: 'stock-chart', variantId: 'stock-sm',       gridCol: 1, gridRow: 4, colSpan: 1, rowSpan: 1 },
    ],
  },
]
