# SOL-Lite Frontend 개발 에이전트

## 커밋 컨벤션 (AngularJS Convention)
- 커밋 메시지는 **한글**로 작성
- Co-Authored-By 라인 **절대 넣지 않기**
- 형식:
  ```
  <type>(<scope>): <subject>

  <body> (선택)

  <footer> (선택)
  ```

### type
- `feat`: 새로운 컴포넌트/기능
- `fix`: 버그 수정
- `docs`: 문서 (DESIGN.md 등)
- `style`: 스타일 수정 (로직 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가
- `chore`: 빌드, 설정, 패키지 등 유지보수

### scope
- 페이지/화면: `home`, `market`, `invest`, `asset`
- 기능 도메인: `auth`, `chat`, `widget`, `watchlist`, `order`, `balance`
- 공통: `layout`, `ui`, `router`, `store`, `style`, `config`
- 전체: `*`

### subject
- 한글로 작성
- 첫 글자 대문자 X, 끝에 마침표 X

### 예시
```
feat(ui): PriceChange 컴포넌트 구현
```
```
feat(home): 위젯 그리드 레이아웃 구현
```
```
feat(auth): 로그인 모달 구현
```
```
feat(chat): AI 채팅 패널 말풍선 컴포넌트 구현
```
```
fix(widget): LockedOverlay z-index 수정
```
```
chore(config): tailwind 디자인 토큰 등록
```
```
style(market): StockRow hover 스타일 수정
```

## 커밋 단위
- 하나의 컴포넌트 또는 하나의 기능 단위로 커밋
- 공통 UI 원자 컴포넌트는 여러 개를 묶어서 커밋 가능
- 페이지 레이아웃과 내부 위젯은 별도 커밋으로 분리

## 코드 컨벤션

### 파일 & 컴포넌트
- 컴포넌트 파일: `PascalCase.jsx` (예: `WidgetCard.jsx`, `LiveDot.jsx`)
- 페이지 파일: `PascalCase + Page.jsx` (예: `HomePage.jsx`)
- 훅 파일: `use` 접두사 + `camelCase.js` (예: `useAuth.js`)
- 유틸 파일: `camelCase.js` (예: `formatPrice.js`)
- 폴더: `camelCase` (예: `components/widgets/`)

### Props
- 일반: `camelCase`
- boolean: `is` / `has` / `can` 접두사 (예: `isLocked`, `isLoading`)
- 이벤트 핸들러: `on` + 동사 (예: `onClick`, `onWidgetAdd`)
- variant: string union (예: `variant="primary" | "secondary"`)

### 스타일 — 안티패턴 (절대 금지)

```jsx
// ❌ 인라인 스타일
style={{ boxShadow: 'var(--shadow-brand-glow)' }}
style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}

// ❌ arbitrary value (토큰이 있을 경우)
className="shadow-[var(--shadow-brand-glow)]"
className="bg-[#0046FF]"

// ✅ 올바른 사용
className="shadow-brand-glow"
className="animate-pulse-dot"
className="bg-primary"
```

### Tailwind v4 토큰 → 클래스 변환 규칙

`src/index.css @theme`에 등록된 CSS 변수는 Tailwind 유틸리티 클래스로 **자동 생성**된다.
인라인 스타일이나 `var()` 참조 없이 클래스명으로 바로 사용한다.

| `@theme` 변수 | 생성되는 클래스 |
|---|---|
| `--color-{name}` | `bg-{name}` / `text-{name}` / `border-{name}` |
| `--shadow-{name}` | `shadow-{name}` |
| `--animate-{name}` | `animate-{name}` |

**색상 토큰 (주요)**

| 용도 | 클래스 |
|---|---|
| 브랜드 | `bg-primary` / `text-primary` / `border-primary` |
| 브랜드 hover | `bg-primary-hover` |
| 브랜드 연한 배경 | `bg-primary-light` |
| 본문 텍스트 | `text-foreground` |
| 보조 텍스트 | `text-foreground-secondary` |
| 비활성 텍스트 | `text-foreground-disabled` |
| 앱 배경 | `bg-background` |
| 카드/헤더 배경 | `bg-surface` |
| 기본 테두리 | `border-stroke` |
| 입력 테두리 | `border-stroke-input` |
| 상승 | `text-up` / `bg-up-bg` / `border-up-border` |
| 하락 | `text-down` / `bg-down-bg` / `border-down-border` |
| 실시간 | `bg-live` / `text-live` |
| 경고 | `text-warning` |
| 종목 아바타 (warning) | `bg-avatar-warning-bg` / `border-avatar-warning-border` |
| 종목 아바타 (green) | `bg-avatar-green-bg` / `border-avatar-green-border` / `text-avatar-green-text` |
| 종목 아바타 (purple) | `bg-avatar-purple-bg` / `border-avatar-purple-border` / `text-avatar-purple-text` |

**그림자 토큰**

| 용도 | 클래스 |
|---|---|
| 로고/브랜드 glow | `shadow-brand-glow` |
| primary 버튼 | `shadow-primary-btn` |
| 위젯 hover | `shadow-widget-hover` |
| 위젯 편집모드 | `shadow-widget-edit` |
| 모달 | `shadow-modal` |
| focus ring | `shadow-focus-ring` |

**애니메이션 토큰**

| 용도 | 클래스 |
|---|---|
| 실시간 점 pulse | `animate-pulse-dot` |
| 말풍선 등장 | `animate-bubble-in` |
| 위젯 wiggle | `animate-wiggle` |
| 모달 등장 | `animate-modal-in` |

### 스타일 — 기타 규칙
- 아이콘은 `lucide-react` 사용, 커스텀 SVG는 `src/assets/icons/`에 분리
- 아이콘 전용 버튼은 반드시 `aria-label` 포함

### 상태 관리
- 전역 상태: Zustand (`src/store/`)
- 로컬 UI 상태: `useState`
- boolean 상태명: `is` / `has` / `can` 접두사 필수
