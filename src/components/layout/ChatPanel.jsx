import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDroppable } from "@dnd-kit/core";
import { Send } from "lucide-react";
import WIDGET_SHORTCUTS from "@/config/widgetShortcuts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "@/store/useAuthStore";
import { chatApi } from "@/api/chat";
import ChatOrderCard from "@/components/layout/ChatOrderCard";
import ChatExchangeCard from "@/components/layout/ChatExchangeCard";
import ChatStockCard from "@/components/layout/ChatStockCard";
import ChatInfoCard from "@/components/layout/ChatInfoCard";
import ChatNewsCard from "@/components/layout/ChatNewsCard";
import ChatWidgetAdder, { getInfoCardWidgetTypeId } from "@/components/layout/ChatWidgetAdder";
import DraggableChatCard from "@/components/layout/DraggableChatCard";
import usePendingWidgetStore from "@/store/usePendingWidgetStore";
import { foreignMarketApi, getExchcd, marketApi } from "@/api/market";
import { balanceApi } from "@/api/balance";
import { orderApi, ORDER_SIDE, ORDER_KIND } from "@/api/order";
import { exchangeApi } from "@/api/exchange";
import usePinAuth from "@/hooks/usePinAuth";
import usePendingQueryStore from "@/store/usePendingQueryStore";
import ChatPinBubble from "@/components/layout/ChatPinBubble";
import ChatExchangePinBubble from "@/components/layout/ChatExchangePinBubble";
import { isForeignMarketType } from "@/features/invest/formatters";
import { buildInvestNavigationState } from "@/features/invest/navigation";
import useWidgetDetailStore from "@/store/useWidgetDetailStore";
import { cn } from "@/lib/cn";
import { getStockLogoUrl } from "@/lib/stockLogo";

const EXCHANGE_RESULT_DELAY_MS = 1400
const INFO_FALLBACK_WIDGET_TYPES = ['portfolio', 'trade-history', 'market-overview', 'index', 'ranking', 'balance', 'exchange']

function toInfoTypeFromWidgetType(widgetTypeId) {
  if (widgetTypeId === 'trade-history') return 'trade_history'
  if (widgetTypeId === 'market-overview') return 'market_overview'
  if (widgetTypeId === 'exchange') return 'exchange_rate'
  return widgetTypeId
}

function inferInfoTypeFromPrompt(prompt = '') {
  const keyword = prompt.trim().toLowerCase()
  if (!keyword) return null
  const matched = WIDGET_SHORTCUTS.find((item) =>
    INFO_FALLBACK_WIDGET_TYPES.includes(item.widgetTypeId) &&
    item.keywords.some((k) => keyword.includes(k))
  )
  if (!matched) return null
  return toInfoTypeFromWidgetType(matched.widgetTypeId)
}

function getTimestamp() {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const STORAGE_KEY = "chat_messages";

function buildClientOrderSeed() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `chat-order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildOrderIdempotencyKey(requestKeyBase, side, quantity) {
  const safeSide = side === "sell" ? "sell" : "buy";
  const safeQty = Number(quantity) > 0 ? Number(quantity) : 1;
  return `${requestKeyBase ?? buildClientOrderSeed()}:${safeSide}:${safeQty}`;
}

function normalizeOrderCardPriceData(marketType, priceData) {
  if (!priceData) return { price: null, changeRate: null };

  if (isForeignMarketType(marketType)) {
    const price = Number(priceData.price);
    const rate = Number(priceData.rate);
    return {
      price: Number.isFinite(price) && price > 0 ? price : null,
      changeRate: Number.isFinite(rate) ? rate : null,
    };
  }

  const price = Number(priceData.currentPrice);
  const rate = Number(priceData.changeRate);
  return {
    price: Number.isFinite(price) && price > 0 ? price : null,
    changeRate: Number.isFinite(rate) ? rate : null,
  };
}

function formatExchangeAmount(currency, amount) {
  if (currency === "USD") {
    return `$${Number(amount ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    })}`;
  }

  return `${Math.round(Number(amount ?? 0)).toLocaleString("ko-KR")}원`;
}

async function waitForMinimumDelay(startedAt) {
  const elapsed = Date.now() - startedAt
  const remaining = Math.max(0, EXCHANGE_RESULT_DELAY_MS - elapsed)
  if (remaining > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, remaining))
  }
}

// ── 초기 웰컴 메시지 ──────────────────────────────────────────
function getInitialMessages() {
  return [
    {
      id: Date.now(),
      role: "ai",
      text: "안녕하세요! 저는 위젯과 대화를 통해  \n증권을 편리하게 돕는 쏠리입니다!",
      time: getTimestamp(),
    },
  ];
}

function loadMessages() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed
        .filter((message) => !['pin', 'pin-result', 'exchange-pin'].includes(message?.type))
        .map((message) => (
          message?.type === 'order'
            ? { ...message, pendingPin: false }
            : message?.type === 'exchange'
              ? { ...message, isPending: false }
            : message
        ));
    }
  } catch {
    return getInitialMessages();
  }
  return getInitialMessages();
}

function saveMessages(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    return;
  }
}

function ChatToastStack({ toasts, onClose }) {
  if (!toasts.length) return null;

  return (
    <div className="shrink-0 px-3 pb-2 flex flex-col gap-2">
      {toasts.map((toast) => {
        const isOrderSuccess = toast.type === "order-success";
        const isExchangeSuccess = toast.type === "exchange-success";
        const isBuy = toast.side === "buy";
        return (
          <div
            key={toast.id}
            className="animate-bubble-in rounded-2xl border border-stroke bg-surface px-3.5 py-3 shadow-toast"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${
                  isOrderSuccess
                    ? (isBuy ? "text-up" : "text-down")
                    : isExchangeSuccess
                      ? "text-primary"
                      : "text-down"
                }`}>
                  {toast.title}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground">
                  {isOrderSuccess ? (
                    <>
                      <span className="font-bold">{toast.name}</span> {isBuy ? "매수" : "매도"} {toast.quantity}주 주문이 접수되었습니다.
                    </>
                  ) : (
                    toast.message
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onClose(toast.id)}
                className="shrink-0 text-[10px] font-semibold text-foreground-disabled hover:text-foreground"
              >
                닫기
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 비로그인 기능 소개 카드 ────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: "💸",
    title: "자연어로 매수 · 매도",
    desc: "채팅으로 간편하게 주문할 수 있어요",
  },
  {
    icon: "💡",
    title: "손쉬운 서비스 검색",
    desc: "원하는 서비스를 빠르게 찾아드려요",
  },
  {
    icon: "📈",
    title: "시황 · 종목별 뉴스 요약",
    desc: "시장 흐름을 요약해드려요",
  },
  {
    icon: "🔍",
    title: "포트폴리오 분석",
    desc: "보유 종목의 현황을 알아보세요",
  },
];

// ── ChatHeader ─────────────────────────────────────────────────
// DESIGN.md §16: w-9 h-9 rounded-xl bg-primary shadow-brand-glow-sm
// 아이콘 18px, "SOL AI 어시스턴트" font-bold, LiveDot + "온라인 · 즉시 응답"
function ChatHeader() {
  return (
    <div className="h-chat-header flex items-center gap-3 px-4 border-b border-stroke shrink-0">
      <div className="flex flex-col gap-0.5">
        <span className="text-[14px] font-bold text-foreground">
          SOL-Lite <span className="text-primary">쏠리</span>
        </span>
      </div>
    </div>
  );
}

// ── ChatBubble ─────────────────────────────────────────────────
// DESIGN.md §16:
//   AI  — rounded-[0_16px_16px_16px] bg-surface-muted text-foreground
//   User — rounded-[16px_0_16px_16px] bg-primary text-white
//   animate-bubble-in, 타임스탬프 text-[9px] text-foreground-disabled
//   타이핑 인디케이터: dot 3개, animate-pulse-dot staggered delay

const AVATARS = [
  { file: 'puri',     bgClass: 'bg-chat-avatar-puri'     },  // 플리
  { file: 'rurulara', bgClass: 'bg-chat-avatar-rurulara' },  // 루루라라
  { file: 'doremi',   bgClass: 'bg-chat-avatar-doremi'   },  // 도레미
  { file: 'shu',      bgClass: 'bg-chat-avatar-shu'      },  // 슈
  { file: 'rino',     bgClass: 'bg-chat-avatar-rino'     },  // 리노
  { file: 'molly',    bgClass: 'bg-chat-avatar-molly'    },  // 몰리
  { file: 'sol',      bgClass: 'bg-chat-avatar-sol'      },  // 쏠
  { file: 'ray',      bgClass: 'bg-chat-avatar-ray'      },  // 레이
];

function ChatBubble({
  role,
  text,
  time,
  isTyping = false,
  isError = false,
  onRetry,
  msgId,
}) {
  const isAI = role === "ai";
  const avatar = AVATARS[msgId ? (msgId % AVATARS.length) : 0];

  return (
    <div
      className={`flex animate-bubble-in ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div
        className={cn("flex flex-col gap-1 max-w-[85%]", isAI ? "items-start" : "items-end")}
      >
      {isAI && (
        <div className="flex items-end gap-2">
          <div
            className={cn("w-10 h-10 rounded-full overflow-hidden flex items-end justify-center shrink-0", avatar.bgClass)}
          >
            <img
              src={`/avatars/${avatar.file}.png`}
              alt="SOL AI"
              className="w-8 h-8 object-contain object-bottom animate-avatar-pop-in"
            />
          </div>
          {time && !isTyping && (
            <span className="text-[9px] text-foreground-disabled">{time}</span>
          )}
        </div>
      )}
      {!isAI ? (
        <>
          {time && !isTyping && (
            <span className="text-[9px] text-foreground-disabled">{time}</span>
          )}
          <div className="px-3.5 py-2.5 text-[13px] leading-relaxed bg-primary text-white rounded-[16px_0_16px_16px]">
          {isTyping ? (
            // DESIGN.md §16: dot 3개, w-1.25 h-1.25, pulse-dot 0/150/300ms
            <div className="flex items-center gap-1 py-0.5">
              <span className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot [animation-delay:0ms]" />
              <span className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot [animation-delay:150ms]" />
              <span className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot [animation-delay:300ms]" />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-1 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 mb-1 space-y-0.5">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 mb-1 space-y-0.5">
                    {children}
                  </ol>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold">{children}</strong>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mt-1">
                    <table className="text-[11px] border-collapse w-full">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-stroke px-2 py-1 bg-surface font-semibold text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-stroke px-2 py-1">{children}</td>
                ),
              }}
            >
              {text}
            </ReactMarkdown>
          )}
          </div>
        </>
      ) : (
        <div className="px-3.5 py-2.5 text-[13px] leading-relaxed bg-surface-muted text-foreground rounded-[0_16px_16px_16px]">
          {isTyping ? (
            <div className="flex items-center gap-1 py-0.5">
              <span className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot [animation-delay:0ms]" />
              <span className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot [animation-delay:150ms]" />
              <span className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot [animation-delay:300ms]" />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                table: ({ children }) => <div className="overflow-x-auto mt-1"><table className="text-[11px] border-collapse w-full">{children}</table></div>,
                th: ({ children }) => <th className="border border-stroke px-2 py-1 bg-surface font-semibold text-left">{children}</th>,
                td: ({ children }) => <td className="border border-stroke px-2 py-1">{children}</td>,
              }}
            >
              {text}
            </ReactMarkdown>
          )}
        </div>
      )}
      {isError && onRetry && (
        <button onClick={onRetry} className="text-[11px] text-primary hover:underline cursor-pointer self-start">
          다시 시도
        </button>
      )}
      </div>
    </div>
  );
}

// ── ChatMessages ───────────────────────────────────────────────
function ChatMessages({ messages, isTyping, bottomRef, onRetry, onOrderAction, onExchangeAction, onOrderDetail, onPinClose, onPinSuccess, onExchangePinSuccess, onPinError }) {
  const { pendingMsgId, widgetTypeId: pendingWidgetTypeId, variant: pendingVariant } = usePendingWidgetStore()
  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
      {messages.map((msg) => {
        // 주문 카드
        if (msg.type === 'order' && msg.stock) {
          const av = AVATARS[msg.id % AVATARS.length]
          const isThisPending = pendingMsgId === msg.id
          return (
            <div key={msg.id} className="flex flex-col gap-1 animate-bubble-in">
              <div className="flex items-end gap-2">
                <div className={cn("w-10 h-10 rounded-full overflow-hidden flex items-end justify-center shrink-0", av.bgClass)}>
                  <img src={`/avatars/${av.file}.png`} alt="SOL AI" className="w-8 h-8 object-contain object-bottom animate-avatar-pop-in" />
                </div>
                {msg.time && <span className="text-[9px] text-foreground-disabled">{msg.time}</span>}
                <ChatWidgetAdder msgId={msg.id} widgetTypeId="stock-chart" />
              </div>
              {isThisPending ? (
                <DraggableChatCard msgId={msg.id} widgetTypeId={pendingWidgetTypeId} variant={pendingVariant} widgetConfig={{ stockCode: msg.stock.stockCode, stockName: msg.stock.name, marketType: msg.stock.marketType, exchangeCode: msg.stock.exchangeCode }}>
                  <ChatOrderCard
                    {...msg.stock}
                    onBuy={(qty) => onOrderAction?.(msg.id, msg.stock, 'buy', qty, msg.requestKeyBase)}
                    onSell={(qty) => onOrderAction?.(msg.id, msg.stock, 'sell', qty, msg.requestKeyBase)}
                    onDetail={() => onOrderDetail?.(msg.stock)}
                  />
                </DraggableChatCard>
              ) : (
                <ChatOrderCard
                  {...msg.stock}
                  onBuy={(qty) => onOrderAction?.(msg.id, msg.stock, 'buy', qty, msg.requestKeyBase)}
                  onSell={(qty) => onOrderAction?.(msg.id, msg.stock, 'sell', qty, msg.requestKeyBase)}
                  onDetail={() => onOrderDetail?.(msg.stock)}
                />
              )}
            </div>
          )
        }
        // PIN 입력 버블
        if (msg.type === 'pin') {
          return (
            <div key={msg.id} className="flex flex-col gap-1 animate-bubble-in">
              <ChatPinBubble
                stockCode={msg.stockCode}
                marketType={msg.marketType}
                name={msg.name}
                side={msg.side}
                quantity={msg.quantity}
                idempotencyKey={msg.idempotencyKey}
                onClose={() => onPinClose?.(msg.id, msg.sourceOrderId)}
                onSuccess={() => onPinSuccess?.(msg.id, msg.sourceOrderId, msg.name, msg.side, msg.quantity)}
                onError={(message) => onPinError?.(message)}
              />
            </div>
          )
        }
        if (msg.type === 'exchange-pin') {
          return (
            <div key={msg.id} className="flex flex-col gap-1 animate-bubble-in">
              <ChatExchangePinBubble
                onClose={() => onPinClose?.(msg.id, msg.sourceExchangeId)}
                onSubmit={(pinData) => onExchangePinSuccess?.(msg.id, msg.sourceExchangeId, {
                  ...pinData,
                  fromCurrency: msg.fromCurrency,
                  toCurrency: msg.toCurrency,
                  requestAmount: msg.requestAmount,
                })}
                onError={(message) => onPinError?.(message)}
              />
            </div>
          )
        }
        // 환전 카드
        if (msg.type === 'exchange') {
          const av = AVATARS[msg.id % AVATARS.length]
          const isThisPending = pendingMsgId === msg.id
          return (
            <div key={msg.id} className="flex flex-col gap-1 animate-bubble-in">
              <div className="flex items-end gap-2">
                <div className={cn("w-10 h-10 rounded-full overflow-hidden flex items-end justify-center shrink-0", av.bgClass)}>
                  <img src={`/avatars/${av.file}.png`} alt="SOL AI" className="w-8 h-8 object-contain object-bottom animate-avatar-pop-in" />
                </div>
                {msg.time && <span className="text-[9px] text-foreground-disabled">{msg.time}</span>}
                <ChatWidgetAdder msgId={msg.id} widgetTypeId="exchange" variantIds={['exchange-sm']} />
              </div>
              {isThisPending ? (
                <DraggableChatCard msgId={msg.id} widgetTypeId={pendingWidgetTypeId} variant={pendingVariant}>
                  <ChatExchangeCard
                    krwBalance={msg.krwBalance}
                    usdBalance={msg.usdBalance}
                    isPending={Boolean(msg.isPending)}
                    onSubmit={(payload) => onExchangeAction?.(msg.id, payload)}
                  />
                </DraggableChatCard>
              ) : (
                <ChatExchangeCard
                  krwBalance={msg.krwBalance}
                  usdBalance={msg.usdBalance}
                  isPending={Boolean(msg.isPending)}
                  onSubmit={(payload) => onExchangeAction?.(msg.id, payload)}
                />
              )}
            </div>
          )
        }
        // 주식 차트 카드 — 풀 너비 유지
        if (msg.type === 'stock_price') {
          const av = AVATARS[msg.id % AVATARS.length]
          const isThisPending = pendingMsgId === msg.id
          return (
            <div key={msg.id} className="flex flex-col gap-1 animate-bubble-in">
              <div className="flex items-end gap-2">
                <div className={cn("w-10 h-10 rounded-full overflow-hidden flex items-end justify-center shrink-0", av.bgClass)}>
                  <img src={`/avatars/${av.file}.png`} alt="SOL AI" className="w-8 h-8 object-contain object-bottom animate-avatar-pop-in" />
                </div>
                {msg.time && <span className="text-[9px] text-foreground-disabled">{msg.time}</span>}
                <ChatWidgetAdder msgId={msg.id} widgetTypeId="stock-chart" />
              </div>
              {isThisPending ? (
                <DraggableChatCard msgId={msg.id} widgetTypeId={pendingWidgetTypeId} variant={pendingVariant} widgetConfig={{ stockCode: msg.stockCode, stockName: msg.stockName, marketType: msg.marketType, exchangeCode: msg.exchangeCode }}>
                  <ChatStockCard
                    stockCode={msg.stockCode}
                    stockName={msg.stockName}
                    marketType={msg.marketType}
                    exchangeCode={msg.exchangeCode}
                  />
                </DraggableChatCard>
              ) : (
                <ChatStockCard
                  stockCode={msg.stockCode}
                  stockName={msg.stockName}
                  marketType={msg.marketType}
                  exchangeCode={msg.exchangeCode}
                />
              )}
            </div>
          )
        }
        // 뉴스 카드 (종목 뉴스 / 보유 종목 뉴스)
        if (msg.type === 'news_card') {
          const av = AVATARS[msg.id % AVATARS.length]
          const isThisPending = pendingMsgId === msg.id
          return (
            <div key={msg.id} className="flex justify-start animate-bubble-in">
              <div className="flex flex-col gap-1 max-w-[90%] items-start">
                <div className="flex items-end gap-2">
                  <div className={cn("w-10 h-10 rounded-full overflow-hidden flex items-end justify-center shrink-0", av.bgClass)}>
                    <img src={`/avatars/${av.file}.png`} alt="SOL AI" className="w-8 h-8 object-contain object-bottom animate-avatar-pop-in" />
                  </div>
                  {msg.time && <span className="text-[9px] text-foreground-disabled">{msg.time}</span>}
                  <ChatWidgetAdder msgId={msg.id} widgetTypeId="stock-news" />
                </div>
                {isThisPending ? (
                  <DraggableChatCard msgId={msg.id} widgetTypeId={pendingWidgetTypeId} variant={pendingVariant} widgetConfig={{ stockCode: msg.stockCode, stockName: msg.stockName }}>
                    <ChatNewsCard text={msg.text} stockCode={msg.stockCode} stockName={msg.stockName} />
                  </DraggableChatCard>
                ) : (
                  <ChatNewsCard text={msg.text} stockCode={msg.stockCode} stockName={msg.stockName} />
                )}
              </div>
            </div>
          )
        }
        // 정보 카드 (지수/순위/잔고/환율) — reply 텍스트를 카드 스타일로 표시
        if (msg.type === 'info_card') {
          const av = AVATARS[msg.id % AVATARS.length]
          const infoWidgetTypeId = getInfoCardWidgetTypeId(msg.infoType)
          const isThisPending = pendingMsgId === msg.id
          return (
            <div key={msg.id} className="flex justify-start animate-bubble-in">
              <div className="flex flex-col gap-1 max-w-[85%] items-start">
                <div className="flex items-end gap-2">
                  <div className={cn("w-10 h-10 rounded-full overflow-hidden flex items-end justify-center shrink-0", av.bgClass)}>
                    <img src={`/avatars/${av.file}.png`} alt="SOL AI" className="w-8 h-8 object-contain object-bottom animate-avatar-pop-in" />
                  </div>
                  {msg.time && <span className="text-[9px] text-foreground-disabled">{msg.time}</span>}
                  {infoWidgetTypeId && (
                    <ChatWidgetAdder
                      msgId={msg.id}
                      widgetTypeId={infoWidgetTypeId}
                      variantIds={infoWidgetTypeId === 'exchange' ? ['exchange-sm'] : undefined}
                    />
                  )}
                </div>
                {isThisPending ? (
                  <DraggableChatCard msgId={msg.id} widgetTypeId={pendingWidgetTypeId} variant={pendingVariant}>
                    <ChatInfoCard text={msg.text} />
                  </DraggableChatCard>
                ) : (
                  <ChatInfoCard text={msg.text} />
                )}
              </div>
            </div>
          )
        }
        // 일반 말풍선
        return (
          <ChatBubble
            key={msg.id}
            msgId={msg.id}
            role={msg.role}
            text={msg.text}
            time={msg.time}
            isError={msg.isError}
            onRetry={msg.isError ? onRetry : undefined}
          />
        )
      })}
      {isTyping && <ChatBubble role="ai" isTyping msgId={1} />}
      {/* 자동 스크롤 앵커 */}
      <div ref={bottomRef} />
    </div>
  );
}

// ── ChatSuggestions ────────────────────────────────────────────
// 채팅 입력 위에 뜨는 종목 자동완성 드롭다운
function ChatSuggestions({ suggestions, activeIndex, onSelect }) {
  if (suggestions.length === 0) return null;
  return (
    <div className="absolute bottom-full left-0 right-0 overflow-hidden border-t border-x border-stroke bg-surface z-10">
      {suggestions.map((sugg, i) => (
        <button
          key={sugg.key}
          onMouseDown={(e) => { e.preventDefault(); onSelect(sugg); }}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100",
            i === activeIndex ? "bg-background" : "hover:bg-background",
            i > 0 && "border-t border-stroke-subtle"
          )}
        >
          {sugg.stock ? (
            <img
              src={getStockLogoUrl(sugg.stock.marketType, sugg.stock.stockCode)}
              alt={sugg.stock.stockName}
              className="h-7 w-7 shrink-0 rounded-full bg-background object-contain"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="h-7 w-7 shrink-0 rounded-full bg-primary-light flex items-center justify-center">
              {sugg.Icon && <sugg.Icon className="w-3.5 h-3.5 text-primary" />}
            </div>
          )}
          <span className="flex-1 truncate text-[13px] font-bold text-foreground">{sugg.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── ChatInput ──────────────────────────────────────────────────
// DESIGN.md §16: bg-background border-stroke-input rounded-2xl px-3.5 py-2.5
// 전송버튼: 빈 입력 → bg-surface-muted cursor-not-allowed / 입력 있음 → bg-primary
// textarea: 입력 내용에 따라 높이 자동 증가, 최대 5줄, Shift+Enter 줄바꿈
function ChatInput({ isDisabled = false, isSending = false, onSend, value = "", onChange, onSuggestionKeyDown }) {
  const textareaRef = useRef(null);
  const canSend = value.trim().length > 0 && !isDisabled;

  // 내용에 따라 textarea 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  // 답변 완료 시 입력창 포커스 복원
  useEffect(() => {
    if (!isSending) textareaRef.current?.focus();
  }, [isSending]);

  function handleSend() {
    if (!canSend) return;
    onSend(value.trim());
    onChange?.("");
    // 전송 후 높이 초기화
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e) {
    // suggestion 키 처리가 우선 (ArrowUp/Down/Escape/Enter with active suggestion)
    if (onSuggestionKeyDown?.(e)) return;
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className={`flex items-end gap-2 px-3 py-[10px] border-t border-stroke shrink-0 ${isDisabled ? "opacity-60" : ""}`}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        placeholder={
          isSending
            ? "답변을 준비하고 있어요..."
            : isDisabled
            ? "로그인 후 이용하실 수 있습니다"
            : "SOL AI 어시스턴트에게 물어보세요..."
        }
        className="flex-1 px-3 py-1.5 rounded-lg bg-background text-[12px] text-foreground placeholder:text-foreground-disabled border border-stroke focus:outline-none transition-colors duration-150 resize-none leading-relaxed"
        style={{ maxHeight: "120px", overflowY: "auto" }}
      />
      <button
        aria-label="메시지 전송"
        disabled={!canSend}
        onClick={handleSend}
        className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-colors duration-150 ${
          canSend
            ? "bg-primary text-white hover:bg-primary-hover cursor-pointer"
            : "bg-surface-muted text-foreground-disabled cursor-not-allowed"
        }`}
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── LoginPrompt ────────────────────────────────────────────────
// DESIGN.md §16: w-16 h-16 rounded-2xl bg-primary AI 아이콘,
// 기능 카드 3개 (bg-surface-subtle border-stroke rounded-xl),
// full-width primary 버튼 "로그인하고 시작하기 →"
// 하단에 ChatInput disabled
function LoginPrompt() {
  const openLoginModal = useAuthStore((s) => s.openLoginModal);
  const [avatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-5">
        <div className="w-full flex justify-start">
          <div className="flex flex-col gap-1 w-full max-w-full">
            <div className="flex items-end gap-2">
              <div
                className={cn(
                  "w-11 h-11 rounded-full overflow-hidden flex items-end justify-center shrink-0",
                  avatar.bgClass,
                )}
              >
                <img
                  src={`/avatars/${avatar.file}.png`}
                  alt={avatar.file}
                  className="w-9 h-9 object-contain object-bottom"
                />
              </div>
              <span className="text-[14px] font-bold text-foreground">
                챗봇 <span className="text-primary">쏠리</span>
              </span>
            </div>
            <div className="w-full rounded-[0_18px_18px_18px] bg-surface-muted px-5 py-4 text-left">
              <div className="flex flex-col gap-4">
                {FEATURE_CARDS.map((card) => (
                  <div key={card.title} className="flex items-start gap-3">
                    <span className="text-[22px] leading-none mt-0.5">{card.icon}</span>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">
                        {card.title}
                      </p>
                      <p className="text-[12px] text-foreground-tertiary mt-1 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => openLoginModal()}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary-hover transition-colors duration-150 shadow-primary-btn"
        >
          로그인하고 시작하기 →
        </button>
      </div>
      <ChatInput isDisabled />
    </>
  );
}

// ── ChatPanel (root) ───────────────────────────────────────────
export default function ChatPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPinCached, verifyAndCachePin } = usePinAuth();
  const { isAuthenticated, isRestoring } = useAuthStore();
  const [messages, setMessages] = useState(loadMessages);
  const [toasts, setToasts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggIdx, setActiveSuggIdx] = useState(-1);
  const bottomRef = useRef(null);
  const lastFailedTextRef = useRef(null);
  const toastTimersRef = useRef(new Map());
  const suggDebounceRef = useRef(null);
  const openWidgetDetail = useWidgetDetailStore((s) => s.open);
  // 복원 완료 후 isAuthenticated의 이전 값 추적 (null = 복원 전)
  const prevIsAuthRef = useRef(null);

  const { pendingQuery, consumePendingQuery } = usePendingQueryStore();
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: 'chat-dropzone' });


  // 메시지 변경 시 sessionStorage에 저장
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // 실제 로그인/로그아웃 시에만 메시지 초기화
  // isRestoring 중에는 건너뛰고, 복원 완료 후 실제 변경만 감지
  useEffect(() => {
    if (isRestoring) return;

    const prev = prevIsAuthRef.current;
    prevIsAuthRef.current = isAuthenticated;

    // 복원 직후 첫 세팅은 초기화하지 않음 (새로고침 대화 유지)
    if (prev === null) return;

    // 실제 로그인 or 로그아웃
    if (prev !== isAuthenticated) {
      const fresh = getInitialMessages();
      setMessages(fresh);
      saveMessages(fresh);
      setIsTyping(false);
      lastFailedTextRef.current = null;
    }
  }, [isAuthenticated, isRestoring]);

  // 새 메시지마다 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // draft 변경 시 종목 자동완성 검색 (300ms 디바운스)
  useEffect(() => {
    clearTimeout(suggDebounceRef.current);
    if (draft.trim().length === 0) {
      setSuggestions([]);
      setActiveSuggIdx(-1);
      return;
    }
    suggDebounceRef.current = setTimeout(async () => {
      const keyword = draft.trim().toLowerCase();

      // 위젯 단축키 매칭 (정적, API 불필요)
      const widgetItems = WIDGET_SHORTCUTS
        .filter(w => w.keywords.some(k => k.startsWith(keyword) || keyword.startsWith(k)))
        .map(w => ({ key: w.key, label: w.label, widgetTypeId: w.widgetTypeId, Icon: w.Icon, config: {} }));

      // 위젯 매칭 있으면 종목 검색 스킵
      if (widgetItems.length > 0) {
        setSuggestions(widgetItems);
        setActiveSuggIdx(-1);
        return;
      }

      // 종목 검색
      const results = await marketApi.searchStocks(draft.trim()).catch(() => []);
      const stockItems = results.slice(0, 1).flatMap((stock) => [
        { key: `${stock.stockCode}-price`, label: `${stock.stockName} 주가`, widgetTypeId: "stock-chart", stock },
        { key: `${stock.stockCode}-news`,  label: `${stock.stockName} 뉴스`, widgetTypeId: "stock-news",  stock },
      ]);

      setSuggestions(stockItems);
      setActiveSuggIdx(-1);
    }, 300);
    return () => clearTimeout(suggDebounceRef.current);
  }, [draft]);

  function handleSuggestionSelect(sugg) {
    openWidgetDetail({
      widgetTypeId: sugg.widgetTypeId,
      config: sugg.stock ? {
        stockCode:    sugg.stock.stockCode,
        stockName:    sugg.stock.stockName,
        marketType:   sugg.stock.marketType,
        exchangeCode: sugg.stock.exchangeCode,
        widgetPeriod: "1D",
      } : (sugg.config ?? {}),
    });
    setSuggestions([]);
    setActiveSuggIdx(-1);
    setDraft("");
  }

  function handleSuggestionKeyDown(e) {
    if (suggestions.length === 0) return false;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggIdx((prev) => Math.max(-1, prev - 1));
      return true;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggIdx((prev) => Math.min(suggestions.length - 1, prev + 1));
      return true;
    }
    if (e.key === "Escape") {
      setSuggestions([]);
      setActiveSuggIdx(-1);
      return true;
    }
    if (e.key === "Enter" && activeSuggIdx >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[activeSuggIdx]);
      return true;
    }
    return false;
  }

  useEffect(() => () => {
    toastTimersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    toastTimersRef.current.clear();
  }, []);

  const dismissToast = useCallback((toastId) => {
    const timerId = toastTimersRef.current.get(toastId);
    if (timerId) {
      window.clearTimeout(timerId);
      toastTimersRef.current.delete(toastId);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const pushToast = useCallback((toast, duration = 3200) => {
    const toastId = Date.now() + Math.random();
    const nextToast = {
      id: toastId,
      ...toast,
    };

    setToasts((prev) => [...prev, nextToast]);

    const timerId = window.setTimeout(() => {
      dismissToast(toastId);
    }, duration);
    toastTimersRef.current.set(toastId, timerId);
  }, [dismissToast]);

  const pushOrderToast = useCallback((stockName, side, quantity) => {
    pushToast({
      type: "order-success",
      title: "주문 접수 완료",
      name: stockName,
      side,
      quantity,
    });
  }, [pushToast]);

  const pushErrorToast = useCallback((message, title = "주문 처리 실패") => {
    pushToast({
      type: "error",
      title,
      message,
    }, 3600);
  }, [pushToast]);

  const pushExchangeToast = useCallback((result) => {
    pushToast({
      type: "exchange-success",
      title: "환전 완료",
      message: `${formatExchangeAmount(result.fromCurrency, result.requestAmount)}를 ${formatExchangeAmount(result.toCurrency, result.receiveAmount)}로 환전했습니다.`,
    });
  }, [pushToast]);

  const appendOrderCardMessage = useCallback(async (data) => {
    const searchResults = await marketApi.searchStocks(data.stock_code).catch(() => []);
    const info =
      searchResults.find((item) => item.stockCode === data.stock_code) ??
      searchResults[0] ??
      null;
    const marketType = data.market_type ?? info?.marketType ?? null;
    const exchangeCode = info?.exchangeCode ?? null;

    if (!marketType) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "ai",
          text: "종목 정보를 찾지 못해 주문 카드를 열지 못했습니다. 잠시 후 다시 시도해 주세요.",
          time: getTimestamp(),
        },
      ]);
      return;
    }

    const priceData = await (
      isForeignMarketType(marketType)
        ? foreignMarketApi.getCurrentPrice(
            data.stock_code,
            getExchcd(exchangeCode ?? (marketType === "NYSE" ? "NYS" : marketType === "AMEX" ? "AMS" : "NAS")),
          )
        : marketApi.getCurrentPrice(data.stock_code)
    ).catch(() => null);

    const normalizedPrice = normalizeOrderCardPriceData(marketType, priceData);
    const stock = {
      name: info?.stockName ?? data.stock_code,
      stockCode: data.stock_code,
      marketType,
      exchangeCode,
      price: normalizedPrice.price,
      changeRate: normalizedPrice.changeRate,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "order",
        stock,
        requestKeyBase: buildClientOrderSeed(),
        time: getTimestamp(),
      },
    ]);
  }, []);

  const appendExchangeCardMessage = useCallback(async () => {
    try {
      const summary = await balanceApi.getBalanceSummary();
      const cashList = summary?.cashBalances ?? [];
      const krw = cashList.find((balance) => balance.currencyCode === "KRW");
      const usd = cashList.find((balance) => balance.currencyCode === "USD");

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "exchange",
          krwBalance: Number(krw?.availableAmount ?? 0),
          usdBalance: Number(usd?.availableAmount ?? usd?.totalAmount ?? 0),
          isPending: false,
          time: getTimestamp(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "ai",
          text: "환전 카드를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          time: getTimestamp(),
        },
      ]);
    }
  }, []);

  const handleSend = useCallback(async (text, stockCode = null, stockName = null) => {
    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      time: getTimestamp(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const data = await chatApi.sendMessage(text, stockCode, stockName);
      lastFailedTextRef.current = null;

      const INFO_CARD_TYPES = ['index', 'ranking', 'balance', 'exchange_rate', 'market_overview', 'portfolio', 'trade_history', 'trade-history'];
      const NEWS_CARD_TYPES = ['stock_news'];

      if (data.type === "order" && data.stock_code) {
        await appendOrderCardMessage(data);
      } else if (data.type === "exchange") {
        await appendExchangeCardMessage();
      } else if (data.type === "stock_price" && data.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: 'stock_price',
            stockCode: data.data.stock_code,
            stockName: data.data.stock_name,
            marketType: data.data.market_type,
            exchangeCode: data.data.exchange_code,
            time: getTimestamp(),
          },
        ]);
      } else if (NEWS_CARD_TYPES.includes(data.type)) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: 'news_card',
            text: data.reply,
            stockCode: data.stock_code ?? null,
            stockName: data.stock_name ?? null,
            time: getTimestamp(),
          },
        ]);
      } else if (INFO_CARD_TYPES.includes(data.type)) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: 'info_card',
            infoType: data.type,
            text: data.reply,
            time: getTimestamp(),
          },
        ]);
      } else if (data.reply && /━/.test(data.reply)) {
        const inferredInfoType = inferInfoTypeFromPrompt(text)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: 'info_card',
            infoType: inferredInfoType ?? 'market_overview',
            text: data.reply,
            time: getTimestamp(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), role: "ai", text: data.reply, time: getTimestamp() },
        ]);
      }
    } catch {
      lastFailedTextRef.current = { text, stockCode, stockName };
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "ai",
          text: "응답을 가져오지 못했습니다.",
          time: getTimestamp(),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [appendExchangeCardMessage, appendOrderCardMessage]);

  // 대시보드 위젯 → 채팅 드롭 시 자동 질의 전송
  useEffect(() => {
    if (!pendingQuery || !isAuthenticated) return
    const { text, stockCode, stockName } = pendingQuery
    consumePendingQuery()
    handleSend(text, stockCode, stockName)
  }, [pendingQuery, isAuthenticated, consumePendingQuery, handleSend])

  const handleRetry = useCallback(() => {
    const failed = lastFailedTextRef.current;
    if (!failed) return;
    setMessages((prev) => prev.filter((m) => !m.isError));
    handleSend(failed.text, failed.stockCode, failed.stockName);
  }, [handleSend]);

  const handlePinClose = useCallback((messageId, sourceOrderId) => {
    setMessages((prev) => prev
      .filter((message) => (
        message.id !== messageId
        && !(message.type === 'pin' && message.sourceOrderId === sourceOrderId)
      ))
      .map((message) => {
        if (message.id !== sourceOrderId) {
          return message;
        }

        return {
          ...message,
          pendingPin: false,
        };
      }));
  }, []);

  const handlePinSuccess = useCallback((messageId, sourceOrderId, stockName, side, quantity) => {
    setMessages((prev) => prev
      .filter((message) => (
        message.id !== messageId
        && !(message.type === 'pin' && message.sourceOrderId === sourceOrderId)
      ))
      .map((message) => {
        if (message.id !== sourceOrderId) {
          return message;
        }

        return {
          ...message,
          pendingPin: false,
        };
      }));
    pushOrderToast(stockName, side, quantity);
  }, [pushOrderToast]);

  const handlePinError = useCallback((message) => {
    pushErrorToast(message, '계좌 비밀번호 확인');
  }, [pushErrorToast]);

  const applyExchangeResultToMessage = useCallback((sourceExchangeId, result) => {
    const nextKrwBalance = result.fromCurrency === 'KRW'
      ? Number(result.fromBalanceAfter)
      : Number(result.toBalanceAfter);
    const nextUsdBalance = result.fromCurrency === 'USD'
      ? Number(result.fromBalanceAfter)
      : Number(result.toBalanceAfter);

    setMessages((prev) => prev.map((message) => {
      if (message.id !== sourceExchangeId || message.type !== 'exchange') {
        return message;
      }

      return {
        ...message,
        krwBalance: Number.isFinite(nextKrwBalance) ? nextKrwBalance : message.krwBalance,
        usdBalance: Number.isFinite(nextUsdBalance) ? nextUsdBalance : message.usdBalance,
        isPending: false,
      };
    }));
  }, []);

  const setExchangePending = useCallback((sourceExchangeId, isPending) => {
    setMessages((prev) => prev.map((message) => {
      if (message.id !== sourceExchangeId || message.type !== 'exchange') {
        return message;
      }

      return {
        ...message,
        isPending,
      };
    }));
  }, []);

  const runExchangeFlow = useCallback(async (sourceExchangeId, payload, options = {}) => {
    const startedAt = Date.now();
    let pinVerified = false;
    setExchangePending(sourceExchangeId, true);

    try {
      if (options.pin) {
        await verifyAndCachePin(options.pin, options.rememberPin);
        pinVerified = true;
      }

      const result = await exchangeApi.exchange(payload.fromCurrency, payload.toCurrency, payload.requestAmount);
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      await waitForMinimumDelay(startedAt);
      applyExchangeResultToMessage(sourceExchangeId, result);
      pushExchangeToast(result);
    } catch (err) {
      await waitForMinimumDelay(startedAt);
      if (options.pin && !pinVerified) {
        pushErrorToast(err?.message ?? '비밀번호가 올바르지 않습니다.', '계좌 비밀번호 확인');
      } else {
        pushErrorToast(err?.message ?? '환전을 실행하지 못했습니다.', '환전 실패');
      }
      throw err;
    } finally {
      setExchangePending(sourceExchangeId, false);
    }
  }, [applyExchangeResultToMessage, pushErrorToast, pushExchangeToast, queryClient, setExchangePending, verifyAndCachePin]);

  const handleExchangePinSuccess = useCallback(async (messageId, sourceExchangeId, payload) => {
    setMessages((prev) => prev
      .filter((message) => (
        message.id !== messageId
        && !(message.type === 'exchange-pin' && message.sourceExchangeId === sourceExchangeId)
      )));
    await runExchangeFlow(sourceExchangeId, payload, {
      pin: payload.pin,
      rememberPin: payload.rememberPin,
    });
  }, [runExchangeFlow]);

  async function handleOrderAction(messageId, stock, side, quantity, requestKeyBase) {
    const idempotencyKey = buildOrderIdempotencyKey(requestKeyBase, side, quantity);

    if (isPinCached()) {
      try {
        await orderApi.placeOrder({
          stockCode: stock.stockCode,
          marketType: stock.marketType,
          orderSide: ORDER_SIDE[side],
          orderKind: ORDER_KIND.market,
          orderChannel: 'CHAT',
          orderQuantity: quantity,
          idempotencyKey,
        });
        queryClient.invalidateQueries({ queryKey: ['balance'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        pushOrderToast(stock.name, side, quantity);
      } catch (err) {
        pushErrorToast(err?.message ?? '주문 접수에 실패했습니다.');
        throw err;
      }
    } else {
      setMessages((prev) => {
        const alreadyOpen = prev.some(
          (message) => message.type === 'pin' && message.sourceOrderId === messageId
        );

        if (alreadyOpen) {
          return prev;
        }

        return [
          ...prev.map((message) => {
            if (message.id !== messageId) {
              return message;
            }

            return {
              ...message,
              pendingPin: true,
            };
          }),
          {
            id: Date.now(),
            type: 'pin',
            sourceOrderId: messageId,
            stockCode: stock.stockCode,
            marketType: stock.marketType,
            name: stock.name,
            side,
            quantity,
            idempotencyKey,
            time: getTimestamp(),
          },
        ];
      });
    }
  }

  async function handleExchangeAction(messageId, payload) {
    if (isPinCached()) {
      await runExchangeFlow(messageId, payload);
      return;
    }

    setMessages((prev) => {
      const alreadyOpen = prev.some(
        (message) => message.type === 'exchange-pin' && message.sourceExchangeId === messageId
      );

      if (alreadyOpen) {
        return prev;
      }

      return [
        ...prev,
        {
          id: Date.now(),
          type: 'exchange-pin',
          sourceExchangeId: messageId,
          fromCurrency: payload.fromCurrency,
          toCurrency: payload.toCurrency,
          requestAmount: payload.requestAmount,
          time: getTimestamp(),
        },
      ];
    });
  }

  function handleOrderDetail(stock) {
    navigate(`/invest/${stock.stockCode}`, {
      state: buildInvestNavigationState({
        stockName: stock.name,
        marketType: stock.marketType,
        exchangeCode: stock.exchangeCode,
      }),
    });
  }

  return (
    <div ref={setDropRef} className={cn('flex flex-col h-full', isOver && 'ring-2 ring-primary ring-inset')}>
      <ChatHeader />
      {isRestoring || isAuthenticated ? (
        <>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            bottomRef={bottomRef}
            onRetry={handleRetry}
            onOrderAction={(msgId, stock, side, qty, key) => handleOrderAction(msgId, stock, side, qty, key)}
            onExchangeAction={(msgId, payload) => handleExchangeAction(msgId, payload)}
            onOrderDetail={handleOrderDetail}
            onPinClose={handlePinClose}
            onPinSuccess={(msgId, sourceOrderId, stockName, side, qty) => handlePinSuccess(msgId, sourceOrderId, stockName, side, qty)}
            onExchangePinSuccess={(msgId, sourceExchangeId, payload) => handleExchangePinSuccess(msgId, sourceExchangeId, payload)}
            onPinError={handlePinError}
          />
          <ChatToastStack toasts={toasts} onClose={dismissToast} />
          <div className="relative shrink-0">
            <ChatSuggestions
              suggestions={suggestions}
              activeIndex={activeSuggIdx}
              onSelect={handleSuggestionSelect}
            />
            <ChatInput
              value={draft}
              onChange={setDraft}
              onSend={handleSend}
              onSuggestionKeyDown={handleSuggestionKeyDown}
              isDisabled={isTyping}
              isSending={isTyping}
            />
          </div>
        </>
      ) : (
        <LoginPrompt />
      )}
    </div>
  );
}
