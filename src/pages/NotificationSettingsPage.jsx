import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { notificationApi } from '@/api/notification'
import useAuthStore from '@/store/useAuthStore'

const THRESHOLD_OPTIONS = [1, 3, 5, 10, 15, 20]

const TOGGLE_ITEMS = [
  { key: 'priceAlertEnabled', label: '가격 변동 알림', desc: '설정한 기준 이상 가격 변동 시 알림' },
  { key: 'executionAlertEnabled', label: '체결 알림', desc: '매수/매도 주문 체결 시 알림' },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-stroke-input'}`}
    >
      <span
        className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}
      />
    </button>
  )
}

export default function NotificationSettingsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const [settings, setSettings] = useState({
    priceAlertEnabled: true,
    executionAlertEnabled: true,
    defaultThresholdPercent: 5,
  })
  const [isCustom, setIsCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [allOffWarning, setAllOffWarning] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const savedTimerRef = useRef(null)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    return () => clearTimeout(savedTimerRef.current)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true })
      return
    }
    notificationApi.getSettings()
      .then((data) => {
        const threshold = parseFloat(data.defaultThresholdPercent)
        setSettings({
          priceAlertEnabled: data.priceAlertEnabled,
          executionAlertEnabled: data.executionAlertEnabled,
          defaultThresholdPercent: threshold,
        })
        if (!THRESHOLD_OPTIONS.includes(threshold)) {
          setIsCustom(true)
          setCustomValue(String(data.defaultThresholdPercent))
        }
      })
      .catch((err) => {
        console.warn('[Notification] 설정 조회 실패:', err?.message)
        setLoadError(true)
      })
  }, [isAuthenticated, navigate])

  function handleToggle(key) {
    const next = { ...settings, [key]: !settings[key] }
    const anyOn = next.priceAlertEnabled || next.executionAlertEnabled
    setAllOffWarning(!anyOn)
    setSettings(next)
  }

  function selectThreshold(val) {
    setIsCustom(false)
    setSaveError('')
    setSettings((s) => ({ ...s, defaultThresholdPercent: val }))
  }

  function handleCustomChange(val) {
    setCustomValue(val)
    setSettings((s) => ({ ...s, defaultThresholdPercent: parseFloat(val) || 0 }))
  }

  async function handleSave() {
    const percent = settings.defaultThresholdPercent
    if (!percent || percent < 0.01 || percent > 99.99) {
      setSaveError('유효한 범위를 입력해주세요 (0.01 ~ 99.99)')
      return
    }
    setSaveError('')
    setSaving(true)
    try {
      await notificationApi.updateSettings({
        priceAlertEnabled: settings.priceAlertEnabled,
        executionAlertEnabled: settings.executionAlertEnabled,
        defaultThresholdPercent: percent,
      })
      setSaved(true)
      clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.warn('[Notification] 설정 저장 실패:', err?.message)
      setSaveError('설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} aria-label="뒤로" className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground-secondary" strokeWidth={2} />
          </button>
          <h1 className="text-[18px] font-bold text-foreground">알림 설정</h1>
        </div>
        <div className="bg-surface rounded-xl border border-stroke px-4 py-10 text-center">
          <p className="text-[13px] text-foreground-secondary">설정을 불러오지 못했습니다.</p>
          <button
            onClick={() => { setLoadError(false); navigate(0) }}
            className="mt-3 text-[13px] text-primary hover:underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 상단 */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          aria-label="뒤로"
          className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground-secondary" strokeWidth={2} />
        </button>
        <h1 className="text-[18px] font-bold text-foreground">알림 설정</h1>
      </div>

      {/* 알림 유형별 토글 */}
      <section className="bg-surface rounded-xl border border-stroke overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-stroke-subtle">
          <p className="text-[13px] font-semibold text-foreground">알림 유형</p>
        </div>
        {TOGGLE_ITEMS.map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between px-4 py-3.5 border-b border-stroke-subtle last:border-0"
          >
            <div>
              <p className="text-[13px] font-medium text-foreground">{label}</p>
              <p className="text-[12px] text-foreground-tertiary mt-0.5">{desc}</p>
            </div>
            <Toggle checked={settings[key]} onChange={() => handleToggle(key)} />
          </div>
        ))}
      </section>

      {allOffWarning && (
        <p className="text-[12px] text-warning mb-4 px-1">
          모든 알림이 비활성화됩니다. 최소 하나 이상 켜두는 것을 권장합니다.
        </p>
      )}

      {/* 가격 변동 알림 기준 */}
      <section className="bg-surface rounded-xl border border-stroke overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-stroke-subtle">
          <p className="text-[13px] font-semibold text-foreground">관심 종목 가격 변동 알림 기준</p>
          <p className="text-[12px] text-foreground-tertiary mt-0.5">
            전일 대비 변동률이 해당 값 이상일 때 알림을 받습니다
          </p>
        </div>
        <div className="px-4 py-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {THRESHOLD_OPTIONS.map((opt) => {
              const selected = !isCustom && settings.defaultThresholdPercent === opt
              return (
                <button
                  key={opt}
                  onClick={() => selectThreshold(opt)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'border-stroke-input text-foreground-secondary hover:border-primary hover:text-primary hover:bg-primary-light'
                  }`}
                >
                  ±{opt}%
                </button>
              )
            })}
            <button
              onClick={() => { setIsCustom(true); setCustomValue(String(settings.defaultThresholdPercent)) }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                isCustom
                  ? 'bg-primary text-white border-primary'
                  : 'border-stroke-input text-foreground-secondary hover:border-primary hover:text-primary hover:bg-primary-light'
              }`}
            >
              직접 입력
            </button>
          </div>

          {isCustom && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customValue}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="예: 7.5"
                min="0.01"
                max="99.99"
                step="0.01"
                className="w-36 px-3 py-2 rounded-lg border border-stroke-input text-[13px] text-foreground placeholder:text-foreground-disabled focus:outline-none focus:border-primary"
              />
              <span className="text-[13px] text-foreground-secondary">%</span>
            </div>
          )}

          {saveError && (
            <p className="text-[12px] text-danger mt-2">{saveError}</p>
          )}
        </div>
      </section>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-primary text-white text-[14px] font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 shadow-primary-btn"
      >
        {saved ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" strokeWidth={2.5} />
            저장 완료
          </span>
        ) : saving ? '저장 중…' : '설정 저장'}
      </button>
    </div>
  )
}
