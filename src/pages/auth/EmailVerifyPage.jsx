import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { XCircle, Loader } from 'lucide-react'
import { authApi } from '@/api/auth'
import SolLiteBrand from '@/components/ui/SolLiteBrand'
import SplashScreenFill from '@/components/ui/SplashScreenFill'

export default function EmailVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'animating' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('유효하지 않은 인증 링크입니다.')
      return
    }

    authApi.confirmVerifyEmail({ token })
      .then(() => {
        setStatus('animating')
        setTimeout(() => setStatus('success'), 1600)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.message ?? '인증 링크가 만료되었거나 유효하지 않습니다.')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div
        className="w-full max-w-[400px] bg-surface rounded-xl shadow-modal p-8 text-center"
        style={{ animation: 'modal-in .2s ease both' }}
      >
        {/* 로딩/에러 상태에서만 상단 로고 표시 */}
        {(status === 'loading' || status === 'error') && (
          <SolLiteBrand className="justify-center mb-8" />
        )}

        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-primary mx-auto mb-5 animate-spin" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">인증 처리 중</h2>
            <p className="text-[13px] text-foreground-disabled">잠시만 기다려 주세요...</p>
          </>
        )}

        {(status === 'animating' || status === 'success') && (
          <div className="min-h-[220px] flex flex-col items-center justify-center">
            <div className="mb-6">
              <SplashScreenFill inline animated={status === 'animating'} />
            </div>
            {status === 'success' && (
              <>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">이메일 인증 완료</h2>
                <p className="text-[13px] text-foreground-disabled leading-[1.8]">
                  인증이 완료되었습니다.<br />이 탭을 닫고 회원가입 화면으로 돌아가세요.
                </p>
              </>
            )}
          </div>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-up mx-auto mb-5" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">인증 실패</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-8">{message}</p>
            <button
              onClick={() => navigate('/', { state: { openAuthModal: 'login' } })}
              className="w-full py-[13px] bg-surface-muted border border-stroke text-foreground-secondary rounded-xl text-sm font-semibold hover:bg-stroke-subtle transition-colors"
            >
              로그인 페이지로
            </button>
          </>
        )}
      </div>
    </div>
  )
}
