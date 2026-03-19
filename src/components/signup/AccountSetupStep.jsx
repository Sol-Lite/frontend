import { Controller } from 'react-hook-form'
import { ShieldCheck } from 'lucide-react'
import { PasswordInput } from '@/components/ui/Input'
import { INVESTMENT_TYPE_OPTIONS } from '@/components/signup/signupSchema'

function normalizePin(value) {
  return value.replace(/\D/g, '').slice(0, 4)
}

function InvestmentTypeCard({ selected, option, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={[
        'w-full rounded-2xl border px-4 py-4 text-left transition-all duration-[150ms]',
        selected
          ? 'border-primary bg-primary-light shadow-brand-glow'
          : 'border-stroke bg-surface hover:border-primary-border hover:bg-surface-subtle',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={['text-[14px] font-bold', selected ? 'text-primary' : 'text-foreground'].join(' ')}>
            {option.label}
          </p>
          <p className="mt-1 text-[12px] leading-[1.7] text-foreground-secondary">
            {option.description}
          </p>
        </div>
        <div
          className={[
            'mt-0.5 h-4 w-4 rounded-full border shrink-0 transition-colors',
            selected ? 'border-primary bg-primary' : 'border-stroke-input bg-surface',
          ].join(' ')}
        />
      </div>
    </button>
  )
}

export default function AccountSetupStep({
  control,
  fieldErrors,
  isLoading,
  error,
  onBack,
  onSubmit,
}) {
  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-1">계좌 설정</h2>
        <p className="text-[13px] text-foreground-disabled leading-[1.8]">
          계좌 비밀번호와 투자성향을 설정하면 계좌 개설이 완료됩니다.
        </p>
      </div>

      <div className="rounded-2xl border border-stroke bg-surface px-5 py-5">
        <div className="flex items-start gap-3 rounded-2xl border border-primary-border bg-primary-light px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-primary">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">계좌 비밀번호는 숫자 4자리입니다</p>
            <p className="mt-1 text-[12px] leading-[1.7] text-foreground-secondary">
              출금, 이체, 계좌 관련 주요 거래에서 사용할 비밀번호예요.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-[18px]">
          <Controller
            name="accountPin"
            control={control}
            render={({ field }) => (
              <PasswordInput
                label="계좌 비밀번호"
                required
                placeholder="숫자 4자리를 입력하세요"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                {...field}
                onChange={(e) => field.onChange(normalizePin(e.target.value))}
              />
            )}
          />
          {fieldErrors.accountPin && <p className="-mt-3 text-[11px] text-up">{fieldErrors.accountPin}</p>}

          <Controller
            name="accountPinConfirm"
            control={control}
            render={({ field }) => (
              <PasswordInput
                label="계좌 비밀번호 확인"
                required
                placeholder="계좌 비밀번호를 다시 입력하세요"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                {...field}
                onChange={(e) => field.onChange(normalizePin(e.target.value))}
              />
            )}
          />
          {fieldErrors.accountPinConfirm && <p className="-mt-3 text-[11px] text-up">{fieldErrors.accountPinConfirm}</p>}

          <div>
            <label className="block text-[11px] font-semibold text-foreground-secondary mb-2">
              투자성향 <span className="text-up">*</span>
            </label>
            <Controller
              name="investmentType"
              control={control}
              render={({ field }) => (
                <div className="grid gap-3">
                  {INVESTMENT_TYPE_OPTIONS.map((option) => (
                    <InvestmentTypeCard
                      key={option.value}
                      option={option}
                      selected={field.value === option.value}
                      onSelect={field.onChange}
                    />
                  ))}
                </div>
              )}
            />
            {fieldErrors.investmentType && <p className="mt-2 text-[11px] text-up">{fieldErrors.investmentType}</p>}
          </div>
        </div>
      </div>

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
          disabled={isLoading}
          className="flex-[1.3] py-[13px] rounded-xl bg-primary text-white text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? '계좌 개설 중...' : '계좌 만들기'}
        </button>
      </div>
    </div>
  )
}
