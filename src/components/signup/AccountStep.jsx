import { Activity } from 'lucide-react'

export default function AccountStep({ onFinish }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-5">
        <Activity className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">계좌 개설 완료!</h2>
      <p className="text-[13px] text-foreground-disabled mb-8 leading-[1.8]">
        증권종합 계좌 개설 절차가 완료되었습니다.
        <br />
        로그인하여 SOL Lite 모의투자 서비스를 시작해 주세요.
      </p>
      <button
        type="button"
        onClick={onFinish}
        className="w-full py-[13px] bg-primary text-white border-none rounded-xl text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors duration-[150ms]"
      >
        로그인하고 시작하기
      </button>
    </div>
  )
}
