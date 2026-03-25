import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { X, XCircle } from 'lucide-react'
import { accountApi } from '@/api/account'
import { pinResetSchema } from '@/lib/validationSchemas'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'
import SolLiteBrand from '@/components/ui/SolLiteBrand'
import SplashScreenFill from '@/components/ui/SplashScreenFill'

function PinDots({ value, active }) {
  return (
    <div className="flex justify-center gap-2.5">
      {Array.from({ length: 4 }, (_, index) => {
        const filled = index < value.length
        return (
          <div
            key={index}
            className={[
              'flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors',
              active ? 'border-primary bg-primary-light' : 'border-stroke-input bg-surface-subtle',
            ].join(' ')}
          >
            <div
              className={[
                'h-2.5 w-2.5 rounded-full transition-colors',
                filled ? 'bg-primary' : active ? 'bg-primary/20' : 'bg-stroke-input',
              ].join(' ')}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function PinResetPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [activePinField, setActivePinField] = useState(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('form') // 'form' | 'animating' | 'success' | 'error'
  const [error, setError] = useState('')

  function handlePinChange(nextValue) {
    const sanitized = nextValue.replace(/\D/g, '').slice(0, 4)
    if (activePinField === 'newPin') setNewPin(sanitized)
    else if (activePinField === 'confirmPin') setConfirmPin(sanitized)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validation = pinResetSchema.safeParse({ newPin, confirmPin })
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? '입력 값을 확인해주세요.')
      return
    }

    setIsLoading(true)
    try {
      await accountApi.confirmPinReset(token, newPin)
      setStatus('animating')
      setTimeout(() => setStatus('success'), 1600)
    } catch (err) {
      if (err?.code === 'TOKEN_EXPIRED' || err?.code === 'INVALID_TOKEN' || err?.code === 'TOKEN_ALREADY_USED') {
        setStatus('error')
      } else {
        setError(err?.message ?? '계좌 비밀번호 재설정에 실패했습니다. 다시 시도해 주세요.')
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
              계좌 비밀번호 재설정 링크가 올바르지 않습니다.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-[13px] bg-surface-muted border border-stroke text-foreground-secondary rounded-[4px] text-sm font-semibold hover:bg-stroke-subtle transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}

        {token && status === 'form' && (
          <form onSubmit={handleSubmit} className="px-6 pt-5 pb-[26px] flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">계좌 비밀번호 재설정</h2>
              <p className="text-[13px] text-foreground-disabled mt-1">새로 사용할 4자리 비밀번호를 입력해 주세요.</p>
            </div>

            <div className="flex flex-col gap-4 mt-1">
              <div>
                <label className="text-[11px] font-semibold text-foreground-secondary block mb-2">새 비밀번호 (4자리)</label>
                <button
                  type="button"
                  onClick={() => { setActivePinField('newPin'); setIsKeyboardOpen(true) }}
                  className="flex w-full justify-center bg-transparent py-1 focus:outline-none"
                >
                  <PinDots value={newPin} active={activePinField === 'newPin' && isKeyboardOpen} />
                </button>
                {activePinField === 'newPin' && (
                  <AccountPinKeypad
                    variant="desktop"
                    isOpen={isKeyboardOpen}
                    value={newPin}
                    onChange={handlePinChange}
                    onDone={() => setIsKeyboardOpen(false)}
                    onClose={() => setIsKeyboardOpen(false)}
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground-secondary block mb-2">비밀번호 확인 (4자리)</label>
                <button
                  type="button"
                  onClick={() => { setActivePinField('confirmPin'); setIsKeyboardOpen(true) }}
                  className="flex w-full justify-center bg-transparent py-1 focus:outline-none"
                >
                  <PinDots value={confirmPin} active={activePinField === 'confirmPin' && isKeyboardOpen} />
                </button>
                {activePinField === 'confirmPin' && (
                  <AccountPinKeypad
                    variant="desktop"
                    isOpen={isKeyboardOpen}
                    value={confirmPin}
                    onChange={handlePinChange}
                    onDone={() => setIsKeyboardOpen(false)}
                    onClose={() => setIsKeyboardOpen(false)}
                  />
                )}
              </div>
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
                  계좌 비밀번호가 변경되었습니다.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-[13px] bg-primary text-white rounded-[4px] text-sm font-bold hover:bg-primary-hover transition-colors duration-[150ms]"
                >
                  홈으로 가기
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
              재설정 링크가 만료되었습니다.<br />계정 설정에서 다시 요청해 주세요.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-[13px] bg-surface-muted border border-stroke text-foreground-secondary rounded-[4px] text-sm font-semibold hover:bg-stroke-subtle transition-colors"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
