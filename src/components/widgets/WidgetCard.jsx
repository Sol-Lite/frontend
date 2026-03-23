import useEditModeStore from '@/store/useEditModeStore'
import EditHandle from './EditHandle'
import { cn } from '@/lib/cn'

export default function WidgetCard({ children, className = '', onDelete, onClick }) {
  const { isEditMode, wiggleDelay, wiggleSyncKey } = useEditModeStore()

  return (
    /* 바깥 div는 안정적 — EditHandle의 absolute 기준점 역할 */
    <div className={cn('relative h-full', className)}>
      {isEditMode && <EditHandle onDelete={onDelete} />}
      {/* animation wrapper: wiggleSyncKey 변경 시 remount → 모든 위젯 animation 동시 재시작 */}
      <div
        key={isEditMode ? wiggleSyncKey : undefined}
        className={cn(
          'h-full',
          isEditMode
            ? 'animate-wiggle'
            : 'cursor-pointer transition-[transform] duration-[200ms] hover:-translate-y-px',
        )}
        style={isEditMode ? { animationDelay: `${wiggleDelay}ms` } : undefined}
      >
        <div
          onClick={!isEditMode ? onClick : undefined}
          className={cn(
            'h-full bg-surface border rounded-2xl p-[14px_16px]',
            'flex flex-col overflow-hidden',
            isEditMode
              ? 'border-stroke-input shadow-widget-edit'
              : 'border-stroke transition-[border-color,box-shadow] duration-[200ms] hover:border-widget-border-hover hover:shadow-widget-hover',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
