import { z } from 'zod'

export const signupBasicInfoSchema = z.object({
  email: z.email('올바른 이메일 형식을 입력해 주세요.'),
  name: z.string().trim().min(1, '이름을 입력해 주세요.'),
  phone: z.union([
    z.literal(''),
    z.string().regex(/^\d{2,3}-\d{3,4}-\d{4}$/, '휴대폰 번호를 끝까지 입력해 주세요.'),
  ]),
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
