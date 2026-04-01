import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Activity, X, Check, ArrowLeft } from 'lucide-react'
import SplashScreenFill from '@/components/ui/SplashScreenFill'
import { Input, PasswordInput } from '@/components/ui/Input'
import { router } from '@/router'
import { authApi } from '@/api/auth'
import useLogin from '@/hooks/useLogin'

function LoginView({
  email,
  setEmail,
  password,
  setPassword,
  autoLogin,
  setAutoLogin,
  isLoading,
  error,
  handleSubmit,
  onClose,
  onForgot,
}) {
  return (
    <>
      <div className="px-6 pt-4">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">로그인</h2>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pt-[18px] pb-[26px] flex flex-col gap-3.5">
        <Input
          label="이메일"
          type="email"
          placeholder="example@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-[11px] font-semibold text-foreground-secondary">비밀번호</label>
            <button
              type="button"
              onClick={onForgot}
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-[13px] bg-primary text-white border-none rounded-[4px] text-sm font-bold hover:bg-primary-hover transition-colors duration-[150ms] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>

        <p className="text-center text-xs text-foreground-disabled mt-0.5">
          계정이 없으신가요?
          <button
            type="button"
            onClick={() => {
              onClose()
              router.navigate('/signup')
            }}
            className="text-primary font-semibold ml-1"
          >
            회원가입
          </button>
        </p>
      </form>
    </>
  )
}

function LoginLoadingView() {
  return (
    <div className="h-full px-6 py-8 text-center flex flex-col items-center justify-center">
      <div className="mb-6">
        <SplashScreenFill inline animated />
      </div>
      <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-1">로그인 중</h2>
      <p className="text-[13px] text-foreground-disabled leading-[1.8]">
        계정 정보를 확인하고 있어요.<br />
        잠시만 기다려주세요.
      </p>
    </div>
  )
}

function ForgotView({ onBack }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('form') // 'form' | 'loading' | 'success'
  const [error, setError] = useState('')

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('이메일을 입력해 주세요.')
      return
    }
    setStatus('loading')
    try {
      await Promise.all([
        authApi.requestPasswordReset({ email }),
        delay(1400),
      ])
      setStatus('success')
    } catch (err) {
      await delay(1400)
      setStatus('form')
      setError(err?.message ?? '요청 처리 중 오류가 발생했습니다.')
    }
  }

  if (status === 'loading' || status === 'success') {
    return (
      <div className="px-6 py-8 text-center min-h-[260px] flex flex-col items-center justify-center">
        <div className="mb-6">
          <SplashScreenFill inline animated={status === 'loading'} />
        </div>
        {status === 'loading' && (
          <>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-1">요청 처리 중</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8]">
              재설정 링크를 준비하고 있어요.<br />
              잠시만 기다려주세요.
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-1">요청 완료</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-6">
              비밀번호 재설정 링크를 이메일로 발송했습니다.
            </p>
            <button
              onClick={onBack}
              className="text-[12px] text-primary font-medium hover:text-primary-hover transition-colors"
            >
              로그인으로 돌아가기
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="px-6 pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-primary text-xs font-medium mb-3 hover:text-primary-hover transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          로그인으로 돌아가기
        </button>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">비밀번호 찾기</h2>
        <p className="text-[13px] text-foreground-disabled mt-1">가입하신 이메일을 입력해 주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pt-4 pb-[26px] flex flex-col gap-3.5">
        <Input
          label="이메일"
          type="email"
          placeholder="example@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="text-[11px] text-up">{error}</p>}

        <button
          type="submit"
          className="w-full py-[13px] bg-primary text-white border-none rounded-[4px] text-sm font-bold hover:bg-primary-hover transition-colors duration-[150ms] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          재설정 링크 받기
        </button>
      </form>
    </>
  )
}

export default function LoginModal({ onClose, initialView = 'login' }) {
  const [view, setView] = useState(initialView) // 'login' | 'forgot'
  const {
    email, setEmail,
    password, setPassword,
    autoLogin, setAutoLogin,
    isLoading,
    error,
    handleSubmit,
  } = useLogin({ onSuccess: onClose, minLoadingMs: 1400 })

  useEffect(() => {
    setView(initialView)
  }, [initialView])

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-5 bg-transparent"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] bg-surface rounded-[6px] shadow-modal overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
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
            onClick={onClose}
            aria-label="닫기"
            className="text-foreground-disabled hover:text-foreground-tertiary p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-[340px] flex flex-col">
          {view === 'login'
            ? (isLoading
                ? <LoginLoadingView />
                : (
                  <LoginView
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    autoLogin={autoLogin}
                    setAutoLogin={setAutoLogin}
                    isLoading={isLoading}
                    error={error}
                    handleSubmit={handleSubmit}
                    onClose={onClose}
                    onForgot={() => setView('forgot')}
                  />
                ))
            : <ForgotView onBack={() => setView('login')} />
          }
        </div>
      </div>
    </div>,
    document.body,
  )
}
