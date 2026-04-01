import { useState, useEffect, useRef } from 'react'
import { X, LogOut } from 'lucide-react'
import SplashScreenFill from '@/components/ui/SplashScreenFill'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useRightPanelStore from '@/store/useRightPanelStore'
import useAuthStore from '@/store/useAuthStore'
import { Input, PasswordInput } from '@/components/ui/Input'
import { userApi } from '@/api/user'
import { accountApi } from '@/api/account'
import { authApi } from '@/api/auth'
import { changePasswordSchema, changePinSchema, resetAccountSchema, closeAccountSchema, updateProfileSchema } from '@/lib/validationSchemas'
import { formatPhoneNumber } from '@/components/signup/phoneNumber'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'

function Header() {
  const navigate = useNavigate()
  const setChatMode = useRightPanelStore((s) => s.setChatMode)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    setChatMode()
    try {
      await authApi.logout()
    } catch (err) {
      console.error('로그아웃 에러:', err)
    } finally {
      logout()
      navigate('/')
    }
  }

  return (
    <div className="h-chat-header flex items-center justify-between px-4 border-b border-stroke shrink-0">
      <span className="text-[13px] font-semibold text-foreground">계정 설정</span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-foreground-tertiary hover:text-up transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
          로그아웃
        </button>
        <button
          onClick={() => setChatMode()}
          aria-label="닫기"
          className="p-1 text-foreground-tertiary hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}


function MenuTabs({ selectedMenuItem, onSelectMenuItem, disabled }) {
  const tabs = [
    { id: 'update-profile',          label: '프로필',      danger: false },
    { id: 'change-account-password', label: '계정 비밀번호', danger: false },
    { id: 'change-account-pin',      label: '계좌 비밀번호', danger: false },
    { id: 'reset',                   label: '리셋',        danger: true  },
    { id: 'close-account',           label: '계좌 해지',   danger: true  },
  ]

  return (
    <div className="flex border-b border-stroke shrink-0 overflow-x-auto">
      {tabs.map(({ id, label, danger }) => {
        const active = selectedMenuItem === id
        return (
          <button
            key={id}
            onClick={() => onSelectMenuItem(id)}
            disabled={disabled}
            className={`px-3 py-[10px] text-[12px] border-b-2 transition-colors whitespace-nowrap disabled:pointer-events-none disabled:opacity-40 ${
              active
                ? danger
                  ? 'font-bold text-up border-b-up'
                  : 'font-bold text-primary border-b-primary'
                : 'font-medium text-foreground-disabled border-b-transparent hover:text-foreground-secondary'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function UpdateProfileForm({ onSuccess }) {
  const queryClient = useQueryClient()
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userApi.getProfile(),
    staleTime: 1000 * 60 * 5,
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setPhone(formatPhoneNumber(profile.phone ?? ''))
    }
  }, [profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!profile) return

    if (name === (profile.name ?? '') && phone === formatPhoneNumber(profile.phone ?? '')) {
      setError('변경된 내용이 없습니다.')
      return
    }

    const validation = updateProfileSchema.safeParse({ name, phone })
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? '입력 값을 확인해주세요.')
      return
    }

    setIsLoading(true)
    try {
      await userApi.updateProfile(name, phone)
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
      onSuccess('프로필이 수정되었습니다.')
    } catch (err) {
      setError(err?.message ?? '프로필 수정에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isProfileLoading) {
    return <p className="text-[12px] text-foreground-disabled">불러오는 중...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-[11px] font-semibold text-foreground-secondary block mb-1.5">이름</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-foreground-secondary block mb-1.5">전화번호</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
          placeholder="010-0000-0000"
        />
      </div>

      {error && <p className="text-[11px] text-up">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 rounded-lg bg-primary text-white text-[12px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 mt-2"
      >
        저장
      </button>
    </form>
  )
}

function ChangePasswordForm({ onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPasswordError, setCurrentPasswordError] = useState('')

  async function handleCurrentPasswordBlur() {
    if (!currentPassword) return
    setCurrentPasswordError('')
    try {
      await userApi.verifyPassword(currentPassword)
    } catch {
      setCurrentPasswordError('현재 비밀번호가 올바르지 않습니다.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (currentPasswordError) return

    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    })

    if (!validation.success) {
      const fieldError = validation.error.issues[0]
      setError(fieldError.message)
      return
    }

    setIsLoading(true)
    try {
      await userApi.changePassword(currentPassword, newPassword)
      onSuccess('비밀번호가 변경되었습니다.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setCurrentPasswordError('')
    } catch (err) {
      setError(err?.message ?? '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="text-[11px] font-semibold text-foreground-secondary block mb-1.5">
          현재 비밀번호
        </label>
        <PasswordInput
          value={currentPassword}
          onChange={(e) => { setCurrentPassword(e.target.value); setCurrentPasswordError('') }}
          onBlur={handleCurrentPasswordBlur}
          placeholder="현재 비밀번호"
        />
        {currentPasswordError && <p className="text-[11px] text-up mt-1">{currentPasswordError}</p>}
      </div>

      <div>
        <label className="text-[11px] font-semibold text-foreground-secondary block mb-1.5">
          새 비밀번호
        </label>
        <PasswordInput
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="새 비밀번호"
        />
      </div>

      <div>
        <label className="text-[11px] font-semibold text-foreground-secondary block mb-1.5">
          비밀번호 확인
        </label>
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="비밀번호 확인"
        />
      </div>

      {error && <p className="text-[11px] text-up">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 rounded-lg bg-primary text-white text-[12px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 mt-2"
      >
        변경
      </button>
    </form>
  )
}

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

function PinField({ label, value, active, error, onClick }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-foreground-secondary block mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={onClick}
        className={[
          'flex w-full justify-center bg-transparent py-1 text-center transition-opacity duration-[150ms] focus:outline-none',
          active ? 'opacity-100' : 'opacity-95 hover:opacity-100',
        ].join(' ')}
        data-pin-interactive="true"
      >
        <PinDots value={value} active={active} />
      </button>

      {error && <p className="mt-2 text-[11px] text-up">{error}</p>}
    </div>
  )
}

function ChangePinForm({ onSuccess }) {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPinError, setCurrentPinError] = useState('')
  const [activePinField, setActivePinField] = useState(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (currentPinError) return

    const validation = changePinSchema.safeParse({
      currentPin,
      newPin,
      confirmPin,
    })

    if (!validation.success) {
      const fieldError = validation.error.issues[0]
      setError(fieldError.message)
      return
    }

    setIsLoading(true)
    try {
      await accountApi.changePin(currentPin, newPin)
      onSuccess('계좌 비밀번호가 변경되었습니다.')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      setCurrentPinError('')
    } catch (err) {
      setError(err?.message ?? '계좌 비밀번호 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function handlePinChange(nextValue) {
    const sanitizedValue = nextValue.replace(/\D/g, '').slice(0, 4)

    if (activePinField === 'currentPin') {
      setCurrentPin(sanitizedValue)
      setCurrentPinError('')
      return
    }
    if (activePinField === 'newPin') {
      setNewPin(sanitizedValue)
      return
    }
    if (activePinField === 'confirmPin') {
      setConfirmPin(sanitizedValue)
      return
    }
  }

  async function handleCurrentPinDone() {
    setIsKeyboardOpen(false)
    if (currentPin.length === 4) {
      setCurrentPinError('')
      try {
        await accountApi.verifyPin(currentPin)
      } catch {
        setCurrentPinError('현재 PIN이 올바르지 않습니다.')
      }
    }
  }

  function handlePinDone() {
    setIsKeyboardOpen(false)
  }

  function openKeyboard(fieldName) {
    setActivePinField(fieldName)
    setIsKeyboardOpen(true)
  }

  async function handleRequestPinReset() {
    setResetLoading(true)
    try {
      await accountApi.requestPinReset()
      setResetSent(true)
    } catch (err) {
      setError(err?.message ?? '이메일 발송에 실패했습니다.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <PinField
          label="현재 비밀번호 (4자리)"
          value={currentPin}
          active={activePinField === 'currentPin' && isKeyboardOpen}
          error={undefined}
          onClick={() => openKeyboard('currentPin')}
        />
        {activePinField === 'currentPin' && (
          <AccountPinKeypad
            variant="desktop"
            isOpen={isKeyboardOpen}
            value={currentPin}
            onChange={handlePinChange}
            onDone={handleCurrentPinDone}
            onClose={() => setIsKeyboardOpen(false)}
          />
        )}
        {currentPinError && <p className="text-[11px] text-up mt-1">{currentPinError}</p>}
      </div>

      <div>
        <PinField
          label="새 비밀번호 (4자리)"
          value={newPin}
          active={activePinField === 'newPin' && isKeyboardOpen}
          error={undefined}
          onClick={() => openKeyboard('newPin')}
        />
        {activePinField === 'newPin' && (
          <AccountPinKeypad
            variant="desktop"
            isOpen={isKeyboardOpen}
            value={newPin}
            onChange={handlePinChange}
            onDone={handlePinDone}
            onClose={() => setIsKeyboardOpen(false)}
          />
        )}
      </div>

      <div>
        <PinField
          label="비밀번호 확인 (4자리)"
          value={confirmPin}
          active={activePinField === 'confirmPin' && isKeyboardOpen}
          error={undefined}
          onClick={() => openKeyboard('confirmPin')}
        />
        {activePinField === 'confirmPin' && (
          <AccountPinKeypad
            variant="desktop"
            isOpen={isKeyboardOpen}
            value={confirmPin}
            onChange={handlePinChange}
            onDone={handlePinDone}
            onClose={() => setIsKeyboardOpen(false)}
          />
        )}
      </div>

      {error && <p className="text-[11px] text-up">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 rounded-lg bg-primary text-white text-[12px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 mt-2"
      >
        변경
      </button>

      <div className="mt-1 text-center">
        {resetSent ? (
          <p className="text-[11px] text-live">재설정 이메일을 전송했습니다. 이메일을 확인해주세요.</p>
        ) : (
          <button
            type="button"
            disabled={resetLoading}
            onClick={handleRequestPinReset}
            className="text-[11px] text-foreground-tertiary hover:text-primary transition-colors disabled:opacity-60"
          >
            {resetLoading ? '전송 중...' : '비밀번호를 잊으셨나요?'}
          </button>
        )}
      </div>
    </form>
  )
}

function ResetForm({ onSuccess }) {
  const [accountPin, setAccountPin] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validation = resetAccountSchema.safeParse({
      accountPin,
    })

    if (!validation.success) {
      const fieldError = validation.error.issues[0]
      setError(fieldError.message)
      return
    }

    setIsLoading(true)
    try {
      await accountApi.reset(accountPin)
      onSuccess('계좌가 리셋되었습니다. 새 라운드가 시작됩니다.')
      setAccountPin('')
    } catch (err) {
      setError(err?.message ?? '리셋에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function handlePinChange(nextValue) {
    const sanitizedValue = nextValue.replace(/\D/g, '').slice(0, 4)
    setAccountPin(sanitizedValue)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="pl-3 border-l-2 border-up">
        <p className="text-[11px] text-up font-semibold mb-0.5">이 작업은 되돌릴 수 없습니다.</p>
        <p className="text-[11px] text-foreground-secondary leading-relaxed">
          리셋하면 현재 라운드가 종료되고 새로운 라운드가 시작됩니다.
        </p>
      </div>

      <div>
        <PinField
          label="계좌 비밀번호 (4자리)"
          value={accountPin}
          active={isKeyboardOpen}
          error={undefined}
          onClick={() => setIsKeyboardOpen(true)}
        />
        <AccountPinKeypad
          variant="desktop"
          isOpen={isKeyboardOpen}
          value={accountPin}
          onChange={handlePinChange}
          onDone={() => setIsKeyboardOpen(false)}
          onClose={() => setIsKeyboardOpen(false)}
        />
      </div>

      {error && <p className="text-[11px] text-up">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 rounded-lg bg-up text-white text-[12px] font-medium hover:opacity-90 transition-colors disabled:opacity-60 mt-2"
      >
        리셋
      </button>
    </form>
  )
}

function CloseAccountForm() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  // 1단계: 현금 초기화
  const [cashPin, setCashPin] = useState('')
  const [cashKeyboardOpen, setCashKeyboardOpen] = useState(false)
  const [cashLoading, setCashLoading] = useState(false)
  const [cashError, setCashError] = useState('')
  const [cashDone, setCashDone] = useState(false)

  // 2단계: 계좌 해지
  const [closePin, setClosePin] = useState('')
  const [closeKeyboardOpen, setCloseKeyboardOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [closeLoading, setCloseLoading] = useState(false)
  const [closeError, setCloseError] = useState('')

  async function handleCashReset(e) {
    e.preventDefault()
    setCashError('')
    if (!cashPin) {
      setCashKeyboardOpen(true)
      setCashError('비밀번호 입력이 필요합니다.')
      return
    }
    const validation = resetAccountSchema.safeParse({ accountPin: cashPin })
    if (!validation.success) {
      setCashKeyboardOpen(true)
      setCashError(validation.error.issues[0].message)
      return
    }
    setCashLoading(true)
    try {
      await accountApi.resetCashForClose(cashPin)
      setCashDone(true)
      setCashPin('')
    } catch (err) {
      setCashError(err?.message ?? '현금 초기화에 실패했습니다.')
    } finally {
      setCashLoading(false)
    }
  }

  async function handleCloseAccount(e) {
    e.preventDefault()
    setCloseError('')
    if (!closePin) {
      setCloseKeyboardOpen(true)
      setCloseError('비밀번호 입력이 필요합니다.')
      return
    }
    const validation = closeAccountSchema.safeParse({ accountPin: closePin, agreed })
    if (!validation.success) {
      setCloseKeyboardOpen(true)
      setCloseError(validation.error.issues[0].message)
      return
    }
    setCloseLoading(true)
    try {
      await accountApi.closeAccount(closePin)
      logout()
      navigate('/')
    } catch (err) {
      setCloseError(err?.message ?? '계좌 해지에 실패했습니다.')
    } finally {
      setCloseLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="pl-3 border-l-2 border-up flex gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-up font-semibold">계좌 해지 전 순서대로 진행해 주세요.</p>
          <ol className="flex flex-col gap-0.5">
            {['미체결 주문 취소', '보유 종목 전량 매도', '현금 초기화', '계좌 해지'].map((step, i) => (
              <li key={i} className="text-[11px] text-foreground-secondary flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-up text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 1단계: 현금 초기화 */}
      <form onSubmit={handleCashReset} className="flex flex-col gap-3">
        <p className="text-[12px] font-semibold text-foreground">
          1단계 — 현금 초기화
          {cashDone && <span className="ml-2 text-live text-[11px]">완료</span>}
        </p>
        {!cashDone && (
          <>
            <div>
              <PinField
                label="계좌 비밀번호 (4자리)"
                value={cashPin}
                active={cashKeyboardOpen}
                error={undefined}
                onClick={() => setCashKeyboardOpen(true)}
              />
              <AccountPinKeypad
                variant="desktop"
                isOpen={cashKeyboardOpen}
                value={cashPin}
                onChange={(v) => setCashPin(v.replace(/\D/g, '').slice(0, 4))}
                onDone={() => setCashKeyboardOpen(false)}
                onClose={() => setCashKeyboardOpen(false)}
              />
            </div>
            {cashError && <p className="text-[11px] text-up">{cashError}</p>}
            <button
              type="submit"
              disabled={cashLoading}
              className="px-4 py-2 rounded-lg bg-up text-white text-[12px] font-medium hover:opacity-90 transition-colors disabled:opacity-60"
            >
              KRW·USD 현금 0원으로 초기화
            </button>
          </>
        )}
      </form>

      {/* 2단계: 계좌 해지 */}
      <form onSubmit={handleCloseAccount} className="flex flex-col gap-3">
        <p className={`text-[12px] font-semibold ${cashDone ? 'text-foreground' : 'text-foreground-disabled'}`}>
          2단계 — 계좌 해지
        </p>
        {cashDone && (
          <>
            <div>
              <PinField
                label="계좌 비밀번호 (4자리)"
                value={closePin}
                active={closeKeyboardOpen}
                error={undefined}
                onClick={() => setCloseKeyboardOpen(true)}
              />
              <AccountPinKeypad
                variant="desktop"
                isOpen={closeKeyboardOpen}
                value={closePin}
                onChange={(v) => setClosePin(v.replace(/\D/g, '').slice(0, 4))}
                onDone={() => setCloseKeyboardOpen(false)}
                onClose={() => setCloseKeyboardOpen(false)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span className="text-[11px] text-foreground-secondary">
                계좌 해지에 동의합니다. 이 작업은 되돌릴 수 없습니다.
              </span>
            </label>
            {closeError && <p className="text-[11px] text-up">{closeError}</p>}
            <button
              type="submit"
              disabled={closeLoading || !agreed}
              className="px-4 py-2 rounded-lg bg-up text-white text-[12px] font-medium hover:opacity-90 transition-colors disabled:opacity-60"
            >
              계좌 해지
            </button>
          </>
        )}
      </form>
    </div>
  )
}

function ContentArea({ selectedMenuItem, onSuccess }) {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      {selectedMenuItem === 'update-profile' && (
        <UpdateProfileForm onSuccess={onSuccess} />
      )}

      {selectedMenuItem === 'change-account-password' && (
        <ChangePasswordForm onSuccess={onSuccess} />
      )}

      {selectedMenuItem === 'change-account-pin' && (
        <ChangePinForm onSuccess={onSuccess} />
      )}

      {selectedMenuItem === 'reset' && (
        <ResetForm onSuccess={onSuccess} />
      )}

      {selectedMenuItem === 'close-account' && (
        <CloseAccountForm />
      )}

      {!selectedMenuItem && (
        <div className="flex items-center justify-center h-full text-foreground-disabled">
          <p className="text-[12px]">항목을 선택해주세요.</p>
        </div>
      )}
    </div>
  )
}

export default function AccountSettingsPanel() {
  const [selectedMenuItem, setSelectedMenuItem] = useState('update-profile')
  const [successStatus, setSuccessStatus] = useState(null) // null | 'animating' | 'success'
  const [successMessage, setSuccessMessage] = useState('')
  const successTimerRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(successTimerRef.current)
  }, [])

  const handleSuccess = (message) => {
    setSuccessMessage(message)
    setSuccessStatus('animating')
    successTimerRef.current = setTimeout(() => setSuccessStatus('success'), 1600)
  }

  const handleReset = () => {
    clearTimeout(successTimerRef.current)
    setSuccessStatus(null)
    setSuccessMessage('')
  }

  return (
    <div className="flex flex-col h-full">
      <Header />

      <MenuTabs selectedMenuItem={selectedMenuItem} onSelectMenuItem={(item) => { handleReset(); setSelectedMenuItem(item) }} disabled={successStatus === 'animating'} />

      {successStatus ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6">
          <SplashScreenFill inline animated={successStatus === 'animating'} />
          {successStatus === 'success' && (
            <>
              <p className="text-[13px] font-semibold text-foreground tracking-tight">{successMessage}</p>
              <button
                onClick={handleReset}
                className="px-5 py-2 rounded-lg bg-primary text-white text-[12px] font-medium hover:bg-primary-hover transition-colors"
              >
                확인
              </button>
            </>
          )}
        </div>
      ) : (
        <ContentArea selectedMenuItem={selectedMenuItem} onSuccess={handleSuccess} />
      )}
    </div>
  )
}
