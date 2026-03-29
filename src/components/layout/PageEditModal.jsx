import { useState, useMemo } from 'react'
import { X, Trash2, Plus } from 'lucide-react'
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

function PageCard({ page, isActive, canDelete, onDelete, onNavigate }) {
  return (
    <div className="w-[148px] shrink-0">
      <button
        onClick={isActive ? undefined : onNavigate}
        aria-label={isActive ? undefined : `${page.name}으로 이동`}
        className={cn(
          'w-full rounded-[14px] overflow-hidden text-left',
          isActive
            ? 'border-2 border-primary shadow-widget-hover cursor-default'
            : 'border border-stroke hover:border-primary hover:shadow-widget-hover transition-all duration-150 cursor-pointer',
        )}
      >
        <PageThumbnail widgets={page.widgets} />
      </button>

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

        {canDelete && (
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

/* 변경사항 저장 확인 모달
   - type 'close'    : 저장 → applyPageChanges 후 닫기 / 저장 안 함 → 그냥 닫기
   - type 'navigate' : 저장 → applyPageChanges 후 닫기 / 저장 안 함 → switchPage 후 닫기 */
function ConfirmModal({ onSave, onDiscard, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-2xl shadow-modal w-[320px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-foreground mb-1">저장하지 않은 변경사항이 있습니다</h3>
        <p className="text-xs text-foreground-secondary mb-5">저장하지 않으면 변경사항이 사라집니다.</p>
        <div className="flex gap-2">
          <button
            onClick={onDiscard}
            className="flex-1 py-2 rounded-xl border border-stroke-input text-xs text-foreground-secondary font-medium hover:bg-surface-muted transition-colors"
          >
            저장 안 함
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors shadow-primary-btn"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PageEditModal({ onClose }) {
  const { pages, currentPageId, applyPageChanges, switchPage } = useWidgetStore()

  const [stagedPages, setStagedPages]         = useState(() => pages.map((p) => ({ ...p })))
  const [stagedCurrentId, setStagedCurrentId] = useState(currentPageId)
  // null | { type: 'close' } | { type: 'navigate', pageId: string }
  const [pendingAction, setPendingAction]     = useState(null)

  /* staged 변경사항 여부: 원본 대비 페이지 추가/삭제가 있으면 true */
  const hasStagedChanges = useMemo(() => {
    const originalIds = new Set(pages.map((p) => p.id))
    const stagedIds   = new Set(stagedPages.map((p) => p.id))
    return (
      stagedIds.size !== originalIds.size ||
      [...stagedIds].some((id) => !originalIds.has(id)) ||
      [...originalIds].some((id) => !stagedIds.has(id))
    )
  }, [pages, stagedPages])

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
    const next = stagedPages.filter((p) => p.id !== pageId)
    // 현재 페이지를 삭제한 경우 stagedCurrentId를 인접 페이지로 갱신
    if (pageId === stagedCurrentId) {
      const deletedIndex = stagedPages.findIndex((p) => p.id === pageId)
      const fallback = next[deletedIndex] ?? next[deletedIndex - 1]
      setStagedCurrentId(fallback.id)
    }
    setStagedPages(next)
  }

  function handleSave() {
    applyPageChanges(stagedPages, stagedCurrentId)
    onClose()
  }

  /* 백드롭 / X 버튼 클릭 */
  function handleAttemptClose() {
    if (hasStagedChanges) {
      setPendingAction({ type: 'close' })
      return
    }
    onClose()
  }

  /* 비활성 페이지 카드 클릭 */
  function handleNavigateTo(pageId) {
    if (!hasStagedChanges) {
      switchPage(pageId)
      onClose()
      return
    }
    setPendingAction({ type: 'navigate', pageId })
  }

  /* 확인 모달 — 저장 후 처리 */
  function handleConfirmSave() {
    const targetId = pendingAction.type === 'navigate' ? pendingAction.pageId : stagedCurrentId
    applyPageChanges(stagedPages, targetId)
    setPendingAction(null)
    onClose()
  }

  /* 확인 모달 — 저장 없이 처리 */
  function handleConfirmDiscard() {
    if (pendingAction.type === 'navigate') {
      switchPage(pendingAction.pageId)
    }
    setPendingAction(null)
    onClose()
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={handleAttemptClose}
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
            onClick={handleAttemptClose}
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
              onNavigate={() => handleNavigateTo(page.id)}
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

    {pendingAction && (
      <ConfirmModal
        onSave={handleConfirmSave}
        onDiscard={handleConfirmDiscard}
        onCancel={() => setPendingAction(null)}
      />
    )}
    </>
  )
}
