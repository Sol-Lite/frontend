import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import AccountStep from '@/components/signup/AccountStep'
import AccountSetupStep from '@/components/signup/AccountSetupStep'
import AccountIntroStep from '@/components/signup/AccountIntroStep'
import BasicInfoStep from '@/components/signup/BasicInfoStep'
import BrandPanel from '@/components/signup/BrandPanel'
import { CONSENT_INITIAL_STATE, FINANCE_KEYS, SAFETY_KEYS } from '@/components/signup/consentData'
import PreOpenCheckStep from '@/components/signup/PreOpenCheckStep'
import ConsentStep from '@/components/signup/ConsentStep'
import StepIndicator from '@/components/signup/StepIndicator'
import {
  signupAccountSetupDefaultValues,
  signupAccountSetupSchema,
  signupBasicInfoDefaultValues,
  signupBasicInfoSchema,
} from '@/components/signup/signupSchema'
import { authApi } from '@/api/auth'
import useEmailVerification from '@/hooks/useEmailVerification'

const INDICATOR_STEPS = ['계좌개설', '기본정보', '사전확인', '동의서', '계좌설정']
const STEP_TO_INDICATOR = [0, 1, 2, 3, 4, 4]

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const basicInfoForm = useForm({
    resolver: zodResolver(signupBasicInfoSchema),
    mode: 'onChange',
    defaultValues: signupBasicInfoDefaultValues,
  })
  const {
    control: basicInfoControl,
    clearErrors: clearBasicInfoErrors,
    handleSubmit: handleBasicInfoSubmit,
    setError: setBasicInfoFieldError,
    trigger,
    watch,
    formState: { errors: basicInfoErrors },
  } = basicInfoForm
  const accountSetupForm = useForm({
    resolver: zodResolver(signupAccountSetupSchema),
    mode: 'onChange',
    defaultValues: signupAccountSetupDefaultValues,
  })
  const {
    control: accountSetupControl,
    clearErrors: clearAccountSetupErrors,
    handleSubmit: handleAccountSetupSubmit,
    setError: setAccountSetupFieldError,
    formState: { errors: accountSetupErrors },
  } = accountSetupForm
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
    clearBasicInfoErrors('email')
    setError('')
    setEmailCheckError('')
    if (sendDone) {
      resetVerification()
    }
  }

  async function handleSendVerifyEmail() {
    const isEmailValid = await trigger('email')
    if (!isEmailValid) return

    clearBasicInfoErrors('email')
    setError('')
    setEmailCheckError('')

    const result = await sendVerifyEmail()
    if (result.ok) return

    if (result.error?.code === 'DUPLICATE_EMAIL') {
      const message = result.error.message ?? '이미 등록된 이메일입니다'
      setEmailCheckError(message)
      setBasicInfoFieldError('email', {
        type: 'server',
        message,
      })
      return
    }

    setError(result.error?.message ?? '인증 메일 발송에 실패했습니다.')
  }

  function handleBasicInfoStep() {
    handleBasicInfoSubmit(() => {
      setError('')
      setVerifyHighlight(false)

      if (emailCheckError) {
        setBasicInfoFieldError('email', {
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

  function handleConsentStep() {
    setError('')
    clearAccountSetupErrors()
    setStep(4)
  }

  function handleSignup() {
    handleAccountSetupSubmit(async ({ accountPin, investmentType }) => {
      setError('')
      clearAccountSetupErrors()
      setIsLoading(true)
      try {
        const serviceTermsAgreed = FINANCE_KEYS.every((key) => agreements[key])
        const privacyTermsAgreed = SAFETY_KEYS.every((key) => agreements[key])

        await authApi.signup({
          email,
          password,
          passwordConfirm,
          name,
          phone,
          serviceTermsAgreed,
          privacyTermsAgreed,
          investmentType,
          accountPin,
        })
        setStep(5)
      } catch (err) {
        const validationErrors = err?.errors ?? {}
        let hasFieldError = false

        if (validationErrors.accountPin) {
          setAccountSetupFieldError('accountPin', {
            type: 'server',
            message: validationErrors.accountPin,
          })
          hasFieldError = true
        }

        if (validationErrors.investmentType) {
          setAccountSetupFieldError('investmentType', {
            type: 'server',
            message: validationErrors.investmentType,
          })
          hasFieldError = true
        }

        if (hasFieldError) return

        setError(err?.message ?? '회원가입에 실패했습니다. 다시 시도해 주세요.')
      } finally {
        setIsLoading(false)
      }
    }, () => {
      setError('')
    })()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <BrandPanel />

      <div className="flex-1 bg-surface flex flex-col overflow-y-auto">
        {step === 0 ? (
          <AccountIntroStep onNext={() => setStep(1)} />
        ) : (
          <div className="max-w-[560px] w-full mx-auto px-8 py-11">
            <StepIndicator current={STEP_TO_INDICATOR[step]} steps={INDICATOR_STEPS} />

            {step === 1 && (
            <BasicInfoStep
              password={password}
              control={basicInfoControl}
              isSending={isSending}
              sendDone={sendDone}
              emailVerified={emailVerified}
              verifyHighlight={verifyHighlight}
              error={error}
              fieldErrors={{
                email: basicInfoErrors.email?.message,
                name: basicInfoErrors.name?.message,
                phone: basicInfoErrors.phone?.message,
                password: basicInfoErrors.password?.message,
                passwordConfirm: basicInfoErrors.passwordConfirm?.message,
              }}
              onEmailInputChange={handleEmailChange}
              onBack={() => {
                setError('')
                setStep(0)
              }}
              onSendVerifyEmail={handleSendVerifyEmail}
              onNext={handleBasicInfoStep}
            />
          )}

          {step === 2 && (
            <PreOpenCheckStep
              onBack={() => {
                setError('')
                setStep(1)
              }}
              onNext={() => {
                setError('')
                setStep(3)
              }}
            />
          )}

          {step === 3 && (
            <ConsentStep
              agreements={agreements}
              onAgreementsChange={setAgreements}
              onBack={() => {
                setError('')
                setStep(2)
              }}
              onSubmit={handleConsentStep}
              isLoading={isLoading}
              error={error}
              submitLabel="동의하고 계속하기"
            />
          )}

          {step === 4 && (
            <AccountSetupStep
              control={accountSetupControl}
              fieldErrors={{
                accountPin: accountSetupErrors.accountPin?.message,
                accountPinConfirm: accountSetupErrors.accountPinConfirm?.message,
                investmentType: accountSetupErrors.investmentType?.message,
              }}
              isLoading={isLoading}
              error={error}
              onBack={() => {
                setError('')
                setStep(3)
              }}
              onSubmit={handleSignup}
            />
          )}

          {step === 5 && (
            <AccountStep onFinish={() => navigate('/login')} />
          )}

          {step < 5 && (
            <p className="text-center text-xs text-foreground-disabled mt-5">
              이미 계정이 있으신가요?
              <button type="button" onClick={() => navigate('/login')}
                className="text-primary font-semibold ml-1">
                로그인
              </button>
            </p>
          )}
        </div>
        )}
      </div>
    </div>
  )
}
