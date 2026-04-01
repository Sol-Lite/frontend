import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ArrowLeftRight, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { exchangeApi } from '@/api/exchange'
import SplashScreenFill from '@/components/ui/SplashScreenFill'

const EXCHANGE_RESULT_DELAY_MS = 1400

function fmt(n) {
  return Math.round(Number(n ?? 0)).toLocaleString('ko-KR')
}

function fmtUsd(n, minimumFractionDigits = 0, maximumFractionDigits = 4) {
  return Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  })
}

function fmtRate(n) {
  return Number(n ?? 0).toLocaleString('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseAmount(str) {
  return Number(str.replace(/,/g, '')) || 0
}

function normalizeInputRaw(value, direction) {
  const sanitized = String(value ?? '').replace(/[^0-9.]/g, '')

  if (direction === 'KRW_TO_USD') {
    return sanitized.replace(/\./g, '')
  }

  const [integerPart = '', ...decimalParts] = sanitized.split('.')
  return decimalParts.length > 0
    ? `${integerPart}.${decimalParts.join('')}`
    : integerPart
}

function getMaxInputRaw(balance, direction) {
  if (direction === 'KRW_TO_USD') {
    return String(Math.floor(Number(balance ?? 0)))
  }

  return normalizeInputRaw(String(balance ?? 0), direction)
}

export default function ExchangeModal({ onClose, krwBalance, usdBalance }) {
  const queryClient = useQueryClient()

  const [dir, setDir] = useState('KRW_TO_USD') // 'KRW_TO_USD' | 'USD_TO_KRW'
  const [inputRaw, setInputRaw] = useState('')   // 콤마 없는 숫자 문자열
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [done, setDone] = useState(null)         // 완료된 ExchangeResponse

  const debounceRef = useRef(null)
  const resultTimerRef = useRef(null)

  const fromCurrency = dir === 'KRW_TO_USD' ? 'KRW' : 'USD'
  const toCurrency   = dir === 'KRW_TO_USD' ? 'USD' : 'KRW'
  const maxBalance   = dir === 'KRW_TO_USD' ? krwBalance : usdBalance
  const unit         = dir === 'KRW_TO_USD' ? '원' : '$'

  useEffect(() => () => {
    clearTimeout(debounceRef.current)
    clearTimeout(resultTimerRef.current)
  }, [])

  function requestPreview(raw, nextFromCurrency = fromCurrency, nextToCurrency = toCurrency) {
    setInputRaw(raw)
    setPreview(null)
    setPreviewError(null)

    clearTimeout(debounceRef.current)
    const amount = parseAmount(raw)
    if (amount <= 0) return

    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const data = await exchangeApi.getAvailable(nextFromCurrency, nextToCurrency, amount)
        setPreview(data)
      } catch {
        setPreviewError('환율 정보를 가져오지 못했습니다.')
      } finally {
        setPreviewLoading(false)
      }
    }, 400)
  }

  // 금액 입력 → 디바운스 후 프리뷰
  function handleInput(e) {
    requestPreview(normalizeInputRaw(e.target.value, dir))
  }

  // 전액 입력
  function handleMax() {
    requestPreview(getMaxInputRaw(maxBalance, dir))
  }

  // 환전 실행
  const { mutate: doExchange, isPending } = useMutation({
    mutationFn: () =>
      exchangeApi.exchange(fromCurrency, toCurrency, parseAmount(inputRaw)),
    onSuccess: (data) => {
      // 잔고 관련 쿼리 갱신
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      setResultLoading(true)
      clearTimeout(resultTimerRef.current)
      resultTimerRef.current = setTimeout(() => {
        setResultLoading(false)
        setDone(data)
      }, EXCHANGE_RESULT_DELAY_MS)
    },
  })

  const amount = parseAmount(inputRaw)
  const canSubmit = amount > 0 && amount <= maxBalance && preview && !isPending && !resultLoading

  if (resultLoading) {
    return (
      <Overlay onClose={onClose}>
        <div className="px-6 py-8 text-center min-h-[260px] flex flex-col items-center justify-center">
          <div className="mb-6">
            <SplashScreenFill inline animated />
          </div>
          <h2 className="text-lg font-extrabold text-foreground tracking-tight mb-1">환전 처리 중</h2>
          <p className="text-[13px] text-foreground-disabled leading-[1.8]">
            환전 결과를 정리하고 있어요.<br />
            잠시만 기다려주세요.
          </p>
        </div>
      </Overlay>
    )
  }

  // ── 완료 화면 ─────────────────────────────────────────────────
  if (done) {
    const isKrwToUsd = done.fromCurrency === 'KRW'
    return (
      <Overlay onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="text-center">
            <div className="text-[15px] font-bold text-foreground">환전 완료</div>
            <div className="text-[12px] text-foreground-disabled mt-1">
              {isKrwToUsd
                ? `${fmt(done.requestAmount)}원 → $${fmtUsd(done.receiveAmount)}`
                : `$${fmtUsd(done.requestAmount)} → ${fmt(done.receiveAmount)}원`}
            </div>
          </div>
          <div className="w-full flex flex-col gap-2 bg-surface-subtle rounded-xl p-3 text-[11px]">
            <Row label="적용 환율" value={`${fmtRate(done.appliedRate)}원/USD`} />
            <Row label="수수료 (1.75%)" value={isKrwToUsd ? `${fmtRate(done.feeAmount)}원` : `$${fmtUsd(done.feeAmount, 0, 4)}`} />
            <Row label="수령 금액" value={isKrwToUsd ? `$${fmtUsd(done.receiveAmount)}` : `${fmt(done.receiveAmount)}원`} bold />
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
            onClick={() => {
              setDir(key)
              setInputRaw('')
              setPreview(null)
              setPreviewError(null)
            }}
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
          보유 {fromCurrency}: {dir === 'KRW_TO_USD' ? `${fmt(maxBalance)}원` : `$${fmtUsd(maxBalance)}`}
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
          <Row label="적용 환율" value={`${fmtRate(preview.exchangeRate)}원/USD`} />
          <Row
            label="수수료 (1.75%)"
            value={dir === 'KRW_TO_USD'
              ? `${fmtRate(preview.feeAmount)}원`
              : `$${fmtUsd(preview.feeAmount)}`}
          />
          <Row
            label="예상 수령액"
            value={dir === 'KRW_TO_USD'
              ? `$${fmtUsd(preview.estimatedReceiveAmount)}`
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
  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center p-5 bg-transparent"
      onClick={onClose}
    >
      {/* 모달 */}
      <div
        className="relative w-[380px] bg-surface rounded-2xl shadow-modal p-6 animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[9px] bg-primary flex items-center justify-center shadow-brand-glow">
              <ArrowLeftRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-bold text-foreground">환전하기</span>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1 text-foreground-disabled hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
