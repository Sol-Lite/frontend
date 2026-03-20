import { X, Lock, RotateCcw, Trash2, Key } from 'lucide-react'
import useAuthStore from '@/store/useAuthStore'
import useRightPanelStore from '@/store/useRightPanelStore'
import { useMyAccount } from '@/api/account'

function Header() {
  const setChatMode = useRightPanelStore((s) => s.setChatMode)
  return (
    <div className="h-chat-header flex items-center justify-between px-4 border-b border-stroke shrink-0">
      <span className="text-[13px] font-semibold text-foreground">계좌 설정</span>
      <button
        onClick={() => setChatMode()}
        aria-label="닫기"
        className="p-1 text-foreground-tertiary hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function AccountInfo() {
  const { user } = useAuthStore()
  const { data: accountInfo } = useMyAccount()

  return (
    <div className="px-4 py-4 border-b border-stroke-subtle bg-surface-subtle shrink-0">
      <div className="text-[12px] font-semibold text-foreground mb-1">
        {user?.name}
      </div>
      <div className="text-[11px] text-foreground-secondary">
        {accountInfo?.accountNumber}
      </div>
      <div className="text-[10px] text-foreground-disabled mt-2">
        상태: {accountInfo?.accountStatus}
      </div>
    </div>
  )
}

function MenuItem({ icon: Icon, label, onClick, isWarning = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-[12px] hover:bg-surface-muted transition-colors text-left border-b border-stroke-subtle last:border-b-0 ${isWarning ? 'text-up' : 'text-foreground'}`}
    >
      <Icon className="w-4 h-4 shrink-0" strokeWidth={2} style={{ color: isWarning ? 'currentColor' : '' }} />
      <span>{label}</span>
    </button>
  )
}

function MenuContent() {
  const handleMenuClick = (label) => {
    console.log(label)
    // TODO: 각 메뉴 항목에 대한 동작 구현
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="flex-1 flex flex-col">
        <MenuItem
          icon={Lock}
          label="계좌 비밀번호 변경"
          onClick={() => handleMenuClick('계좌 비밀번호 변경')}
        />
        <MenuItem
          icon={RotateCcw}
          label="리셋"
          onClick={() => handleMenuClick('리셋')}
        />
        <MenuItem
          icon={Trash2}
          label="계좌 해지 신청"
          onClick={() => handleMenuClick('계좌 해지 신청')}
          isWarning
        />
        <MenuItem
          icon={Key}
          label="계정 비밀번호 변경"
          onClick={() => handleMenuClick('계정 비밀번호 변경')}
        />
      </div>
    </div>
  )
}

export default function AccountSettingsPanel() {
  return (
    <>
      <Header />
      <AccountInfo />
      <MenuContent />
    </>
  )
}
