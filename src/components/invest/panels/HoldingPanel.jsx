import { cn } from '@/lib/cn'
import { HOLDING_SUMMARY } from '@/mocks/invest'

export default function HoldingPanel() {
  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="grid grid-cols-2 gap-1.5">
        {HOLDING_SUMMARY.map((item) => (
          <div
            key={item.label}
            className={cn(
              'rounded-lg px-2.5 py-2',
              item.tone === 'neutral' && 'bg-surface-subtle',
              item.tone === 'accent' && 'bg-up-bg',
              item.tone === 'profit' && 'bg-up-bg',
            )}
          >
            <div className="mb-0.5 text-[8px] text-foreground-disabled">{item.label}</div>
            <div className={cn('text-[16px] font-extrabold', item.tone === 'profit' ? 'text-up' : 'text-foreground')}>
              {item.value}
            </div>
            {item.subValue && (
              <div className="mt-0.5 text-[9px] font-bold text-up">{item.subValue}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
