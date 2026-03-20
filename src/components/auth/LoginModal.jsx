import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Activity, X, Check } from 'lucide-react'
import { Input, PasswordInput } from '@/components/ui/Input'
import { authApi } from '@/api/auth'
import { router } from '@/router'
import useAuthStore from '@/store/useAuthStore'

export default function LoginModal({ onClose }) {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await authApi.login({ email, password, autoLogin })
      setAuth({
        accessToken: res.accessToken,
        user:        res.user,
        autoLogin,
      })
      // 계좌 정보 쿼리 유효화 (다음 호출 시 새로 fetch)
      queryClient.invalidateQueries({ queryKey: ['account', 'me'] })
      onClose()
    } catch (err) {
      setError(err?.message ?? '이메일 또는 비밀번호를 확인해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 pointer-events-none">
      {/* 모달 */}
      <div
        className="relative w-full max-w-[400px] bg-surface rounded-[6px] shadow-modal overflow-hidden pointer-events-auto animate-modal-in"
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
                onClick={() => {
                  onClose()
                  router.navigate('/forgot-password')
                }}
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
      </div>
    </div>
  )
}
