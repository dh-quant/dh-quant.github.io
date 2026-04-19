---
layout: page
title: Quant Backtester
description: 파이썬으로 직접 만든 전략 백테스팅 엔진 — 체결 지연 · 슬리피지 · 수수료까지 반영.
img: assets/img/projects/backtester.svg
importance: 1
category: quant
giscus_comments: false
---

## 개요

시중 라이브러리(vectorbt, backtrader)를 쓰기 전에 **전략의 어디가 깨지는지** 직접 이해하려고
벤치마크용 백테스팅 엔진을 파이썬으로 작성했습니다. `pandas`만으로 벡터라이즈, 체결 지연 / 슬리피지 /
수수료를 파라미터화해서 실매매 환경에 가까운 수익 곡선을 뽑는 게 목표.

## 핵심 기능

- 바이너리 시그널 → 포지션 사이징 → P&L까지 한 파이프라인
- 체결 지연(next-bar open) · 슬리피지(bps) · 수수료(bps) 분리
- 롤링 샤프 · MDD · 승률 · 평균 손익비 자동 산출
- 멀티 종목 / 멀티 타임프레임 포트폴리오 백테스트

## 스택

`Python 3.11` · `pandas` · `numpy` · `matplotlib` · `numba`(핫 루프)

## 배운 것

- 실매매에서 "백테스트는 왜 다 좋아 보이나" — 체결 가정 하나만 풀어도 샤프가 반토막.
- 생존 편향, 미래 참조(look-ahead), 재조정 지연까지 잡기 전엔 아무 숫자도 못 믿는다는 점.
