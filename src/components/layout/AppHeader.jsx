import { Activity, LayoutGrid } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import NavTabs from './NavTabs'
import useAuthStore from '@/store/useAuthStore'
import useEditModeStore from '@/store/useEditModeStore'
import useWidgetStore from '@/store/useWidgetStore'

function Logo() {
  return (
    <div className="flex items-center gap-2 mr-2 shrink-0">
      <div
        className="w-7 h-7 rounded-[9px] bg-primary flex items-center justify-center shadow-brand-glow"
      >
        <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-[15px] font-bold tracking-tight text-foreground">
        SOL <span className="text-primary">Lite</span>
      </span>
    </div>
  )
}

function UserArea() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-1.5 pl-2 border-l border-stroke">
        <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
          {user.name?.[0] ?? '김'}
        </div>
        <div className="hidden sm:block">
          <div className="text-[11px] font-semibold leading-none text-foreground">
            {user.name ?? '김SOL'}
          </div>
          <div className="text-[9px] text-foreground-disabled mt-0.5">
            주문가능 {user.availableAmount ?? '7,478만원'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate('/login')}
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

function EditModeActions() {
  const { exitEditMode, saveLayout } = useEditModeStore()
  const { restoreSnapshot, clearSnapshot } = useWidgetStore()
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-light border border-primary-border">
        <LayoutGrid className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
        <span className="text-[12px] font-semibold text-primary">위젯 편집</span>
      </div>
      <button
        onClick={() => { restoreSnapshot(); exitEditMode() }}
        className="px-3 py-1.5 rounded-xl border border-stroke-input text-[12px] text-foreground-tertiary font-medium hover:bg-surface-muted transition-colors duration-[150ms]"
      >
        취소
      </button>
      <button
        onClick={() => { clearSnapshot(); saveLayout() }}
        className="px-3 py-1.5 rounded-xl bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-colors duration-[150ms] shadow-primary-btn"
      >
        완료 · 저장
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

  return (
    <header className="h-header flex items-center px-4 gap-3 bg-surface border-b border-stroke shrink-0 z-50">
      <Logo />
      <NavTabs />
      <div className="flex-1" />
      {isEditMode ? <EditModeActions /> : <WidgetEditButton />}
      <UserArea />
    </header>
  )
}
