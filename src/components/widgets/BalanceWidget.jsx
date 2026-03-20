import LiveDot from '@/components/ui/LiveDot'
import LockedOverlay from '@/components/ui/LockedOverlay'
import useAuthStore from '@/store/useAuthStore'
import WidgetCard from './WidgetCard'
import { BALANCE } from '@/mocks/home'

export default function BalanceWidget({ variant = 'balance-sm', colSpan = 1, rowSpan = 1, onDelete }) {
  const { isAuthenticated, isRestoring } = useAuthStore()

  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete}>
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-[10px] font-semibold text-foreground-disabled tracking-[.04em] uppercase">계좌 잔고</span>
        <LiveDot />
      </div>

      {variant === 'balance-lg' ? (
        <div className="flex flex-col flex-1 gap-1.5 min-h-0">
          <div className="shrink-0">
            <div className="text-[8px] text-foreground-disabled">총 평가자산</div>
            <div className="text-[18px] font-bold leading-tight tracking-tight text-foreground mt-0.5">
              {BALANCE.total}
            </div>
            <div className="text-[9px] font-semibold text-up mt-0.5">▲ {BALANCE.profit} ({BALANCE.profitRate})</div>
          </div>
          <div className="h-px bg-stroke-subtle shrink-0" />
          <div className="flex gap-2 flex-1 items-start">
            {[
              { label: '투자원금', val: BALANCE.invested, color: 'text-foreground' },
              { label: '평가손익', val: BALANCE.profit,   color: 'text-up' },
              { label: '주문가능', val: BALANCE.available, color: 'text-foreground' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex-1 min-w-0">
                <div className="text-[10px] text-foreground-disabled">{label}</div>
                <div className={`text-[13px] font-semibold truncate ${color}`}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      ) : variant === 'balance-3x1' ? (
        <div className="flex flex-1 gap-4 min-h-0">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-[9px] text-foreground-disabled">총 평가자산</div>
              <div className="text-[22px] font-bold leading-tight tracking-tight text-foreground mt-0.5">
                {BALANCE.total}
              </div>
              <div className="text-[10px] font-semibold text-up mt-0.5">▲ {BALANCE.profit} ({BALANCE.profitRate})</div>
            </div>
            <div className="flex gap-6 shrink-0">
              <div>
                <div className="text-[9px] text-foreground-disabled">투자원금</div>
                <div className="text-[11px] font-semibold text-foreground">{BALANCE.invested}</div>
              </div>
              <div>
                <div className="text-[9px] text-foreground-disabled">주문가능</div>
                <div className="text-[11px] font-semibold text-foreground">{BALANCE.available}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-1 min-w-0 pl-4 border-l border-stroke">
            <div className="text-[9px] text-foreground-disabled shrink-0">수익 추이 (30일)</div>
            <div className="flex-1 min-h-0 flex items-end gap-px my-2">
              {[30,38,35,50,55,65,70,80,85,92].map((h, i) => (
                <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="text-[9px] text-foreground-disabled text-right shrink-0">최고 +5.2%</div>
          </div>
        </div>
      ) : variant === 'balance-2x2' ? (
        <div className="flex flex-col flex-1 gap-2.5">
          <div>
            <div className="text-[10px] text-foreground-disabled">총 평가자산</div>
            <div className="text-[22px] font-bold leading-tight tracking-tight text-foreground mt-0.5">
              {BALANCE.total}<span className="text-[12px] font-medium text-foreground-tertiary ml-0.5">원</span>
            </div>
            <div className="text-[12px] font-semibold text-up mt-0.5">▲ {BALANCE.profit} ({BALANCE.profitRate})</div>
          </div>
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {[
              { label: '투자원금', val: BALANCE.invested, color: 'text-foreground' },
              { label: '평가손익', val: BALANCE.profit,    color: 'text-up' },
              { label: '당일손익', val: '+342,000',        color: 'text-up' },
              { label: '수익률',   val: BALANCE.profitRate, color: 'text-up' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-background rounded-xl px-3 py-2">
                <div className="text-[9px] text-foreground-disabled">{label}</div>
                <div className={`text-[12px] font-bold ${color} mt-0.5`}>{val}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-0 bg-background rounded-xl flex items-end px-2 pb-2 pt-2 gap-px">
            {[30, 45, 38, 60, 52, 65, 55, 70, 62, 78, 68, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-up/50 rounded-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ) : (
        /* balance-sm (default) */
        <div className="flex-1 flex flex-col justify-end min-h-0">
          <div className="text-[10px] text-foreground-disabled mb-0.5">총 평가자산</div>
          <div className="text-[18px] font-bold leading-tight tracking-tight text-foreground">
            {BALANCE.total}
          </div>
          <div className="text-[11px] font-semibold text-up mt-1">▲ {BALANCE.profit} ({BALANCE.profitRate})</div>
        </div>
      )}

      {!isRestoring && !isAuthenticated && <LockedOverlay message="계좌 정보를 보려면" />}
    </WidgetCard>
  )
}
