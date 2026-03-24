export default function SplashScreenFill({ inline = false, animated = true }) {
  const content = (
    <div className="flex flex-col items-center gap-6">
      {/* 로고 fill-up */}
      <div className="relative w-20 h-20">
        <img
          src="/shinhan-logo.png"
          alt=""
          className="w-20 h-20 object-contain mix-blend-multiply opacity-15"
        />
        <img
          src="/shinhan-logo.png"
          alt="SOL Lite"
          className={`absolute inset-0 w-20 h-20 object-contain mix-blend-multiply ${animated ? 'animate-fill-up' : ''}`}
        />
      </div>

      <span className={`text-[15px] font-bold tracking-tight text-primary ${animated ? 'animate-fill-up' : ''}`}>
        SOL Lite
      </span>
    </div>
  )

  if (inline) return content

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      {content}
    </div>
  )
}
