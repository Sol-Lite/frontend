import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function LockedOverlay({ message = '계좌 정보를 보려면' }) {
  const navigate = useNavigate()

  return (
    <div className="absolute inset-0 rounded-2xl bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
      <div className="w-9 h-9 rounded-xl bg-surface-muted flex items-center justify-center">
        <Lock className="w-[18px] h-[18px] text-foreground-disabled" />
      </div>
      <div className="text-center">
        <div className="text-[12px] font-bold text-foreground-secondary">로그인 필요</div>
        <div className="text-[10px] text-foreground-disabled mt-0.5">{message}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); navigate('/login') }}
        className="px-4 py-1.5 bg-primary text-white text-[11px] font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-[150ms]"
      >
        로그인하기
      </button>
    </div>
  )
}
