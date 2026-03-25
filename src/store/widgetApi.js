/**
 * 프론트(useWidgetStore) ↔ 백엔드(WidgetLayout DTO) 변환 레이어
 *
 * GET /api/dashboards/me  → fromApiResponse(data)  → pages
 * pages                   → toApiPayload(pages)     → PUT /api/dashboards/me
 */

/**
 * widgetType → 기본 variantId 매핑.
 * GET 응답의 configJson에 variantId가 없을 때 폴백으로 사용.
 */
const DEFAULT_VARIANT = {
  'index':           'index-3x1',
  'balance':         'balance-sm',
  'portfolio':       'portfolio-sm',
  'exchange':        'exchange-sm',
  'stock-chart':     'stock-3x2',
  'ranking':         'ranking-lg',
  'watchlist':       'watchlist-sm',
  'market-overview': 'market-sm',
  'trade-history':   'trade-wide',
  'stock-news':      'stock-news-wide',
}

/**
 * GET /api/dashboards/me 응답 → useWidgetStore.pages 형태로 변환
 *
 * 백엔드는 List<DashboardPageResponse> 를 배열로 직접 반환.
 *
 * @param {Array} data - 백엔드 응답 JSON (페이지 배열)
 * @returns {Array} useWidgetStore의 pages 배열
 */
export function fromApiResponse(data) {
  return data.map((page) => ({
    id:      String(page.dashboardId),
    name:    page.name,
    widgets: page.widgets.map((w) => {
      let parsed = {}
      if (w.configJson) {
        try { parsed = JSON.parse(w.configJson) } catch { /* 잘못된 JSON은 빈 config로 처리 */ }
      }
      const { variantId, ...restConfig } = parsed
      return {
        instanceId:   crypto.randomUUID(),
        widgetTypeId: w.widgetType,
        variantId:    variantId ?? DEFAULT_VARIANT[w.widgetType] ?? w.widgetType,
        gridCol:      w.positionX,
        gridRow:      w.positionY,
        colSpan:      w.width,
        rowSpan:      w.height,
        config:       Object.keys(restConfig).length > 0 ? restConfig : undefined,
      }
    }),
  }))
}

/**
 * useWidgetStore.pages → PUT /api/dashboards/me 요청 바디로 변환
 *
 * - page.id가 서버 발급 ID(숫자)면 dashboardId로 전송 (UPDATE)
 * - 'page-1' 같은 프론트 임시 ID면 null로 전송 (INSERT)
 *
 * @param {Array} pages - useWidgetStore의 pages 배열
 * @returns {{ pages: Array }} PUT 요청 바디
 */
export function toApiPayload(pages) {
  return {
    pages: pages.map((page, i) => {
      const numericId = Number(page.id)
      return {
        dashboardId: Number.isFinite(numericId) ? numericId : null,
        name:        page.name,
        pageOrder:   i + 1,
        widgets:     page.widgets.map((w) => ({
          widgetType: w.widgetTypeId,
          positionX:  w.gridCol,
          positionY:  w.gridRow,
          width:      w.colSpan,
          height:     w.rowSpan,
          configJson: JSON.stringify({ variantId: w.variantId, ...w.config }),
        })),
      }
    }),
  }
}
