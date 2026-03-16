/**
 * 섹션 타이틀 영역
 *
 * @param {string}   title
 * @param {string}   meta     - 우측 보조 텍스트 (예: "5개 종목")
 * @param {ReactNode} action  - 우측 액션 버튼/요소
 * @param {string}   className
 */
export default function SectionHeader({ title, meta, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-extrabold text-foreground">{title}</span>
        {meta && (
          <span className="text-[12px] text-foreground-disabled">{meta}</span>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
