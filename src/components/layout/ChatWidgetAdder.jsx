import { useState, useRef, useEffect } from 'react'
import { Grid2X2Plus } from 'lucide-react'
import { WIDGET_TYPES } from '@/mocks/widgets'
import usePendingWidgetStore from '@/store/usePendingWidgetStore'

const INFOCARD_WIDGET_MAP = {
  balance:          'balance',
  exchange_rate:    'exchange',
  index:            'index',
  ranking:          'ranking',
  market_overview:  'market-overview',
  portfolio:        'portfolio',
  trade_history:    'trade-history',
  'trade-history':  'trade-history',
}

/** info_card infoType → widgetTypeId */
export function getInfoCardWidgetTypeId(infoType) {
  return INFOCARD_WIDGET_MAP[infoType] ?? null
}

/**
 * 타임스탬프 옆에 붙는 위젯 추가 버튼.
 * 클릭 시 size variants가 오른쪽으로 펼쳐지고, 선택하면 해당 채팅 카드가
 * 흔들리면서 드래거블 상태가 된다. 대시보드 그리드에 드롭하면 위젯이 배치된다.
 */
export default function ChatWidgetAdder({ msgId, widgetTypeId, variantIds }) {
  const [open, setOpen]           = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const { pendingMsgId, setPending, clearPending } = usePendingWidgetStore()
  const containerRef = useRef(null)

  const widgetType = WIDGET_TYPES.find((w) => w.id === widgetTypeId)

  const isPending = pendingMsgId === msgId

  // 외부 클릭 시 초기 상태로 리셋 (open 또는 isPending 상태일 때)
  useEffect(() => {
    if (!open && !isPending) return
    const handleClick = (e) => {
      // React가 클릭 핸들러에서 DOM을 업데이트해 target이 이미 제거된 경우 무시
      if (!document.body.contains(e.target)) return
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        clearPending()
        setSelectedId(null)
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [open, isPending, clearPending])

  // 드롭 완료 등 외부에서 clearPending 호출 시 selectedId 리셋
  useEffect(() => {
    if (!isPending) setSelectedId(null)
  }, [isPending])

  if (!widgetType) return null
  // variantIds가 지정된 경우 해당 variant만 피커에 표시
  const variants = variantIds
    ? widgetType.variants.filter((v) => variantIds.includes(v.id))
    : widgetType.variants

  const handleAdd = (variant) => {
    if (isPending && selectedId === variant.id) {
      clearPending()
      setSelectedId(null)
      setOpen(false)
      return
    }
    setSelectedId(variant.id)
    setPending(msgId, widgetTypeId, variant)
    setOpen(false)
  }

  const handleIconClick = () => {
    if (isPending) {
      clearPending()
      setSelectedId(null)
      setOpen(false)
    } else {
      setOpen((o) => !o)
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col items-start">
      {/* 아이콘 클릭 시 안내 문구 — 타임스탬프 위로 올라옴 */}
      {open && (
        <span className="text-[9px] text-foreground-tertiary whitespace-nowrap mb-0.5 animate-bubble-in">
          원하는 카드를 선택하세요
        </span>
      )}

      <div className="flex items-center gap-1.5">
        {/* 아이콘 버튼 */}
        <button
          onClick={handleIconClick}
          className={[
            'p-0.5 rounded transition-colors',
            isPending
              ? 'text-primary'
              : open
              ? 'text-foreground-tertiary'
              : 'text-foreground-disabled hover:text-foreground-tertiary',
          ].join(' ')}
          title={isPending ? '드래그하여 대시보드에 추가 (클릭 시 취소)' : `${widgetType.name} 위젯 추가`}
        >
          <Grid2X2Plus size={14} />
        </button>

        {/* 드래그 안내 문구 — 사이즈 선택 후 */}
        {isPending && (
          <span className="text-[9px] text-primary font-medium whitespace-nowrap animate-bubble-in">
            대시보드로 드래그 해보세요
          </span>
        )}

        {/* Size variants — 오른쪽으로 펼쳐짐 */}
        {open && (
          <div className="flex items-center gap-2 animate-bubble-in">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => handleAdd(v)}
                className="group"
                title={v.label}
              >
                <div
                  className={[
                    'rounded-[3px] border transition-colors flex items-center justify-center',
                    selectedId === v.id
                      ? 'bg-primary border-primary'
                      : 'border-stroke bg-surface-muted group-hover:bg-primary-light group-hover:border-primary',
                  ].join(' ')}
                  style={{ width: v.colSpan * 16, height: v.rowSpan * 12 }}
                >
                  <span className={['text-[7px] leading-none font-semibold', selectedId === v.id ? 'text-white' : 'text-foreground-secondary group-hover:text-primary'].join(' ')}>
                    {v.colSpan}×{v.rowSpan}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
