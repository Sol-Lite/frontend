import { Outlet } from 'react-router-dom'

// TODO(layout): 4단계에서 AppShell(AppHeader + Sidebar + ChatPanel)로 교체
export default function App() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Outlet />
    </div>
  )
}
