import { useEffect, useRef, useState } from 'react'
import { authApi } from '@/api/auth'

const POLL_INTERVAL = 3000

export default function useEmailVerification(email, { onError } = {}) {
  const [isSending, setIsSending] = useState(false)
  const [sendDone, setSendDone] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const pollingRef = useRef(null)

  useEffect(() => {
    if (!sendDone || emailVerified) return undefined

    pollingRef.current = setInterval(async () => {
      try {
        const res = await authApi.getEmailVerifyStatus(email)
        if (res?.verified) {
          setEmailVerified(true)
          clearInterval(pollingRef.current)
        }
      } catch {
        // Polling errors are ignored to keep retrying.
      }
    }, POLL_INTERVAL)

    return () => clearInterval(pollingRef.current)
  }, [email, sendDone, emailVerified])

  function resetVerification() {
    setSendDone(false)
    setEmailVerified(false)
    clearInterval(pollingRef.current)
  }

  async function sendVerifyEmail() {
    if (!email) {
      onError?.('이메일을 먼저 입력해 주세요.')
      return { ok: false, error: { message: '이메일을 먼저 입력해 주세요.' } }
    }

    onError?.('')
    setIsSending(true)

    try {
      await authApi.sendVerifyEmail({ email })
      setSendDone(true)
      setEmailVerified(false)
      return { ok: true }
    } catch (err) {
      return {
        ok: false,
        error: err ?? { message: '인증 메일 발송에 실패했습니다.' },
      }
    } finally {
      setIsSending(false)
    }
  }

  return {
    isSending,
    sendDone,
    emailVerified,
    resetVerification,
    sendVerifyEmail,
  }
}
