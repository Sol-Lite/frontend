import { ArrowRight, Landmark } from 'lucide-react'

export default function AccountIntroStep({ onNext }) {
  return (
    <div>
      <div className="rounded-[20px] border border-primary-border bg-[linear-gradient(180deg,#F8FAFF_0%,#EEF2FF_100%)] p-5 shadow-[0_10px_30px_rgba(0,70,255,.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold text-primary tracking-[.04em] uppercase mb-2">대표 계좌</div>
            <div className="text-[24px] font-black tracking-tight text-foreground mb-2">증권종합</div>
            <p className="text-[13px] text-foreground-secondary leading-[1.8]">
              국내 주식과 금융상품 거래를 위한 기본 계좌입니다.
              <br />
              기본 정보를 입력한 뒤 계좌 개설 전 확인 절차를 진행합니다.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white border border-primary-border flex items-center justify-center shrink-0">
            <Landmark className="w-7 h-7 text-primary" strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full mt-7 py-[13px] bg-primary text-white border-none rounded-xl text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors duration-[150ms] flex items-center justify-center gap-2"
      >
        계좌 개설하기
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
