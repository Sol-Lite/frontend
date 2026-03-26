import { useState, useEffect, useRef } from 'react'
import { X, ArrowLeftRight, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { exchangeApi } from '@/api/exchange'

function fmt(n) {
  return Math.round(Number(n ?? 0)).toLocaleString('ko-KR')
}

function parseAmount(str) {
  return Number(str.replace(/,/g, '')) || 0
}

export default function ExchangeModal({ onClose, krwBalance, usdBalance }) {
  const queryClient = useQueryClient()

  const [dir, setDir] = useState('KRW_TO_USD') // 'KRW_TO_USD' | 'USD_TO_KRW'
  const [inputRaw, setInputRaw] = useState('')   // 콤마 없는 숫자 문자열
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [done, setDone] = useState(null)         // 완료된 ExchangeResponse

  const debounceRef = useRef(null)

  const fromCurrency = dir === 'KRW_TO_USD' ? 'KRW' : 'USD'
  const toCurrency   = dir === 'KRW_TO_USD' ? 'USD' : 'KRW'
  const maxBalance   = dir === 'KRW_TO_USD' ? krwBalance : usdBalance
  const unit         = dir === 'KRW_TO_USD' ? '원' : '$'

  // 방향 전환 시 입력·프리뷰 초기화
  function toggleDir() {
    setDir((d) => d === 'KRW_TO_USD' ? 'USD_TO_KRW' : 'KRW_TO_USD')
    setInputRaw('')
    setPreview(null)
    setPreviewError(null)
  }

  // 금액 입력 → 디바운스 후 프리뷰
  function handleInput(e) {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    setInputRaw(raw)
    setPreview(null)
    setPreviewError(null)

    clearTimeout(debounceRef.current)
    const amount = parseAmount(raw)
    if (amount <= 0) return

    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const data = await exchangeApi.getAvailable(fromCurrency, toCurrency, amount)
        setPreview(data)
      } catch {
        setPreviewError('환율 정보를 가져오지 못했습니다.')
      } finally {
        setPreviewLoading(false)
      }
    }, 400)
  }

  // 전액 입력
  function handleMax() {
    setInputRaw(String(maxBalance))
  }

  // 환전 실행
  const { mutate: doExchange, isPending } = useMutation({
    mutationFn: () =>
      exchangeApi.exchange(fromCurrency, toCurrency, parseAmount(inputRaw)),
    onSuccess: (data) => {
      // 잔고 관련 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      setDone(data)
    },
  })

  const amount = parseAmount(inputRaw)
  const canSubmit = amount > 0 && amount <= maxBalance && preview && !isPending

  // ── 완료 화면 ─────────────────────────────────────────────────
  if (done) {
    const isKrwToUsd = done.fromCurrency === 'KRW'
    return (
      <Overlay onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-full bg-live/10 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-live" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <div className="text-[15px] font-bold text-foreground">환전 완료</div>
            <div className="text-[12px] text-foreground-disabled mt-1">
              {isKrwToUsd
                ? `${fmt(done.requestAmount)}원 → $${fmt(done.receiveAmount)}`
                : `$${fmt(done.requestAmount)} → ${fmt(done.receiveAmount)}원`}
            </div>
          </div>
          <div className="w-full flex flex-col gap-2 bg-surface-subtle rounded-xl p-3 text-[11px]">
            <Row label="적용 환율" value={`${fmt(done.appliedRate)}원/USD`} />
            <Row label="수수료" value={isKrwToUsd ? `${fmt(done.feeAmount)}원` : `$${fmt(done.feeAmount)}`} />
            <Row label="수령 금액" value={isKrwToUsd ? `$${fmt(done.receiveAmount)}` : `${fmt(done.receiveAmount)}원`} bold />
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors"
          >
            확인
          </button>
        </div>
      </Overlay>
    )
  }

  // ── 입력 화면 ─────────────────────────────────────────────────
  return (
    <Overlay onClose={onClose}>
      {/* 방향 선택 */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'KRW_TO_USD', label: 'KRW → USD' },
          { key: 'USD_TO_KRW', label: 'USD → KRW' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setDir(key); setInputRaw(''); setPreview(null) }}
            className={`flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-colors ${
              dir === key
                ? 'border-primary bg-primary-light text-primary'
                : 'border-stroke bg-surface text-foreground-disabled hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 금액 입력 */}
      <div className="mb-1">
        <div className="text-[10px] font-semibold text-foreground-disabled mb-1.5">환전 금액</div>
        <div className="flex items-center gap-2 border-[1.5px] border-stroke-input rounded-[10px] px-3 py-2.5 focus-within:border-primary focus-within:shadow-focus-ring transition-all">
          <input
            type="text"
            inputMode="numeric"
            value={inputRaw ? Number(inputRaw.replace(/,/g, '')).toLocaleString('ko-KR') : ''}
            onChange={handleInput}
            placeholder="0"
            className="flex-1 text-[16px] font-bold text-foreground bg-transparent outline-none placeholder:text-foreground-disabled"
          />
          <span className="text-[12px] text-foreground-disabled shrink-0">{unit}</span>
        </div>
      </div>

      {/* 보유 잔고 + 전액 버튼 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] text-foreground-disabled">
          보유 {fromCurrency}: {dir === 'KRW_TO_USD' ? `${fmt(maxBalance)}원` : `$${fmt(maxBalance)}`}
        </span>
        <button
          onClick={handleMax}
          className="text-[10px] font-semibold text-primary hover:underline"
        >
          전액
        </button>
      </div>

      {/* 프리뷰 */}
      {previewLoading && (
        <div className="flex items-center justify-center gap-2 py-3 mb-3 bg-surface-subtle rounded-xl">
          <Loader2 className="w-3.5 h-3.5 text-foreground-disabled animate-spin" />
          <span className="text-[11px] text-foreground-disabled">환율 조회 중…</span>
        </div>
      )}
      {previewError && (
        <div className="py-2 mb-3 text-center text-[11px] text-down">{previewError}</div>
      )}
      {preview && !previewLoading && (
        <div className="flex flex-col gap-2 bg-surface-subtle rounded-xl p-3 mb-4 text-[11px]">
          <Row label="적용 환율" value={`${fmt(preview.exchangeRate)}원/USD`} />
          <Row
            label="예상 수령액"
            value={dir === 'KRW_TO_USD'
              ? `$${Number(preview.estimatedReceiveAmount).toFixed(2)}`
              : `${fmt(preview.estimatedReceiveAmount)}원`}
            bold
          />
        </div>
      )}

      {/* 실행 버튼 */}
      <button
        disabled={!canSubmit}
        onClick={() => doExchange()}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold shadow-primary-btn hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? '처리 중…' : '환전 실행'}
      </button>
    </Overlay>
  )
}

// ── 공통 헬퍼 ─────────────────────────────────────────────────────
function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-disabled">{label}</span>
      <span className={`${bold ? 'font-bold text-foreground' : 'text-foreground-secondary'}`}>{value}</span>
    </div>
  )
}

function Overlay({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 딤 배경 */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* 모달 */}
      <div className="relative z-10 w-[380px] bg-surface rounded-2xl shadow-modal p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[9px] bg-primary flex items-center justify-center shadow-brand-glow">
              <ArrowLeftRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold text-foreground">환전하기</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-foreground-disabled hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
