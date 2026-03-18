import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Activity, CheckCircle, XCircle, Loader } from 'lucide-react'
import { authApi } from '@/api/auth'

export default function EmailVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('유효하지 않은 인증 링크입니다.')
      return
    }

    authApi.confirmVerifyEmail({ token })
      .then(() => setStatus('success'))
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
        {/* 로고 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-[9px] bg-primary flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground-secondary">SOL Lite</span>
        </div>

        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-primary mx-auto mb-5 animate-spin" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">인증 처리 중</h2>
            <p className="text-[13px] text-foreground-disabled">잠시만 기다려 주세요...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-live mx-auto mb-5" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">이메일 인증 완료</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-8">
              이메일 인증이 완료되었습니다.<br />로그인하여 서비스를 이용하세요.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-[13px] bg-primary text-white rounded-xl text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors duration-[150ms]"
            >
              로그인하러 가기
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-up mx-auto mb-5" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">인증 실패</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-8">{message}</p>
            <button
              onClick={() => navigate('/login')}
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
