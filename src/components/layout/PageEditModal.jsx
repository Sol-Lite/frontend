import { useState } from 'react'
import { Trash2, Plus, RotateCcw } from 'lucide-react'
import useWidgetStore from '@/store/useWidgetStore'
import { cn } from '@/lib/cn'
import { PreviewContent } from '@/components/layout/EditPanel/WidgetSizeList'

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
          className="bg-surface rounded-[3px] overflow-hidden min-w-0 min-h-0 relative"
          style={{
            gridColumn: `${w.gridCol} / span ${w.colSpan}`,
            gridRow:    `${w.gridRow} / span ${w.rowSpan}`,
          }}
        >
          <div className="absolute top-0 left-0 w-[600%] h-[600%] origin-top-left scale-[0.1667] pointer-events-none p-[14px_16px]">
            <PreviewContent type={w.variantId} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PageCard({ page, isActive, canDelete, onDelete, onRestore, onNavigate }) {
  const isDeleted = !!page._deleted

  return (
    <div className={cn('w-[148px] shrink-0', isDeleted && 'opacity-40')}>
      <div className="relative">
        <button
          disabled={isDeleted || isActive}
          onClick={isDeleted || isActive ? undefined : onNavigate}
          aria-label={isDeleted || isActive ? undefined : `${page.name}으로 이동`}
          className={cn(
            'w-full rounded-[14px] overflow-hidden text-left',
            isActive && !isDeleted
              ? 'border-2 border-primary shadow-widget-hover cursor-default'
              : isDeleted
                ? 'border border-stroke cursor-default'
                : 'border border-stroke hover:border-primary hover:shadow-widget-hover transition-all duration-150 cursor-pointer',
          )}
        >
          <PageThumbnail widgets={page.widgets} />
        </button>

        {/* 삭제 상태 오버레이 — 되돌리기 버튼 */}
        {isDeleted && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[14px]">
            <button
              onClick={onRestore}
              aria-label={`${page.name} 되돌리기`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-stroke text-[11px] font-semibold text-foreground-secondary hover:border-primary hover:text-primary transition-colors shadow-modal"
            >
              <RotateCcw className="w-3 h-3" />
              되돌리기
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2.5 px-0.5">
        <div className="flex items-center gap-1 min-w-0">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            isActive && !isDeleted ? 'bg-primary' : 'bg-foreground-disabled',
          )} />
          <span className={cn(
            'text-[11px] truncate',
            isActive && !isDeleted ? 'font-semibold text-primary' : 'font-medium text-foreground-secondary',
          )}>
            {page.name}
          </span>
          {isActive && !isDeleted && (
            <span className="text-[10px] text-foreground-disabled bg-surface-muted px-1.5 py-px rounded-full shrink-0">
              현재
            </span>
          )}
        </div>

        {!isDeleted && canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
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

  const [stagedPages, setStagedPages]         = useState(() => pages.map((p) => ({ ...p })))
  const [stagedCurrentId, setStagedCurrentId] = useState(currentPageId)

  const activePages = stagedPages.filter((p) => !p._deleted)

  function handleAddPage() {
    const newId = crypto.randomUUID()
    const nextIndex = activePages.length + 1
    setStagedPages((prev) => [
      ...prev,
      { id: newId, name: `대시보드 ${nextIndex}`, widgets: [] },
    ])
  }

  function handleDeletePage(pageId) {
    if (activePages.length <= 1) return
    setStagedPages((prev) => prev.map((p) => p.id === pageId ? { ...p, _deleted: true } : p))
    // 현재 페이지 삭제 시 인접 활성 페이지로 이동
    if (pageId === stagedCurrentId) {
      const remaining = activePages.filter((p) => p.id !== pageId)
      const deletedIndex = activePages.findIndex((p) => p.id === pageId)
      const fallback = remaining[deletedIndex] ?? remaining[deletedIndex - 1]
      setStagedCurrentId(fallback.id)
    }
  }

  function handleRestorePage(pageId) {
    setStagedPages((prev) => prev.map((p) => p.id === pageId ? { ...p, _deleted: false } : p))
  }

  /* 페이지 카드 클릭 or backdrop 클릭 — _deleted 제외 후 store에 반영하고 모달 닫기 */
  function handleClose(targetPageId = stagedCurrentId) {
    const finalPages = stagedPages
      .filter((p) => !p._deleted)
      .map(({ _deleted: _, ...rest }) => rest)
    applyPageChanges(finalPages, targetPageId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={() => handleClose()}
      />

      {/* 모달 카드 */}
      <div className="relative bg-surface rounded-[20px] p-7 w-[760px] max-w-full border border-stroke shadow-modal animate-modal-in">
        {/* 헤더 */}
        <div className="mb-6">
          <h2 className="text-base font-extrabold text-foreground">페이지 편집</h2>
          <p className="text-[11px] text-foreground-disabled mt-0.5">
            대시보드 페이지를 추가하거나 삭제하세요
          </p>
        </div>

        {/* 페이지 썸네일 목록 */}
        <div className="flex gap-3.5 items-start overflow-x-auto pb-1">
          {stagedPages.map((page) => (
            <PageCard
              key={page.id}
              page={page}
              isActive={page.id === stagedCurrentId}
              canDelete={activePages.length > 1}
              onDelete={() => handleDeletePage(page.id)}
              onRestore={() => handleRestorePage(page.id)}
              onNavigate={() => handleClose(page.id)}
            />
          ))}
          <AddPageSlot onClick={handleAddPage} />
        </div>
      </div>
    </div>
  )
}
