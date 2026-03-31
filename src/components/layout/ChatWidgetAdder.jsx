import { useState } from 'react'
import { Grid2X2Plus } from 'lucide-react'
import { WIDGET_TYPES } from '@/mocks/widgets'
import usePendingWidgetStore from '@/store/usePendingWidgetStore'

const INFOCARD_WIDGET_MAP = {
  balance:          'balance',
  exchange_rate:    'exchange',
  index:            'index',
  ranking:          'ranking',
  market_overview:  'market-overview',
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

  const widgetType = WIDGET_TYPES.find((w) => w.id === widgetTypeId)
  if (!widgetType) return null

  const isPending = pendingMsgId === msgId
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
                <span className={['text-[7px] leading-none', selectedId === v.id ? 'text-white' : 'text-foreground-disabled group-hover:text-primary'].join(' ')}>
                  {v.colSpan}×{v.rowSpan}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
