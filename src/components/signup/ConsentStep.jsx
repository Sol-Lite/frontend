import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { CONSENT_ALL_KEYS, CONSENT_DOCUMENTS } from '@/components/signup/consentData'

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

function ItemRow({ checked, onToggle, title, lines, expanded, onToggleExpand }) {
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
    <div className="pt-6 border-t border-stroke-subtle">
      <p className="text-[13px] font-bold text-foreground mb-3">{doc.title}</p>
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

export default function ConsentStep({
  agreements,
  onAgreementsChange,
  onBack,
  onSubmit,
  isLoading,
  error,
  submitLabel = '동의하고 계좌 만들기',
}) {
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
          {isLoading ? '처리 중...' : submitLabel}
        </button>
      </div>
    </div>
  )
}
