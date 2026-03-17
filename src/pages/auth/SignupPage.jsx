import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import AccountStep from '@/components/signup/AccountStep'
import AccountIntroStep from '@/components/signup/AccountIntroStep'
import BasicInfoStep from '@/components/signup/BasicInfoStep'
import BrandPanel from '@/components/signup/BrandPanel'
import PreOpenCheckStep from '@/components/signup/PreOpenCheckStep'
import ConsentStep, { CONSENT_INITIAL_STATE, FINANCE_KEYS, SAFETY_KEYS } from '@/components/signup/ConsentStep'
import StepIndicator from '@/components/signup/StepIndicator'
import { signupBasicInfoDefaultValues, signupBasicInfoSchema } from '@/components/signup/signupSchema'
import { authApi } from '@/api/auth'
import useEmailVerification from '@/hooks/useEmailVerification'

const INDICATOR_STEPS = ['계좌개설', '기본정보', '계좌설정']
const STEP_TO_INDICATOR = [0, 1, 1, 1, 2]

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const basicInfoForm = useForm({
    resolver: zodResolver(signupBasicInfoSchema),
    mode: 'onChange',
    defaultValues: signupBasicInfoDefaultValues,
  })
  const {
    control,
    clearErrors,
    handleSubmit,
    setError: setFieldError,
    trigger,
    watch,
    formState: { errors },
  } = basicInfoForm
  const email = watch('email')
  const name = watch('name')
  const phone = watch('phone')
  const password = watch('password')
  const passwordConfirm = watch('passwordConfirm')

  const [agreements, setAgreements] = useState(CONSENT_INITIAL_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState('')
  const [emailCheckError, setEmailCheckError] = useState('')
  const [verifyHighlight, setVerifyHighlight] = useState(false)
  const { isSending, sendDone, emailVerified, resetVerification, sendVerifyEmail } = useEmailVerification(email, {
    onError: setError,
  })

  function handleEmailChange() {
    clearErrors('email')
    setError('')
    setEmailCheckError('')
    if (sendDone) {
      resetVerification()
    }
  }

  async function handleSendVerifyEmail() {
    const isEmailValid = await trigger('email')
    if (!isEmailValid) return

    clearErrors('email')
    setError('')
    setEmailCheckError('')

    const result = await sendVerifyEmail()
    if (result.ok) return

    if (result.error?.code === 'DUPLICATE_EMAIL') {
      const message = result.error.message ?? '이미 등록된 이메일입니다'
      setEmailCheckError(message)
      setFieldError('email', {
        type: 'server',
        message,
      })
      return
    }

    setError(result.error?.message ?? '인증 메일 발송에 실패했습니다.')
  }

  function handleBasicInfoStep() {
    handleSubmit(() => {
      setError('')
      setVerifyHighlight(false)

      if (emailCheckError) {
        setFieldError('email', {
          type: 'server',
          message: emailCheckError,
        })
        return
      }

      if (!emailVerified) {
        setVerifyHighlight(true)
        if (!sendDone) {
          setError('이메일 인증 발송을 먼저 해주세요.')
        } else {
          setError('메일함에서 인증 링크를 클릭한 후 다시 시도해 주세요.')
        }
        return
      }

      setStep(2)
    }, () => {
      setError('')
      setVerifyHighlight(false)
    })()
  }

  async function handleSignup() {
    setError('')
    setIsLoading(true)
    try {
      const serviceTermsAgreed = FINANCE_KEYS.every((key) => agreements[key])
      const privacyTermsAgreed = SAFETY_KEYS.every((key) => agreements[key])

      await authApi.signup({
        email,
        password,
        passwordConfirm,
        name,
        phone: phone || null,
        serviceTermsAgreed,
        privacyTermsAgreed,
      })
      setStep(4)
    } catch (err) {
      setError(err?.message ?? '회원가입에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <BrandPanel />

      <div className="flex-1 bg-surface flex flex-col overflow-y-auto">
        <div className="max-w-[560px] w-full mx-auto px-8 py-11">
          <StepIndicator current={STEP_TO_INDICATOR[step]} steps={INDICATOR_STEPS} />

          {step === 0 && (
            <AccountIntroStep onNext={() => setStep(1)} />
          )}

          {step === 1 && (
            <BasicInfoStep
              password={password}
              control={control}
              isSending={isSending}
              sendDone={sendDone}
              emailVerified={emailVerified}
              verifyHighlight={verifyHighlight}
              error={error}
              fieldErrors={{
                email: errors.email?.message,
                name: errors.name?.message,
                phone: errors.phone?.message,
                password: errors.password?.message,
                passwordConfirm: errors.passwordConfirm?.message,
              }}
              onEmailInputChange={handleEmailChange}
              onBack={() => setStep(0)}
              onSendVerifyEmail={handleSendVerifyEmail}
              onNext={handleBasicInfoStep}
            />
          )}

          {step === 2 && (
            <PreOpenCheckStep
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <ConsentStep
              agreements={agreements}
              onAgreementsChange={setAgreements}
              onBack={() => setStep(2)}
              onSubmit={handleSignup}
              isLoading={isLoading}
              error={error}
            />
          )}

          {step === 4 && (
            <AccountStep onFinish={() => navigate('/login')} />
          )}

          {step < 4 && (
            <p className="text-center text-xs text-foreground-disabled mt-5">
              이미 계정이 있으신가요?
              <button type="button" onClick={() => navigate('/login')}
                className="text-primary font-semibold ml-1">
                로그인
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
