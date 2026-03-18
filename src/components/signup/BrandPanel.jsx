import { Activity, MessageCircle, LayoutGrid, BarChart2 } from 'lucide-react'

const FEATURES = [
  { icon: MessageCircle, label: 'SOL AI 채팅 어시스턴트' },
  { icon: LayoutGrid, label: '자유롭게 구성하는 위젯 대시보드' },
  { icon: BarChart2, label: '국내·해외 실시간 시세 및 주문' },
]

export default function BrandPanel() {
  return (
    <div
      className="w-[44%] shrink-0 flex flex-col py-12 px-11 relative overflow-hidden bg-gradient-to-br from-[#0035CC] via-primary to-[#2563EB]"
    >
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/[.06]" />
      <div className="absolute -bottom-[60px] -left-[60px] w-60 h-60 rounded-full bg-white/[.04]" />

      <div className="flex items-center gap-2.5 relative z-10">
        <div className="w-9 h-9 rounded-[11px] bg-white/20 flex items-center justify-center">
          <Activity className="w-[18px] h-[18px] text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-extrabold text-white tracking-tight">
          SOL <span className="opacity-85">Lite</span>
        </span>
      </div>

      <div className="my-auto relative z-10">
        <div className="text-[11px] font-semibold text-white/60 tracking-[.08em] uppercase mb-3.5">
          새로운 증권 경험
        </div>
        <h1 className="text-[30px] font-black text-white leading-[1.3] tracking-tight mb-3.5">
          채팅과 위젯으로<br />증권을 더<br />편리하게
        </h1>
        <p className="text-[13px] text-white/70 leading-[1.8]">
          AI 채팅 어시스턴트에게 물어보고,<br />내가 원하는 대로 대시보드를 구성하세요.
        </p>
        <div className="mt-7 flex flex-col gap-2.5">
          {FEATURES.map((feature) => (
            <div key={feature.label} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <feature.icon className="w-[13px] h-[13px] text-white" />
              </div>
              <span className="text-[13px] text-white/85 font-medium">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-white/40 relative z-10">
        SOL Lite는 실제 투자와 무관한 모의투자 서비스입니다
      </div>
    </div>
  )
}
