---
layout: post
title: "데일리 트레이딩 | 2026-04-19"
date: 2026-04-19 18:00:00 +0900
description: 오늘의 시황 및 매매 복기
tags: trading daily-log quant
categories: trading
giscus_comments: false
related_posts: true
thumbnail: assets/img/posts/thumbnail.jpg
toc:
  sidebar: left
---

## 오늘의 시황

- **KOSPI**: 2,750.12 (+0.8%)
- **KOSDAQ**: 870.45 (−0.3%)
- **S&P 500**: 5,240.xx
- **USD/KRW**: 1,370원
- **WTI**: $82.5

오늘 시장 분위기를 2~3줄로 요약.

## 주요 이벤트 / 뉴스

- 이벤트 1
- 이벤트 2

## 포지션 & 매매 기록

| 종목 | 방향 | 진입가 | 청산가 | 수량 | 손익 | 비고 |
| --- | --- | --- | --- | --- | --- | --- |
| 005930 삼성전자 | Long | 75,000 | 76,200 | 100 | +120,000 | 갭업 후 눌림목 |
| 000660 SK하이닉스 | Short | 180,000 | 178,500 | 20 | +30,000 | 저항 이탈 실패 |

## 매매 근거 (Thesis)

### 1) 삼성전자 Long
- 근거: …
- 결과: …

### 2) SK하이닉스 Short
- 근거: …
- 결과: …

## 오늘의 수익률

- 실현 손익: **+150,000원**
- 계좌 변화: **+0.37%**
- MTD: +2.1% / YTD: +8.4%

## 복기 & 배운 점

- 잘한 점: …
- 못한 점: …
- 내일 관찰할 것: …

## 코드 스니펫 (optional)

```python
import pandas as pd
import yfinance as yf

df = yf.download("005930.KS", period="1mo")
df["ret"] = df["Close"].pct_change()
print(df.tail())
```

## 차트 (optional)

이미지는 `assets/img/posts/` 폴더에 올리고 아래처럼 불러오기:

{% raw %}
{% include figure.liquid loading="eager" path="assets/img/posts/2026-04-19-chart.png" class="img-fluid rounded z-depth-1" %}
{% endraw %}
