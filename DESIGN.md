# SOL Lite — Design System

> Tailwind CSS 기반 디자인 토큰 및 UI 규칙 문서.
> `src/front-mvp/` HTML 프로토타입에서 추출한 실제 값을 기준으로 한다.

---

## Scope Boundary

- 본 문서는 `src/front-mvp/` HTML 기준의 **desktop UI 전환 규칙**만 다룬다.
- 본 프로젝트는 **desktop-only** 기준으로 설계한다. 모바일/태블릿 전환 규칙은 현재 스코프에 포함하지 않는다.
- 모바일/태블릿 반응형 재설계는 현재 스코프에 포함하지 않는다.
- desktop 범위 내 resize 대응은 수행한다.
- 다크모드는 별도 theme layer로 확장 가능하도록 고려한다.
- 접근성 고도화 및 디자인 리프레시는 현재 스코프에 포함하지 않는다.

---

## Tailwind Token Mapping

> 코드 작성 시 하드코딩(`bg-[#0046FF]`) 대신 아래 Tailwind 클래스를 사용한다.
> 토큰은 `src/index.css`의 `@theme` 블록에 CSS 변수로 등록되어 있다.
> Tailwind v4: `--color-{name}` → `text-{name}` / `bg-{name}` / `border-{name}` 자동 생성.

| 의미 | Hex | Tailwind 클래스 |
|---|---|---|
| primary | `#0046FF` | `bg-primary` / `text-primary` / `border-primary` |
| primary-hover | `#0035CC` | `bg-primary-hover` |
| primary-light | `#EEF2FF` | `bg-primary-light` |
| primary-border | `#C7D2FE` | `border-primary-border` |
| up | `#E8393E` | `text-up` |
| up-bg | `#FFF0F1` | `bg-up-bg` |
| up-border | `#FFBFC1` | `border-up-border` |
| down | `#0075E8` | `text-down` |
| down-bg | `#EFF6FF` | `bg-down-bg` |
| down-border | `#BFDBFE` | `border-down-border` |
| live | `#12B76A` | `text-live` / `bg-live` |
| text-primary | `#191F28` | `text-foreground` |
| text-secondary | `#374151` | `text-foreground-secondary` |
| text-tertiary | `#6B7280` | `text-foreground-tertiary` |
| text-disabled | `#9CA3AF` | `text-foreground-disabled` |
| bg-app | `#F4F6FA` | `bg-background` |
| bg-surface | `#FFFFFF` | `bg-surface` |
| bg-subtle | `#F8F9FB` | `bg-surface-subtle` |
| bg-muted | `#F3F4F6` | `bg-surface-muted` |
| border | `#EAECF0` | `border-stroke` |
| border-subtle | `#F3F4F6` | `border-stroke-subtle` |
| border-input | `#E5E7EB` | `border-stroke-input` |

> `text-primary`가 Tailwind의 `text-primary`(=#0046FF)와 충돌하므로
> 텍스트 색상 토큰은 `foreground-*`, 배경은 `background`/`surface-*`, 보더는 `stroke-*`로 매핑한다.

사용 예시:
```jsx
// ❌ 하드코딩
<div className="bg-[#0046FF] text-[#191F28] border-[#EAECF0]" />

// ✅ 토큰 클래스 사용
<div className="bg-primary text-foreground border-stroke" />
```

---

## 1. Color Tokens

### Brand

| Token | Hex | 용도 |
|---|---|---|
| `primary` | `#0046FF` | CTA, 활성 상태, 브랜드 강조 |
| `primary-hover` | `#0035CC` | primary 버튼 hover |
| `primary-light` | `#EEF2FF` | active chip bg, icon bg |
| `primary-border` | `#C7D2FE` | active chip border |
| `primary-dim` | `#E0E7FF` | 연한 강조 border |
| `primary-gradient` | `linear-gradient(145deg, #0035CC 0%, #0046FF 50%, #2563EB 100%)` | signup 브랜드 패널 |

### Semantic — 주가 방향

| Token | Hex | 용도 |
|---|---|---|
| `up` | `#E8393E` | 상승 텍스트, ▲ |
| `up-bg` | `#FFF0F1` | 상승 뱃지 배경 |
| `up-border` | `#FFBFC1` | 상승 뱃지 테두리 |
| `down` | `#0075E8` | 하락 텍스트, ▼ |
| `down-bg` | `#EFF6FF` | 하락 뱃지 배경 |
| `down-border` | `#BFDBFE` | 하락 뱃지 테두리 |

> **한국 증권 관례**: 상승은 빨강(`#E8393E`), 하락은 파랑(`#0075E8`). 서구 관례와 반대임에 유의.

### Semantic — 상태

| Token | Hex | 용도 |
|---|---|---|
| `live` | `#12B76A` | 실시간 인디케이터, 온라인 상태 |
| `danger` | `#FF3B30` | 위젯 삭제 버튼 (iOS-style) |
| `warning` | `#FF9500` | 경고, SK 등 orange 계열 로고 |

### Neutral

| Token | Hex | 용도 |
|---|---|---|
| `text-primary` | `#191F28` | 본문 주요 텍스트 |
| `text-secondary` | `#374151` | 보조 텍스트, 레이블 |
| `text-tertiary` | `#6B7280` | 비활성 텍스트 |
| `text-disabled` | `#9CA3AF` | placeholder, 비활성 |
| `bg-app` | `#F4F6FA` | 앱 전체 배경 |
| `bg-surface` | `#FFFFFF` | 카드, 헤더, 사이드바 |
| `bg-subtle` | `#F8F9FB` | 행 hover, 내부 섹션 |
| `bg-muted` | `#F3F4F6` | 비활성 버튼, skeleton |
| `border` | `#EAECF0` | 컴포넌트 외곽선 |
| `border-subtle` | `#F3F4F6` | 테이블 구분선 |
| `border-input` | `#E5E7EB` | input 기본 테두리 |
| `scrollbar-thumb` | `#D1D5DB` | 스크롤바 thumb |

### Portfolio Palette (원형 차트 고정 색상)

```
#0046FF → #00A878 → #FF9500 → #EF4444 → #8B5CF6
```

---

## 2. Typography

### Font Family

```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
```

Tailwind 설정:
```js
// tailwind.config.js
fontFamily: {
  sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'sans-serif'],
}
```

CDN 로드:
```html
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
```

### Type Scale

| 이름 | px | Tailwind | 용도 |
|---|---|---|---|
| `2xs` | 9px | `text-[9px]` | 보조 라벨, 시가/고가/저가, 종목코드 |
| `xs` | 10px | `text-[10px]` | card-label, 뱃지, 날짜 |
| `sm` | 11px | `text-[11px]` | 아바타 이름, 보조 수치 |
| `base` | 12px | `text-xs` | 네비 버튼, input label, 버튼 |
| `md` | 13px | `text-[13px]` | 헤더 타이틀, 본문, chat 메시지 |
| `lg` | 14px | `text-sm` | input 값, primary 버튼 |
| `xl` | 15px | `text-[15px]` | 로고 텍스트, 환율 수치 |
| `2xl` | 18px | `text-[18px]` | 위젯 주가 수치 |
| `3xl` | 20px | `text-xl` | 모달 제목, 총 평가자산 |
| `hero` | 30px | `text-[30px]` | 브랜드 카피 (signup) |

### Font Weight

| 이름 | 값 | 용도 |
|---|---|---|
| `medium` | 500 | 일반 강조 |
| `semibold` | 600 | label, chip, 보조 버튼 |
| `bold` | 700 | 버튼, 헤더, 수치 |
| `extrabold` | 800 | 모달 제목, 브랜드 카피 |
| `black` | 900 | 총 자산 수치, hero |

### Letter Spacing

- 카드 레이블 (card-label): `tracking-[.04em]` + `uppercase`
- 브랜드 카피: `tracking-tight` (`letter-spacing: -.5px`)
- 로고 텍스트: `tracking-tight`

---

## 3. Spacing

| 용도 | 값 |
|---|---|
| 위젯 그리드 gap | `10px` |
| 카드 내부 padding | `14px 16px` |
| 헤더 좌우 padding | `px-4` (16px) |
| 섹션 내부 행 간격 | `gap-1.5` ~ `gap-2.5` |
| 모달 내부 padding | `24px` |
| 채팅 패널 padding | `p-3.5` |
| 사이드바 padding | `14px 0` |
| 폼 필드 간격 | `18px` |

---

## 4. Border / Radius / Shadow

### Border Radius

| 컴포넌트 | 값 | Tailwind |
|---|---|---|
| 위젯 카드 | `16px` | `rounded-2xl` |
| 위젯 카드 (내부 섹션) | `12px` | `rounded-xl` |
| primary 버튼 | `12px` | `rounded-xl` |
| 입력 필드 | `10px` | `rounded-[10px]` |
| 로그인 모달 | `6px` | `rounded-[6px]` |
| 회원가입 모달 | `12px` | `rounded-xl` |
| 네비 탭 그룹 | `12px` | `rounded-xl` |
| 네비 탭 아이템 | `8px` | `rounded-lg` |
| 로고 아이콘 | `9px` | `rounded-[9px]` |
| 사이드바 아이콘 | `12px` | `rounded-xl` |
| tab-chip | `6px` | `rounded-[6px]` |
| filter-chip | `20px` | `rounded-full` |
| 아바타 | `50%` | `rounded-full` |
| 종목 로고 원 | `50%` | `rounded-full` |
| 스텝 인디케이터 | `50%` | `rounded-full` |
| 삭제 버튼 (edit) | `50%` | `rounded-full` |

### Border

- **기본**: `border border-stroke` (1px)
- **입력**: `border-[1.5px] border-stroke-input`
- **활성 칩/버튼**: `border-[1.5px] border-primary`
- **위젯 편집모드**: `border-[1.5px] border-dashed border-stroke-input`
- **위젯 추가 슬롯**: `border-2 border-dashed border-primary-border`
- **구분선**: `border-b border-stroke`
- **테이블 행**: `border-b border-stroke-subtle`

### Shadow

| 용도 | 값 |
|---|---|
| 로고 아이콘 | `shadow-[0_0_14px_rgba(0,70,255,.35)]` |
| AI 채팅 아이콘 | `shadow-[0_0_14px_rgba(0,70,255,.30)]` |
| primary 버튼 | `shadow-[0_4px_14px_rgba(0,70,255,.25)]` |
| 위젯 카드 hover | `shadow-[0_4px_16px_rgba(0,70,255,.08)]` |
| 위젯 편집모드 | `shadow-[0_4px_14px_rgba(0,0,0,.07)]` |
| 로그인 모달 | `shadow-[0_20px_50px_rgba(0,0,0,.22)]` |
| input focus ring | `shadow-[0_0_0_3px_rgba(0,70,255,.08)]` |
| 네비 활성 아이템 | `shadow-sm` |
| 위젯 picker hover | `shadow-[0_0_0_3px_rgba(0,70,255,.07)]` |

---

## 5. Viewport & Scaling Rules

본 프로젝트는 **desktop-only + fixed-layout hybrid** 구조를 따른다.
주요 shell 영역(Header, Sidebar, ChatPanel)은 고정값을 사용하고, MainContent는 유동폭으로 처리한다.
spacing은 비율 단위보다 tokenized fixed spacing을 우선 사용한다.

### 지원 범위

| 항목 | 값 |
|---|---|
| 최소 창 너비 | `1280px` |
| 권장 해상도 | `1440px` 이상 |
| 최대 보장 브라우저 줌 | `125%` (이상은 일부 클리핑 허용) |
| 권장 브라우저 줌 | `100%` |

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

```css
/* index.css */
html { min-width: 1280px; } /* 1280px 미만: 수평 스크롤, 레이아웃 고정 */
```

### 고정 요소 (절대값 유지, 창 크기와 무관)

| 요소 | 고정값 |
|---|---|
| AppHeader height | `54px` |
| Sidebar width | `56px` |
| ChatPanel width | `368px` |

### 유동 요소 (남은 공간을 채움)

| 요소 | 규칙 |
|---|---|
| MainContent | `flex: 1`, `min-width: 0` |
| 위젯 그리드 셀 | `1fr` (그리드 내에서 균등 분할) |
| AppHeader 중앙 여백 | `flex-1` (로고~nav / 유저영역 사이) |

### 창 너비별 동작

```
1280px: MainContent = 1280 - 56 - 368 = 856px / 4열 그리드 셀 ≈ 206px
1440px: MainContent = 1440 - 56 - 368 = 1016px / 4열 그리드 셀 ≈ 246px
1920px: MainContent = 1920 - 56 - 368 = 1496px / 4열 그리드 셀 ≈ 366px
```

- 위젯 그리드는 4열 고정. 셀이 넓어질수록 위젯 내부 여백이 자연스럽게 늘어남
- 열 추가/변경은 현재 스코프 밖 (향후 1600px+ 대응 시 검토)

### 브라우저 줌 대응

줌 시 `100vh`, `height: calc(100vh - 54px)` 기반 레이아웃은 논리 뷰포트 기준으로 동작한다.

| 줌 레벨 | 논리 뷰포트 (1440px 기준) | 동작 |
|---|---|---|
| 100% | 1440px | 정상 |
| 125% | 1152px | 정상 (min-width 1280px 미달 → 수평 스크롤) |
| 150% | 960px | 수평 스크롤 발생, 보장 범위 밖 |

> `min-width: 1280px`을 `<html>`에 설정하면 줌 확대로 뷰포트가 좁아질 때 레이아웃이 깨지지 않고 스크롤로 처리된다.

### OS 디스플레이 스케일링

- Mac Retina (2x), Windows 125%/150% 모두 **논리 픽셀 기준**으로 설계
- `px` 단위 사용 유지 — Retina에서 `1px` 보더, `9px` 텍스트 선명하게 렌더링됨
- `rem` 기반 스케일링은 사용하지 않음 (OS 폰트 크기 설정에 의한 레이아웃 틀어짐 방지)

---

## 6. Layout Rules

### 전체 구조

```
┌─────────────────────────────────────────┐
│  AppHeader (height: 54px, bg: #fff)      │
├────┬───────────────────────┬────────────┤
│    │                       │            │
│ S  │   MainContent         │  ChatPanel │
│ i  │   (flex: 1)           │  (368px)   │
│ d  │                       │            │
│    │                       │            │
└────┴───────────────────────┴────────────┘
```

- **AppHeader**: `height: 54px`, `bg-white`, `border-b border-[#EAECF0]`, `z-50`
- **AppBody**: `height: calc(100vh - 54px)`, `overflow: hidden`
- **Sidebar**: `width: 56px`, `bg-white`, `border-r border-[#EAECF0]` — 홈 화면에서만 존재
- **ChatPanel**: `width: 368px`, `flex-shrink: 0`, `bg-white`, `border-l border-[#EAECF0]`
- **MainContent**: `flex: 1`, `min-width: 0`, `overflow: hidden`

### Scrollbar

```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-stroke-subtle); border-radius: 4px; }
```

Tailwind 커스텀 유틸리티로 등록 권장:
```js
// scrollbar-thin 플러그인 or @layer utilities에 추가
```

---

## 7. Widget 규칙

### 그리드

```css
display: grid;
grid-template-columns: repeat(4, 1fr);
grid-template-rows: repeat(3, 1fr);
gap: 10px;
height: 100%;
```

- 기본 1칸: `grid-column: span 1`
- 넓은 위젯: `grid-column: span 2`
- 현재 3행 고정 (스크롤 없음)

### 위젯 카드 — 일반 상태

```
bg-white, border border-[#EAECF0], rounded-2xl, p-[14px_16px]
flex flex-col, overflow-hidden, cursor-pointer
transition: box-shadow .2s, border-color .2s, transform .15s
```

### 위젯 카드 — hover

```
border-color: #BFD0FF
shadow: 0 4px 16px rgba(0,70,255,.08)
transform: translateY(-1px)
```

### 위젯 카드 — 편집 모드

```
border: 1.5px dashed #C8CBD2
shadow: 0 4px 14px rgba(0,0,0,.07)
cursor: grab
animation: wiggle 0.55s ease-in-out infinite
```

```css
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg) translateY(0); }
  20%  { transform: rotate(-1.2deg) translateY(-1px); }
  60%  { transform: rotate(1.2deg) translateY(-1px); }
}
```

### 위젯 카드 — Locked (로그인 필요)

- 콘텐츠에 `opacity-20` 적용
- `LockedOverlay` 절대 위치로 덮음: `position: absolute; inset: 0; background: rgba(255,255,255,.85); backdrop-filter: blur(4px); border-radius: 16px`
- 아이콘 + 텍스트 + 로그인 버튼 포함

### 위젯 추가 슬롯

```
border: 2px dashed #C7D2FE, rounded-2xl
bg: rgba(238,242,255,.5)
hover → border-color: #0046FF, bg: #F0F4FF
```

### card-label

```
font-size: 10px, font-weight: 600, color: #9CA3AF
letter-spacing: .04em, text-transform: uppercase
```

---

## 8. Navigation / Tab 규칙

### AppHeader 메인 탭 (pill 스타일)

```
그룹: bg-[#F4F6FA] rounded-xl p-1, flex items-center gap-0.5
아이템 기본: px-4 py-1.5 text-[12px] text-[#9CA3AF] rounded-lg
아이템 hover: text-[#374151]
아이템 active: bg-white text-[#191F28] font-semibold shadow-sm
```

### Sidebar 아이콘 탭 (홈 화면)

```
아이콘 컨테이너: w-10 h-10 rounded-xl cursor-pointer
기본: color #9CA3AF, bg transparent
hover: bg #F3F4F6, color #374151
active: bg #EEF2FF, color #0046FF
```

### TabChip (위젯 내 소형 탭)

```
padding: 3px 9px, font-size: 10px, font-weight: 600, border-radius: 6px
기본: bg transparent, color #9CA3AF
active: bg #EEF2FF, color #0046FF
```

### FilterChip (시세 페이지 필터)

```
padding: 4px 12px, border-radius: 20px, font-size: 11px, font-weight: 600
기본: bg #F3F4F6, color #6B7280
hover: bg #E5E7EB
active: bg #0046FF, color #fff
```

### PeriodChip (차트 기간 선택)

```
padding: 3px 9px, border-radius: 6px, font-size: 10px, font-weight: 600
기본: bg transparent, color #9CA3AF
active: bg #191F28, color #fff
```

### UnderlineTab (시세/투자 페이지 서브 탭)

```
padding: 10px 12px, font-size: 12px
기본: color #9CA3AF, border: none, bg: none
active: font-weight 700, color #0046FF, border-bottom: 2px solid #0046FF
```

### OrderTypeButton (주문 유형: 매수/매도/정정)

```
flex: 1, padding: 7px, border-radius: 9px, font-size: 12px
기본: border 1.5px solid #E5E7EB, bg #fff, color #6B7280
active: border-color #0046FF, bg #EEF2FF, color #0046FF, font-weight 700
```

---

## 9. Modal / Sheet 규칙

### 로그인 모달 (login.html)

- 뒤 배경: 앱 화면 흐림 + `rgba(15,23,42,.5)` 딤 + `backdrop-filter: blur(6px)`
- 모달 컨테이너: `max-width: 400px`, `bg-white`, `rounded-[6px]`, `shadow-[0_20px_50px_rgba(0,0,0,.22)]`
- 등장 애니메이션:
```css
@keyframes modalIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 회원가입 (signup.html)

- 전체 화면 2-column 레이아웃 (브랜드 패널 44% + 폼 패널 56%) — desktop 기준으로 유지
- 스텝 인디케이터: 원형 dot + 연결선

### 공통 모달 규칙

| 항목 | 값 |
|---|---|
| 딤 오버레이 | `bg-black/50 backdrop-blur-sm` |
| z-index 딤 | 10 |
| z-index 모달 | 20 |
| 등장 방식 | `translateY(10px) → 0`, opacity 0→1, duration `.2s` |
| 닫기 버튼 | 우상단 `×`, color #9CA3AF |

---

## 10. Button / Input / Card 규칙

### Button

#### Primary

```
bg-[#0046FF] text-white font-bold
rounded-xl px-* py-*
shadow-[0_4px_14px_rgba(0,70,255,.25)]
hover: bg-[#0035CC]
transition-colors
```

#### Secondary (Ghost)

```
border border-[#0046FF] text-[#0046FF] font-semibold
rounded-xl
hover: bg-[#F5F7FF]
```

#### Neutral

```
bg-[#F3F4F6] border border-[#E5E7EB] text-[#374151] font-semibold
rounded-[10px]
```

#### Danger (위젯 삭제)

```
position: absolute; top: -8px; left: -8px
w-[22px] h-[22px] rounded-full
bg-[#FF3B30] text-white border-2 border-white
shadow-[0_2px_6px_rgba(0,0,0,.22)]
font-size: 15px (– 기호)
```

### Input

```
width: 100%
padding: 11px 14px
border: 1.5px solid #E5E7EB
border-radius: 10px
font-size: 14px (13px in trade panel)
color: #191F28
bg: #fff
outline: none
transition: border-color .2s, box-shadow .2s

focus:
  border-color: #0046FF
  box-shadow: 0 0 0 3px rgba(0,70,255,.08)
```

- 비밀번호 필드: 우측 눈 아이콘 버튼 포함 (`position: absolute; right: 12px`)
- 레이블: `font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 6px`
- 필수 표시: `color: #E8393E` `*`

### Card (일반 컨텐츠 카드)

위젯 카드와 동일한 기반, 위젯 그리드 외부에서 사용 시:
```
bg-white border border-[#EAECF0] rounded-2xl p-4
```

---

## 11. UI State 규칙

### Hover

| 대상 | 스타일 |
|---|---|
| 위젯 카드 | `border-color #BFD0FF`, `shadow`, `translateY(-1px)` |
| 테이블 행 (stock-row, hold-row) | `bg-[#F8F9FB]` |
| 위젯 picker | `border-color #0046FF`, `shadow-[0_0_0_3px_rgba(0,70,255,.07)]` |
| 위젯 추가 슬롯 | `border-color #0046FF`, `bg-[#F0F4FF]` |
| 하트 버튼 | `color #E8393E` |

### Active / Selected

- 탭/칩류: 각 탭 규칙 참조 (§8)
- 체크박스: `bg-[#0046FF]` + 흰 체크 SVG
- 행 선택: `bg-[#F5F7FF]` 또는 `border-l-2 border-[#0046FF]`

### Disabled

```
opacity: 60% (opacity-60)
cursor: default 또는 cursor-not-allowed
색상 변경 없이 opacity로만 처리
```

예: 비로그인 상태 chat input
```
bg-[#F4F6FA] border-[#E5E7EB] opacity-60
placeholder: "로그인 후 이용하실 수 있습니다"
```

### Loading

- 실시간 인디케이터 (LiveDot):
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: .5; transform: scale(.8); }
}
/* w-[6px] h-[6px] rounded-full bg-[#12B76A] animation: pulse-dot 2s infinite */
```

- 스켈레톤: `bg-[#F3F4F6] rounded-lg animate-pulse`
- Locked 콘텐츠: `opacity-20` (blur overlay로 덮음)

### Empty

```
텍스트: text-[#9CA3AF], font-size 12-13px
아이콘: color #9CA3AF, w-8~10 h-8~10
컨테이너: flex flex-col items-center justify-center gap-2 p-6
```

### Error (입력 필드)

```
border-color: #E8393E
메시지: font-size 11px, color #E8393E, margin-top 5px
```

---

## 12. Animation 모음

| 이름 | 정의 | 적용 |
|---|---|---|
| `pulse-dot` | scale .8↔1, opacity .5↔1, 2s infinite | LiveDot |
| `bubbleIn` | translateY(6px)→0, opacity 0→1, .22s ease | 채팅 말풍선 |
| `wiggle` | rotate ±1.2deg + translateY(-1px), .55s infinite | 위젯 편집 모드 |
| `modalIn` | translateY(10px)→0, opacity 0→1, .2s ease | 모달 등장 |

---

## 13. 기타 규칙

### SparkLine (미니 차트)

```
<svg width="100%" height="22" viewBox="0 0 120 22" preserveAspectRatio="none">
  <path fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" .../>
</svg>
상승: stroke="#E8393E"
하락: stroke="#0075E8"
```

### LogoCircle (종목 아이콘)

```
w-[32px] h-[32px] rounded-full
flex items-center justify-center
font-size: 11px, font-weight: 800
배경/색상은 종목마다 다름 (예: 삼성 #EEF2FF/#0046FF, SK #FFF3E0/#FF9500)
```

### PriceChange 뱃지

```
상승: bg-[#FFF0F1] text-[#E8393E] border border-[#FFBFC1] rounded-md px-1.5 py-0.5 text-[9px] font-semibold
하락: bg-[#EFF6FF] text-[#0075E8] border border-[#BFDBFE] rounded-md px-1.5 py-0.5 text-[9px] font-semibold
```

### Pie Chart (포트폴리오)

```
width: 50px~80px, height: 50px~80px, border-radius: 50%
background: conic-gradient(#0046FF 0% 34%, #00A878 34% 54%, #FF9500 54% 69%, #EF4444 69% 81%, #8B5CF6 81% 100%)
```

### 투자자 비율 바 (매수/매도)

```
height: 4px, border-radius: 2px, overflow: hidden
매수(적): background #E8393E
매도(청): background #0075E8
```

### 모의투자 고지 문구

모든 주요 화면 하단 또는 온보딩에 포함:
> "SOL Lite는 실제 투자와 무관한 모의투자 서비스입니다"

---

## 14. Icon System

### 라이브러리

**lucide-react** 사용. HTML 프로토타입의 SVG 대부분이 Lucide 계열과 일치한다.

```bash
pnpm add lucide-react
```

### 사이즈 규칙

| 이름 | px | 용도 |
|---|---|---|
| `sm` | 13px (`w-[13px] h-[13px]`) | 인라인 아이콘, 입력 내부 |
| `md` | 14px (`w-3.5 h-3.5`) | 헤더 로고, 버튼 내 아이콘 |
| `base` | 16px (`w-4 h-4`) | 일반 액션 아이콘 |
| `lg` | 18px (`w-[18px] h-[18px]`) | 채팅 패널 AI 아이콘 |
| `xl` | 24px (`w-6 h-6`) | 빈 상태 일러스트 |

### 사용 규칙

```jsx
// ✅ lucide-react
import { TrendingUp, Search, Lock } from 'lucide-react'
<TrendingUp className="w-3.5 h-3.5 text-white" />

// ✅ 커스텀 SVG (lucide에 없는 경우) — src/assets/icons/에 .svg 파일 저장 후 컴포넌트로 import
import { ReactComponent as SolIcon } from '@/assets/icons/sol-logo.svg'
```

### 아이콘 전용 버튼

```jsx
// 아이콘만 있는 버튼은 반드시 aria-label 포함
<button aria-label="위젯 삭제" className="...">
  <X className="w-4 h-4" />
</button>
```

### HTML → lucide 매핑 (주요 아이콘)

| 용도 | lucide 컴포넌트 |
|---|---|
| SOL 로고 (pulse) | `Activity` |
| 검색 | `Search` |
| 잠금 | `Lock` |
| 채팅/메시지 | `MessageCircle` |
| 눈/비밀번호 토글 | `Eye` / `EyeOff` |
| 닫기 | `X` |
| 추가 | `Plus` |
| 하트 (관심종목) | `Heart` |
| 상승 추세 | `TrendingUp` |
| 바 차트 | `BarChart2` |
| 그리드/위젯 | `LayoutGrid` |
| 편집 | `Pencil` |
| 저장 | `Check` |
| 사용자 아바타 | `User` |
| 주문/거래 | `ArrowLeftRight` |
| 잔고/지갑 | `Wallet` |

---

## 15. Motion Duration

### Duration Scale

| 토큰 | 값 | 용도 |
|---|---|---|
| `duration-instant` | `100ms` | 탭 선택, 체크박스, 색상 토글 |
| `duration-fast` | `150ms` | hover 색상 전환, nav 아이템 |
| `duration-normal` | `200ms` | border, shadow, opacity, input focus |
| `duration-chat` | `220ms` | 채팅 말풍선 등장 |
| `duration-motion` | `550ms` | wiggle (위젯 편집 모드) |
| `duration-live` | `2000ms` | pulse-dot 반복 주기 |

`tailwind.config.js`에 등록:
```js
transitionDuration: {
  instant: '100ms',
  fast:    '150ms',
  normal:  '200ms',
  chat:    '220ms',
  motion:  '550ms',
  live:    '2000ms',
}
```

### Easing

| 용도 | easing |
|---|---|
| 색상/opacity 전환 | `ease-in-out` (기본) |
| 말풍선, 모달 등장 | `ease` |
| 위젯 wiggle | `ease-in-out` |
| 카드 translateY | `ease-out` |

### Cursor Rules

| 상태 | 클래스 |
|---|---|
| 클릭 가능 | `cursor-pointer` |
| 드래그 가능 (위젯 편집) | `cursor-grab` |
| 드래그 중 | `cursor-grabbing` (`:active`) |
| 비활성/disabled | `cursor-not-allowed` |
| 텍스트 선택 방지 | `select-none` |

---

## 16. Chat UI 규칙

### 패널 구조

```
ChatPanel (w-[368px], bg-white, border-l border-border)
├── ChatHeader (shrink-0, border-b border-border, px-4 py-3)
│   ├── AI 아이콘 (w-9 h-9, rounded-xl, bg-primary, shadow-brand-glow)
│   ├── 이름 "SOL AI 어시스턴트" (text-[13px] font-bold)
│   └── LiveDot + "온라인 · 즉시 응답" (text-[10px] text-live)
├── ChatMessages (flex-1, overflow-y-auto, p-4, gap-3)
└── ChatInput (shrink-0, border-t border-border, p-3.5, bg-white)
```

### 말풍선 — AI 메시지

```
정렬: 좌측 (justify-start)
배경: bg-bg-muted (bg-[#F3F4F6])
색상: text-text-primary
radius: rounded-[0_16px_16px_16px]  ← 좌상단만 각짐
max-width: 85%
padding: px-3.5 py-2.5
font-size: 13px
line-height: 1.6
등장: animate-bubble-in (translateY 6px → 0, opacity 0 → 1, 220ms ease)
```

### 말풍선 — 사용자 메시지

```
정렬: 우측 (justify-end)
배경: bg-primary (#0046FF)
색상: text-white
radius: rounded-[16px_0_16px_16px]  ← 우상단만 각짐
max-width: 85%
padding: px-3.5 py-2.5
font-size: 13px
line-height: 1.6
등장: animate-bubble-in (동일)
```

### 말풍선 공통 규칙

- 연속된 같은 발신자의 메시지: gap `gap-1` (묶음), 다른 발신자 전환: gap `gap-3`
- 타임스탬프: 말풍선 하단, `font-size: 9px`, `color: text-disabled`, 우측 정렬

### AI 타이핑 인디케이터

```
AI 말풍선과 동일한 스타일 + 내부에 dot 3개
dot: w-[5px] h-[5px] rounded-full bg-text-disabled
애니메이션: 각 dot에 pulse-dot 적용, delay 0ms / 150ms / 300ms
```

### 입력창

```
컨테이너: flex items-center gap-2, bg-bg-app, border border-border-input
          rounded-2xl, px-3.5 py-2.5
textarea/input: flex-1, bg-transparent, text-[12px] text-text-primary
                placeholder: text-text-disabled, outline-none, resize-none
전송 버튼: w-7 h-7, rounded-xl
  활성: bg-primary, text-white
  비활성(빈 입력): bg-bg-muted, text-text-disabled, cursor-not-allowed
```

### 비로그인 상태

```
ChatMessages 영역: 로그인 유도 카드 (중앙 정렬)
  - AI 아이콘 (w-16 h-16, rounded-2xl, bg-primary)
  - 소개 문구 + 기능 예시 카드 3개
  - "로그인하고 시작하기 →" primary 버튼 (full width)
입력창: disabled 상태 (opacity-60), placeholder "로그인 후 이용하실 수 있습니다"
```

---

## 17. Component Naming Convention

### 파일 & 컴포넌트

| 규칙 | 예시 |
|---|---|
| 컴포넌트 파일: `PascalCase.jsx` | `WidgetCard.jsx`, `LiveDot.jsx` |
| 페이지 파일: `PascalCase + Page` | `HomePage.jsx`, `MarketPage.jsx` |
| 훅 파일: `camelCase`, `use` 접두사 | `useAuth.js`, `useWebSocket.js` |
| 유틸 파일: `camelCase` | `formatPrice.js`, `cn.js` |
| 상수 파일: `UPPER_SNAKE_CASE` | `PORTFOLIO_COLORS.js` |
| 폴더: `camelCase` | `components/widgets/`, `features/auth/` |

### Props

| 규칙 | 예시 |
|---|---|
| 일반: `camelCase` | `priceValue`, `stockName` |
| boolean: `is` / `has` / `can` 접두사 | `isLocked`, `isLoading`, `hasError`, `isAuthenticated` |
| 이벤트 핸들러: `on` + 동사 | `onClick`, `onTabChange`, `onWidgetAdd`, `onClose` |
| variant (열거형): string union | `variant="primary" \| "secondary" \| "danger"` |
| 방향: `direction` | `direction="up" \| "down" \| "flat"` |
| 크기: `size` | `size="sm" \| "md" \| "lg"` |

### 컴포넌트별 핵심 Props 예시

```ts
// 재사용 원자
<Button variant="primary | secondary | neutral | danger" size="sm | md" isDisabled />
<PriceChange direction="up | down | flat" value={1.62} showArrow />
<TabChip isActive onClick={fn}>국내</TabChip>
<LiveDot />  // props 없음

// 위젯
<WidgetCard colSpan={1 | 2} isLocked isEditMode onDelete={fn} />

// 채팅
<ChatBubble role="ai | user" isTyping />
```

---

## 18. State & Props Naming Convention

### 전역 상태 (Zustand store)

| 상태 | 타입 | 설명 |
|---|---|---|
| `isAuthenticated` | `boolean` | 로그인 여부 |
| `user` | `User \| null` | 로그인 사용자 정보 |
| `activeTab` | `'home' \| 'market' \| 'invest' \| 'asset'` | 현재 네비 탭 |
| `isEditMode` | `boolean` | 위젯 편집 모드 여부 |
| `widgetLayout` | `Widget[]` | 홈 위젯 배치 |

### 로컬 UI 상태 (useState)

| 상태명 | 타입 | 용도 |
|---|---|---|
| `isLoading` | `boolean` | 데이터 fetch 중 |
| `isOpen` | `boolean` | 모달/드롭다운 열림 여부 |
| `selectedTab` | `string` | 위젯 내 탭 선택값 |
| `inputValue` | `string` | 채팅/검색 입력값 |
| `direction` | `'up' \| 'down' \| 'flat'` | 주가 방향 |
| `colSpan` | `1 \| 2` | 위젯 그리드 점유 열 수 |
| `isLocked` | `boolean` | 로그인 필요 위젯 잠금 |

### 네이밍 원칙

- **boolean 상태**: 항상 `is` / `has` / `can` 접두사
- **서버 데이터**: 도메인 명사 그대로 (`stockPrice`, `portfolioItems`)
- **파생 상태**: `computed` 접두사 피하고 명사형으로 (`sortedStocks`, `filteredList`)
- **이벤트 핸들러 함수**: `handle` + 대상 + 동작 (`handleTabChange`, `handleWidgetDelete`)
