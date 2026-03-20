import StockAvatar from '@/components/ui/StockAvatar'
import {
  LEFT_TABS,
  RIGHT_TABS,
} from '@/features/invest/constants'
import {
  formatNumber,
  formatSignedNumber,
  formatSignedPercent,
  getDirectionClass,
} from '@/features/invest/formatters'
import {
  EXECUTION_HISTORY,
  HOLDING_SUMMARY,
} from '@/mocks/invest'
import { cn } from '@/lib/cn'

function SectionTabs({ items, activeKey, onChange }) {
  return (
    <div className="flex shrink-0 border-b border-stroke bg-surface-subtle px-2.5">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'px-3 py-2.5 text-xs font-semibold transition-colors',
            activeKey === item.key
              ? 'border-b-2 border-primary text-primary'
              : 'text-foreground-disabled hover:text-foreground-secondary',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function DailyPriceTable({ rows, isLoading, errorMessage }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        일별 시세를 불러오는 중입니다.
      </div>
    )
  }

  if (errorMessage && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-danger">
        {errorMessage}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        표시할 일별 시세가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-[1] bg-surface-subtle">
          <tr>
            <th className="border-b border-stroke px-2 py-1.5 text-left text-[10px] font-semibold text-foreground-disabled">일자</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">종가</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">등락률</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">거래량</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">시가</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">고가</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">저가</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date}>
              <td className="border-b border-stroke-subtle px-2 py-1.5 font-semibold text-foreground-secondary">{row.date}</td>
              <td className={cn('border-b border-stroke-subtle px-2 py-1.5 text-right font-extrabold', getDirectionClass(row.changeRate))}>
                {formatNumber(row.close)}
              </td>
              <td className={cn('border-b border-stroke-subtle px-2 py-1.5 text-right', getDirectionClass(row.changeRate))}>
                {formatSignedPercent(row.changeRate)}
              </td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right">{row.volume}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right">{formatNumber(row.open)}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right text-up">{formatNumber(row.high)}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right text-down">{formatNumber(row.low)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RealtimeTradeTable({ rows, isLoading, errorMessage }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        실시간 시세를 불러오는 중입니다.
      </div>
    )
  }

  if (errorMessage && rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-xs text-danger">
        {errorMessage}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
        표시할 실시간 시세가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[58px_68px_72px_72px_100px_72px] border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['시간', '체결가', '전일대비', '체결량', '누적거래량', '체결강도'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '시간' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div
          key={`${row.time}-${row.price}`}
          className="grid grid-cols-[58px_68px_72px_72px_100px_72px] items-center border-b border-stroke-subtle px-2.5 py-1"
        >
          <span className="text-[10px] text-foreground-disabled">{row.time}</span>
          <span className={cn('text-[11px] font-bold text-right', getDirectionClass(row.diff))}>
            {formatNumber(row.price)}
          </span>
          <span className={cn('text-[10px] text-right', getDirectionClass(row.diff))}>
            {formatSignedNumber(row.diff)}
          </span>
          <span className="text-[10px] text-right">{row.volume}</span>
          <span className="text-[10px] text-right">{row.accumulatedVolume}</span>
          <span className={cn('text-[10px] font-semibold text-right', row.isStrong ? 'text-up' : 'text-foreground-disabled')}>
            {row.strength}
          </span>
        </div>
      ))}
    </div>
  )
}

function ExecutionHistoryPanel() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-[1] grid grid-cols-[58px_minmax(0,1fr)_40px_72px_48px_90px] items-center border-b border-stroke bg-surface-subtle px-2.5 py-1">
        {['시간', '종목', '구분', '체결가', '수량', '금액'].map((label) => (
          <span key={label} className={cn('text-[9px] font-semibold text-foreground-disabled', label === '시간' || label === '종목' || label === '구분' ? '' : 'text-right')}>
            {label}
          </span>
        ))}
      </div>

      {EXECUTION_HISTORY.map((row) => {
        const isBuy = row.side === 'buy'

        return (
          <div
            key={`${row.time}-${row.name}-${row.side}`}
            className="grid grid-cols-[58px_minmax(0,1fr)_40px_72px_48px_90px] items-center gap-2 border-b border-stroke-subtle px-2.5 py-1.5"
          >
            <span className="text-[10px] text-foreground-disabled">{row.time}</span>
            <div className="flex min-w-0 items-center gap-1.5">
              <StockAvatar name={row.name} color={row.avatar} size="sm" />
              <span className="truncate text-[10px] font-semibold text-foreground">{row.name}</span>
            </div>
            <span
              className={cn(
                'rounded-[4px] px-1 py-0.5 text-center text-[8px] font-bold',
                isBuy ? 'bg-up-bg text-up' : 'bg-down-bg text-down',
              )}
            >
              {isBuy ? '매수' : '매도'}
            </span>
            <span className={cn('text-[10px] font-bold text-right', isBuy ? 'text-up' : 'text-down')}>
              {formatNumber(row.price)}
            </span>
            <span className="text-[10px] text-right">{row.quantity}</span>
            <span className="text-[10px] font-semibold text-right">{row.amount}</span>
          </div>
        )
      })}
    </div>
  )
}

function HoldingPanel() {
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

function OpinionTable({ data, isLoading }) {
  const opinions = data?.opinions ?? []

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">투자의견을 불러오는 중입니다.</div>
  }

  if (opinions.length === 0) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">투자의견이 없습니다.</div>
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-[1] bg-surface-subtle">
          <tr>
            <th className="border-b border-stroke px-2 py-1.5 text-left text-[10px] font-semibold text-foreground-disabled">일자</th>
            <th className="border-b border-stroke px-2 py-1.5 text-left text-[10px] font-semibold text-foreground-disabled">증권사</th>
            <th className="border-b border-stroke px-2 py-1.5 text-left text-[10px] font-semibold text-foreground-disabled">의견</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">목표가</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">이전 목표가</th>
          </tr>
        </thead>
        <tbody>
          {opinions.map((row, i) => (
            <tr key={`${row.date}-${row.brokerName}-${i}`}>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-foreground-secondary">{row.date}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 font-semibold">{row.brokerName}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5">{row.opinion}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right font-bold">{formatNumber(row.targetPrice)}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right text-foreground-disabled">{formatNumber(row.previousTargetPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InvestorTable({ data, isLoading }) {
  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">투자자 정보를 불러오는 중입니다.</div>
  }

  if (!data) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">투자자 정보가 없습니다.</div>
  }

  const rows = Array.isArray(data) ? data : [data]

  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 z-[1] bg-surface-subtle">
          <tr>
            <th className="border-b border-stroke px-2 py-1.5 text-left text-[10px] font-semibold text-foreground-disabled">일자</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">종가</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">외인 순매수</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">기관 순매수</th>
            <th className="border-b border-stroke px-2 py-1.5 text-right text-[10px] font-semibold text-foreground-disabled">개인 순매수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.date}-${i}`}>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-foreground-secondary">{row.date}</td>
              <td className="border-b border-stroke-subtle px-2 py-1.5 text-right font-bold">{formatNumber(row.close)}</td>
              <td className={cn('border-b border-stroke-subtle px-2 py-1.5 text-right font-semibold', getDirectionClass(row.foreignNetBuy))}>
                {formatSignedNumber(row.foreignNetBuy)}
              </td>
              <td className={cn('border-b border-stroke-subtle px-2 py-1.5 text-right font-semibold', getDirectionClass(row.institutionNetBuy))}>
                {formatSignedNumber(row.institutionNetBuy)}
              </td>
              <td className={cn('border-b border-stroke-subtle px-2 py-1.5 text-right font-semibold', getDirectionClass(row.individualNetBuy))}>
                {formatSignedNumber(row.individualNetBuy)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FinancePanel({ data, isLoading }) {
  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">재무정보를 불러오는 중입니다.</div>
  }

  if (!data) {
    return <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">재무정보가 없습니다.</div>
  }

  const items = [
    { label: '시가총액', value: `${data.marketCap}억` },
    { label: 'PER', value: data.per },
    { label: 'PBR', value: data.pbr },
    { label: 'EPS', value: data.eps },
    { label: 'BPS', value: data.bps },
    { label: 'ROE', value: `${data.roe}%` },
    { label: '자본금', value: `${data.capital}억` },
    { label: '외국인 보유', value: `${data.foreignRatio}%` },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-2.5">
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-surface-subtle px-2.5 py-2">
            <div className="text-[8px] text-foreground-disabled">{item.label}</div>
            <div className="mt-0.5 text-[13px] font-extrabold text-foreground">{item.value ?? '-'}</div>
          </div>
        ))}
      </div>
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
  isLoading,
  errorMessage,
  onLeftTabChange,
  onRightTabChange,
}) {
  return (
    <div className="flex h-[210px] shrink-0 overflow-hidden border-t-2 border-stroke bg-surface">
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden border-r border-stroke">
        <SectionTabs items={LEFT_TABS} activeKey={leftTab} onChange={onLeftTabChange} />
        {leftTab === 'daily' && <DailyPriceTable rows={dailyRows} isLoading={isLoading} errorMessage={errorMessage} />}
        {leftTab === 'realtime' && <RealtimeTradeTable rows={realtimeRows} isLoading={isLoading} errorMessage={errorMessage} />}
        {leftTab === 'opinion' && <OpinionTable data={opinion} isLoading={detailLoading} />}
        {leftTab === 'investor' && <InvestorTable data={investor} isLoading={detailLoading} />}
        {leftTab === 'finance' && <FinancePanel data={finance} isLoading={detailLoading} />}
      </section>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <SectionTabs items={RIGHT_TABS} activeKey={rightTab} onChange={onRightTabChange} />
        {rightTab === 'exec' && <ExecutionHistoryPanel />}
        {rightTab === 'pending' && (
          <div className="flex flex-1 items-center justify-center text-xs text-foreground-disabled">
            미체결 주문이 없습니다.
          </div>
        )}
        {rightTab === 'holding' && <HoldingPanel />}
      </section>
    </div>
  )
}
