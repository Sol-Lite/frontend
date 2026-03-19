import { useState } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { WIDGET_TYPES, WIDGET_CATEGORIES } from '@/mocks/widgets'
import useWidgetStore from '@/store/useWidgetStore'
import { cn } from '@/lib/cn'

export default function WidgetTypeList({ onSelectType }) {
  const { widgets } = useWidgetStore()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('전체')

  const filtered = WIDGET_TYPES.filter((w) => {
    const matchCategory = activeCategory === '전체' || w.category === activeCategory
    const matchQuery = query === '' || w.name.includes(query) || w.description.includes(query)
    return matchCategory && matchQuery
  })

  // 카테고리별 그룹핑 (전체 선택 시 카테고리 헤더 표시)
  const grouped = activeCategory === '전체'
    ? WIDGET_CATEGORIES.slice(1).reduce((acc, cat) => {
        const items = filtered.filter((w) => w.category === cat)
        if (items.length) acc.push({ cat, items })
        return acc
      }, [])
    : [{ cat: activeCategory, items: filtered }]

  return (
    <>
      {/* 헤더 */}
      <div className="px-4 pt-4 pb-3 border-b border-stroke shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold text-foreground">위젯 추가</span>
          <span className="text-[10px] text-foreground-disabled bg-surface-muted px-2 py-0.5 rounded-full">
            {widgets.length}개 배치 중
          </span>
        </div>
        {/* 검색 */}
        <div className="flex items-center gap-2 bg-background border border-stroke rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-foreground-disabled shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="위젯 검색…"
            className="flex-1 text-[12px] text-foreground placeholder:text-foreground-disabled bg-transparent outline-none"
          />
        </div>
        {/* 카테고리 필터 */}
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {WIDGET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-2.5 py-[3px] rounded-full text-[10px] font-semibold transition-colors duration-[150ms]',
                activeCategory === cat
                  ? 'bg-primary-light text-primary'
                  : 'border border-stroke-input bg-surface text-foreground-tertiary hover:border-primary hover:text-primary',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 위젯 타입 목록 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {grouped.map(({ cat, items }) => (
          <div key={cat}>
            <div className="text-[10px] font-bold text-foreground-disabled uppercase tracking-[.07em] mb-2">
              {cat}
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => onSelectType(widget)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-stroke bg-surface hover:border-primary hover:bg-primary-light transition-all duration-[150ms] text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-foreground group-hover:text-primary transition-colors duration-[150ms]">
                      {widget.name}
                    </div>
                    <div className="text-[10px] text-foreground-disabled mt-0.5">{widget.description}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-foreground-disabled group-hover:text-primary shrink-0 transition-colors duration-[150ms]" />
                </button>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="flex items-center justify-center h-24 text-[12px] text-foreground-disabled">
            검색 결과가 없습니다
          </div>
        )}
      </div>
    </>
  )
}
