import { Activity, X, Check } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Input, PasswordInput } from '@/components/ui/Input'
import useLogin from '@/hooks/useLogin'
import useAuthStore from '@/store/useAuthStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/" replace />
  const {
    email, setEmail,
    password, setPassword,
    autoLogin, setAutoLogin,
    isLoading,
    error,
    handleSubmit,
  } = useLogin({ onSuccess: () => navigate('/') })

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center p-5">
      {/* 뒷배경 */}
      <div className="fixed inset-0 bg-background">
        <div className="h-header bg-surface border-b border-stroke flex items-center px-6 gap-3 opacity-40">
          <div className="w-7 h-7 rounded-[9px] bg-primary" />
          <div className="w-20 h-3.5 bg-stroke-input rounded" />
          <div className="flex gap-1 ml-2">
            {[true, false, false, false].map((active, i) => (
              <div key={i} className={['w-11 h-7 rounded-lg', active ? 'bg-primary-light' : 'bg-surface-muted'].join(' ')} />
            ))}
          </div>
        </div>
        <div className="p-5 grid grid-cols-4 gap-[10px] opacity-35">
          <div className="h-40 bg-surface rounded-2xl" />
          <div className="h-40 bg-surface rounded-2xl col-span-2" />
          <div className="h-40 bg-surface rounded-2xl" />
          <div className="h-40 bg-surface rounded-2xl" />
          <div className="h-40 bg-surface rounded-2xl col-span-2" />
          <div className="h-40 bg-surface rounded-2xl" />
        </div>
      </div>

      {/* 딤 오버레이 */}
      <div className="fixed inset-0 bg-black/50 z-10" />

      {/* 모달 */}
      <div
        className="relative z-20 w-full max-w-[400px] bg-surface rounded-[6px] shadow-modal overflow-hidden"
        style={{ animation: 'modal-in .2s ease both' }}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 pt-[22px]">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-[5px] bg-primary flex items-center justify-center">
              <Activity className="w-[13px] h-[13px] text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-foreground-secondary">SOL Lite</span>
          </div>
          <button
            onClick={() => navigate('/')}
            aria-label="닫기"
            className="text-foreground-disabled hover:text-foreground-tertiary p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">로그인</h2>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="px-6 pt-[18px] pb-[26px] flex flex-col gap-3.5">
          <Input
            label="이메일"
            type="email"
            placeholder="example@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* 비밀번호 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-semibold text-foreground-secondary">비밀번호</label>
              <button
                type="button"
                onClick={() => navigate('/', { state: { openAuthModal: 'forgot' } })}
                className="text-[11px] text-primary font-medium hover:text-primary-hover transition-colors"
              >
                비밀번호 찾기
              </button>
            </div>
            <PasswordInput
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 자동 로그인 */}
          <label className="flex items-center gap-[7px] cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setAutoLogin((v) => !v)}
              className={[
                'w-4 h-4 rounded-[2px] flex items-center justify-center shrink-0 transition-colors',
                autoLogin ? 'bg-primary' : 'border-[1.5px] border-stroke-input bg-surface',
              ].join(' ')}
            >
              {autoLogin && <Check className="w-[9px] h-[9px] text-white" strokeWidth={3.5} />}
            </button>
            <span className="text-xs text-foreground-secondary">자동 로그인</span>
          </label>

          {error && <p className="text-[11px] text-up">{error}</p>}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-[13px] bg-primary text-white border-none rounded-[4px] text-sm font-bold hover:bg-primary-hover transition-colors duration-[150ms] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          {/* 회원가입 링크 */}
          <p className="text-center text-xs text-foreground-disabled mt-0.5">
            계정이 없으신가요?
            <button type="button" onClick={() => navigate('/signup')}
              className="text-primary font-semibold ml-1">
              회원가입
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
