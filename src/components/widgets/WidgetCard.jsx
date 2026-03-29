import useEditModeStore from '@/store/useEditModeStore'
import EditHandle from './EditHandle'
import { cn } from '@/lib/cn'

export default function WidgetCard({ children, className = '', onDelete, onClick }) {
  const { isEditMode, wiggleDelay, wiggleSyncKey } = useEditModeStore()

  return (
    <div className={cn('h-full', className)}>
      {/* animation wrapper: wiggleSyncKey 변경 시 remount → 모든 위젯 animation 동시 재시작
          relative는 EditHandle의 absolute 기준점 역할 */}
      <div
        key={isEditMode ? wiggleSyncKey : undefined}
        className={cn(
          'relative h-full',
          isEditMode
            ? 'animate-wiggle'
            : 'cursor-pointer',
        )}
        style={isEditMode ? { animationDelay: `${wiggleDelay}ms` } : undefined}
        onClick={!isEditMode ? onClick : undefined}
      >
        {isEditMode && <EditHandle onDelete={onDelete} />}
        <div
          className={cn(
            'h-full bg-surface border rounded-2xl p-[14px_16px] overflow-hidden',
            'flex flex-col',
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
