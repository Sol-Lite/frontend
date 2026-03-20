import { useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/cn'
import useEditModeStore from '@/store/useEditModeStore'

/**
 * 대시보드 위젯을 dnd-kit draggable + droppable item으로 래핑.
 * - SortableContext/useSortable 미사용 → droppableRects 구독 루프 방지
 * - grid col-span / row-span 처리
 * - isEditMode일 때만 drag 활성화
 * - isDragging 시 원본 자리 placeholder 유지 (opacity: 0)
 */
export default function SortableWidgetCard({ instanceId, colSpan = 1, rowSpan = 1, children }) {
  const { isEditMode } = useEditModeStore()

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: instanceId,
    disabled: !isEditMode,
    data: { type: 'existing-widget', instanceId },
  })

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: instanceId,
    data: { type: 'existing-widget', instanceId },
  })

  const setNodeRef = useCallback(
    (node) => {
      setDraggableRef(node)
      setDroppableRef(node)
    },
    [setDraggableRef, setDroppableRef],
  )

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full',
        isEditMode && 'cursor-grab',
        colSpan === 3 ? 'col-span-3' : colSpan === 2 ? 'col-span-2' : 'col-span-1',
        rowSpan === 2 ? 'row-span-2' : '',
        isDragging && 'opacity-0',
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}
