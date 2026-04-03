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

const CONDITIONAL_SECTION_HEADERS = new Set([
  '📋 주요 이슈',
  '📊 섹터 동향',
  '📈 주요 종목',
])

function isSectionBoundary(line) {
  const trimmed = line.trim()
  return /^(🇰🇷 국내 시황|🇺🇸 해외 시황|💬\s|📋\s|📊\s|📈\s)/.test(trimmed)
}

function hasMeaningfulSectionContent(line) {
  const trimmed = line.trim()

  if (!trimmed) return false
  if (trimmed === '•' || trimmed === '-' || trimmed === '*') return false
  if (/^\[[^\]]+\]$/.test(trimmed)) return false

  return true
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

function removeEmptySummarySections(text) {
  const lines = text.split('\n')
  const result = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!CONDITIONAL_SECTION_HEADERS.has(trimmed)) {
      result.push(line)
      continue
    }

    const sectionLines = [line]
    let cursor = i + 1

    while (cursor < lines.length && !isSectionBoundary(lines[cursor])) {
      sectionLines.push(lines[cursor])
      cursor++
    }

    const hasContent = sectionLines.slice(1).some(hasMeaningfulSectionContent)
    if (hasContent) {
      result.push(...sectionLines)
    }

    i = cursor - 1
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n')
}

export default function ChatInfoCard({ text }) {
  const processed = removeEmptySummarySections(truncateStockSection(text))
    .replace(/^━+\s*$/gm, '\n\n---\n\n')

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
