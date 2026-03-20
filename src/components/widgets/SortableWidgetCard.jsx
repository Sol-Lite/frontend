import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/cn'
import useEditModeStore from '@/store/useEditModeStore'

/**
 * 대시보드 위젯을 dnd-kit sortable item으로 래핑.
 * - grid col-span / row-span 처리 (WidgetCard에서 이 역할을 위임받음)
 * - isEditMode일 때만 drag 활성화
 * - isDragging 시 원본 자리 placeholder 유지 (opacity: 0)
 */
export default function SortableWidgetCard({ instanceId, colSpan = 1, rowSpan = 1, children }) {
  const { isEditMode } = useEditModeStore()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: instanceId,
    disabled: !isEditMode,
    data: { type: 'existing-widget', instanceId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
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
