import { cn } from '@/lib/cn'
import { LEFT_TABS, RIGHT_TABS } from '@/features/invest/constants'
import DailyPriceTable from '@/components/invest/panels/DailyPriceTable'
import RealtimeTradeTable from '@/components/invest/panels/RealtimeTradeTable'
import OpinionTable from '@/components/invest/panels/OpinionTable'
import InvestorTable from '@/components/invest/panels/InvestorTable'
import FinancePanel from '@/components/invest/panels/FinancePanel'
import ExecutionHistoryPanel from '@/components/invest/panels/ExecutionHistoryPanel'
import HoldingPanel from '@/components/invest/panels/HoldingPanel'
import PendingOrdersPanel from '@/components/invest/panels/PendingOrdersPanel'

function SectionTabs({ items, activeKey, onChange }) {
  return (
    <div className="flex shrink-0 border-b border-stroke bg-surface-subtle px-2.5">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'px-3 py-2.5 text-xs transition-colors',
            activeKey === item.key
              ? 'border-b-2 border-primary text-primary font-bold'
              : 'font-semibold text-foreground-disabled hover:text-foreground-secondary',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export default function InvestBottomPanels({
  leftTab,
  rightTab,
  dailyRows,
  realtimeRows,
  opinion,
  investor,
  finance,
  detailLoading,
  dailyLoading,
  realtimeLoading,
  errorMessage,
  onLeftTabChange,
  onRightTabChange,
}) {
  return (
    <div className="flex h-[210px] shrink-0 overflow-hidden border-t-2 border-stroke bg-surface">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-stroke">
        <SectionTabs items={LEFT_TABS} activeKey={leftTab} onChange={onLeftTabChange} />
        {leftTab === 'daily' && <DailyPriceTable rows={dailyRows} isLoading={dailyLoading} errorMessage={errorMessage} />}
        {leftTab === 'realtime' && <RealtimeTradeTable rows={realtimeRows} isLoading={realtimeLoading} errorMessage={errorMessage} />}
        {leftTab === 'opinion' && <OpinionTable data={opinion} isLoading={detailLoading} />}
        {leftTab === 'investor' && <InvestorTable data={investor} isLoading={detailLoading} />}
        {leftTab === 'finance' && <FinancePanel data={finance} isLoading={detailLoading} />}
      </section>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <SectionTabs items={RIGHT_TABS} activeKey={rightTab} onChange={onRightTabChange} />
        {rightTab === 'exec' && <ExecutionHistoryPanel />}
        {rightTab === 'pending' && <PendingOrdersPanel />}
        {rightTab === 'holding' && <HoldingPanel />}
      </section>
    </div>
  )
}
