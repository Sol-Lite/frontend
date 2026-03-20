import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import AppHeader from './AppHeader'
import RightPanel from './RightPanel'
import CurrencySync from './CurrencySync'
import useAuthStore from '@/store/useAuthStore'

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const openLoginModal = useAuthStore((s) => s.openLoginModal)

  useEffect(() => {
    if (location.state?.openLogin) {
      openLoginModal()
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <CurrencySync />
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden bg-background">
          <Outlet />
        </main>
        <RightPanel />
      </div>
    </div>
  )
}
