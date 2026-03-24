import { useState } from 'react'
import { Activity, X, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SplashScreenFill from '@/components/ui/SplashScreenFill'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/api/auth'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

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
      setError(err?.message ?? '요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.')
    }
  }

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[6px] z-10" />

      {/* 모달 */}
      <div
        className="relative z-20 w-full max-w-[400px] bg-surface rounded-[6px] shadow-modal overflow-hidden animate-modal-in"
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
            onClick={() => navigate('/', { state: { openAuthModal: 'login' } })}
            aria-label="닫기"
            className="text-foreground-disabled hover:text-foreground-tertiary p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-[340px] flex flex-col">
          {status === 'form' && (
            <>
              <div className="px-6 pt-4">
                <button
                  onClick={() => navigate('/', { state: { openAuthModal: 'login' } })}
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
                  className="w-full py-[13px] bg-primary text-white border-none rounded-[4px] text-sm font-bold hover:bg-primary-hover transition-colors duration-[150ms]"
                >
                  재설정 링크 받기
                </button>
              </form>
            </>
          )}

          {(status === 'loading' || status === 'success') && (
            <div className="h-full px-6 py-8 text-center flex flex-col items-center justify-center">
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
                    onClick={() => navigate('/', { state: { openAuthModal: 'login' } })}
                    className="text-[12px] text-primary font-medium hover:text-primary-hover transition-colors"
                  >
                    로그인으로 돌아가기
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
