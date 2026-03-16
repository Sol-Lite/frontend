import { MessageSquare, Send, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LiveDot from '@/components/ui/LiveDot'
import useAuthStore from '@/store/useAuthStore'

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
        className="w-full px-4 py-2 rounded-xl bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-colors duration-[150ms]"
        style={{ boxShadow: 'var(--shadow-primary-btn)' }}
      >
        로그인
      </button>
    </div>
  )
}

function ChatHeader() {
  return (
    <div className="h-[46px] flex items-center gap-2 px-4 border-b border-stroke shrink-0">
      <MessageSquare className="w-3.5 h-3.5 text-primary" />
      <span className="text-[13px] font-semibold text-foreground">SOL AI</span>
      <LiveDot size="sm" className="ml-0.5" />
    </div>
  )
}

function ChatInput() {
  return (
    <div className="h-[52px] flex items-center gap-2 px-3 border-t border-stroke shrink-0">
      <input
        type="text"
        placeholder="AI에게 물어보세요..."
        className="flex-1 h-8 px-3 rounded-lg bg-background text-[12px] text-foreground placeholder:text-foreground-disabled border border-stroke focus:outline-none focus:border-primary transition-colors duration-[150ms]"
      />
      <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors duration-[150ms]">
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

export default function ChatPanel() {
  const { isAuthenticated } = useAuthStore()

  return (
    <aside className="w-[368px] flex flex-col bg-surface border-l border-stroke shrink-0">
      {isAuthenticated ? (
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
