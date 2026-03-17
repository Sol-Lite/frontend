import { Controller } from 'react-hook-form'
import { CheckCircle, Mail } from 'lucide-react'
import { formatPhoneNumber } from '@/components/signup/phoneNumber'
import { Input, PasswordInput } from '@/components/ui/Input'
import { getPasswordChecks } from '@/components/signup/passwordValidation'

const PASSWORD_RULES = [
  { key: 'length', label: '최소 8자 이상' },
  { key: 'letter', label: '영문 포함' },
  { key: 'number', label: '숫자 포함' },
  { key: 'special', label: '특수문자 포함' },
]

function PasswordRules({ checks }) {
  return (
    <div className="mt-[7px] bg-surface-subtle rounded-[10px] px-3 py-2.5 grid grid-cols-2 gap-x-3 gap-y-[5px]">
      {PASSWORD_RULES.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-[5px] text-[11px]">
          <div className={['w-1 h-1 rounded-full shrink-0', checks[key] ? 'bg-live' : 'bg-stroke-input'].join(' ')} />
          <span className={checks[key] ? 'text-live' : 'text-foreground-disabled'}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function BasicInfoStep({
  control,
  password,
  isSending,
  sendDone,
  emailVerified,
  verifyHighlight,
  error,
  fieldErrors,
  onEmailInputChange,
  onBack,
  onSendVerifyEmail,
  onNext,
}) {
  const passwordChecks = getPasswordChecks(password)

  return (
    <>
      <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-1">기본 정보 입력</h2>
      <p className="text-[13px] text-foreground-disabled mb-7">증권종합 계좌 개설에 필요한 기본 정보를 입력해 주세요.</p>

      <div className="flex flex-col gap-[18px]">
        <div>
          <label className="block text-[11px] font-semibold text-foreground-secondary mb-1.5">
            이메일 <span className="text-up">*</span>
          </label>
          <div className="flex gap-2">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  placeholder="example@domain.com"
                  onChange={(e) => {
                    field.onChange(e)
                    onEmailInputChange(e)
                  }}
                  className="flex-1 px-3.5 py-[11px] border-[1.5px] border-stroke-input rounded-[10px] text-sm text-foreground bg-surface outline-none transition-[border-color,box-shadow] duration-[200ms] focus:border-primary focus:shadow-focus-ring placeholder:text-foreground-disabled"
                />
              )}
            />
            <button
              type="button"
              onClick={onSendVerifyEmail}
              disabled={isSending || emailVerified}
              className="px-4 bg-surface-muted border-[1.5px] border-stroke-input rounded-[10px] text-xs font-semibold text-foreground-secondary whitespace-nowrap hover:bg-stroke-subtle transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSending ? '발송 중...' : emailVerified ? '인증 완료' : sendDone ? '재발송' : '인증 발송'}
            </button>
          </div>
          {fieldErrors.email && <p className="mt-1.5 text-[11px] text-up">{fieldErrors.email}</p>}

          {sendDone && !emailVerified && (
            <div
              className={[
                'mt-2 flex items-start gap-2.5 rounded-[10px] px-3 py-2.5 border transition-colors duration-[200ms]',
                verifyHighlight ? 'bg-primary-light border-primary' : 'bg-surface-subtle border-stroke-input',
              ].join(' ')}
            >
              <Mail className={['w-3.5 h-3.5 mt-px shrink-0', verifyHighlight ? 'text-primary' : 'text-foreground-disabled'].join(' ')} />
              <div>
                <p className={['text-[11px] font-semibold', verifyHighlight ? 'text-primary' : 'text-foreground-secondary'].join(' ')}>
                  인증 메일이 발송되었습니다
                </p>
                <p className="text-[11px] text-foreground-disabled mt-0.5">
                  메일함에서 인증 링크를 클릭해 주세요. (30분 유효)
                </p>
              </div>
            </div>
          )}

          {emailVerified && (
            <div className="mt-2 flex items-center gap-2 bg-surface-subtle rounded-[10px] px-3 py-2.5 border border-stroke-input">
              <CheckCircle className="w-3.5 h-3.5 text-live shrink-0" />
              <span className="text-[11px] font-semibold text-live">이메일 인증이 완료되었습니다.</span>
            </div>
          )}
        </div>

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input label="이름" required type="text" placeholder="이름을 입력하세요" {...field} />
          )}
        />
        {fieldErrors.name && <p className="-mt-3 text-[11px] text-up">{fieldErrors.name}</p>}

        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Input
              label="휴대폰 번호"
              type="tel"
              placeholder="010-0000-0000"
              {...field}
              onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
            />
          )}
        />
        {fieldErrors.phone && <p className="-mt-3 text-[11px] text-up">{fieldErrors.phone}</p>}

        <div>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordInput label="비밀번호" required placeholder="비밀번호를 입력하세요" {...field} />
            )}
          />
          <PasswordRules checks={passwordChecks} />
          {fieldErrors.password && <p className="mt-1.5 text-[11px] text-up">{fieldErrors.password}</p>}
        </div>

        <Controller
          name="passwordConfirm"
          control={control}
          render={({ field }) => (
            <PasswordInput
              label="비밀번호 확인"
              required
              placeholder="비밀번호를 다시 입력하세요"
              {...field}
            />
          )}
        />
        {fieldErrors.passwordConfirm && <p className="-mt-3 text-[11px] text-up">{fieldErrors.passwordConfirm}</p>}

        {error && <p className="text-[11px] text-up">{error}</p>}

        <div className="flex gap-3 mt-1">
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
            className="flex-[1.3] py-[13px] bg-primary text-white border-none rounded-xl text-sm font-bold shadow-primary-btn hover:bg-primary-hover transition-colors duration-[150ms]"
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </>
  )
}
