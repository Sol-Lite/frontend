# Chat UI 작업 노트

> 작업일: 2026-03-25
> 파일: `src/components/layout/ChatPanel.jsx`, `src/api/chat.js`, `vite.config.js`

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| `src/components/layout/ChatPanel.jsx` | 채팅 패널 메인 컴포넌트 |
| `src/components/layout/RightPanel.jsx` | ChatPanel을 포함하는 우측 패널 컨테이너 |
| `src/api/chat.js` | 채팅 API 호출 |
| `src/store/useRightPanelStore.js` | 우측 패널 탭 상태 |
| `src/store/useAuthStore.js` | 인증 상태 (로그인 여부, 토큰) |
| `src/lib/fetchWithAuth.js` | 인증 헤더 자동 주입 + 401 토큰 갱신 |

---

## 컴포넌트 구조

```
ChatPanel
├── ChatHeader          — AI 아이콘, 제목, 온라인 상태
├── ChatMessages        — 메시지 목록 + 자동 스크롤
│   └── ChatBubble      — AI/사용자 말풍선, 타이핑 인디케이터, 에러
├── ChatInput           — textarea 입력창, 전송 버튼
└── LoginPrompt         — 비로그인 유도 화면 (ChatMessages 대체)
```

---

## DESIGN.md 적용 내역 (§16 Chat UI 규칙)

### ChatHeader
- AI 아이콘: `w-9 h-9 rounded-xl bg-primary shadow-brand-glow-sm` + `MessageCircle w-4.5 h-4.5`
- 제목: `"SOL AI 어시스턴트"` `text-[13px] font-bold`
- 상태: `LiveDot` + `"온라인 · 즉시 응답"` `text-[10px] text-live`

### ChatBubble
- AI 말풍선: `bg-surface-muted rounded-[0_16px_16px_16px]` (좌상단만 각짐)
- 사용자 말풍선: `bg-primary text-white rounded-[16px_0_16px_16px]` (우상단만 각짐)
- 공통: `px-3.5 py-2.5 text-[13px] leading-relaxed animate-bubble-in`
- 타임스탬프: `text-[9px] text-foreground-disabled`
- 타이핑 인디케이터: dot 3개 `w-1.25 h-1.25 bg-foreground-disabled animate-pulse-dot` (0 / 150 / 300ms delay)
- 에러 말풍선: `isError` 플래그 + "다시 시도" 버튼

### ChatInput
- 컨테이너: `bg-background border border-stroke-input rounded-2xl px-3.5 py-2.5`
- `textarea rows={1}` — 자동 높이 증가, `maxHeight: 100px` 초과 시 스크롤
- 전송 버튼 `w-7 h-7 rounded-xl`: 입력 있음 → `bg-primary`, 빈 입력 → `bg-surface-muted cursor-not-allowed`
- `Enter` 전송, `Shift+Enter` 줄바꿈
- 한글 IME 버그 수정: `e.nativeEvent.isComposing` 체크

### LoginPrompt (비로그인)
- AI 아이콘: `w-16 h-16 rounded-2xl bg-primary shadow-brand-glow-sm`
- 기능 소개 카드 3개: `bg-surface-subtle border border-stroke rounded-xl`
- 로그인 버튼: full-width `bg-primary` `"로그인하고 시작하기 →"`
- 하단 ChatInput: `isDisabled` (opacity-60, 잠금 placeholder)

---

## 동적 동작

### 메시지 상태 관리
- `useState(loadMessages)` — sessionStorage에서 복원
- 전송 시 사용자 메시지 즉시 추가 → API 응답 후 AI 메시지 추가
- `isTyping` 상태로 타이핑 인디케이터 제어

### 자동 스크롤
- `bottomRef` (투명 div) + `scrollIntoView({ behavior: 'smooth' })`
- `messages`, `isTyping` 변경 시 자동 실행

### 에러 처리
- API 실패 시 에러 말풍선 표시 + "다시 시도" 버튼
- `lastFailedTextRef`에 마지막 실패 텍스트 저장
- 재시도 클릭 시 에러 메시지 제거 후 재전송

### 메시지 영속성 (sessionStorage)
- 메시지 변경마다 `sessionStorage('chat_messages')` 저장
- 새로고침 시 복원 → 대화 유지
- 탭 닫기 시 자동 소멸

### 로그인/로그아웃 시 초기화
```
새로고침 (auth 복원): prevIsAuthRef === null → 건너뜀 (대화 유지)
실제 로그인/로그아웃:  prev !== isAuthenticated → 메시지 초기화
```
- `isRestoring` 중에는 effect 무시
- `prevIsAuthRef`로 이전 인증 상태 추적

---

## API 연동

### 엔드포인트
```
POST /chat
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:  { "message": "string" }
Response: { "reply": "string" }
```

### Vite 프록시 (`vite.config.js`)
```js
'/chat': {
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
}
```
> 채팅 백엔드(8000)는 메인 백엔드(8080)와 별도 서버

### `src/api/chat.js`
- `fetchWithAuth` 사용 → Authorization 헤더 자동 주입 + 401 시 토큰 자동 갱신

---

## 남은 선택 작업

- [ ] 말풍선 연속 묶음 — 같은 발신자 연속 시 `gap-1`로 묶기 (현재 모두 `gap-3`)
