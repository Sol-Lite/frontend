import { useState } from 'react'
import { Check, X } from 'lucide-react'

const PRE_OPEN_NOTICES = [
  {
    key: 'limited',
    title: '1. 한도제한 계좌로 개설됩니다.',
    description: '해제 조건을 만족하거나, 금융거래 목적에 맞는 서류를 제출하면 직접 해제 신청할 수 있어요. (개설 후 1개월 안에 금융거래 목적을 확인할 수 있는 거래 정보가 있으면 자동으로 해제돼요.)',
    note: '※ 1일 출금한도 : 온라인/ATM 100만원, 영업점 300만원',
    buttonLabel: '자세히 보기',
  },
  {
    key: 'deposit',
    title: '2. 예금자보호에 대한 설명을 확인하세요.',
    description: '본인이 가입하는 금융상품의 예금자 보호여부(보호 또는 비보호) 및 보호한도에 대하여 설명 듣고 이해하였습니다.',
    buttonLabel: '자세히 보기',
  },
]

const PURPOSE_PROOF_ROWS = [
  {
    purpose: '금융투자상품거래',
    proofs: [
      '주식•금융상품 거래내역서 또는 잔고확인서(거래회사인감날인 필수, 발행 후 3개월 이내)',
      '※ CMA, RP 등 현금성 자산 제외',
      '※ 기존 당사거래 고객은 일정 기준 이상의 주식•금융상품 거래내역이 있는 경우 영업점 및 디지털PB센터를 통해 유선신청 가능',
    ],
  },
  {
    purpose: '급여수령',
    proofs: [
      '근로소득원천징수영수증, 건강보험자격득실확인서(직장가입자용), 소득금액증명원, 근로계약서, 재직증명서, 합격증, 퇴직연금 가입 확인서, 최근 3개월 이내 급여명세서, 명함+사원증 등',
      '아르바이트비 수령 시 고용주의 사업자등록증 사본 + 근로계약서(급여명세표) 등',
    ],
  },
  {
    purpose: '기타',
    proofs: [
      '거래목적을 확인할 수 있는 객관적 증빙자료',
      '영업점에서 신청 가능',
    ],
  },
]

const LIMIT_ROWS = [
  { channel: '창구', limit: '300만원' },
  { channel: 'ATM', limit: '100만원' },
  { channel: '전자금융거래 (온라인)', limit: '100만원' },
]

function DetailModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-6 py-8">
      <div
        className="w-full max-w-[860px] max-h-[82vh] bg-surface rounded-2xl shadow-modal overflow-hidden"
        style={{ animation: 'modal-in .2s ease both' }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stroke">
          <h3 className="text-[18px] font-extrabold tracking-tight text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-subtle border border-stroke flex items-center justify-center text-foreground-secondary hover:bg-surface-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(82vh-74px)] px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}

function LimitedAccountDetailModal({ onClose }) {
  return (
    <DetailModal title="한도제한 계좌 자세히보기" onClose={onClose}>
      <div className="space-y-6">
        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-2">금융거래 한도제한 계좌란?</h4>
          <p className="text-[13px] text-foreground-secondary leading-[1.85]">
            보이스피싱 피해 예방 및 전기통신금융사기 방지를 위해 계좌개설 시 금융거래 목적이 확인이 필요하며, 목적에 따른 증빙서류가 확인되지 않으면 출금한도가 제한되는 계좌로 개설됩니다.
            <br />
            (ISA, IRP, 연금저축계좌는 제외)
          </p>
        </section>

        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-3">금융거래 목적에 따른 증빙 서류</h4>
          <div className="rounded-2xl border border-stroke overflow-hidden">
            <div className="grid grid-cols-[180px_1fr] bg-surface-subtle border-b border-stroke">
              <div className="px-4 py-3 text-[12px] font-semibold text-foreground-secondary">금융거래 목적</div>
              <div className="px-4 py-3 text-[12px] font-semibold text-foreground-secondary">증빙서류</div>
            </div>
            {PURPOSE_PROOF_ROWS.map((row) => (
              <div key={row.purpose} className="grid grid-cols-[180px_1fr] border-b border-stroke last:border-b-0">
                <div className="px-4 py-4 text-[13px] font-semibold text-foreground bg-surface-subtle/70">{row.purpose}</div>
                <div className="px-4 py-4">
                  <ul className="space-y-2">
                    {row.proofs.map((proof) => (
                      <li key={proof} className="text-[12px] text-foreground-secondary leading-[1.75]">{proof}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-surface-subtle border border-stroke-subtle px-4 py-3">
            <ul className="space-y-2">
              <li className="text-[12px] text-foreground-secondary leading-[1.7]">
                ※ 상기자료 이외에도 거래목적을 증빙할 수 있는 다른 증빙자료를 준비하실 수 있으며, 필요 시 당사는 상기 증빙자료 외의 추가자료를 요청할 수 있습니다.
              </li>
              <li className="text-[12px] text-foreground-secondary leading-[1.7]">
                ※ 미성년자는 본인 또는 법정대리인의 증빙서류 외에 미성년자 기준의 가족관계증명서와 기본증명서(상세)도 추가 제출해야 합니다.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-3">출금/이체 한도</h4>
          <div className="rounded-2xl border border-stroke overflow-hidden">
            <div className="grid grid-cols-[1fr_180px] bg-surface-subtle border-b border-stroke">
              <div className="px-4 py-3 text-[12px] font-semibold text-foreground-secondary">거래채널</div>
              <div className="px-4 py-3 text-[12px] font-semibold text-foreground-secondary">1일 출금 한도</div>
            </div>
            {LIMIT_ROWS.map((row) => (
              <div key={row.channel} className="grid grid-cols-[1fr_180px] border-b border-stroke last:border-b-0">
                <div className="px-4 py-3 text-[13px] text-foreground">{row.channel}</div>
                <div className="px-4 py-3 text-[13px] font-semibold text-foreground">{row.limit}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-foreground-secondary leading-[1.7]">
            ※ 복수의 한도제한 계좌가 있는 경우 일 출금/이체 한도는 합산하여 적용됩니다.
          </p>
        </section>

        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-2">해제 안내</h4>
          <ul className="space-y-2">
            <li className="text-[12px] text-foreground-secondary leading-[1.75]">• 금융거래 목적에 따른 증빙서류 제출</li>
            <li className="text-[12px] text-foreground-secondary leading-[1.75]">• 해제 조건에 충족한 경우 증빙서류 제출 없이 해제 신청 가능</li>
            <li className="text-[12px] text-foreground-secondary leading-[1.75]">※ 개설 후 1개월 안에 금융거래목적을 확인할 수 있는 거래 정보가 있으면 자동해제 됩니다.</li>
            <li className="text-[12px] text-foreground-secondary leading-[1.75]">※ 자동해제 조건은 상시 변경될 수 있으며, 상세 조건은 안내되지 않습니다.</li>
            <li className="text-[12px] text-foreground-secondary leading-[1.75]">
              ※ SOL-FX계좌: 개설 후 1개월 내 동일명의 당사 타 계좌의 한도해제 이력이나 잔고•거래실적이 있으면 자동해제 됩니다. 다만 개설 후 1개월 내 자동해제가 되지 않으면, 동일명의 당사 타계좌의 잔고•거래실적을 제출해주셔야 SOL-FX계좌의 한도제한 해제가 가능합니다. (당사 타 계좌 잔고 및 거래내역 증빙일 경우 영업점, 디지털PB센터 유선 신청 가능)
            </li>
          </ul>
        </section>
      </div>
    </DetailModal>
  )
}

function DepositProtectionDetailModal({ onClose }) {
  return (
    <DetailModal title="예금자보호 설명/확인" onClose={onClose}>
      <div className="space-y-6">
        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-2">예금자보호제도란?</h4>
          <p className="text-[13px] text-foreground-secondary leading-[1.85]">
            본 금융회사가 예금등 채권의 지급정지 후 파산하게 되는 경우, 예금보험공사가 예금자 1인당 보호금융상품의 원금과 소정의 이자를 합하여 최고 1억원까지 보호합니다.
          </p>
        </section>
        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-2">보호금융상품</h4>
          <p className="text-[13px] text-foreground-secondary leading-[1.85]">
            이 예탁금 중 증권매수 미사용 현금 잔액은 예금자보호법에 따라 원금과 소정의 이자를 합하여 1인당 "1억원까지"(본 금융회사의 여타 보호상품과 합산) 보호됩니다.
          </p>
        </section>
        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-2">비보호상품</h4>
          <p className="text-[13px] text-foreground-secondary leading-[1.85]">
            이 금융상품은 예금자보호법에 따라 보호되지 않습니다.
          </p>
        </section>
        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-2">IRP(개인형 퇴직연금)</h4>
          <p className="text-[13px] text-foreground-secondary leading-[1.85]">
            이 퇴직연금은 예금자보호법에 따라 예금보호 대상 금융상품으로 운용되는 적립금에 대하여 다른 보호상품과는 별도로 1인당 "1억원까지"(운용되는 금융상품 판매회사별 보호상품 합산) 보호됩니다.
          </p>
        </section>
        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-2">중개형 ISA</h4>
          <p className="text-[13px] text-foreground-secondary leading-[1.85]">
            이 금융상품(중개형 ISA)은 예금자보호법에 따라 보호되지 않습니다. 다만, 중개형 ISA의 예탁금 중 증권매수 미사용 현금 잔액은 예금자보호법에 따라 원금과 소정의 이자를 합하여 1인당 "1억원까지" (본 금융회사의 여타 보호상품과 합산) 보호됩니다.
          </p>
        </section>
        <section>
          <h4 className="text-[15px] font-bold text-foreground mb-2">외화전용계좌(SOL-FX)</h4>
          <p className="text-[13px] text-foreground-secondary leading-[1.85]">
            이 예탁금은 예금자보호법에 따라 원금과 소정의 이자를 합하여 1인당 "1억원까지"(본 금융회사의 여타 보호상품과 합산) 보호됩니다.
          </p>
        </section>
      </div>
    </DetailModal>
  )
}

export default function PreOpenCheckStep({ onBack, onNext }) {
  const [openModal, setOpenModal] = useState(null)

  return (
    <>
      <div>
        <div className="mb-7">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-1">계좌 개설 전에 꼭 확인하세요</h2>
          <p className="text-[13px] text-foreground-disabled leading-[1.8]">
            사전 안내를 확인한 뒤 다음 단계에서 동의서를 검토합니다.
          </p>
        </div>

        <div className="rounded-2xl border border-stroke bg-surface overflow-hidden">
          <div className="px-5 py-5 space-y-8">
            {PRE_OPEN_NOTICES.map((item) => (
              <div key={item.key}>
                <p className="text-[16px] font-bold text-foreground leading-[1.55]">{item.title}</p>
                <p className="text-[13px] text-foreground-secondary mt-2 leading-[1.8]">{item.description}</p>
                {item.note && <p className="text-[11px] text-foreground-tertiary mt-2 leading-[1.7]">{item.note}</p>}
                <button
                  type="button"
                  onClick={() => setOpenModal(item.key)}
                  className="mt-4 inline-flex items-center text-[12px] font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  {item.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-[13px] rounded-xl border border-stroke-input bg-surface text-sm font-semibold text-foreground-secondary hover:bg-surface-subtle transition-colors"
          >
            이전
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex-[1.3] py-[13px] rounded-xl bg-primary text-white text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors"
          >
            확인하고 계속하기
          </button>
        </div>
      </div>

      {openModal === 'limited' && <LimitedAccountDetailModal onClose={() => setOpenModal(null)} />}
      {openModal === 'deposit' && <DepositProtectionDetailModal onClose={() => setOpenModal(null)} />}
    </>
  )
}
