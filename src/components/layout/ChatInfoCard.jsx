import { Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function colorizeArrows(str) {
  return str.split(/(🔺|🔻)/).map((part, i) => {
    if (part === '🔺') return <span key={i} className="text-up font-semibold">▲</span>
    if (part === '🔻') return <span key={i} className="text-down font-semibold">▼</span>
    return part
  })
}

function applyArrows(children) {
  return children.map((child, i) =>
    typeof child === 'string'
      ? <Fragment key={i}>{colorizeArrows(child)}</Fragment>
      : child
  )
}

// 📈 주요 종목 섹션에서 [KOSPI]/[KOSDAQ] 각 3개만 남김
function hasArrow(line) {
  return line.includes('▲') || line.includes('▼') || line.includes('🔺') || line.includes('🔻')
}

function truncateStockSection(text) {
  const sectionIdx = text.indexOf('주요 종목')
  if (sectionIdx === -1) return text

  const before = text.slice(0, sectionIdx)
  const lines = text.slice(sectionIdx).split('\n')
  const result = []
  let marketCount = -1 // -1: [MARKET] 헤더 아직 미등장

  for (const line of lines) {
    if (/\[KOSPI\]|\[KOSDAQ\]/i.test(line)) {
      marketCount = 0
      result.push(line)
      continue
    }
    if (marketCount >= 0 && hasArrow(line)) {
      if (marketCount < 3) result.push(line)
      marketCount++
      continue
    }
    result.push(line)
  }

  return before + result.join('\n')
}

export default function ChatInfoCard({ text }) {
  const processed = truncateStockSection(text).replace(/^━+\s*$/gm, '\n\n---\n\n')

  return (
    <div className="bg-surface border border-stroke rounded-[16px] px-2.5 py-2 text-[12px] leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1 last:mb-0">{applyArrows([].concat(children))}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
          strong: ({ children }) => <strong className="font-bold">{applyArrows([].concat(children))}</strong>,
          hr: () => <hr className="border-stroke my-1.5" />,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
