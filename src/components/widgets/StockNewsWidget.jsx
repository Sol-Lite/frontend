import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import WidgetCard from './WidgetCard'
import StockSelectModal from './StockSelectModal'
import useStockNews from '@/features/market/useStockNews'
import useWidgetStore from '@/store/useWidgetStore'
import useEditModeStore from '@/store/useEditModeStore'
import useWidgetDetailStore from '@/store/useWidgetDetailStore'

const DEFAULT_STOCK_NEWS_CODE = '055550'
const DEFAULT_STOCK_NEWS_NAME = '신한지주'

function StockChip({ name, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-0.5 text-widget-9 font-semibold text-primary shrink-0 hover:opacity-70"
    >
      {name ?? '종목 선택'}
      <ChevronDown size={10} />
    </button>
  )
}

function NewsCard({ item, onClickNews }) {
  return (
    <div
      className="flex gap-2 py-2 border-b border-stroke last:border-b-0 cursor-pointer pl-2 border-l-2 border-l-transparent hover:border-l-primary transition-colors"
      onClick={(e) => { e.stopPropagation(); onClickNews(item.newsId) }}
    >
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <p className="text-widget-11 font-semibold text-foreground leading-snug line-clamp-2">
          {item.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {item.source && <span className="text-widget-9 text-foreground-disabled">{item.source}</span>}
          {item.source && item.publishedAt && <span className="text-widget-9 text-stroke">·</span>}
          {item.publishedAt && <span className="text-widget-9 text-foreground-disabled">{item.publishedAt}</span>}
        </div>
      </div>
      {item.thumbnailUrl && (
        <img
          src={item.thumbnailUrl}
          alt=""
          className="w-10 h-10 object-cover rounded-lg shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none' }}
        />
      )}
    </div>
  )
}

function NewsListCompact({ items, onClickNews }) {
  return items.map((item, i) => (
    <div
      key={item.newsId ?? i}
      className="flex items-start gap-1.5 py-1 border-b border-stroke last:border-b-0 cursor-pointer pl-2 border-l-2 border-l-transparent hover:border-l-primary transition-colors"
      onClick={(e) => { e.stopPropagation(); onClickNews(item.newsId) }}
    >
      <span className="text-widget-9 font-bold text-primary mt-[1px] shrink-0">{i + 1}</span>
      <p className="text-widget-10 text-foreground leading-snug line-clamp-2">{item.title}</p>
    </div>
  ))
}

export default function StockNewsWidget({ instanceId, variant = 'stock-news-sm', colSpan = 1, rowSpan = 1, config = {}, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const updateWidgetConfig = useWidgetStore((s) => s.updateWidgetConfig)
  const { lockWidgetDrag, unlockWidgetDrag } = useEditModeStore()
  const openDetail = useWidgetDetailStore((s) => s.open)

  useEffect(() => {
    if (!showModal) return undefined
    lockWidgetDrag()
    return () => unlockWidgetDrag()
  }, [showModal, lockWidgetDrag, unlockWidgetDrag])

  const stockCode = config.stockCode ?? DEFAULT_STOCK_NEWS_CODE
  const stockName = config.stockName ?? DEFAULT_STOCK_NEWS_NAME

  const size = variant === 'stock-news-2x2' ? 5 : 3
  const { news, isLoading } = useStockNews(stockCode, size)

  function handleStockSave({ stockCode: newCode, stockName: newName }) {
    updateWidgetConfig(instanceId, { stockCode: newCode, stockName: newName })
    setShowModal(false)
  }

  function handleWidgetClick() {
    if (!stockCode) return
    openDetail({ widgetTypeId: 'stock-news', config: { stockCode, stockName } })
  }

  function handleNewsClick(newsId) {
    openDetail({ widgetTypeId: 'stock-news', config: { stockCode, stockName, newsId } })
  }

  const chip = (
    <StockChip
      name={stockName}
      onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
    />
  )
  const empty   = <p className="text-widget-10 text-foreground-disabled py-2 opacity-50 group-hover:opacity-75 transition-opacity">뉴스가 없습니다</p>
  const loading = <p className="text-widget-10 text-foreground-disabled py-2 opacity-50 group-hover:opacity-75 transition-opacity">로딩 중...</p>
  const noStock = <p className="text-widget-10 text-foreground-disabled py-2 opacity-50 group-hover:opacity-75 transition-opacity">종목을 선택하세요</p>

  const modal = showModal && (
    <StockSelectModal
      currentCode={stockCode}
      currentName={stockName}
      onSave={handleStockSave}
      onClose={() => setShowModal(false)}
    />
  )

  if (variant === 'stock-news-2x2') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
          {chip}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? loading : !stockCode ? noStock : !news.length ? empty :
            news.map((item, i) => <NewsCard key={item.newsId ?? i} item={item} onClickNews={handleNewsClick} />)
          }
        </div>
        {modal}
      </WidgetCard>
    )
  }

  if (variant === 'stock-news-wide') {
    return (
      <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
        <div className="flex items-center justify-between mb-1 shrink-0">
          <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
          {chip}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? loading : !stockCode ? noStock : !news.length ? empty :
            news.slice(0, 2).map((item, i) => <NewsCard key={item.newsId ?? i} item={item} onClickNews={handleNewsClick} />)
          }
        </div>
        {modal}
      </WidgetCard>
    )
  }

  /* stock-news-sm */
  return (
    <WidgetCard colSpan={colSpan} rowSpan={rowSpan} onDelete={onDelete} onClick={handleWidgetClick}>
      <div className="flex items-center justify-between mb-1 shrink-0">
        <span className="text-widget-10 font-semibold text-foreground-disabled tracking-[.04em] uppercase">종목별 뉴스</span>
        {chip}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto hover:bg-surface-muted/50 transition-colors rounded">
        {isLoading ? loading : !stockCode ? noStock : !news.length ? empty :
          <NewsListCompact items={news} onClickNews={handleNewsClick} />
        }
      </div>
      {modal}
    </WidgetCard>
  )
}
