import { useEffect, useRef, useState } from 'react'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { exchangeApi } from '@/api/exchange'

// ── 포맷 헬퍼 (ExchangeModal과 동일) ──────────────────────────────
function fmt(n) {
  return Math.round(Number(n ?? 0)).toLocaleString('ko-KR')
}

function fmtUsd(n, min = 0, max = 4) {
  return Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  })
}

function fmtRate(n) {
  return Number(n ?? 0).toLocaleString('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseAmount(str) {
  return Number(String(str).replace(/,/g, '')) || 0
}

function normalizeInputRaw(value, direction) {
  const sanitized = String(value ?? '').replace(/[^0-9.]/g, '')
  if (direction === 'KRW_TO_USD') return sanitized.replace(/\./g, '')
  const [int = '', ...decs] = sanitized.split('.')
  return decs.length > 0 ? `${int}.${decs.join('')}` : int
}

function getMaxInputRaw(balance, direction) {
  if (direction === 'KRW_TO_USD') return String(Math.floor(Number(balance ?? 0)))
  return normalizeInputRaw(String(balance ?? 0), direction)
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-disabled">{label}</span>
      <span className={bold ? 'font-bold text-foreground' : 'text-foreground-secondary'}>
        {value}
      </span>
    </div>
  )
}

const RESULT_DELAY_MS = 1400

/**
 * 채팅창 환전 카드 (ExchangeModal UI 기반)
 * @param {number} krwBalance  - 보유 원화 (availableAmount)
 * @param {number} usdBalance  - 보유 달러 (totalAmount)
 */
export default function ChatExchangeCard({ krwBalance, usdBalance }) {
  const queryClient = useQueryClient()

  const [dir, setDir] = useState('KRW_TO_USD')
  const [inputRaw, setInputRaw] = useState('')
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [done, setDone] = useState(null)

  const debounceRef = useRef(null)
  const resultTimerRef = useRef(null)

  useEffect(() => () => {
    clearTimeout(debounceRef.current)
    clearTimeout(resultTimerRef.current)
  }, [])

  const fromCurrency = dir === 'KRW_TO_USD' ? 'KRW' : 'USD'
  const toCurrency   = dir === 'KRW_TO_USD' ? 'USD' : 'KRW'
  const maxBalance   = dir === 'KRW_TO_USD' ? krwBalance : usdBalance
  const unit         = dir === 'KRW_TO_USD' ? '원' : '$'

  function requestPreview(raw, nextFrom = fromCurrency, nextTo = toCurrency) {
    setInputRaw(raw)
    setPreview(null)
    setPreviewError(null)
    clearTimeout(debounceRef.current)

    const amount = parseAmount(raw)
    if (amount <= 0) return

    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const data = await exchangeApi.getAvailable(nextFrom, nextTo, amount)
        setPreview(data)
      } catch {
        setPreviewError('환율 정보를 가져오지 못했습니다.')
      } finally {
        setPreviewLoading(false)
      }
    }, 400)
  }

  function handleInput(e) {
    requestPreview(normalizeInputRaw(e.target.value, dir))
  }

  function handleMax() {
    requestPreview(getMaxInputRaw(maxBalance, dir))
  }

  function handleDirChange(nextDir) {
    setDir(nextDir)
    setInputRaw('')
    setPreview(null)
    setPreviewError(null)
  }

  const { mutate: doExchange, isPending } = useMutation({
    mutationFn: () =>
      exchangeApi.exchange(fromCurrency, toCurrency, parseAmount(inputRaw)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio'] })
      setResultLoading(true)
      clearTimeout(resultTimerRef.current)
      resultTimerRef.current = setTimeout(() => {
        setResultLoading(false)
        setDone(data)
      }, RESULT_DELAY_MS)
    },
  })

  const amount = parseAmount(inputRaw)
  const canSubmit = amount > 0 && amount <= maxBalance && preview && !isPending && !resultLoading

  // ── 처리 중 화면 ───────────────────────────────────────────────
  if (resultLoading) {
    return (
      <div className="bg-surface border border-stroke rounded-2xl p-6 w-full flex flex-col items-center gap-3 min-h-[160px] justify-center">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <p className="text-[13px] font-bold text-foreground">환전 처리 중</p>
        <p className="text-[11px] text-foreground-disabled text-center leading-relaxed">
          환전 결과를 정리하고 있어요.<br />잠시만 기다려주세요.
        </p>
      </div>
    )
  }

  // ── 완료 화면 ─────────────────────────────────────────────────
  if (done) {
    const wasKrwToUsd = done.fromCurrency === 'KRW'
    return (
      <div className="bg-surface border border-stroke rounded-2xl p-4 w-full flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[9px] bg-primary flex items-center justify-center shadow-brand-glow-sm">
            <ArrowLeftRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-bold text-foreground">환전 완료</span>
        </div>
        <div className="flex flex-col gap-2 bg-surface-subtle rounded-xl p-3 text-[11px]">
          <Row
            label="환전 금액"
            value={wasKrwToUsd ? `${fmt(done.requestAmount)}원` : `$${fmtUsd(done.requestAmount)}`}
          />
          <Row label="적용 환율" value={`${fmtRate(done.appliedRate)}원/USD`} />
          <Row
            label="수수료 (1.75%)"
            value={wasKrwToUsd ? `${fmtRate(done.feeAmount)}원` : `$${fmtUsd(done.feeAmount, 0, 4)}`}
          />
          <Row
            label="수령 금액"
            value={wasKrwToUsd ? `$${fmtUsd(done.receiveAmount)}` : `${fmt(done.receiveAmount)}원`}
            bold
          />
        </div>
      </div>
    )
  }

  // ── 입력 화면 ─────────────────────────────────────────────────
  return (
    <div className="bg-surface border border-stroke rounded-2xl p-4 w-full flex flex-col gap-4">

      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-[9px] bg-primary flex items-center justify-center shadow-brand-glow-sm">
          <ArrowLeftRight className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-bold text-foreground">환전하기</span>
      </div>

      {/* 방향 탭 */}
      <div className="flex gap-2">
        {[
          { key: 'KRW_TO_USD', label: 'KRW → USD' },
          { key: 'USD_TO_KRW', label: 'USD → KRW' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleDirChange(key)}
            className={`flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-colors duration-150 ${
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
      <div>
        <div className="text-[10px] font-semibold text-foreground-disabled mb-1.5">환전 금액</div>
        <div className="flex items-center gap-2 border-[1.5px] border-stroke-input rounded-[10px] px-3 py-2.5 focus-within:border-primary focus-within:shadow-focus-ring transition-all">
          <input
            type="text"
            inputMode="numeric"
            value={inputRaw ? parseAmount(inputRaw).toLocaleString('ko-KR') : ''}
            onChange={handleInput}
            placeholder="0"
            className="flex-1 text-[16px] font-bold text-foreground bg-transparent outline-none placeholder:text-foreground-disabled"
          />
          <span className="text-[12px] text-foreground-disabled shrink-0">{unit}</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
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
      </div>

      {/* 프리뷰 로딩 */}
      {previewLoading && (
        <div className="flex items-center justify-center gap-2 py-3 bg-surface-subtle rounded-xl">
          <Loader2 className="w-3.5 h-3.5 text-foreground-disabled animate-spin" />
          <span className="text-[11px] text-foreground-disabled">환율 조회 중…</span>
        </div>
      )}

      {/* 프리뷰 에러 */}
      {previewError && (
        <p className="text-center text-[11px] text-down">{previewError}</p>
      )}

      {/* 프리뷰 상세 */}
      {preview && !previewLoading && (
        <div className="flex flex-col gap-2 bg-surface-subtle rounded-xl p-3 text-[11px]">
          <Row label="적용 환율" value={`${fmtRate(preview.exchangeRate)}원/USD`} />
          <Row
            label="수수료 (1.75%)"
            value={dir === 'KRW_TO_USD' ? `${fmtRate(preview.feeAmount)}원` : `$${fmtUsd(preview.feeAmount)}`}
          />
          <Row
            label="예상 수령액"
            value={dir === 'KRW_TO_USD' ? `$${fmtUsd(preview.estimatedReceiveAmount)}` : `${fmt(preview.estimatedReceiveAmount)}원`}
            bold
          />
        </div>
      )}

      {/* 환전 실행 */}
      <button
        disabled={!canSubmit}
        onClick={() => doExchange()}
        className="w-full py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold shadow-primary-btn hover:bg-primary-hover transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? '처리 중…' : '환전 실행'}
      </button>

    </div>
  )
}
