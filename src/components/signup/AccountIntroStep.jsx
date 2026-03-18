import { ArrowRight, Smartphone, FileText, CreditCard } from 'lucide-react'

export default function AccountIntroStep({ onNext }) {
  return (
    <div className="w-full min-h-screen relative overflow-hidden px-8 py-11 flex flex-col justify-center">
      {/* 배경 장식 요소들 */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl pointer-events-none"
           style={{background: 'rgba(0, 70, 255, 0.15)'}} />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{background: 'rgba(0, 70, 255, 0.1)'}} />

      {/* 메인 콘텐츠 */}
      <div className="relative z-10">
        {/* Hero 섹션 */}
        <div className="mb-10">
          <h1 className="text-5xl font-black text-foreground mb-6 tracking-tight leading-tight">
            증권종합
          </h1>

          <p className="text-xl text-foreground-secondary max-w-2xl mb-8 leading-relaxed">
            국내 주식과 금융상품 거래를 위한 기본 계좌입니다.
            <br />
            안전한 거래 환경과 최고의 서비스를 제공합니다.
          </p>
        </div>

        {/* 필요한 준비물 섹션 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-10">
            세 가지 준비물이 필요해요
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, label: '휴대폰', desc: '본인 명의 휴대폰' },
              { icon: FileText, label: '신분증', desc: '유효한 신분증' },
              { icon: CreditCard, label: '금융계좌', desc: '본인 계좌' },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div
                  key={idx}
                  className="relative p-8 rounded-3xl bg-surface border border-stroke-subtle hover:border-widget-border-hover transition-all duration-300 overflow-hidden group"
                >
                  {/* 배경 그라데이션 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* 콘텐츠 */}
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6">
                      <Icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {item.label}
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>


        {/* 최종 CTA */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onNext}
            className="px-12 py-5 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl
                       transition-all duration-200 flex items-center justify-center gap-2
                       shadow-primary-btn hover:shadow-brand-glow text-lg mx-auto"
          >
            지금 계좌 개설하기
            <ArrowRight className="w-6 h-6" />
          </button>

          <p className="text-sm text-foreground-secondary mt-6">
            이미 계좌가 있으신가요? <a href="#" className="text-primary hover:underline font-semibold">로그인</a>
          </p>
        </div>
      </div>
    </div>
  )
}
