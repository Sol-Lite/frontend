import PriceChange from '@/components/ui/PriceChange'
import WidgetCard from './WidgetCard'
import { HOME_INDICES } from '@/mocks/home'
import { cn } from '@/lib/cn'

const BARS = [50, 55, 48, 60, 52, 58, 54, 62]

const WIDE_PATHS = [
  { area: 'M0,27 L25,21 L50,14 L75,8 L100,3 L100,30 L0,30 Z',  line: '0,27 25,21 50,14 75,8 100,3'  },
  { area: 'M0,3 L33,12 L66,20 L100,27 L100,30 L0,30 Z',         line: '0,3 33,12 66,20 100,27'        },
]

export default function IndexWidget({ variant = 'index-wide', colSpan = 2, rowSpan = 1, onDelete }) {
  if (variant === 'index-sm') {
    const kospi = HOME_INDICES[0]
    const isUp = kospi.change > 0
    const color = isUp ? 'var(--color-up)' : 'var(--color-down)'
    const fill  = isUp ? 'var(--color-up-fill)' : 'var(--color-down-fill)'
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">주요 지수</span>
        <div className="flex-1 flex flex-col justify-center items-center text-center min-h-0">
          <div className="text-[9px] text-foreground-disabled">{kospi.label}</div>
          <div className="text-[18px] font-bold text-foreground leading-tight">{kospi.value}</div>
          <PriceChange value={kospi.change} className="text-[9px]" />
        </div>
        <div className="h-[22px] w-full shrink-0">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
            <path d="M0,27 L25,21 L50,14 L75,8 L100,3 L100,30 L0,30 Z" fill={fill} />
            <polyline points="0,27 25,21 50,14 75,8 100,3" fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'index-3x1') {
    const indices = HOME_INDICES.slice(0, 3)
    const PATHS = [
      { area: 'M0,27 L25,21 L50,14 L75,8 L100,3 L100,30 L0,30 Z',  line: '0,27 25,21 50,14 75,8 100,3'  },
      { area: 'M0,3 L25,10 L50,17 L75,22 L100,27 L100,30 L0,30 Z',  line: '0,3 25,10 50,17 75,22 100,27' },
      { area: 'M0,27 L25,21 L50,14 L75,8 L100,3 L100,30 L0,30 Z',  line: '0,27 25,21 50,14 75,8 100,3'  },
    ]
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">주요 지수</span>
        <div className="flex flex-1 min-h-0 divide-x divide-stroke mt-1">
          {indices.map((idx, i) => {
            const isUp = idx.change > 0
            const { area, line } = PATHS[i]
            const color = isUp ? 'var(--color-up)' : 'var(--color-down)'
            const fill  = isUp ? 'var(--color-up-fill)' : 'var(--color-down-fill)'
            return (
              <div key={idx.key} className="flex-1 flex flex-col items-center px-2">
                <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className="text-[9px] text-foreground-disabled">{idx.label}</div>
                  <div className="text-[17px] font-bold text-foreground leading-tight">{idx.value}</div>
                  <PriceChange value={idx.change} className="text-[10px]" />
                </div>
                <div className="h-[22px] w-full shrink-0">
                  <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <path d={area} fill={fill} />
                    <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </WidgetCard>
    )
  }

  if (variant === 'index-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">주요 지수</span>
        </div>
        <div className="flex flex-col flex-1 gap-3">
          {HOME_INDICES.slice(0, 3).map((idx) => (
            <div key={idx.key} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-foreground-disabled">{idx.label}</div>
                <div className="text-[15px] font-bold text-foreground leading-tight">{idx.value}</div>
                <PriceChange value={idx.change} className="text-[10px]" />
              </div>
              <div className="flex items-end gap-px h-8 shrink-0">
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className={cn('w-1.5 rounded-sm', idx.change > 0 ? 'bg-up/50' : 'bg-down/50')}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </WidgetCard>
    )
  }

  /* index-wide (default) — 2×1: 2컬럼 SVG 라인 차트 */
  const indices = HOME_INDICES.slice(0, 2)
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase shrink-0">주요 지수</span>
      <div className="flex flex-1 min-h-0 divide-x divide-stroke mt-1">
        {indices.map((idx, i) => {
          const isUp = idx.change > 0
          const { area, line } = WIDE_PATHS[i]
          const color = isUp ? 'var(--color-up)' : 'var(--color-down)'
          const fill  = isUp ? 'var(--color-up-fill)' : 'var(--color-down-fill)'
          return (
            <div key={idx.key} className="flex-1 flex flex-col justify-between items-center px-3 py-1">
              <div className="text-center">
                <div className="text-[9px] text-foreground-disabled">{idx.label}</div>
                <div className="text-[16px] font-bold text-foreground leading-tight">{idx.value}</div>
                <PriceChange value={idx.change} className="text-[9px]" />
              </div>
              <div className="h-[20px] w-full shrink-0">
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
                  <path d={area} fill={fill} />
                  <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}
