# CLAUDE.md — SOL Lite Frontend

## 프로젝트 개요

모의투자 서비스 웹 프론트엔드. 실제 투자와 무관한 시뮬레이션 플랫폼.
**Desktop-only** (최소 1280px). 모바일/태블릿 반응형은 현재 스코프 밖.

## 기술 스택

React 19 · Vite 8 · Tailwind CSS v4 · React Router v7 · Zustand v5 · pnpm

## 개발 명령어

```bash
pnpm dev      # 개발 서버
pnpm build    # 프로덕션 빌드
pnpm lint     # ESLint
```

## 프로젝트 구조

```
src/
├── components/
│   ├── layout/    # AppShell, AppHeader, Sidebar, ChatPanel, NavTabs
│   ├── ui/        # 재사용 원자 컴포넌트
│   ├── market/    # 시세 도메인 컴포넌트
│   └── widgets/   # 홈 위젯 컴포넌트
├── features/      # 도메인 기능 (auth, market, trade, asset)
├── hooks/         # 커스텀 훅
├── mocks/         # 목 데이터
├── pages/         # HomePage, MarketPage, InvestPage, AssetPage
├── store/         # Zustand 전역 상태
├── index.css      # @theme 토큰, 글로벌 스타일
└── router.jsx
front-mvp/         # HTML 프로토타입 (UI 레퍼런스)
```

## 참고 문서

- **DESIGN.md** — 디자인 시스템 전체 (색상 토큰, 타이포, 레이아웃, 컴포넌트 스타일)
- **`.claude/agents/frontend.md`** — 커밋 컨벤션, 코드 컨벤션, 스타일 규칙
