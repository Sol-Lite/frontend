import { z } from 'zod'

// Password schema - must be 8+ chars with letters, numbers, and special characters
export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, '비밀번호는 8자 이상, 영문+숫자+특수문자를 포함해야 합니다.')

// PIN schema - exactly 4 digits
export const pinSchema = z
  .string()
  .length(4, 'PIN은 4자리 숫자여야 합니다.')
  .regex(/^\d+$/, 'PIN은 숫자만 입력 가능합니다.')

// Change password form schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
}).refine(
  (data) => data.newPassword !== data.currentPassword,
  {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
  }
).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  }
)

// Change PIN form schema
export const changePinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
  confirmPin: z.string().length(4, 'PIN은 4자리 숫자여야 합니다.'),
}).refine(
  (data) => data.newPin !== data.currentPin,
  {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPin'],
  }
).refine(
  (data) => data.newPin === data.confirmPin,
  {
    message: '새 PIN이 일치하지 않습니다.',
    path: ['confirmPin'],
  }
)

// Reset account form schema
export const resetAccountSchema = z.object({
  accountPin: pinSchema,
})

// Close account form schema
export const closeAccountSchema = z.object({
  accountPin: pinSchema,
  agreed: z.boolean().refine((val) => val === true, {
    message: '약관에 동의해주세요.',
  }),
})

// Update profile form schema
export const updateProfileSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 50자 이하여야 합니다.'),
  phone: z.string().regex(/^$|^\d{2,3}-\d{3,4}-\d{4}$/, '올바른 연락처 형식을 입력하세요 (예: 010-1234-5678)'),
})

// PIN reset confirm schema
export const pinResetSchema = z.object({
  newPin: pinSchema,
  confirmPin: z.string().length(4, 'PIN은 4자리 숫자여야 합니다.'),
}).refine(
  (data) => data.newPin === data.confirmPin,
  {
    message: '새 PIN이 일치하지 않습니다.',
    path: ['confirmPin'],
  }
)
