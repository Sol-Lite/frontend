import { create } from 'zustand'
import { GRID_COLS, GRID_ROWS } from '@/lib/gridConstants'

/* ── 그리드 배치 시뮬레이션 ────────────────────────────────
   CSS grid auto-placement(row-first)를 모방해 빈 셀 탐색.
   widgets를 순서대로 배치 후 새 위젯이 들어갈 자리가 있는지 확인.
──────────────────────────────────────────────────────────── */
function _tryPlace(grid, colSpan, rowSpan) {
  for (let row = 0; row <= GRID_ROWS - rowSpan; row++) {
    for (let col = 0; col <= GRID_COLS - colSpan; col++) {
      let ok = true
      outer: for (let r = row; r < row + rowSpan; r++) {
        for (let c = col; c < col + colSpan; c++) {
          if (grid[r][c]) { ok = false; break outer }
        }
      }
      if (ok) {
        for (let r = row; r < row + rowSpan; r++)
          for (let c = col; c < col + colSpan; c++)
            grid[r][c] = true
        return true
      }
    }
  }
  return false
}

export function canFitInGrid(widgets, colSpan, rowSpan) {
  const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false))
  for (const w of widgets) _tryPlace(grid, w.colSpan, w.rowSpan)
  return _tryPlace(grid, colSpan, rowSpan)
}

const INITIAL_WIDGETS = [
  { instanceId: 'w1', widgetTypeId: 'balance',         variantId: 'balance-sm',   colSpan: 1, rowSpan: 1 },
  { instanceId: 'w2', widgetTypeId: 'index',           variantId: 'index-wide',   colSpan: 2, rowSpan: 1 },
  { instanceId: 'w3', widgetTypeId: 'portfolio',       variantId: 'portfolio-sm', colSpan: 1, rowSpan: 1 },
  { instanceId: 'w4', widgetTypeId: 'stock-chart',     variantId: 'stock-sm',     colSpan: 1, rowSpan: 1, config: { stockId: 'samsung'  } },
  { instanceId: 'w5', widgetTypeId: 'ranking',         variantId: 'ranking-wide', colSpan: 2, rowSpan: 1 },
  { instanceId: 'w6', widgetTypeId: 'watchlist',       variantId: 'watchlist-sm', colSpan: 1, rowSpan: 1 },
  { instanceId: 'w7', widgetTypeId: 'market-overview', variantId: 'market-sm',    colSpan: 1, rowSpan: 1 },
  { instanceId: 'w8', widgetTypeId: 'exchange',        variantId: 'exchange-sm',  colSpan: 1, rowSpan: 1 },
  { instanceId: 'w9', widgetTypeId: 'stock-chart',     variantId: 'stock-sm',     colSpan: 1, rowSpan: 1, config: { stockId: 'skhynix' } },
]

const useWidgetStore = create((set) => ({
  widgets: INITIAL_WIDGETS,

  // 편집 모드 진입 시 스냅샷 저장 → 취소 시 복원
  _snapshot: null,
  snapshotWidgets: () => set((state) => ({ _snapshot: state.widgets })),
  restoreSnapshot: () =>
    set((state) => ({ widgets: state._snapshot ?? state.widgets, _snapshot: null })),
  clearSnapshot: () => set({ _snapshot: null }),

  addWidget: (widgetTypeId, variant) =>
    set((state) => {
      if (!canFitInGrid(state.widgets, variant.colSpan, variant.rowSpan)) return state
      return {
        widgets: [
          ...state.widgets,
          {
            instanceId: crypto.randomUUID(),
            widgetTypeId,
            variantId: variant.id,
            colSpan: variant.colSpan,
            rowSpan: variant.rowSpan,
          },
        ],
      }
    }),
  removeWidget: (instanceId) =>
    set((state) => ({
      widgets: state.widgets.filter((w) => w.instanceId !== instanceId),
    })),
}))

export default useWidgetStore
