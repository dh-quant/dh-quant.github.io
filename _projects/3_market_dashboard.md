---
layout: page
title: Market Dashboard
description: 실시간 매크로 · 섹터 · 자금흐름을 한 화면에서 보는 개인용 트레이딩 대시보드.
img: assets/img/projects/dashboard.svg
importance: 3
category: dev
giscus_comments: false
---

## 목적

브로커 HTS는 매매 속도에 최적화돼 있지만, "지금 시장 어떤 상태지?" 질문에 답하기엔 부족하다고 느꼈습니다.
매크로 지표 · 섹터 리더십 · 자금 흐름 · 변동성 레짐을 **한 화면**에서 보도록
직접 짜본 개인용 대시보드.

## 구성

- **Macro strip** — UST 2s10s, DXY, WTI, 금, BTC
- **Sector heatmap** — 국내/해외 섹터 상대 강도 (20d)
- **Breadth panel** — 52w High/Low, Advance-Decline, McClellan
- **Vol regime** — VIX 구간 분류 + 자산군별 realized vol

## 스택

`FastAPI` 백엔드 · `SQLite` 캐시 · `Plotly` 차트 · `Next.js` + `TailwindCSS` 프런트 ·
배치 잡은 `APScheduler`로 5분 간격.

## 배운 것

- 데이터는 많을수록 좋은 게 아니라, **행동에 연결되는 뷰**만 남겨야 쓴다.
- 프로덕션 모니터링처럼 "알람 조건"을 만들어둬야 대시보드가 진짜 쓸모 있어짐.
