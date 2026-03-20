import { MessageSquare, Send, Lock, X, RotateCcw, Trash2, Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LiveDot from '@/components/ui/LiveDot'
import useAuthStore from '@/store/useAuthStore'
import useEditModeStore from '@/store/useEditModeStore'
import useChatPanelStore from '@/store/useChatPanelStore'
import { useMyAccount } from '@/api/account'
import EditPanel from './EditPanel'

function LoginPrompt() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
        <Lock className="w-4.5 h-4.5 text-foreground-disabled" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-foreground">AI 투자 어시스턴트</p>
        <p className="text-[11px] text-foreground-disabled mt-1 leading-relaxed">
          로그인 후 SOL AI와 대화하며<br />투자 인사이트를 확인하세요.
        </p>
      </div>
      <button
        onClick={() => navigate('/login')}
        className="w-full px-4 py-2 rounded-xl bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-colors duration-[150ms] shadow-primary-btn"
      >
        로그인
      </button>
    </div>
  )
}

function ChatHeader() {
  return (
    <div className="h-chat-header flex items-center gap-2 px-4 border-b border-stroke shrink-0">
      <MessageSquare className="w-3.5 h-3.5 text-primary" />
      <span className="text-[13px] font-semibold text-foreground">SOL AI</span>
      <LiveDot size="sm" className="ml-0.5" />
    </div>
  )
}

function ChatInput() {
  return (
    <div className="h-chat-input flex items-center gap-2 px-3 border-t border-stroke shrink-0">
      <input
        type="text"
        placeholder="AI에게 물어보세요..."
        className="flex-1 h-8 px-3 rounded-lg bg-background text-[12px] text-foreground placeholder:text-foreground-disabled border border-stroke focus:outline-none focus:border-primary transition-colors duration-[150ms]"
      />
      <button aria-label="메시지 전송" className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors duration-[150ms]">
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function ChatMessages() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
      {/* AI 웰컴 메시지 */}
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
        <div className="bg-background rounded-xl rounded-tl-sm px-3 py-2 max-w-[220px]">
          <p className="text-[11px] text-foreground leading-relaxed">
            안녕하세요! 오늘의 시장 동향이나 종목 분석을 도와드릴게요.
          </p>
        </div>
      </div>
    </div>
  )
}

function AccountSettingsHeader() {
  const setChatMode = useChatPanelStore((s) => s.setChatMode)
  return (
    <div className="h-chat-header flex items-center justify-between px-4 border-b border-stroke shrink-0">
      <span className="text-[13px] font-semibold text-foreground">계좌 설정</span>
      <button
        onClick={() => setChatMode()}
        aria-label="닫기"
        className="p-1 text-foreground-tertiary hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function AccountSettingsContent() {
  const setChatMode = useChatPanelStore((s) => s.setChatMode)
  const { user } = useAuthStore()
  const { data: accountInfo } = useMyAccount()

  const handleMenuClick = (label) => {
    console.log(label)
    // TODO: 각 메뉴 항목에 대한 동작 구현
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* 계좌 정보 */}
      <div className="px-4 py-4 border-b border-stroke-subtle bg-surface-subtle shrink-0">
        <div className="text-[12px] font-semibold text-foreground mb-1">
          {user?.name}
        </div>
        <div className="text-[11px] text-foreground-secondary">
          {accountInfo?.accountNumber}
        </div>
        <div className="text-[10px] text-foreground-disabled mt-2">
          상태: {accountInfo?.accountStatus}
        </div>
      </div>

      {/* 메뉴 */}
      <div className="flex-1 flex flex-col">
        <button
          onClick={() => handleMenuClick('계좌 비밀번호 변경')}
          className="flex items-center gap-3 px-4 py-3 text-[12px] text-foreground hover:bg-surface-muted transition-colors text-left border-b border-stroke-subtle"
        >
          <Lock className="w-4 h-4 text-foreground-tertiary shrink-0" strokeWidth={2} />
          <span>계좌 비밀번호 변경</span>
        </button>
        <button
          onClick={() => handleMenuClick('리셋')}
          className="flex items-center gap-3 px-4 py-3 text-[12px] text-foreground hover:bg-surface-muted transition-colors text-left border-b border-stroke-subtle"
        >
          <RotateCcw className="w-4 h-4 text-foreground-tertiary shrink-0" strokeWidth={2} />
          <span>리셋</span>
        </button>
        <button
          onClick={() => handleMenuClick('계좌 해지 신청')}
          className="flex items-center gap-3 px-4 py-3 text-[12px] text-up hover:bg-up-bg transition-colors text-left border-b border-stroke-subtle"
        >
          <Trash2 className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span>계좌 해지 신청</span>
        </button>
        <button
          onClick={() => handleMenuClick('계정 비밀번호 변경')}
          className="flex items-center gap-3 px-4 py-3 text-[12px] text-foreground hover:bg-surface-muted transition-colors text-left"
        >
          <Key className="w-4 h-4 text-foreground-tertiary shrink-0" strokeWidth={2} />
          <span>계정 비밀번호 변경</span>
        </button>
      </div>
    </div>
  )
}

export default function ChatPanel() {
  const { isAuthenticated, isRestoring } = useAuthStore()
  const { isEditMode } = useEditModeStore()
  const mode = useChatPanelStore((s) => s.mode)

  if (isEditMode) return <EditPanel />

  return (
    <aside className="w-chat-panel flex flex-col bg-surface border-l border-stroke shrink-0">
      {mode === 'account-settings' ? (
        <>
          <AccountSettingsHeader />
          <AccountSettingsContent />
        </>
      ) : isRestoring ? (
        <>
          <ChatHeader />
          <ChatMessages />
          <ChatInput />
        </>
      ) : isAuthenticated ? (
        <>
          <ChatHeader />
          <ChatMessages />
          <ChatInput />
        </>
      ) : (
        <>
          <ChatHeader />
          <LoginPrompt />
        </>
      )}
    </aside>
  )
}
