import { create } from 'zustand'
import { GRID_COLS, GRID_ROWS } from '@/lib/gridConstants'

/* ── 충돌 판정 ──────────────────────────────────────────────
   모든 좌표는 1-indexed (CSS grid와 동일).
──────────────────────────────────────────────────────────── */
function _overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

/* 지정 셀에 위젯을 배치할 수 있는지 확인.
   excludeId: 드래그 중인 위젯을 충돌 대상에서 제외할 때 사용. */
export function canPlaceAt(widgets, targetCol, targetRow, colSpan, rowSpan, excludeId = null) {
  if (targetCol < 1 || targetRow < 1) return false
  if (targetCol + colSpan - 1 > GRID_COLS || targetRow + rowSpan - 1 > GRID_ROWS) return false
  return !widgets.some(
    (w) =>
      w.instanceId !== excludeId &&
      _overlap(targetCol, targetRow, colSpan, rowSpan, w.gridCol, w.gridRow, w.colSpan, w.rowSpan),
  )
}

/* 그리드에 해당 크기의 위젯을 배치할 빈 공간이 있는지 확인 */
export function canFitInGrid(widgets, colSpan, rowSpan) {
  for (let r = 1; r <= GRID_ROWS - rowSpan + 1; r++) {
    for (let c = 1; c <= GRID_COLS - colSpan + 1; c++) {
      if (canPlaceAt(widgets, c, r, colSpan, rowSpan)) return true
    }
  }
  return false
}

/* 첫 번째 빈 셀 탐색 (addWidget 자동 배치용, 좌→우, 위→아래 순서) */
function _findFirstFreeCell(widgets, colSpan, rowSpan) {
  for (let r = 1; r <= GRID_ROWS - rowSpan + 1; r++) {
    for (let c = 1; c <= GRID_COLS - colSpan + 1; c++) {
      if (canPlaceAt(widgets, c, r, colSpan, rowSpan)) return { gridCol: c, gridRow: r }
    }
  }
  return null
}

// 6열 × 4행 (24셀) 기본 레이아웃
// Row 1:   index-3x1(3) + balance-sm(1) + portfolio-sm(1) + exchange-sm(1)       = 6
// Row 2–3: stock-3x2(3×2) + ranking-lg(2×2) + watchlist-sm(1) + market-sm(1)    = 6×2
// Row 4:   trade-wide(2) + stock-news-wide(2) + [빈 2칸]                         = 6
const INITIAL_WIDGETS = [
  { instanceId: 'w1',  widgetTypeId: 'index',           variantId: 'index-3x1',       colSpan: 3, rowSpan: 1, gridCol: 1, gridRow: 1 },
  { instanceId: 'w2',  widgetTypeId: 'balance',         variantId: 'balance-sm',      colSpan: 1, rowSpan: 1, gridCol: 4, gridRow: 1 },
  { instanceId: 'w3',  widgetTypeId: 'portfolio',       variantId: 'portfolio-sm',    colSpan: 1, rowSpan: 1, gridCol: 5, gridRow: 1 },
  { instanceId: 'w4',  widgetTypeId: 'exchange',        variantId: 'exchange-sm',     colSpan: 1, rowSpan: 1, gridCol: 6, gridRow: 1 },
  { instanceId: 'w5',  widgetTypeId: 'stock-chart',     variantId: 'stock-3x2',       colSpan: 3, rowSpan: 2, gridCol: 1, gridRow: 2, config: { stockId: 'samsung' } },
  { instanceId: 'w6',  widgetTypeId: 'ranking',         variantId: 'ranking-lg',      colSpan: 2, rowSpan: 2, gridCol: 4, gridRow: 2 },
  { instanceId: 'w7',  widgetTypeId: 'watchlist',       variantId: 'watchlist-sm',    colSpan: 1, rowSpan: 1, gridCol: 6, gridRow: 2 },
  { instanceId: 'w8',  widgetTypeId: 'market-overview', variantId: 'market-sm',       colSpan: 1, rowSpan: 1, gridCol: 6, gridRow: 3 },
  { instanceId: 'w9',  widgetTypeId: 'trade-history',   variantId: 'trade-wide',      colSpan: 2, rowSpan: 1, gridCol: 1, gridRow: 4 },
  { instanceId: 'w10', widgetTypeId: 'stock-news',      variantId: 'stock-news-wide', colSpan: 2, rowSpan: 1, gridCol: 3, gridRow: 4 },
]

const useWidgetStore = create((set) => ({
  widgets: INITIAL_WIDGETS,

  // 편집 모드 진입 시 스냅샷 저장 → 취소 시 복원
  _snapshot: null,
  snapshotWidgets: () => set((state) => ({ _snapshot: state.widgets })),
  restoreSnapshot: () =>
    set((state) => ({ widgets: state._snapshot ?? state.widgets, _snapshot: null })),
  clearSnapshot: () => set({ _snapshot: null }),

  // new-widget 드래그 중 대시보드 outline 표시용
  isDraggingNewWidget: false,
  setIsDraggingNewWidget: (v) => set({ isDraggingNewWidget: v }),

  // 드래그 중 drop 예정 위치를 보여주는 ghost placeholder
  phantomWidget: null,
  setPhantom: (phantom) => set({ phantomWidget: phantom }),
  clearPhantom: () => set({ phantomWidget: null }),

  // 첫 번째 빈 셀에 위젯 추가 (AddWidgetSlot 클릭 등)
  addWidget: (widgetTypeId, variant) =>
    set((state) => {
      const pos = _findFirstFreeCell(state.widgets, variant.colSpan, variant.rowSpan)
      if (!pos) return state
      return {
        widgets: [
          ...state.widgets,
          {
            instanceId: crypto.randomUUID(),
            widgetTypeId,
            variantId: variant.id,
            colSpan: variant.colSpan,
            rowSpan: variant.rowSpan,
            gridCol: pos.gridCol,
            gridRow: pos.gridRow,
          },
        ],
      }
    }),

  // 지정 좌표에 위젯 추가 (drag-to-add 용)
  addWidgetAt: (widgetTypeId, variant, gridCol, gridRow) =>
    set((state) => {
      if (!canPlaceAt(state.widgets, gridCol, gridRow, variant.colSpan, variant.rowSpan)) return state
      return {
        widgets: [
          ...state.widgets,
          {
            instanceId: crypto.randomUUID(),
            widgetTypeId,
            variantId: variant.id,
            colSpan: variant.colSpan,
            rowSpan: variant.rowSpan,
            gridCol,
            gridRow,
          },
        ],
      }
    }),

  removeWidget: (instanceId) =>
    set((state) => ({
      widgets: state.widgets.filter((w) => w.instanceId !== instanceId),
    })),

  // 기존 위젯을 지정 좌표로 이동
  moveWidgetTo: (instanceId, gridCol, gridRow) =>
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.instanceId === instanceId ? { ...w, gridCol, gridRow } : w,
      ),
    })),
}))

export default useWidgetStore
