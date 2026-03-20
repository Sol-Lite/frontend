import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'
import RightPanel from './RightPanel'

export default function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
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
