import { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import AppHeader from './AppHeader'
import RightPanel from './RightPanel'
import CurrencySync from './CurrencySync'
import WidgetDetailModal from '@/components/widgets/WidgetDetailModal'
import useWidgetStore, { canPlaceAt, findPushAsidePlanAt } from '@/store/useWidgetStore'
import useEditModeStore from '@/store/useEditModeStore'
import useGridStore from '@/store/useGridStore'
import useAuthStore from '@/store/useAuthStore'
import usePendingWidgetStore from '@/store/usePendingWidgetStore'
import usePendingQueryStore from '@/store/usePendingQueryStore'
import { getWidgetDefaultQuery } from '@/config/widgetShortcuts'
import { useDashboardLoad, useDashboardSave } from '@/hooks/useDashboardSync'
import { WIDGET_REGISTRY } from '@/components/widgets/widgetRegistry'
import { GRID_GAP, GRID_COLS, GRID_ROWS, gridElementRef } from '@/lib/gridConstants'

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const openLoginModal = useAuthStore((s) => s.openLoginModal)
  useDashboardLoad()

  useEffect(() => {
    if (location.state?.openAuthModal) {
      openLoginModal(location.state.openAuthModal)
      navigate(location.pathname, { replace: true, state: {} })
      return
    }

  }, [location, navigate, openLoginModal])


  const [activeDrag, setActiveDrag] = useState(null)
  const {
    widgets,
    addWidgetAt,
    moveWidgetTo,
    applyPushAsidePlan,
    setPhantom,
    clearPhantom,
    phantomWidget,
    setIsDraggingNewWidget,
  } = useWidgetStore()
  const { resyncWiggle } = useEditModeStore()
  const { mutate: saveDashboard } = useDashboardSave()
  const clearPending = usePendingWidgetStore((s) => s.clearPending)
  const setPendingQuery = usePendingQueryStore((s) => s.setPendingQuery)
  const { cellWidth, cellHeight } = useGridStore()
  const pointerPos = useRef({ x: 0, y: 0 })
  const dragAnchor = useRef({ colOffset: 0, rowOffset: 0 })

  // 포인터 좌표를 drag 중에만 추적 (handleDragMove에서 사용)
  // 동일 참조로 등록·해제할 수 있도록 useRef에 저장
  const onPointerMove = useRef((e) => { pointerPos.current = { x: e.clientX, y: e.clientY } }).current

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart({ active, activatorEvent }) {
    const type = active.data.current?.type
    setActiveDrag({ id: active.id, data: active.data.current })
    window.addEventListener('pointermove', onPointerMove)

    // existing-widget: 위젯 내부에서 어디를 잡았는지(anchor)를 셀 단위로 저장.
    // 이후 드래그 좌표 계산 시 top-left 기준 보정에 사용한다.
    if (type === 'existing-widget') {
      dragAnchor.current = { colOffset: 0, rowOffset: 0 }
      const el = gridElementRef.current
      const pointer = activatorEvent
      const w = widgets.find((it) => it.instanceId === active.id)
      if (el && pointer && 'clientX' in pointer && 'clientY' in pointer && w && cellWidth && cellHeight) {
        const rect = el.getBoundingClientRect()
        const widgetLeft = rect.left + (w.gridCol - 1) * (cellWidth + GRID_GAP)
        const widgetTop = rect.top + (w.gridRow - 1) * (cellHeight + GRID_GAP)
        const relX = pointer.clientX - widgetLeft
        const relY = pointer.clientY - widgetTop
        const colOffset = Math.max(0, Math.min(Math.floor(relX / (cellWidth + GRID_GAP)), w.colSpan - 1))
        const rowOffset = Math.max(0, Math.min(Math.floor(relY / (cellHeight + GRID_GAP)), w.rowSpan - 1))
        dragAnchor.current = { colOffset, rowOffset }
      }
    }

    if (type === 'new-widget') {
      setIsDraggingNewWidget(true)
    }
  }

  /* 포인터 좌표 → 1-indexed grid cell → phantom 업데이트.
     new-widget / existing-widget 모두 처리.

     existing-widget 배치 규칙:
       1. 빈 셀 위 → 드래그 위젯만 그 위치로 이동 (phantom 표시)
       2. 점유 셀 위 → push-aside plan(연쇄 밀림) 생성 가능할 때 허용
       3. 그 외 → phantom 제거 (drop 불가)
     → 드래그한 위젯 외 다른 위젯은 절대 의도치 않게 이동하지 않음. */
  function handleDragMove({ active }) {
    const type = active.data.current?.type
    if (type !== 'new-widget' && type !== 'existing-widget') return

    const el = gridElementRef.current
    if (!el || !cellWidth || !cellHeight) return

    const rect = el.getBoundingClientRect()
    const { x, y } = pointerPos.current

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      clearPhantom()
      return
    }

    // 포인터가 가리키는 셀(1-indexed)
    const pointerCol = Math.max(1, Math.min(Math.floor((x - rect.left) / (cellWidth + GRID_GAP)) + 1, GRID_COLS))
    const pointerRow = Math.max(1, Math.min(Math.floor((y - rect.top) / (cellHeight + GRID_GAP)) + 1, GRID_ROWS))

    if (type === 'new-widget') {
      const { variant } = active.data.current
      if (canPlaceAt(widgets, pointerCol, pointerRow, variant.colSpan, variant.rowSpan)) {
        setPhantom({ gridCol: pointerCol, gridRow: pointerRow, colSpan: variant.colSpan, rowSpan: variant.rowSpan })
      } else {
        clearPhantom()
      }
      return
    }

    // existing-widget
    const activeWidget = widgets.find((w) => w.instanceId === active.id)
    if (!activeWidget) return

    // existing-widget은 잡은 anchor를 기준으로 top-left 보정
    const desiredCol = Math.max(
      1,
      Math.min(pointerCol - dragAnchor.current.colOffset, GRID_COLS - activeWidget.colSpan + 1),
    )
    const desiredRow = Math.max(
      1,
      Math.min(pointerRow - dragAnchor.current.rowOffset, GRID_ROWS - activeWidget.rowSpan + 1),
    )

    // Case 1: 빈 셀 → 이동
    if (canPlaceAt(widgets, desiredCol, desiredRow, activeWidget.colSpan, activeWidget.rowSpan, active.id)) {
      setPhantom({
        gridCol: desiredCol,
        gridRow: desiredRow,
        colSpan: activeWidget.colSpan,
        rowSpan: activeWidget.rowSpan,
        activeId: active.id,
      })
      return
    }

    // Case 2: 점유 셀 → desired top-left 기준 push-aside plan 시도 (연쇄 밀림 포함)
    const plan = findPushAsidePlanAt(widgets, active.id, desiredCol, desiredRow)
    if (plan) {
      setPhantom({
        gridCol: plan.targetCol,
        gridRow: plan.targetRow,
        colSpan: activeWidget.colSpan,
        rowSpan: activeWidget.rowSpan,
        activeId: active.id,
        pushAsidePlan: plan,
      })
    } else {
      clearPhantom()
    }
  }

  function handleDragOver({ active, over }) {
    // phantom은 handleDragMove(pointer 좌표 기반)에서 관리
    // new-widget이 그리드 외부로 벗어났을 때 phantom 제거 보조
    if (!over && active.data.current?.type === 'new-widget') clearPhantom()
  }

  function handleDragEnd({ active, over }) {
    window.removeEventListener('pointermove', onPointerMove)
    dragAnchor.current = { colOffset: 0, rowOffset: 0 }
    const savedPhantom = phantomWidget
    setActiveDrag(null)
    clearPhantom()
    setIsDraggingNewWidget(false)
    resyncWiggle()

    const type = active.data.current?.type

    if (type === 'new-widget' && savedPhantom) {
      const { widgetTypeId, variant, widgetConfig } = active.data.current
      addWidgetAt(widgetTypeId, variant, savedPhantom.gridCol, savedPhantom.gridRow, widgetConfig)
      clearPending()
      saveDashboard()
    } else if (type === 'new-widget') {
      // 그리드 밖에 드롭 → pending 유지 (사용자가 다시 시도할 수 있도록)
    } else if (type === 'existing-widget' && savedPhantom?.activeId) {
      if (savedPhantom.pushAsidePlan) {
        applyPushAsidePlan(savedPhantom.pushAsidePlan)
      } else {
        moveWidgetTo(savedPhantom.activeId, savedPhantom.gridCol, savedPhantom.gridRow)
      }
    } else if (type === 'widget-to-chat') {
      if (over?.id === 'chat-dropzone') {
        const { widgetTypeId, variantId, config } = active.data.current
        const query = getWidgetDefaultQuery(widgetTypeId, config, variantId)
        if (query) setPendingQuery(query)
      }
    }
  }

  function handleDragCancel() {
    window.removeEventListener('pointermove', onPointerMove)
    dragAnchor.current = { colOffset: 0, rowOffset: 0 }
    clearPhantom()
    setIsDraggingNewWidget(false)
    resyncWiggle()
    setActiveDrag(null)
  }

  // ── DragOverlay 렌더링 ────────────────────────────────────
  let overlayContent = null

  if (activeDrag && cellWidth && cellHeight) {
    const type = activeDrag.data?.type

    if (type === 'existing-widget') {
      const w = widgets.find((w) => w.instanceId === activeDrag.id)
      const Comp = w ? WIDGET_REGISTRY[w.widgetTypeId] : null
      if (Comp && w) {
        const ow = w.colSpan * cellWidth + (w.colSpan - 1) * GRID_GAP
        const oh = w.rowSpan * cellHeight + (w.rowSpan - 1) * GRID_GAP
        overlayContent = (
          <div className="opacity-90 shadow-widget-edit cursor-grabbing" style={{ width: ow, height: oh }}>
            <Comp variant={w.variantId} colSpan={w.colSpan} rowSpan={w.rowSpan} config={w.config} />
          </div>
        )
      }
    } else if (type === 'new-widget') {
      const { widgetTypeId, variant } = activeDrag.data
      const Comp = WIDGET_REGISTRY[widgetTypeId]
      if (Comp) {
        const ow = variant.colSpan * cellWidth + (variant.colSpan - 1) * GRID_GAP
        const oh = variant.rowSpan * cellHeight + (variant.rowSpan - 1) * GRID_GAP
        overlayContent = (
          <div className="opacity-90 shadow-widget-edit cursor-grabbing" style={{ width: ow, height: oh }}>
            <Comp variant={variant.id} colSpan={variant.colSpan} rowSpan={variant.rowSpan} />
          </div>
        )
      }
    } else if (type === 'widget-to-chat') {
      const w = widgets.find((w) => w.instanceId === activeDrag.data.instanceId)
      const Comp = w ? WIDGET_REGISTRY[w.widgetTypeId] : null
      if (Comp && w) {
        const ow = w.colSpan * cellWidth + (w.colSpan - 1) * GRID_GAP
        const oh = w.rowSpan * cellHeight + (w.rowSpan - 1) * GRID_GAP
        overlayContent = (
          <div className="opacity-90 shadow-widget-edit cursor-grabbing" style={{ width: ow, height: oh }}>
            <Comp variant={w.variantId} colSpan={w.colSpan} rowSpan={w.rowSpan} config={w.config} />
          </div>
        )
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <CurrencySync />
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <main className="relative flex-1 overflow-hidden bg-background isolate">
            <Outlet />
            <WidgetDetailModal />
          </main>
          <RightPanel />
        </div>
      </div>
      <DragOverlay>{overlayContent}</DragOverlay>
    </DndContext>
  )
}
