import { Check } from 'lucide-react'

export default function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-[5px] shrink-0">
              <div
                className={[
                  'w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold',
                  active ? 'bg-primary text-white shadow-[0_0_12px_rgba(0,70,255,.3)]'
                    : done ? 'bg-primary text-white'
                      : 'bg-surface-muted text-foreground-disabled border-[1.5px] border-stroke-input',
                ].join(' ')}
              >
                {done ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={[
                  'text-[10px] font-semibold',
                  active || done ? 'text-primary' : 'text-foreground-disabled',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={['flex-1 h-0.5 mx-2.5 mb-3.5', done ? 'bg-primary' : 'bg-stroke-input'].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
