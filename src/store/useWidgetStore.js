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

/* 두 위젯이 서로의 위치를 교환할 수 있는지 확인.
   - A가 B의 좌표에, B가 A의 좌표에 배치될 때 다른 위젯과 충돌하지 않아야 함.
   - 크기가 달라도 각자의 새 위치에 물리적으로 맞으면 swap 허용. */
export function canSwap(widgets, idA, idB) {
  const wA = widgets.find((w) => w.instanceId === idA)
  const wB = widgets.find((w) => w.instanceId === idB)
  if (!wA || !wB) return false

  // A가 B의 위치에 배치 가능한지 (A, B 자신 제외)
  const aFitsAtB =
    wB.gridCol + wA.colSpan - 1 <= GRID_COLS &&
    wB.gridRow + wA.rowSpan - 1 <= GRID_ROWS &&
    !widgets.some(
      (w) =>
        w.instanceId !== idA &&
        w.instanceId !== idB &&
        _overlap(wB.gridCol, wB.gridRow, wA.colSpan, wA.rowSpan, w.gridCol, w.gridRow, w.colSpan, w.rowSpan),
    )

  // B가 A의 위치에 배치 가능한지 (A, B 자신 제외)
  const bFitsAtA =
    wA.gridCol + wB.colSpan - 1 <= GRID_COLS &&
    wA.gridRow + wB.rowSpan - 1 <= GRID_ROWS &&
    !widgets.some(
      (w) =>
        w.instanceId !== idA &&
        w.instanceId !== idB &&
        _overlap(wA.gridCol, wA.gridRow, wB.colSpan, wB.rowSpan, w.gridCol, w.gridRow, w.colSpan, w.rowSpan),
    )

  return aFitsAtB && bFitsAtA
}

/* 지정 위치에서 가장 가까운 빈 셀 탐색 (push-aside용).
   excludeIds: 충돌 판정에서 제외할 instanceId 목록 (드래그 중인 위젯 + 밀리는 위젯). */
export function findNearestFreeCell(widgets, colSpan, rowSpan, fromCol, fromRow, excludeIds = []) {
  const others = widgets.filter((w) => !excludeIds.includes(w.instanceId))
  let best = null
  let bestDist = Infinity
  for (let r = 1; r <= GRID_ROWS - rowSpan + 1; r++) {
    for (let c = 1; c <= GRID_COLS - colSpan + 1; c++) {
      if (canPlaceAt(others, c, r, colSpan, rowSpan)) {
        const dist = Math.abs(c - fromCol) + Math.abs(r - fromRow)
        if (dist < bestDist) {
          bestDist = dist
          best = { gridCol: c, gridRow: r }
        }
      }
    }
  }
  return best
}

/* active를 over의 자리로 이동시키기 위해 필요한 push-aside 이동 계획 생성.
   - active의 target footprint와 겹치는 모든 위젯(blockers)을 연쇄적으로 가장 가까운 빈 셀로 이동
   - blockers를 모두 재배치할 수 있으면 plan 반환, 아니면 null */
export function findPushAsidePlan(widgets, activeId, overId) {
  const active = widgets.find((w) => w.instanceId === activeId)
  const over = widgets.find((w) => w.instanceId === overId)
  if (!active || !over) return null

  return findPushAsidePlanAt(widgets, activeId, over.gridCol, over.gridRow)
}

/* active를 지정 target 좌표(top-left)로 이동시키기 위해 필요한 push-aside 이동 계획 생성.
   - active의 target footprint와 겹치는 모든 위젯(blockers)을 연쇄적으로 가장 가까운 빈 셀로 이동
   - blockers를 모두 재배치할 수 있으면 plan 반환, 아니면 null */
export function findPushAsidePlanAt(widgets, activeId, targetCol, targetRow) {
  const active = widgets.find((w) => w.instanceId === activeId)
  if (!active) return null

  // active가 over 기준 좌표에 물리적으로 들어갈 수 있어야 함
  if (targetCol + active.colSpan - 1 > GRID_COLS || targetRow + active.rowSpan - 1 > GRID_ROWS) {
    return null
  }

  // active가 target에 들어갈 때 겹치는 위젯들(본인 제외)
  const blockers = widgets.filter(
    (w) =>
      w.instanceId !== activeId &&
      _overlap(targetCol, targetRow, active.colSpan, active.rowSpan, w.gridCol, w.gridRow, w.colSpan, w.rowSpan),
  )
  if (blockers.length === 0) return null

  // 큰 위젯을 먼저 배치하면 성공률이 높다.
  // 주의: greedy 휴리스틱이라 최적 해가 존재해도 null을 반환할 수 있다.
  const sortedBlockers = [...blockers].sort((a, b) => {
    const areaDiff = b.colSpan * b.rowSpan - a.colSpan * a.rowSpan
    if (areaDiff !== 0) return areaDiff
    const da = Math.abs(a.gridCol - targetCol) + Math.abs(a.gridRow - targetRow)
    const db = Math.abs(b.gridCol - targetCol) + Math.abs(b.gridRow - targetRow)
    return da - db
  })

  const blockerIds = new Set(sortedBlockers.map((w) => w.instanceId))
  const working = widgets
    .filter((w) => w.instanceId !== activeId && !blockerIds.has(w.instanceId))
    .concat({
      instanceId: '__ghost_active__',
      gridCol: targetCol,
      gridRow: targetRow,
      colSpan: active.colSpan,
      rowSpan: active.rowSpan,
    })

  const moves = []
  for (const blocker of sortedBlockers) {
    const cell = findNearestFreeCell(working, blocker.colSpan, blocker.rowSpan, blocker.gridCol, blocker.gridRow)
    if (!cell) return null
    moves.push({ instanceId: blocker.instanceId, gridCol: cell.gridCol, gridRow: cell.gridRow })
    working.push({
      instanceId: blocker.instanceId,
      colSpan: blocker.colSpan,
      rowSpan: blocker.rowSpan,
      gridCol: cell.gridCol,
      gridRow: cell.gridRow,
    })
  }

  return { activeId, targetCol, targetRow, moves }
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

/* 첫 번째 빈 셀 탐색 (addWidget 자동 배치용) */
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

const INITIAL_PAGES = [
  { id: 'page-1', name: '대시보드 1', widgets: INITIAL_WIDGETS },
]

/* 현재 페이지의 widgets를 업데이트하고 top-level widgets 키도 동기화.
   top-level widgets는 기존 소비자(AppShell, HomePage 등) 하위 호환용. */
function _setCurrentWidgets(state, newWidgets) {
  const newPages = state.pages.map((p) =>
    p.id === state.currentPageId ? { ...p, widgets: newWidgets } : p,
  )
  return { pages: newPages, widgets: newWidgets }
}

const useWidgetStore = create((set) => ({
  // ── 멀티 페이지 상태 ─────────────────────────────────────
  pages: INITIAL_PAGES,
  currentPageId: 'page-1',

  // top-level widgets: 항상 현재 페이지의 widgets를 미러링 (하위 호환)
  widgets: INITIAL_WIDGETS,

  // ── 페이지 전환 ─────────────────────────────────────────
  switchPage: (pageId) =>
    set((state) => {
      const page = state.pages.find((p) => p.id === pageId)
      if (!page || page.id === state.currentPageId) return state
      return { currentPageId: pageId, widgets: page.widgets }
    }),

  // ── 페이지 이름 변경 ─────────────────────────────────────
  renamePage: (pageId, name) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, name } : p)),
    })),

  // ── 페이지 편집 모달에서 staged 변경사항 일괄 적용 ────────
  applyPageChanges: (newPages, newCurrentId) =>
    set(() => {
      const currentPage = newPages.find((p) => p.id === newCurrentId) ?? newPages[0]
      return {
        pages: newPages,
        currentPageId: currentPage.id,
        widgets: currentPage.widgets,
      }
    }),

  // ── 편집 모드 스냅샷 (현재 페이지 스코프) ────────────────
  _snapshot: null,
  snapshotWidgets: () =>
    set((state) => ({ _snapshot: { pageId: state.currentPageId, widgets: state.widgets } })),
  restoreSnapshot: () =>
    set((state) => {
      if (!state._snapshot) return state
      // 스냅샷이 현재 페이지와 다를 경우 무시 (페이지 전환이 일어난 경우)
      if (state._snapshot.pageId !== state.currentPageId) return { _snapshot: null }
      return {
        ..._setCurrentWidgets(state, state._snapshot.widgets),
        _snapshot: null,
      }
    }),
  clearSnapshot: () => set({ _snapshot: null }),

  // ── drag UI 상태 ─────────────────────────────────────────
  isDraggingNewWidget: false,
  setIsDraggingNewWidget: (v) => set({ isDraggingNewWidget: v }),

  phantomWidget: null,
  setPhantom: (phantom) => set({ phantomWidget: phantom }),
  clearPhantom: () => set({ phantomWidget: null }),

  // ── 위젯 CRUD ────────────────────────────────────────────

  // 첫 번째 빈 셀에 위젯 추가 (AddWidgetSlot 클릭 등)
  addWidget: (widgetTypeId, variant) =>
    set((state) => {
      const pos = _findFirstFreeCell(state.widgets, variant.colSpan, variant.rowSpan)
      if (!pos) return state
      const newWidgets = [
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
      ]
      return _setCurrentWidgets(state, newWidgets)
    }),

  // 지정 좌표에 위젯 추가 (new-widget drag-to-add 용)
  addWidgetAt: (widgetTypeId, variant, gridCol, gridRow) =>
    set((state) => {
      if (!canPlaceAt(state.widgets, gridCol, gridRow, variant.colSpan, variant.rowSpan)) return state
      const newWidgets = [
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
      ]
      return _setCurrentWidgets(state, newWidgets)
    }),

  removeWidget: (instanceId) =>
    set((state) => {
      const newWidgets = state.widgets.filter((w) => w.instanceId !== instanceId)
      return _setCurrentWidgets(state, newWidgets)
    }),

  // 위젯을 지정 좌표로 이동 (빈 셀 drop)
  moveWidgetTo: (instanceId, gridCol, gridRow) =>
    set((state) => {
      const newWidgets = state.widgets.map((w) =>
        w.instanceId === instanceId ? { ...w, gridCol, gridRow } : w,
      )
      return _setCurrentWidgets(state, newWidgets)
    }),

  // 연쇄 push-aside 적용: active를 target으로 이동 + blockers를 계획된 좌표로 이동
  applyPushAsidePlan: (plan) =>
    set((state) => {
      if (!plan?.activeId) return state
      const moveMap = new Map((plan.moves || []).map((m) => [m.instanceId, m]))
      const newWidgets = state.widgets.map((w) => {
        if (w.instanceId === plan.activeId) {
          return { ...w, gridCol: plan.targetCol, gridRow: plan.targetRow }
        }
        const m = moveMap.get(w.instanceId)
        if (m) return { ...w, gridCol: m.gridCol, gridRow: m.gridRow }
        return w
      })
      return _setCurrentWidgets(state, newWidgets)
    }),
}))

export default useWidgetStore
