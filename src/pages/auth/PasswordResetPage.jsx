import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Activity, CheckCircle, XCircle } from 'lucide-react'
import { PasswordInput } from '@/components/ui/Input'
import { authApi } from '@/api/auth'

const PW_RULES = [
  { key: 'length',  label: '최소 8자 이상',  check: (pw) => pw.length >= 8 },
  { key: 'letter',  label: '영문 포함',       check: (pw) => /[A-Za-z]/.test(pw) },
  { key: 'number',  label: '숫자 포함',       check: (pw) => /[0-9]/.test(pw) },
  { key: 'special', label: '특수문자 포함',   check: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

function PasswordRules({ password }) {
  return (
    <div className="mt-[7px] bg-surface-subtle rounded-[10px] px-3 py-2.5 grid grid-cols-2 gap-x-3 gap-y-[5px]">
      {PW_RULES.map(({ key, label, check }) => {
        const ok = check(password)
        return (
          <div key={key} className="flex items-center gap-[5px] text-[11px]">
            <div className={['w-1 h-1 rounded-full shrink-0', ok ? 'bg-live' : 'bg-stroke-input'].join(' ')} />
            <span className={ok ? 'text-live' : 'text-foreground-disabled'}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword]           = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [isLoading, setIsLoading]               = useState(false)
  const [status, setStatus]                     = useState('form') // 'form' | 'success' | 'error'
  const [error, setError]                       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword !== newPasswordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    const allOk = PW_RULES.every(({ check }) => check(newPassword))
    if (!allOk) {
      setError('비밀번호 조건을 모두 충족해야 합니다.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.confirmPasswordReset({ token, newPassword, newPasswordConfirm })
      setStatus('success')
    } catch (err) {
      if (err?.code === 'TOKEN_EXPIRED' || err?.code === 'INVALID_TOKEN' || err?.code === 'TOKEN_ALREADY_USED') {
        setStatus('error')
      } else {
        setError(err?.message ?? '비밀번호 재설정에 실패했습니다. 다시 시도해 주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 토큰 없음
  if (!token) {
    return (
      <ResultCard>
        <XCircle className="w-12 h-12 text-up mx-auto mb-5" />
        <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">유효하지 않은 링크</h2>
        <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-8">
          비밀번호 재설정 링크가 올바르지 않습니다.
        </p>
        <button onClick={() => navigate('/login')}
          className="w-full py-[13px] bg-surface-muted border border-stroke text-foreground-secondary rounded-xl text-sm font-semibold hover:bg-stroke-subtle transition-colors">
          로그인 페이지로
        </button>
      </ResultCard>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div
        className="w-full max-w-[400px] bg-surface rounded-xl shadow-modal overflow-hidden"
        style={{ animation: 'modal-in .2s ease both' }}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-2.5 px-6 pt-[22px]">
          <div className="w-[26px] h-[26px] rounded-[5px] bg-primary flex items-center justify-center">
            <Activity className="w-[13px] h-[13px] text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground-secondary">SOL Lite</span>
        </div>

        {status === 'form' && (
          <form onSubmit={handleSubmit} className="px-6 pt-5 pb-[26px] flex flex-col gap-3.5">
            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">비밀번호 재설정</h2>
              <p className="text-[13px] text-foreground-disabled mt-1">새로 사용할 비밀번호를 입력해 주세요.</p>
            </div>

            <div className="flex flex-col gap-[18px] mt-1">
              <div>
                <PasswordInput
                  label="새 비밀번호"
                  required
                  placeholder="새 비밀번호를 입력하세요"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <PasswordRules password={newPassword} />
              </div>

              <PasswordInput
                label="새 비밀번호 확인"
                required
                placeholder="비밀번호를 다시 입력하세요"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
              />
            </div>

            {error && <p className="text-[11px] text-up">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-[13px] bg-primary text-white rounded-[4px] text-sm font-bold hover:bg-primary-hover transition-colors duration-[150ms] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리 중...' : '비밀번호 변경'}
            </button>
          </form>
        )}

        {status === 'success' && (
          <div className="px-6 py-8 text-center">
            <CheckCircle className="w-12 h-12 text-live mx-auto mb-5" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">변경 완료</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-8">
              비밀번호가 변경되었습니다.<br />새 비밀번호로 로그인해 주세요.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-[13px] bg-primary text-white rounded-xl text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors duration-[150ms]"
            >
              로그인하러 가기
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="px-6 py-8 text-center">
            <XCircle className="w-12 h-12 text-up mx-auto mb-5" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">링크 만료</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-8">
              비밀번호 재설정 링크가 만료되었습니다.<br />다시 요청해 주세요.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-[13px] bg-surface-muted border border-stroke text-foreground-secondary rounded-xl text-sm font-semibold hover:bg-stroke-subtle transition-colors"
            >
              로그인 페이지로
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 토큰 없는 경우 래퍼
function ResultCard({ children }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-5">
      <div
        className="w-full max-w-[400px] bg-surface rounded-xl shadow-modal p-8 text-center"
        style={{ animation: 'modal-in .2s ease both' }}
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-[9px] bg-primary flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground-secondary">SOL Lite</span>
        </div>
        {children}
      </div>
    </div>
  )
}
