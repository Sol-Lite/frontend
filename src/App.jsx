export default function App() {
  return (
    <div className="flex items-center justify-center h-screen bg-background text-foreground">
      <div className="text-center">
        <div className="w-10 h-10 rounded-[9px] bg-primary flex items-center justify-center mx-auto mb-3 shadow-brand-glow">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <p className="text-[15px] font-bold tracking-tight">
          SOL <span className="text-primary">Lite</span>
        </p>
        <p className="text-[12px] text-foreground-disabled mt-1">설정 중...</p>
      </div>
    </div>
  )
}
