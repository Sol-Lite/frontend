import { z } from 'zod'

export const INVESTMENT_TYPE_OPTIONS = [
  {
    value: 'CONSERVATIVE',
    label: '안정형',
    description: '원금 손실 가능성을 낮추고 안정적인 흐름을 우선해요.',
  },
  {
    value: 'CONSERVATIVE_GROWTH',
    label: '안정추구형',
    description: '안정성을 우선하면서도 제한적인 수익 기회를 함께 봐요.',
  },
  {
    value: 'BALANCED',
    label: '위험중립형',
    description: '위험과 수익의 균형을 고려해 투자하려는 편이에요.',
  },
  {
    value: 'AGGRESSIVE_GROWTH',
    label: '적극투자형',
    description: '수익 확대를 위해 일정 수준의 가격 변동을 감수할 수 있어요.',
  },
  {
    value: 'AGGRESSIVE',
    label: '공격투자형',
    description: '높은 수익을 기대하며 큰 가격 변동도 감수할 수 있어요.',
  },
]

const INVESTMENT_TYPE_VALUES = INVESTMENT_TYPE_OPTIONS.map((option) => option.value)

export const signupBasicInfoSchema = z.object({
  email: z.email('올바른 이메일 형식을 입력해 주세요.'),
  name: z.string().trim().min(1, '이름을 입력해 주세요.'),
  phone: z
    .string()
    .min(1, '휴대폰 번호를 입력해 주세요.')
    .regex(/^\d{2,3}-\d{3,4}-\d{4}$/, '휴대폰 번호를 끝까지 입력해 주세요.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .refine((value) => /[A-Za-z]/.test(value), '비밀번호에 영문을 포함해 주세요.')
    .refine((value) => /[0-9]/.test(value), '비밀번호에 숫자를 포함해 주세요.')
    .refine((value) => /[^A-Za-z0-9]/.test(value), '비밀번호에 특수문자를 포함해 주세요.'),
  passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해 주세요.'),
}).refine((data) => data.password === data.passwordConfirm, {
  path: ['passwordConfirm'],
  message: '비밀번호가 일치하지 않습니다.',
})

export const signupBasicInfoDefaultValues = {
  email: '',
  name: '',
  phone: '',
  password: '',
  passwordConfirm: '',
}

export const signupAccountSetupSchema = z.object({
  investmentType: z
    .string()
    .min(1, '투자성향을 선택해 주세요.')
    .refine((value) => INVESTMENT_TYPE_VALUES.includes(value), '투자성향을 선택해 주세요.'),
  accountPin: z
    .string()
    .regex(/^\d{4}$/, '계좌 비밀번호는 숫자 4자리입니다'),
  accountPinConfirm: z
    .string()
    .min(1, '계좌 비밀번호 확인을 입력해 주세요.')
    .regex(/^\d{4}$/, '계좌 비밀번호는 숫자 4자리입니다'),
}).refine((data) => data.accountPin === data.accountPinConfirm, {
  path: ['accountPinConfirm'],
  message: '계좌 비밀번호가 일치하지 않습니다.',
})

export const signupAccountSetupDefaultValues = {
  investmentType: '',
  accountPin: '',
  accountPinConfirm: '',
}
