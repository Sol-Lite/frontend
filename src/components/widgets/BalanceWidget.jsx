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
        <div className="flex items-center justify-between flex-1 gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] text-foreground-disabled">총 평가자산</div>
            <div className="text-[18px] font-bold leading-tight tracking-tight text-foreground">
              {BALANCE.total}<span className="text-[11px] font-medium text-foreground-tertiary ml-0.5">원</span>
            </div>
            <div className="text-[11px] font-semibold text-up">▲ {BALANCE.profit} ({BALANCE.profitRate})</div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-subtle">
              <span className="text-[13px]">🇰🇷</span>
              <div>
                <div className="text-[9px] text-foreground-disabled">KRW</div>
                <div className="text-[12px] font-semibold text-foreground">{BALANCE.krw}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-subtle">
              <span className="text-[13px]">🇺🇸</span>
              <div>
                <div className="text-[9px] text-foreground-disabled">USD</div>
                <div className="text-[12px] font-semibold text-foreground">{BALANCE.usd}</div>
              </div>
            </div>
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
              { label: '투자원금', val: '82,180,000', color: 'text-foreground' },
              { label: '평가손익', val: BALANCE.profit, color: 'text-up' },
              { label: '당일손익', val: '+342,000',    color: 'text-up' },
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
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-foreground-disabled mb-0.5">총 평가자산</div>
            <div className="text-[18px] font-bold leading-tight tracking-tight text-foreground">
              {BALANCE.total}<span className="text-[11px] font-medium text-foreground-tertiary ml-0.5">원</span>
            </div>
            <div className="text-[11px] font-semibold text-up mt-0.5">▲ {BALANCE.profit} ({BALANCE.profitRate})</div>
          </div>
          <div className="flex flex-col gap-1 pt-2 border-t border-stroke-subtle mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px]">🇰🇷</span>
                <span className="text-[10px] text-foreground-tertiary">KRW</span>
              </div>
              <span className="text-[10px] font-semibold text-foreground-secondary">{BALANCE.krw}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px]">🇺🇸</span>
                <span className="text-[10px] text-foreground-tertiary">USD</span>
              </div>
              <span className="text-[10px] font-semibold text-foreground-secondary">{BALANCE.usd}</span>
            </div>
          </div>
        </div>
      )}

      {!isRestoring && !isAuthenticated && <LockedOverlay message="계좌 정보를 보려면" />}
    </WidgetCard>
  )
}
