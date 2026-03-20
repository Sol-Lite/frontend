import { create } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
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

function _simulatePlacement(widgets) {
  const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false))
  for (const w of widgets) {
    if (!_tryPlace(grid, w.colSpan, w.rowSpan)) return false
  }
  return true
}

export function canFitInGrid(widgets, colSpan, rowSpan) {
  const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false))
  for (const w of widgets) _tryPlace(grid, w.colSpan, w.rowSpan)
  return _tryPlace(grid, colSpan, rowSpan)
}

/* 재배치 후 전체 위젯이 그리드에 정상 배치 가능한지 검증.
   false 반환 시 해당 순서 변경은 허용하지 않는다. */
export function canReorderWidgets(widgets, activeId, overId) {
  const oldIndex = widgets.findIndex((w) => w.instanceId === activeId)
  const newIndex = widgets.findIndex((w) => w.instanceId === overId)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return false
  return _simulatePlacement(arrayMove([...widgets], oldIndex, newIndex))
}

// 6열 × 4행 (24셀) 기본 레이아웃
// Row 1:   index-3x1(3) + balance-sm(1) + portfolio-sm(1) + exchange-sm(1)       = 6
// Row 2–3: stock-3x2(3×2) + ranking-lg(2×2) + watchlist-sm(1) + market-sm(1)    = 6×2
// Row 4:   trade-wide(2) + stock-news-wide(2) + [빈 2칸]                         = 6
const INITIAL_WIDGETS = [
  { instanceId: 'w1',  widgetTypeId: 'index',           variantId: 'index-3x1',      colSpan: 3, rowSpan: 1 },
  { instanceId: 'w2',  widgetTypeId: 'balance',         variantId: 'balance-sm',     colSpan: 1, rowSpan: 1 },
  { instanceId: 'w3',  widgetTypeId: 'portfolio',       variantId: 'portfolio-sm',   colSpan: 1, rowSpan: 1 },
  { instanceId: 'w4',  widgetTypeId: 'exchange',        variantId: 'exchange-sm',    colSpan: 1, rowSpan: 1 },
  { instanceId: 'w5',  widgetTypeId: 'stock-chart',     variantId: 'stock-3x2',      colSpan: 3, rowSpan: 2, config: { stockId: 'samsung' } },
  { instanceId: 'w6',  widgetTypeId: 'ranking',         variantId: 'ranking-lg',     colSpan: 2, rowSpan: 2 },
  { instanceId: 'w7',  widgetTypeId: 'watchlist',       variantId: 'watchlist-sm',   colSpan: 1, rowSpan: 1 },
  { instanceId: 'w8',  widgetTypeId: 'market-overview', variantId: 'market-sm',      colSpan: 1, rowSpan: 1 },
  { instanceId: 'w9',  widgetTypeId: 'trade-history',   variantId: 'trade-wide',     colSpan: 2, rowSpan: 1 },
  { instanceId: 'w10', widgetTypeId: 'stock-news',      variantId: 'stock-news-wide', colSpan: 2, rowSpan: 1 },
]

const useWidgetStore = create((set) => ({
  widgets: INITIAL_WIDGETS,

  // 편집 모드 진입 시 스냅샷 저장 → 취소 시 복원
  _snapshot: null,
  snapshotWidgets: () => set((state) => ({ _snapshot: state.widgets })),
  restoreSnapshot: () =>
    set((state) => ({ widgets: state._snapshot ?? state.widgets, _snapshot: null })),
  clearSnapshot: () => set({ _snapshot: null }),

  // 드래그 중 ghost placeholder (new-widget 드래그 시 push-aside 표시용)
  phantomWidget: null,
  setPhantom: (phantom) => set({ phantomWidget: phantom }),
  clearPhantom: () => set({ phantomWidget: null }),

  setWidgetsOrder: (ordered) => set({ widgets: ordered }),

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

  // 지정 인덱스에 위젯 삽입 (new-widget drag-to-add 용)
  addWidgetAt: (widgetTypeId, variant, insertIndex) =>
    set((state) => {
      if (!canFitInGrid(state.widgets, variant.colSpan, variant.rowSpan)) return state
      const newWidget = {
        instanceId: crypto.randomUUID(),
        widgetTypeId,
        variantId: variant.id,
        colSpan: variant.colSpan,
        rowSpan: variant.rowSpan,
      }
      const next = [...state.widgets]
      next.splice(Math.min(insertIndex, next.length), 0, newWidget)
      return { widgets: next }
    }),

  removeWidget: (instanceId) =>
    set((state) => ({
      widgets: state.widgets.filter((w) => w.instanceId !== instanceId),
    })),

  reorderWidgets: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.widgets.findIndex((w) => w.instanceId === activeId)
      const newIndex = state.widgets.findIndex((w) => w.instanceId === overId)
      if (oldIndex === -1 || newIndex === -1) return state
      return { widgets: arrayMove(state.widgets, oldIndex, newIndex) }
    }),
}))

export default useWidgetStore
