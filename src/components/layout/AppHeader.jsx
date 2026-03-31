import { useState } from 'react'
import { Activity, LayoutGrid } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import NavTabs, { NavConfirmModal } from './NavTabs'
import useAuthStore from '@/store/useAuthStore'
import { useMyAccount } from '@/api/account'
import useRightPanelStore from '@/store/useRightPanelStore'
import useEditModeStore from '@/store/useEditModeStore'
import useWidgetStore, { hasUnsavedChanges } from '@/store/useWidgetStore'
import { dashboardApi } from '@/api/dashboard'
import { useDashboardSave } from '@/hooks/useDashboardSync'
import NotificationCenter from '@/components/ui/NotificationCenter'
import { FontSizeButton, ThemeButton } from './DisplaySettingsButtons'

function Logo() {
  const navigate = useNavigate()
  const { isEditMode, exitEditMode, saveLayout } = useEditModeStore()
  const { restoreSnapshot, clearSnapshot } = useWidgetStore()
  const unsaved = useWidgetStore(hasUnsavedChanges)
  const { mutate: saveDashboard, isPending } = useDashboardSave()
  const [showConfirm, setShowConfirm] = useState(false)

  function handleClick() {
    if (!isEditMode) {
      navigate('/')
      return
    }
    if (!unsaved) {
      exitEditMode()
      navigate('/')
      return
    }
    setShowConfirm(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        aria-label="홈으로 이동"
        className="flex items-center gap-2 mr-2 shrink-0"
      >
        <div className="w-7 h-7 rounded-[9px] bg-primary flex items-center justify-center shadow-brand-glow">
          <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          SOL <span className="text-primary">Lite</span>
        </span>
      </button>
      {showConfirm && (
        <NavConfirmModal
          isPending={isPending}
          onSave={() => {
            clearSnapshot()
            saveDashboard(undefined, {
              onSuccess: () => {
                saveLayout()
                navigate('/')
                setShowConfirm(false)
              },
            })
          }}
          onDiscard={() => {
            restoreSnapshot()
            exitEditMode()
            navigate('/')
            setShowConfirm(false)
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}

function UserArea() {
  const navigate = useNavigate()  // signup에 사용
  const { isAuthenticated, user, openLoginModal } = useAuthStore()
  const { data: accountInfo } = useMyAccount()
  const setAccountSettingsMode = useRightPanelStore((s) => s.setAccountSettingsMode)

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openLoginModal()}
          className="flex items-center px-4 py-1.5 rounded-xl bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-colors duration-[150ms] shadow-primary-btn"
        >
          로그인
        </button>
        <button
          onClick={() => navigate('/signup')}
          className="flex items-center px-4 py-1.5 rounded-xl border border-primary text-primary text-[12px] font-semibold hover:bg-primary-light transition-colors duration-[150ms]"
        >
          회원가입
        </button>
      </div>
    )
  }

  const accountNumber = accountInfo?.accountNumber ?? '-'

  return (
    <button
      onClick={() => setAccountSettingsMode()}
      className="pl-2 pr-3 py-2 border-l border-stroke flex items-center gap-2 hover:bg-surface-muted rounded-lg transition-colors"
    >
      <div className="text-right">
        <div className="text-[13px] font-bold leading-none text-foreground">
          {user.name}
        </div>
        <div className="text-[12px] text-foreground-secondary mt-1">
          {accountNumber}
        </div>
      </div>
    </button>
  )
}

function EditModeActions() {
  const { exitEditMode, saveLayout } = useEditModeStore()
  const { restoreSnapshot, clearSnapshot, clearPendingPresets, pages, currentPageId } = useWidgetStore()
  const pendingPresets = useWidgetStore((s) => s.pendingPresets)
  const deletePageIds = useWidgetStore((s) => s.deletePageIds)
  const { mutate: saveDashboard, isPending, isError } = useDashboardSave()

  async function handleSave() {
    clearSnapshot()

    // 프리셋 여러 개가 대기 중이면 각각 API로 새 페이지 생성
    if (pendingPresets.length > 0) {
      try {
        let allResponses = []

        // 각 프리셋마다 API 호출
        for (const preset of pendingPresets) {
          const payload = {
            presetName: preset.name,
            theme: preset.sectorCode,
            widgets: preset.widgets.map((w) => ({
              widgetType: w.widgetTypeId,
              positionX: w.gridCol,
              positionY: w.gridRow,
              width: w.colSpan,
              height: w.rowSpan,
              configJson: JSON.stringify({ variantId: w.variantId }),
            })),
          }
          const response = await dashboardApi.applyPreset(payload)
          if (response?.length) {
            allResponses = response  // 마지막 응답이 전체 페이지 목록
          }
        }

        if (allResponses.length > 0) {
          // 서버 데이터로 갱신
          const { loadFromServer, switchPage } = useWidgetStore.getState()
          loadFromServer(allResponses)
          // 마지막 생성된 페이지로 이동
          const lastPage = allResponses[allResponses.length - 1]
          switchPage(String(lastPage.dashboardId))
        }

        clearPendingPresets()
      } catch (e) {
        console.error('프리셋 적용 실패:', e)
      }
    }

    // DB에서 삭제할 페이지가 있으면 각각 API 호출
    if (deletePageIds.length > 0) {
      try {
        for (const pageId of deletePageIds) {
          await dashboardApi.deletePage(pageId)
        }
      } catch (e) {
        console.error('페이지 삭제 실패:', e)
      }
    }

    // 저장 성공 시 editMode 종료, 실패 시 UI에 오류 표시
    saveDashboard(undefined, {
      onSuccess: () => {
        useWidgetStore.getState().clearDeletePageIds?.()
        saveLayout()
      },
    })
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-light border border-primary-border">
        <LayoutGrid className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
        <span className="text-[12px] font-semibold text-primary">위젯 편집</span>
      </div>
      {isError && (
        <span className="text-[11px] text-down">저장 실패. 다시 시도해주세요.</span>
      )}
      <button
        onClick={() => {
          restoreSnapshot()
          clearPendingPresets()
          const { clearDeletePageIds, pages: allPages, removeTempPage } = useWidgetStore.getState()
          clearDeletePageIds()
          // 모든 임시 페이지 제거
          allPages.forEach((p) => {
            if (p.isTempPage) {
              removeTempPage(p.id)
            }
          })
          exitEditMode()
        }}
        disabled={isPending}
        className="px-3 py-1.5 rounded-xl border border-stroke-input text-[12px] text-foreground-tertiary font-medium hover:bg-surface-muted transition-colors duration-[150ms] disabled:opacity-50"
      >
        취소
      </button>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-colors duration-[150ms] shadow-primary-btn disabled:opacity-50"
      >
        {isPending ? '저장 중…' : '완료 · 저장'}
      </button>
    </div>
  )
}

function WidgetEditButton() {
  const { enterEditMode } = useEditModeStore()
  const { snapshotWidgets } = useWidgetStore()
  return (
    <button
      onClick={() => { snapshotWidgets(); enterEditMode() }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stroke text-foreground-secondary text-[12px] font-medium hover:border-primary hover:text-primary hover:bg-primary-light transition-all duration-[150ms]"
    >
      <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2} />
      위젯 편집
    </button>
  )
}

export default function AppHeader() {
  const { isEditMode } = useEditModeStore()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header className="h-header flex items-center px-4 gap-3 bg-surface border-b border-stroke shrink-0 z-50">
      <Logo />
      <NavTabs />
      <div className="flex-1" />
      {isHome && (isEditMode ? <EditModeActions /> : <WidgetEditButton />)}
      <FontSizeButton />
      <ThemeButton />
      <NotificationCenter />
      <UserArea />
    </header>
  )
}
