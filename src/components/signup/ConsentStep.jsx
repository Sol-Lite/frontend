import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

const CONSENT_DOCUMENTS = [
  {
    key: 'finance',
    title: '개인(신용)정보 처리 동의서 [금융거래설정용]',
    groups: [
      {
        key: 'financeCollection',
        label: '개인신용정보 수집•이용에 동의합니다.',
        itemKeys: ['financeCollectionDetails', 'financeCollectionItems'],
        items: [
          {
            key: 'financeCollectionDetails',
            title: '수집•이용에 관한 사항',
            lines: [
              '수집 • 이용 목적',
              '• (금융)계약의 체결 • 유지 • 이행 • 관리 • 개선',
              '• 법령상 의무이행(실명확인, 특정금융거래보고, 불공정거래예방, 적합성확인)',
              '• 금융사고 방지(본인확인, 이상금융거래탐지)',
              '• 통계 및 분석, 리스크 관리, 고객서비스 품질 향상',
              '• 분쟁 • 민원처리 사고 조사',
              '',
              '보유 및 이용기간',
              '• (금융)거래 종료일로부터 5년(단, 금융사고조사, 분쟁해결, 민원처리, 자본시장법(10년 이상 보관) 법령상 의무이행을 위한 경우에는 분리하여 별도 보관)',
              '• 위 보유 기간에서의 (금융)거래 종료일이란 고객이 보유하고 있는 모든 계좌의 적극적 폐쇄 및 모든 상품의 계약 해지가 이루어지는 시점을 말합니다.',
              '',
              '거부 권리 및 불이익',
              '• 귀하는 아래 개인신용정보의 수집•이용에 대해 거부하실 수 있습니다. 다만, "수집•이용에 관한 동의"는 금융거래 설정을 위한 필수적 사항이므로 동의를 거부하실 경우 관련 상품 및 서비스의 체결, 이행, (금융)거래관계의 설정 및 유지가 불가능할 수 있습니다.',
            ],
          },
          {
            key: 'financeCollectionItems',
            title: '수집•이용 항목',
            lines: [
              '개인(신용)정보(69개)',
              '• 일반개인정보(50개) : 성명, 생년월일 등',
              '• 신용거래정보(9개) : 상품종류, 금융 거래정보 등',
              '• 신용도판단정보(4개) : 연체, 명의도용 정보 등',
              '• 신용능력정보(3개) : 소득, 재산정보 등',
              '• 공공정보(3개) : 개인신용정보평점, 기초수급자여부 등',
            ],
          },
        ],
      },
      {
        key: 'financeIdentifier',
        label: '고유식별정보 수집•이용에 동의합니다.',
        itemKeys: ['financeIdentifierItems'],
        items: [
          {
            key: 'financeIdentifierItems',
            title: '수집•이용 항목',
            lines: [
              '고유식별정보(5개)',
              '• 주민등록번호, 외국인등록번호, 여권번호, 운전면허번호, 대리인 주민등록번호',
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'safety',
    title: '개인(신용)정보 처리 동의서 [비대면 계좌개설 안심차단 등록 여부 조회용]',
    intro: '귀하는 상기 개인(신용)정보 수집•이용·제공•조회에 대한 동의를 거부할 권리가 있습니다. 다만, 위 사항에 동의하셔야만 비대면 계좌개설 안심차단 등록 여부 조회 및 비대면 계좌개설 진행(안심차단을 신청하지 않은 것으로 확인된 경우)이 가능합니다.',
    groups: [
      {
        key: 'safetyUse',
        label: '고유식별정보 수집•이용에 동의합니다.',
        heading: '수집•이용에 관한 사항 [공통필수]',
        itemKeys: ['safetyUseDetails', 'safetyUseItems'],
        items: [
          {
            key: 'safetyUseDetails',
            title: '수집•이용에 관한 사항',
            lines: [
              '수집 • 이용 목적',
              '• 비대면 계좌개설 시 안심차단 등록 여부 조회',
              '',
              '보유 및 이용기간',
              '• 거래종료일로부터 3개월까지 보유 • 이용됩니다.',
              '• 거래종료일이란, 비대면 계좌개설 안심차단 등록 여부 조회를 완료한 시점을 의미합니다.',
              '• 거래종료일 후에는 금융사고 조사, 분쟁 해결, 민원처리, 법령상 의무이행 목적으로만 보유•이용됩니다. 단, 관련 법령에 따른 의무를 이행해야 하는 경우 해당 법령상의 보존 기간을 따릅니다.',
            ],
          },
          {
            key: 'safetyUseItems',
            title: '수집•이용 항목',
            lines: [
              '[개인식별번호]',
              '• 고유식별정보(주민등록번호, 외국인등록번호)',
            ],
          },
        ],
      },
      {
        key: 'safetyProvide',
        label: '고유식별정보 제공에 동의합니다.',
        heading: '제공에 관한 사항',
        itemKeys: ['safetyProvideDetails', 'safetyProvideItems'],
        items: [
          {
            key: 'safetyProvideDetails',
            title: '제공에 관한 사항',
            lines: [
              '제공받는 자',
              '• 종합신용정보집중기관 : 한국신용정보원',
              '',
              '제공받는 자의 이용목적',
              '• 조회기관의 요청에 따라 비대면 계좌개설 안심차단 등록 여부를 조회기관에 제공',
              '',
              '보유 및 이용기간',
              '• 제공받는 자의 이용 목적을 달성할 때까지 보유 • 이용됩니다. 이 경우 관련 법령상 보존기간을 따릅니다.',
            ],
          },
          {
            key: 'safetyProvideItems',
            title: '제공할 개인(신용)정보의 항목',
            lines: [
              '[개인식별번호]',
              '• 고유식별정보(주민등록번호, 외국인등록번호)',
            ],
          },
        ],
      },
      {
        key: 'safetyQueryPersonal',
        label: '개인(신용)정보를 조회하는 것에 동의합니다.',
        heading: '조회에 관한 사항',
        itemKeys: ['safetyQueryPersonalDetails', 'safetyQueryPersonalItems'],
        items: [
          {
            key: 'safetyQueryPersonalDetails',
            title: '조회에 관한 사항',
            lines: [
              '조회 대상 기관',
              '• 종합신용정보집중기관 : 한국신용정보원',
              '',
              '조회 목적',
              '• 비대면 계좌개설 안심차단 등록 여부 확인',
              '',
              '보유 및 이용기간',
              '• 거래종료일까지 조회 동의의 효력이 지속됩니다.',
              '• 거래종료일이란, 비대면 계좌개설 안심차단 등록 여부 조회를 완료한 시점을 의미합니다. 단, 관련 법령에 따른 의무를 이행해야 하는 경우 해당 법령상의 효력 기간을 따릅니다.',
            ],
          },
          {
            key: 'safetyQueryPersonalItems',
            title: '조회할 개인(신용)정보의 항목',
            lines: [
              '[개인식별번호]',
              '• 고유식별정보(주민등록번호, 외국인등록번호)',
              '[일반개인정보(성명)]',
              '[공공정보 등]',
              '• 금융거래 안심차단 신청내역 정보, 사망자 정보 등',
            ],
          },
        ],
      },
      {
        key: 'safetyQueryIdentifier',
        label: '고유식별정보를 조회하는 것에 동의합니다.',
        heading: '조회에 관한 사항',
        itemKeys: ['safetyQueryIdentifierDetails', 'safetyQueryIdentifierItems'],
        items: [
          {
            key: 'safetyQueryIdentifierDetails',
            title: '조회에 관한 사항',
            lines: [
              '조회 대상 기관',
              '• 종합신용정보집중기관 : 한국신용정보원',
              '',
              '조회 목적',
              '• 비대면 계좌개설 안심차단 등록 여부 확인',
              '',
              '보유 및 이용기간',
              '• 거래종료일까지 조회 동의의 효력이 지속됩니다.',
              '• 거래종료일이란, 비대면 계좌개설 안심차단 등록 여부 조회를 완료한 시점을 의미합니다. 단, 관련 법령에 따른 의무를 이행해야 하는 경우 해당 법령상의 효력 기간을 따릅니다.',
            ],
          },
          {
            key: 'safetyQueryIdentifierItems',
            title: '조회할 개인(신용)정보의 항목',
            lines: [
              '[개인식별번호]',
              '• 고유식별정보(주민등록번호, 외국인등록번호)',
              '[일반개인정보(성명)]',
              '[공공정보]',
              '• 금융거래 안심차단 신청내역 정보, 사망자 정보 등',
            ],
          },
        ],
      },
    ],
  },
]

export const FINANCE_KEYS = CONSENT_DOCUMENTS.find((doc) => doc.key === 'finance').groups.flatMap((g) => g.itemKeys)
export const SAFETY_KEYS  = CONSENT_DOCUMENTS.find((doc) => doc.key === 'safety').groups.flatMap((g) => g.itemKeys)
export const CONSENT_ALL_KEYS = [...FINANCE_KEYS, ...SAFETY_KEYS]

export const CONSENT_INITIAL_STATE = Object.fromEntries(
  CONSENT_ALL_KEYS.map((key) => [key, false])
)

function Checkbox({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange() }}
      className={[
        'w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0 transition-colors',
        checked ? 'bg-primary' : 'border-[1.5px] border-stroke-input bg-surface',
      ].join(' ')}
    >
      {checked && <Check className="w-[9px] h-[9px] text-white" strokeWidth={3.5} />}
    </button>
  )
}

function ItemRow({ itemKey, checked, onToggle, title, lines, expanded, onToggleExpand }) {
  return (
    <div className="border-t border-stroke-subtle">
      <div className="flex items-center gap-3 py-3">
        <Checkbox checked={checked} onChange={onToggle} />
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex-1 flex items-center justify-between gap-2 text-left"
        >
          <span className="text-[13px] text-foreground-secondary">{title}</span>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-foreground-disabled shrink-0" />
            : <ChevronDown className="w-3.5 h-3.5 text-foreground-disabled shrink-0" />}
        </button>
      </div>

      {expanded && (
        <div className="pb-3 pl-7 space-y-1">
          {lines.map((line, i) =>
            line === ''
              ? <div key={i} className="h-2" />
              : <p key={i} className="text-[12px] text-foreground-secondary leading-[1.8]">{line}</p>
          )}
        </div>
      )}
    </div>
  )
}

function GroupRow({ group, agreements, onAgreementsChange, expandedItems, onExpandItems }) {
  const groupChecked = group.itemKeys.every((key) => agreements[key])

  function toggleGroup() {
    const next = !groupChecked
    const updated = { ...agreements }
    group.itemKeys.forEach((key) => { updated[key] = next })
    onAgreementsChange(updated)
    if (next) onExpandItems(group.itemKeys)
  }

  return (
    <div className="border-t border-stroke">
      {group.heading && (
        <p className="text-[11px] font-semibold text-foreground-disabled pt-4 pb-1">{group.heading}</p>
      )}
      <label className="flex items-center gap-3 py-3.5 cursor-pointer select-none">
        <Checkbox checked={groupChecked} onChange={toggleGroup} />
        <span className="text-[14px] font-bold text-foreground">{group.label}</span>
      </label>

      <div className="pl-7">
        {group.items.map((item) => (
          <ItemRow
            key={item.key}
            itemKey={item.key}
            checked={!!agreements[item.key]}
            onToggle={() => {
              const next = !agreements[item.key]
              onAgreementsChange({ ...agreements, [item.key]: next })
              if (next) onExpandItems([item.key])
            }}
            title={item.title}
            lines={item.lines}
            expanded={!!expandedItems[item.key]}
            onToggleExpand={() => onExpandItems([item.key], 'toggle')}
          />
        ))}
      </div>
    </div>
  )
}

function DocumentSection({ doc, agreements, onAgreementsChange, expandedItems, onExpandItems }) {
  return (
    <div>
      <p className="text-[13px] font-bold text-foreground-secondary mb-1">{doc.title}</p>
      {doc.intro && (
        <p className="text-[11px] text-foreground-disabled leading-[1.75] mb-2">{doc.intro}</p>
      )}
      {doc.groups.map((group) => (
        <GroupRow
          key={group.key}
          group={group}
          agreements={agreements}
          onAgreementsChange={onAgreementsChange}
          expandedItems={expandedItems}
          onExpandItems={onExpandItems}
        />
      ))}
    </div>
  )
}

export default function ConsentStep({ agreements, onAgreementsChange, onBack, onSubmit, isLoading, error }) {
  const [expandedItems, setExpandedItems] = useState({})
  const allChecked = CONSENT_ALL_KEYS.every((key) => agreements[key])

  function handleExpandItems(keys, mode = 'open') {
    setExpandedItems((prev) => {
      const next = { ...prev }
      keys.forEach((key) => {
        next[key] = mode === 'toggle' ? !prev[key] : true
      })
      return next
    })
  }

  function toggleAll() {
    const next = !allChecked
    const updated = { ...agreements }
    CONSENT_ALL_KEYS.forEach((key) => { updated[key] = next })
    onAgreementsChange(updated)
    if (next) {
      const allExpanded = Object.fromEntries(CONSENT_ALL_KEYS.map((key) => [key, true]))
      setExpandedItems(allExpanded)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-1">개인(신용)정보 처리 동의서</h2>
        <p className="text-[13px] text-foreground-disabled leading-[1.8]">
          상위 동의 체크 시 하위 항목이 함께 선택됩니다.
        </p>
      </div>

      <div className="rounded-2xl border border-stroke bg-surface px-5 py-2 space-y-6">
        {CONSENT_DOCUMENTS.map((doc) => (
          <DocumentSection
            key={doc.key}
            doc={doc}
            agreements={agreements}
            onAgreementsChange={onAgreementsChange}
            expandedItems={expandedItems}
            onExpandItems={handleExpandItems}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={toggleAll}
        className="w-full mt-4 py-[12px] rounded-xl bg-primary text-white text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors"
      >
        모두 체크하기
      </button>

      {error && <p className="mt-4 text-[11px] text-up">{error}</p>}

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
          onClick={onSubmit}
          disabled={!allChecked || isLoading}
          className="flex-[1.3] py-[13px] rounded-xl bg-primary text-white text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? '처리 중...' : '동의하고 계좌 만들기'}
        </button>
      </div>
    </div>
  )
}
