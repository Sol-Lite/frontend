export default function SolLiteBrand({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/shc_symbol_ci.png"
        alt="SOL Lite"
        className="w-7 h-7 object-contain"
      />
      <span className="text-[15px] font-bold tracking-tight text-primary">SOL Lite</span>
    </div>
  )
}
