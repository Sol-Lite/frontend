import { useState } from 'react'
import { authApi } from '@/api/auth'
import useAuthStore from '@/store/useAuthStore'
import useRightPanelStore from '@/store/useRightPanelStore'

export default function useLogin({ onSuccess } = {}) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setChatMode = useRightPanelStore((s) => s.setChatMode)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await authApi.login({ email, password, autoLogin })
      setAuth({ accessToken: res.accessToken, user: res.user, autoLogin })
      setChatMode()
      onSuccess?.()
    } catch (err) {
      setError(err?.message ?? '이메일 또는 비밀번호를 확인해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    autoLogin, setAutoLogin,
    isLoading,
    error,
    handleSubmit,
  }
}
