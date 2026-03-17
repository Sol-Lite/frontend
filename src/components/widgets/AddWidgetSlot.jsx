import { Plus } from 'lucide-react'

export default function AddWidgetSlot() {
  return (
    <div className="col-span-1 rounded-2xl border-2 border-dashed border-primary-border bg-primary-light/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-[200ms] hover:border-primary hover:bg-primary-light group">
      <div className="w-9 h-9 rounded-full border-2 border-dashed border-stroke-input flex items-center justify-center transition-all duration-[200ms] group-hover:border-primary group-hover:bg-primary-light">
        <Plus className="w-4 h-4 text-foreground-disabled group-hover:text-primary transition-colors duration-[200ms]" />
      </div>
      <span className="text-[11px] text-foreground-disabled group-hover:text-primary transition-colors duration-[200ms]">
        위젯 추가
      </span>
    </div>
  )
}
