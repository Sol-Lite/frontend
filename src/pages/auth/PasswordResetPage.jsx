import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { X, XCircle } from 'lucide-react'
import { PasswordInput } from '@/components/ui/Input'
import { authApi } from '@/api/auth'
import SolLiteBrand from '@/components/ui/SolLiteBrand'
import SplashScreenFill from '@/components/ui/SplashScreenFill'

const PW_RULES = [
  { key: 'length',  label: '최소 8자 이상',  check: (pw) => pw.length >= 8 },
  { key: 'letter',  label: '영문 포함',       check: (pw) => /[A-Za-z]/.test(pw) },
  { key: 'number',  label: '숫자 포함',       check: (pw) => /[0-9]/.test(pw) },
  { key: 'special', label: '특수문자 포함',   check: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

function PasswordRules({ password }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
      {PW_RULES.map(({ key, label, check }) => {
        const ok = check(password)
        return (
          <div key={key} className="flex items-center gap-1.5 text-[11px]">
            <span
              className={[
                'h-1.5 w-1.5 shrink-0 rounded-full',
                ok
                  ? 'bg-primary'
                  : 'bg-stroke-input',
              ].join(' ')}
            />
            <span className={ok ? 'text-primary font-medium' : 'text-foreground-disabled'}>{label}</span>
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

  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('form') // 'form' | 'animating' | 'success' | 'error'
  const [error, setError] = useState('')

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
      setStatus('animating')
      setTimeout(() => setStatus('success'), 1600)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="fixed inset-0 bg-black/40" onClick={() => navigate('/')} />

      <div className="relative z-10 w-full max-w-[400px] bg-surface rounded-[6px] shadow-modal overflow-hidden animate-modal-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-[22px]">
          <SolLiteBrand />
          <button
            onClick={() => navigate('/')}
            aria-label="닫기"
            className="text-foreground-disabled hover:text-foreground-tertiary p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 토큰 없음 */}
        {!token && (
          <div className="px-6 py-8 text-center">
            <XCircle className="w-12 h-12 text-up mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">유효하지 않은 링크</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-6">
              비밀번호 재설정 링크가 올바르지 않습니다.
            </p>
            <button
              onClick={() => navigate('/', { state: { openAuthModal: 'login' } })}
              className="w-full py-[13px] bg-surface-muted border border-stroke text-foreground-secondary rounded-[4px] text-sm font-semibold hover:bg-stroke-subtle transition-colors"
            >
              로그인으로 돌아가기
            </button>
          </div>
        )}

        {token && status === 'form' && (
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

        {token && (status === 'animating' || status === 'success') && (
          <div className="px-6 py-8 text-center min-h-[280px] flex flex-col items-center justify-center">
            <div className="mb-6">
              <SplashScreenFill inline animated={status === 'animating'} />
            </div>
            {status === 'success' && (
              <>
                <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">변경 완료</h2>
                <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-6">
                  비밀번호가 변경되었습니다.<br />새 비밀번호로 로그인해 주세요.
                </p>
                <button
                  onClick={() => navigate('/', { state: { openAuthModal: 'login' } })}
                  className="w-full py-[13px] bg-primary text-white rounded-[4px] text-sm font-bold hover:bg-primary-hover transition-colors duration-[150ms]"
                >
                  로그인하러 가기
                </button>
              </>
            )}
          </div>
        )}

        {token && status === 'error' && (
          <div className="px-6 py-8 text-center">
            <XCircle className="w-12 h-12 text-up mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">링크 만료</h2>
            <p className="text-[13px] text-foreground-disabled leading-[1.8] mb-6">
              비밀번호 재설정 링크가 만료되었습니다.<br />다시 요청해 주세요.
            </p>
            <button
              onClick={() => navigate('/', { state: { openAuthModal: 'login' } })}
              className="w-full py-[13px] bg-surface-muted border border-stroke text-foreground-secondary rounded-[4px] text-sm font-semibold hover:bg-stroke-subtle transition-colors"
            >
              로그인으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
