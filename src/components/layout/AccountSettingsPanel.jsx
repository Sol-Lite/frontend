import { useState } from 'react'
import { X, Lock, RotateCcw, Trash2, Key, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useRightPanelStore from '@/store/useRightPanelStore'
import useAuthStore from '@/store/useAuthStore'
import { PasswordInput } from '@/components/ui/Input'
import { userApi } from '@/api/user'
import { accountApi } from '@/api/account'
import { authApi } from '@/api/auth'
import { changePasswordSchema, changePinSchema, resetAccountSchema, closeAccountSchema } from '@/lib/validationSchemas'
import AccountPinKeypad from '@/components/signup/AccountPinKeypad'
import DecoyCursorOverlay from '@/components/signup/DecoyCursorOverlay'

function Header() {
  const navigate = useNavigate()
  const setChatMode = useRightPanelStore((s) => s.setChatMode)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error('로그아웃 에러:', err)
    }
    logout()
    navigate('/')
  }

  return (
    <div className="h-chat-header flex items-center justify-between px-4 border-b border-stroke shrink-0">
      <span className="text-[13px] font-semibold text-foreground">계정 설정</span>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLogout}
          aria-label="로그아웃"
          className="p-1 text-foreground-tertiary hover:text-up transition-colors"
          title="로그아웃"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
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

function MenuTabs({ selectedMenuItem, onSelectMenuItem }) {
  return (
    <div className="flex border-b border-stroke shrink-0 overflow-x-auto">
      <button
        onClick={() => onSelectMenuItem('change-account-password')}
        className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
          selectedMenuItem === 'change-account-password'
            ? 'text-primary border-b-primary'
            : 'text-foreground-secondary border-b-transparent hover:text-foreground'
        }`}
      >
        계정 비밀번호
      </button>
      <button
        onClick={() => onSelectMenuItem('change-account-pin')}
        className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
          selectedMenuItem === 'change-account-pin'
            ? 'text-primary border-b-primary'
            : 'text-foreground-secondary border-b-transparent hover:text-foreground'
        }`}
      >
        계좌 비밀번호
      </button>
      <button
        onClick={() => onSelectMenuItem('reset')}
        className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
          selectedMenuItem === 'reset'
            ? 'text-primary border-b-primary'
            : 'text-foreground-secondary border-b-transparent hover:text-foreground'
        }`}
      >
        리셋
      </button>
      <button
        onClick={() => onSelectMenuItem('close-account')}
        className={`px-4 py-2 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
          selectedMenuItem === 'close-account'
            ? 'text-up border-b-up'
            : 'text-foreground-secondary border-b-transparent hover:text-up'
        }`}
      >
        계좌 해지
      </button>
    </div>
  )
}

function ChangePasswordForm({ onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    })

    if (!validation.success) {
      const fieldError = validation.error.errors[0]
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
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="현재 비밀번호"
        />
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
        {isLoading ? '변경 중...' : '변경'}
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
  const [activePinField, setActivePinField] = useState(null)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validation = changePinSchema.safeParse({
      currentPin,
      newPin,
      confirmPin,
    })

    if (!validation.success) {
      const fieldError = validation.error.errors[0]
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

  function handlePinDone() {
    setIsKeyboardOpen(false)
  }

  function openKeyboard(fieldName) {
    setActivePinField(fieldName)
    setIsKeyboardOpen(true)
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
            onDone={handlePinDone}
            onClose={() => setIsKeyboardOpen(false)}
          />
        )}
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
        {isLoading ? '변경 중...' : '변경'}
      </button>
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
      const fieldError = validation.error.errors[0]
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
      <div className="p-3 bg-up-bg rounded-lg">
        <p className="text-[11px] text-up leading-relaxed">
          리셋하면 현재 라운드가 종료되고 새로운 라운드가 시작됩니다. 이 작업은 되돌릴 수 없습니다.
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
        className="px-4 py-2 rounded-lg bg-primary text-white text-[12px] font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 mt-2"
      >
        {isLoading ? '진행 중...' : '리셋'}
      </button>
    </form>
  )
}

function CloseAccountForm({ onSuccess }) {
  const [accountPin, setAccountPin] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validation = closeAccountSchema.safeParse({
      accountPin,
      agreed,
    })

    if (!validation.success) {
      const fieldError = validation.error.errors[0]
      setError(fieldError.message)
      return
    }

    setIsLoading(true)
    try {
      await accountApi.closeAccount(accountPin)
      onSuccess('계좌가 해지되었습니다.')
      setAccountPin('')
    } catch (err) {
      setError(err?.message ?? '계좌 해지에 실패했습니다.')
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
      <div className="p-3 bg-up-bg rounded-lg">
        <p className="text-[11px] text-up leading-relaxed">
          계좌를 해지하면 모든 데이터가 삭제되며 되돌릴 수 없습니다.
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

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="w-4 h-4 accent-primary rounded cursor-pointer"
        />
        <span className="text-[11px] text-foreground-secondary">
          계좌 해지에 동의합니다.
        </span>
      </label>

      {error && <p className="text-[11px] text-up">{error}</p>}

      <button
        type="submit"
        disabled={isLoading || !agreed}
        className="px-4 py-2 rounded-lg bg-up text-white text-[12px] font-medium hover:bg-[#d03239] transition-colors disabled:opacity-60 mt-2"
      >
        {isLoading ? '처리 중...' : '해지'}
      </button>
    </form>
  )
}

function ContentArea({ selectedMenuItem, onSuccess }) {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
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
        <CloseAccountForm onSuccess={onSuccess} />
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
  const [selectedMenuItem, setSelectedMenuItem] = useState('change-account-password')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  return (
    <div className="flex flex-col h-full">
      <Header />

      {successMessage && (
        <div className="px-4 py-2 bg-live/10 border-b border-live text-[11px] text-live">
          {successMessage}
        </div>
      )}

      <MenuTabs selectedMenuItem={selectedMenuItem} onSelectMenuItem={setSelectedMenuItem} />

      <ContentArea selectedMenuItem={selectedMenuItem} onSuccess={handleSuccess} />
    </div>
  )
}
