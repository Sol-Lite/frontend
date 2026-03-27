import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { LAST_INVEST_PATH_KEY, LAST_INVEST_STATE_KEY } from '@/features/invest/navigation'
import useEditModeStore from '@/store/useEditModeStore'
import useWidgetStore, { hasUnsavedChanges } from '@/store/useWidgetStore'
import { useDashboardSave } from '@/hooks/useDashboardSync'

const TABS = [
  { label: '홈',  path: '/' },
  { label: '시세', path: '/market' },
  { label: '주문', path: '/invest' },
  { label: '잔고', path: '/asset' },
]

/* 이동 경로를 결정 — /invest는 마지막 방문 경로 복원 */
function resolveNavigatePath(path) {
  if (path !== '/invest') return { path, state: undefined }
  const lastInvestPath = sessionStorage.getItem(LAST_INVEST_PATH_KEY) || '/invest'
  const savedState = sessionStorage.getItem(LAST_INVEST_STATE_KEY)
  let parsedState
  try { parsedState = savedState ? JSON.parse(savedState) : undefined } catch { parsedState = undefined }
  return { path: lastInvestPath, state: parsedState }
}

/* 편집 모드 탭 이동 확인 모달 */
function NavConfirmModal({ isPending, onSave, onDiscard, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-[320px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[14px] font-bold text-foreground mb-1">편집 중인 내용이 있습니다</h3>
        <p className="text-[12px] text-foreground-secondary mb-5">저장하지 않으면 변경사항이 사라집니다.</p>
        <div className="flex gap-2">
          <button
            onClick={onDiscard}
            disabled={isPending}
            className="flex-1 py-2 rounded-xl border border-stroke-input text-[12px] text-foreground-secondary font-medium hover:bg-surface-muted transition-colors disabled:opacity-50"
          >
            저장 안 함
          </button>
          <button
            onClick={onSave}
            disabled={isPending}
            className="flex-1 py-2 rounded-xl bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-colors shadow-primary-btn disabled:opacity-50"
          >
            {isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NavTabs() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isEditMode, exitEditMode, saveLayout } = useEditModeStore()
  const { restoreSnapshot, clearSnapshot } = useWidgetStore()
  const unsaved = useWidgetStore(hasUnsavedChanges)
  const { mutate: saveDashboard, isPending } = useDashboardSave()

  const [pendingNav, setPendingNav] = useState(null) // { path, state }

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)

  function doNavigate({ path, state }) {
    navigate(path, state ? { state } : undefined)
  }

  function handleTabClick(tabPath) {
    const target = resolveNavigatePath(tabPath)

    if (!isEditMode) {
      doNavigate(target)
      return
    }

    if (!unsaved) {
      // 변경사항 없음 — 편집 모드만 종료 후 이동
      exitEditMode()
      doNavigate(target)
      return
    }

    // 변경사항 있음 — 모달 표시
    setPendingNav(target)
  }

  function handleSave() {
    clearSnapshot()
    saveDashboard(undefined, {
      onSuccess: () => {
        saveLayout()
        doNavigate(pendingNav)
        setPendingNav(null)
      },
    })
  }

  function handleDiscard() {
    restoreSnapshot()
    exitEditMode()
    doNavigate(pendingNav)
    setPendingNav(null)
  }

  function handleCancel() {
    setPendingNav(null)
  }

  return (
    <>
      <nav className="flex items-center gap-0.5 bg-background rounded-xl p-1">
        {TABS.map(({ label, path }) => (
          <button
            key={path}
            onClick={() => handleTabClick(path)}
            className={cn(
              'px-4 py-1.5 text-[12px] rounded-lg transition-colors duration-150',
              isActive(path)
                ? 'bg-surface text-foreground font-semibold shadow-sm'
                : 'text-foreground-disabled hover:text-foreground-secondary',
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {pendingNav && (
        <NavConfirmModal
          isPending={isPending}
          onSave={handleSave}
          onDiscard={handleDiscard}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
