import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LiveDot from "@/components/ui/LiveDot";
import useAuthStore from "@/store/useAuthStore";
import { chatApi } from "@/api/chat";
import ChatOrderCard from "@/components/layout/ChatOrderCard";
import ChatExchangeCard from "@/components/layout/ChatExchangeCard";
import { marketApi } from "@/api/market";
import { balanceApi } from "@/api/balance";

function getTimestamp() {
  return new Date().toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const STORAGE_KEY = "chat_messages";

// ── 초기 웰컴 메시지 ──────────────────────────────────────────
function getInitialMessages() {
  return [
    {
      id: Date.now(),
      role: "ai",
      text: "안녕하세요! 저는 SOL AI 어시스턴트입니다. ",
      time: getTimestamp(),
    },
  ];
}

function loadMessages() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return getInitialMessages();
}

function saveMessages(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {}
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
      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-brand-glow-sm">
        <MessageCircle className="w-4.5 h-4.5 text-white" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-bold text-foreground">
          SOL AI 어시스턴트
        </span>
        <div className="flex items-center gap-1">
          <LiveDot />
          <span className="text-[10px] text-live">온라인 · 즉시 응답</span>
        </div>
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
function ChatBubble({
  role,
  text,
  time,
  isTyping = false,
  isError = false,
  onRetry,
}) {
  const isAI = role === "ai";

  return (
    <div
      className={`flex animate-bubble-in ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div
        className="flex flex-col gap-1"
        style={{
          maxWidth: "85%",
          alignItems: isAI ? "flex-start" : "flex-end",
        }}
      >
        <div
          className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
            isAI
              ? "bg-surface-muted text-foreground rounded-[0_16px_16px_16px]"
              : "bg-primary text-white rounded-[16px_0_16px_16px]"
          }`}
        >
          {isTyping ? (
            // DESIGN.md §16: dot 3개, w-1.25 h-1.25, pulse-dot 0/150/300ms
            <div className="flex items-center gap-1 py-0.5">
              <span
                className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.25 h-1.25 rounded-full bg-foreground-disabled animate-pulse-dot"
                style={{ animationDelay: "300ms" }}
              />
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
        <div className="flex items-center gap-2">
          {time && !isTyping && (
            <span className="text-[9px] text-foreground-disabled">{time}</span>
          )}
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="text-[9px] text-primary hover:underline cursor-pointer"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ChatMessages ───────────────────────────────────────────────
function ChatMessages({ messages, isTyping, bottomRef, onRetry }) {
  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
      {messages.map((msg) => {
        // 주문 카드
        if (msg.type === 'order' && msg.stock) {
          return (
            <div key={msg.id} className="flex flex-col gap-1">
              <ChatOrderCard {...msg.stock} />
              {msg.time && (
                <span className="text-[9px] text-foreground-disabled">{msg.time}</span>
              )}
            </div>
          )
        }
        // 환전 카드
        if (msg.type === 'exchange') {
          return (
            <div key={msg.id} className="flex flex-col gap-1">
              <ChatExchangeCard krwBalance={msg.krwBalance} usdBalance={msg.usdBalance} />
              {msg.time && (
                <span className="text-[9px] text-foreground-disabled">{msg.time}</span>
              )}
            </div>
          )
        }
        // 일반 말풍선
        return (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            text={msg.text}
            time={msg.time}
            isError={msg.isError}
            onRetry={msg.isError ? onRetry : undefined}
          />
        )
      })}
      {isTyping && <ChatBubble role="ai" isTyping />}
      {/* 자동 스크롤 앵커 */}
      <div ref={bottomRef} />
    </div>
  );
}

// ── ChatInput ──────────────────────────────────────────────────
// DESIGN.md §16: bg-background border-stroke-input rounded-2xl px-3.5 py-2.5
// 전송버튼: 빈 입력 → bg-surface-muted cursor-not-allowed / 입력 있음 → bg-primary
// textarea: 입력 내용에 따라 높이 자동 증가, 최대 5줄, Shift+Enter 줄바꿈
function ChatInput({ isDisabled = false, onSend }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);
  const canSend = value.trim().length > 0 && !isDisabled;

  // 내용에 따라 textarea 높이 자동 조절
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function handleSend() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    // 전송 후 높이 초기화
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e) {
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
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        placeholder={
          isDisabled
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

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-brand-glow-sm">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">
              SOL AI 어시스턴트
            </p>
            <p className="text-[11px] text-foreground-tertiary mt-1 leading-relaxed">
              대화를 통해 증권 서비스를
              <br />
              빠르게 이용해보세요.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {FEATURE_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-surface-subtle border border-stroke rounded-xl px-3.5 py-3 flex items-start gap-3"
            >
              <span className="text-base leading-none mt-0.5">{card.icon}</span>
              <div>
                <p className="text-[12px] font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="text-[11px] text-foreground-tertiary mt-0.5">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
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
  const { isAuthenticated, isRestoring } = useAuthStore();
  const [messages, setMessages] = useState(loadMessages);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const lastFailedTextRef = useRef(null);
  // 복원 완료 후 isAuthenticated의 이전 값 추적 (null = 복원 전)
  const prevIsAuthRef = useRef(null);

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

  const handleSend = useCallback(async (text) => {
    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      time: getTimestamp(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const data = await chatApi.sendMessage(text);
      lastFailedTextRef.current = null;

      // 말풍선 먼저 추가
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "ai", text: data.reply, time: getTimestamp() },
      ]);

      if (data.type === "order" && data.stock_code) {
        // 종목 검색 + 현재가 병렬 조회
        const [searchResults, priceData] = await Promise.all([
          marketApi.searchStocks(data.stock_code),
          marketApi.getCurrentPrice(data.stock_code),
        ]);
        const info = searchResults?.[0];
        const stock = {
          name: info?.stockName ?? data.stock_code,
          stockCode: data.stock_code,
          marketType: info?.marketType ?? "KOSPI",
          price: priceData?.currentPrice ?? 0,
          changeRate: priceData?.changeRate ?? 0,
        };
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), type: "order", stock, time: getTimestamp() },
        ]);
      } else if (data.type === "exchange") {
        // 잔고 조회 후 환전 카드를 채팅 메시지로 추가
        const summary = await balanceApi.getBalanceSummary();
        const cashList = summary?.cashBalances ?? [];
        const krw = cashList.find((b) => b.currencyCode === "KRW");
        const usd = cashList.find((b) => b.currencyCode === "USD");
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "exchange",
            krwBalance: Number(krw?.availableAmount ?? 0),
            usdBalance: Number(usd?.totalAmount ?? 0),
            time: getTimestamp(),
          },
        ]);
      }
    } catch {
      lastFailedTextRef.current = text;
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
  }, []);

  const handleRetry = useCallback(() => {
    const text = lastFailedTextRef.current;
    if (!text) return;
    setMessages((prev) => prev.filter((m) => !m.isError));
    handleSend(text);
  }, [handleSend]);

  return (
    <>
      <ChatHeader />
      {isRestoring || isAuthenticated ? (
        <>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            bottomRef={bottomRef}
            onRetry={handleRetry}
          />
          <ChatInput onSend={handleSend} />
        </>
      ) : (
        <LoginPrompt />
      )}
    </>
  );
}
