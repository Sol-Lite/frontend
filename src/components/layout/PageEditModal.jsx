import { useState } from 'react'
import { X, Trash2, Plus } from 'lucide-react'
import useWidgetStore from '@/store/useWidgetStore'
import { cn } from '@/lib/cn'

const WIDGET_LABELS = {
  'balance':         '계좌잔고',
  'index':           '주요지수',
  'portfolio':       '포트폴리오',
  'stock-chart':     '차트',
  'ranking':         '순위',
  'watchlist':       '관심종목',
  'market-overview': '시황',
  'stock-news':      '뉴스',
  'exchange':        '환율',
  'trade-history':   '거래내역',
}

/* 6×4 미니 그리드 썸네일 */
function PageThumbnail({ widgets }) {
  if (widgets.length === 0) {
    return (
      <div className="bg-background h-[148px] flex items-center justify-center">
        <span className="text-[9px] text-foreground-disabled">빈 대시보드</span>
      </div>
    )
  }
  return (
    <div className="bg-background h-[148px] p-2 grid grid-cols-6 grid-rows-4 gap-[3px]">
      {widgets.map((w) => (
        <div
          key={w.instanceId}
          className="bg-surface rounded-[3px] p-1 overflow-hidden min-w-0 min-h-0"
          style={{
            gridColumn: `${w.gridCol} / span ${w.colSpan}`,
            gridRow: `${w.gridRow} / span ${w.rowSpan}`,
          }}
        >
          <span className="text-[5px] font-semibold text-foreground-disabled leading-none block truncate">
            {WIDGET_LABELS[w.widgetTypeId] ?? w.widgetTypeId}
          </span>
        </div>
      ))}
    </div>
  )
}

function PageCard({ page, isActive, canDelete, onDelete }) {
  return (
    <div className="w-[148px] shrink-0">
      <div className={cn(
        'rounded-[14px] overflow-hidden',
        isActive
          ? 'border-2 border-primary shadow-widget-hover'
          : 'border border-stroke',
      )}>
        <PageThumbnail widgets={page.widgets} />
      </div>

      <div className="flex items-center justify-between mt-2.5 px-0.5">
        <div className="flex items-center gap-1 min-w-0">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            isActive ? 'bg-primary' : 'bg-foreground-disabled',
          )} />
          <span className={cn(
            'text-[11px] truncate',
            isActive ? 'font-semibold text-primary' : 'font-medium text-foreground-secondary',
          )}>
            {page.name}
          </span>
          {isActive && (
            <span className="text-[10px] text-foreground-disabled bg-surface-muted px-1.5 py-px rounded-full shrink-0">
              현재
            </span>
          )}
        </div>

        {!isActive && canDelete && (
          <button
            onClick={onDelete}
            aria-label={`${page.name} 삭제`}
            className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg border border-danger/20 bg-danger/5 text-danger text-[10px] font-semibold hover:opacity-80 transition-opacity shrink-0"
          >
            <Trash2 className="w-[9px] h-[9px]" />
            삭제
          </button>
        )}
      </div>
    </div>
  )
}

function AddPageSlot({ onClick }) {
  return (
    <div className="w-[148px] shrink-0">
      <button
        onClick={onClick}
        aria-label="새 페이지 추가"
        className="w-full h-[148px] rounded-[14px] border-2 border-dashed border-stroke-input bg-surface-subtle flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary-light transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-foreground-disabled flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 text-foreground-disabled" />
        </div>
        <span className="text-[11px] text-foreground-disabled font-medium">새 페이지 추가</span>
      </button>
      <div className="mt-2.5 px-0.5">
        <span className="text-[11px] text-foreground-disabled">빈 대시보드</span>
      </div>
    </div>
  )
}

export default function PageEditModal({ onClose }) {
  const { pages, currentPageId, applyPageChanges } = useWidgetStore()

  // 취소 지원을 위한 로컬 staged 상태
  const [stagedPages, setStagedPages] = useState(() => pages.map((p) => ({ ...p })))
  const [stagedCurrentId] = useState(currentPageId)

  function handleAddPage() {
    const newId = crypto.randomUUID()
    const nextIndex = stagedPages.length + 1
    setStagedPages((prev) => [
      ...prev,
      { id: newId, name: `대시보드 ${nextIndex}`, widgets: [] },
    ])
  }

  function handleDeletePage(pageId) {
    if (stagedPages.length <= 1) return
    setStagedPages((prev) => prev.filter((p) => p.id !== pageId))
  }

  function handleSave() {
    // 삭제된 페이지가 현재 페이지일 경우 첫 번째 페이지로 fallback
    const targetId = stagedPages.find((p) => p.id === stagedCurrentId)
      ? stagedCurrentId
      : stagedPages[0].id
    applyPageChanges(stagedPages, targetId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={onClose}
      />

      {/* 모달 카드 */}
      <div className="relative bg-surface rounded-[20px] p-7 w-[760px] max-w-full border border-stroke shadow-modal animate-modal-in">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-extrabold text-foreground">페이지 편집</h2>
            <p className="text-[11px] text-foreground-disabled mt-0.5">
              대시보드 페이지를 추가하거나 삭제하세요
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-7 h-7 rounded-full border border-stroke-input bg-surface-muted flex items-center justify-center text-foreground-tertiary hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 페이지 썸네일 목록 */}
        <div className="flex gap-3.5 items-start overflow-x-auto pb-1">
          {stagedPages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              isActive={page.id === stagedCurrentId}
              canDelete={stagedPages.length > 1}
              onDelete={() => handleDeletePage(page.id)}
            />
          ))}
          <AddPageSlot onClick={handleAddPage} />
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-stroke-subtle">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[10px] border border-stroke-input bg-surface text-foreground-secondary text-[12px] font-semibold hover:border-stroke hover:text-foreground transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-[10px] bg-primary text-white text-[12px] font-bold shadow-primary-btn hover:bg-primary-hover transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
