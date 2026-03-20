import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import useAuthStore from '@/store/useAuthStore'
import LoginModal from '@/components/auth/LoginModal'

export default function App() {
  const showLoginModal = useAuthStore((s) => s.showLoginModal)
  const closeLoginModal = useAuthStore((s) => s.closeLoginModal)
  const isRestoring = useAuthStore((s) => s.isRestoring)

  useEffect(() => {
    useAuthStore.getState().restoreAuth()
  }, [])

  if (isRestoring) return null

  return (
    <>
      <RouterProvider router={router} />
      {showLoginModal && <LoginModal onClose={closeLoginModal} />}
    </>
  )
}
