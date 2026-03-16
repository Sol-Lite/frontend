import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from './AppHeader'
import Sidebar from './Sidebar'
import ChatPanel from './ChatPanel'

export default function AppShell() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        {isHome && <Sidebar />}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
        <ChatPanel />
      </div>
    </div>
  )
}
