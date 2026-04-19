---
layout: about
title: about
permalink: /
subtitle: <a href='https://www.kentech.ac.kr'>KENTECH</a> · 금융 · 퀀트 · 트레이딩

profile:
  align: right
  image: prof_pic.jpg
  image_circular: true
  more_info: >
    <p><i class="fa-solid fa-envelope"></i> lucaskdh@kentech.ac.kr</p>
    <p><i class="fa-solid fa-location-dot"></i> 전라남도 나주시, KENTECH</p>

selected_papers: false
social: true

announcements:
  enabled: false

latest_posts:
  enabled: true
  scrollable: true
  limit: 3

chart:
  echarts: true
---

<section class="dh-hero">
  <div class="dh-hero__eyebrow"><span class="pulse-dot"></span> live · markets open somewhere</div>
  <h3 class="dh-hero__title">안녕하세요, 김동혁입니다.</h3>
  <p class="dh-hero__tagline">
    KENTECH(한국에너지공과대학교)에서 공부하며, 금융 시장과 퀀트 트레이딩에 빠져 있습니다.
    가격의 흐름 뒤에 숨은 <b>신호</b>, 심리, 그리고 데이터를 파헤치는 것을 좋아합니다.
  </p>

  <div class="dh-chips">
    <span class="dh-chip dh-chip--bull">📈 Trading</span>
    <span class="dh-chip">🧠 Quant Research</span>
    <span class="dh-chip dh-chip--cyan">🐍 Python · Pandas</span>
    <span class="dh-chip dh-chip--gold">📊 Backtesting</span>
    <span class="dh-chip dh-chip--bear">⚡ Derivatives</span>
    <span class="dh-chip">🏦 Macro</span>
    <span class="dh-chip dh-chip--cyan">⚛️ KENTECH</span>
  </div>
</section>

<div class="dh-ticker" id="dh-ticker" aria-label="Live market ticker">
  <div class="dh-ticker__meta">
    <span class="dh-ticker__live"><span class="pulse-dot"></span> LIVE</span>
    <span class="dh-ticker__updated">loading…</span>
    <span class="dh-ticker__src">Yahoo Finance · 15m cron</span>
  </div>
  <div class="dh-ticker__track">
    <span class="dh-ticker__item dh-ticker__item--stale"><span class="dh-ticker__symbol">Loading markets…</span></span>
  </div>
</div>

### 무엇을 하고 있나요

이 사이트에는 **매매 일지**, **시장 분석**, 그리고 관심 있는 주제들을 기록합니다.
주로 파이썬으로 데이터 파이프라인을 짜고, 직접 돌린 백테스트와 실매매 결과를 비교하며 전략을 다듬고 있어요.

<div class="dh-grid">
  <div class="dh-stat">
    <div class="dh-stat__label">Focus</div>
    <div class="dh-stat__value">Systematic</div>
    <div class="dh-stat__note">룰 기반 · 규율 있는 엔트리/엑싯</div>
  </div>
  <div class="dh-stat">
    <div class="dh-stat__label">Assets</div>
    <div class="dh-stat__value">Equities · Futures</div>
    <div class="dh-stat__note">KRX · CME · 선물옵션까지</div>
  </div>
  <div class="dh-stat">
    <div class="dh-stat__label">Stack</div>
    <div class="dh-stat__value">Python · SQL</div>
    <div class="dh-stat__note">pandas · numpy · vectorbt</div>
  </div>
  <div class="dh-stat">
    <div class="dh-stat__label">Goal</div>
    <div class="dh-stat__value">Edge + Discipline</div>
    <div class="dh-stat__note">작은 엣지를 꾸준히 · 크게 잃지 않기</div>
  </div>
</div>

<div class="dh-section-title">Global Markets Desk</div>

<div class="dh-dashboard">

  <div class="dh-panel dh-span-4">
    <div class="dh-panel__gradient"></div>
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Fear &amp; Greed</h4>
      <span class="dh-panel__sub">Derived</span>
    </div>
    <div id="dh-fear-greed" class="dh-gauge"></div>
    <div class="dh-gauge-meta"><span>loading…</span></div>
  </div>

  <div class="dh-panel dh-span-4">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Asset Class Pulse</h4>
      <span class="dh-panel__sub">1D · Avg</span>
    </div>
    <div id="dh-asset-bars" class="dh-bars"></div>
  </div>

  <div class="dh-panel dh-span-4">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">World Markets · Clock</h4>
      <span class="dh-panel__sub">Local time + Index</span>
    </div>
    <div id="dh-market-clock" class="dh-clock"></div>
  </div>

  <div class="dh-panel dh-span-7">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Global Indices</h4>
      <span class="dh-panel__sub">Last 22 trading days</span>
    </div>
    <div id="dh-indices" class="dh-rows"></div>
  </div>

  <div class="dh-panel dh-span-5">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">US Treasury Curve</h4>
      <span class="dh-panel__sub">Today vs Yesterday</span>
    </div>
    <div id="dh-yield-curve" class="dh-yield-curve"></div>
  </div>

  <div class="dh-panel dh-span-12">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">US Sector Map</h4>
      <span class="dh-panel__sub">Select Sector SPDRs · 1D change</span>
    </div>
    <div id="dh-sector-tree" class="dh-sector-tree"></div>
  </div>

  <div class="dh-panel dh-span-4">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Commodities</h4>
      <span class="dh-panel__sub">Energy · Metals · Grains</span>
    </div>
    <div id="dh-commodities" class="dh-cards"></div>
  </div>

  <div class="dh-panel dh-span-4">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">FX Majors</h4>
      <span class="dh-panel__sub">USD pairs</span>
    </div>
    <div id="dh-fx" class="dh-cards"></div>
  </div>

  <div class="dh-panel dh-span-4">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Crypto</h4>
      <span class="dh-panel__sub">Top cap</span>
    </div>
    <div id="dh-crypto" class="dh-cards"></div>
  </div>

  <div class="dh-panel dh-span-12">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">KOSPI · Live Candlestick</h4>
      <span class="dh-panel__sub">Daily · 6 months · MA20/60</span>
    </div>
    <div id="dh-kospi-chart" class="dh-echarts"></div>
  </div>

  <div class="dh-panel dh-span-7">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Headline Heatmap</h4>
      <span class="dh-panel__sub">Color intensity ∝ |Δ%|</span>
    </div>
    <div id="dh-heatmap" class="dh-heatmap"></div>
  </div>

  <div class="dh-panel dh-span-5">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Top Movers</h4>
      <span class="dh-panel__sub">Among headline</span>
    </div>
    <div class="dh-movers">
      <div class="dh-movers__col">
        <h5 class="dh-movers__title dh-movers__title--up">🚀 Gainers</h5>
        <ol id="dh-movers-up" class="dh-movers__list"></ol>
      </div>
      <div class="dh-movers__col">
        <h5 class="dh-movers__title dh-movers__title--down">🩸 Losers</h5>
        <ol id="dh-movers-down" class="dh-movers__list"></ol>
      </div>
    </div>
  </div>

</div>

<div class="dh-section-title">오늘의 한 마디</div>

<figure class="dh-quote" id="dh-quote" aria-live="polite">
  <blockquote class="dh-quote__text">—</blockquote>
  <figcaption class="dh-quote__author">—</figcaption>
  <div class="dh-quote__progress"><span></span></div>
</figure>

### 연락 · 링크

관심사가 겹치거나 이야기 나누고 싶으시면 메일·깃허브로 편하게 연락 주세요.

<script src="{{ '/assets/js/ticker.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/market-clock.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/kospi-chart.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/quotes.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/dashboard.js' | relative_url }}" defer></script>
