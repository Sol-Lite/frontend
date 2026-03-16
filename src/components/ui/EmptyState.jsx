/**
 * 빈 상태 표시
 *
 * @param {ReactNode} icon     - lucide-react 아이콘 컴포넌트
 * @param {string}   message   - 주 메시지
 * @param {string}   sub       - 보조 메시지 (선택)
 * @param {ReactNode} action   - CTA 버튼 (선택)
 * @param {string}   className
 */
export default function EmptyState({ icon: Icon, message, sub, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 p-6 text-center ${className}`}>
      {Icon && <Icon className="w-9 h-9 text-foreground-disabled" strokeWidth={1.5} />}
      <p className="text-[13px] font-semibold text-foreground-disabled">{message}</p>
      {sub && <p className="text-[11px] text-foreground-disabled">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
