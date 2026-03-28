import { useState } from 'react'
import { X } from 'lucide-react'

const ALL_INDICES = [
  { code: '001',      label: 'KOSPI' },
  { code: '301',      label: 'KOSDAQ' },
  { code: 'NAS@IXIC', label: 'NASDAQ' },
  { code: 'SPI@SPX',  label: 'S&P 500' },
]

const VARIANT_MAX = {
  'index-sm':   1,
  'index-wide': 2,
  'index-3x1':  3,
  'index-2x2':  3,
}

export default function IndexConfigModal({ variant, currentIndices, onSave, onClose }) {
  const max = VARIANT_MAX[variant] ?? 3
  const [selected, setSelected] = useState(currentIndices)

  function toggle(code) {
    setSelected((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code)
      }
      if (prev.length >= max) return prev
      return [...prev, code]
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-[280px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-bold text-foreground">표시할 지수 선택</span>
          <button onClick={onClose} className="text-foreground-disabled hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-foreground-disabled mb-3">
          최대 {max}개 선택 가능
        </p>

        <div className="flex flex-col gap-2 mb-5">
          {ALL_INDICES.map(({ code, label }) => {
            const isChecked = selected.includes(code)
            const isDisabled = !isChecked && selected.length >= max
            return (
              <label
                key={code}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-primary-light border border-primary-border'
                    : isDisabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'bg-background hover:bg-surface-subtle border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => toggle(code)}
                  className="accent-primary w-3.5 h-3.5"
                />
                <span className={`text-[12px] font-semibold ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                  {label}
                </span>
              </label>
            )
          })}
        </div>

        <button
          disabled={selected.length === 0}
          onClick={() => onSave(selected)}
          className="w-full py-2 rounded-xl bg-primary text-white text-[12px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          저장
        </button>
      </div>
    </div>
  )
}
