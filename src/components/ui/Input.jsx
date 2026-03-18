import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export const Input = forwardRef(function Input({ label, required, className = '', ...props }, ref) {
  return (
    <div>
      {label && (
        <label className="block text-[11px] font-semibold text-foreground-secondary mb-1.5">
          {label}
          {required && <span className="text-up ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={[
          'w-full px-3.5 py-[11px]',
          'border-[1.5px] border-stroke-input rounded-[10px]',
          'text-sm text-foreground bg-surface',
          'outline-none transition-[border-color,box-shadow] duration-[200ms]',
          'focus:border-primary focus:shadow-focus-ring',
          'placeholder:text-foreground-disabled',
          className,
        ].join(' ')}
        {...props}
      />
    </div>
  )
})

export const PasswordInput = forwardRef(function PasswordInput({ label, required, className = '', ...props }, ref) {
  const [show, setShow] = useState(false)

  return (
    <div>
      {label && (
        <label className="block text-[11px] font-semibold text-foreground-secondary mb-1.5">
          {label}
          {required && <span className="text-up ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={show ? 'text' : 'password'}
          className={[
            'w-full px-3.5 py-[11px] pr-[42px]',
            'border-[1.5px] border-stroke-input rounded-[10px]',
            'text-sm text-foreground bg-surface',
            'outline-none transition-[border-color,box-shadow] duration-[200ms]',
            'focus:border-primary focus:shadow-focus-ring',
            'placeholder:text-foreground-disabled',
            className,
          ].join(' ')}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-disabled hover:text-foreground-tertiary transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
})
