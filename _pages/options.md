---
layout: page
title: options
permalink: /options/
description: 실전 옵션 데스크 — 딜러 GEX/Vanna/Charm, IV 표면, term structure, VRP, max-pain. 15분 cron으로 갱신.
nav: true
nav_order: 3

chart:
  echarts: true

_styles: >
  .opt-conc {
    border: 1px solid var(--accent-line);
    background: var(--accent-soft);
    border-radius: var(--r-md);
    padding: 1.1rem 1.3rem 1.2rem;
    margin: 0.4rem 0 1.5rem;
  }
  .opt-conc__title {
    font-size: 0.78rem; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--accent); margin: 0 0 0.55rem;
  }
  .opt-conc__list { list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 0.35rem; }
  .opt-conc__row {
    display: flex; gap: 0.7rem; align-items: baseline;
    font-size: 0.95rem; line-height: 1.5;
  }
  .opt-conc__icon { flex: 0 0 1.6rem; font-size: 1rem; opacity: 0.85; }
  .opt-conc__updated { font-size: 0.72rem; color: var(--fg-mute); margin-top: 0.6rem;
    font-variant-numeric: tabular-nums; }

  .opt-tabs { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1.1rem; }
  .opt-tab {
    border: 1px solid var(--border); background: var(--surface);
    border-radius: 999px; padding: 0.4rem 0.95rem;
    font-family: var(--mono); font-size: 0.82rem; font-weight: 600;
    cursor: pointer; color: var(--fg);
    transition: all 0.15s var(--ease);
  }
  .opt-tab:hover { border-color: var(--border-strong); }
  .opt-tab.is-active {
    background: var(--fg); color: var(--surface); border-color: var(--fg);
  }
  .opt-tab__sub { font-family: var(--sans); font-weight: 400;
    font-size: 0.7rem; opacity: 0.7; margin-left: 0.4rem; }

  .opt-snap { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0; border: 1px solid var(--border); border-radius: var(--r-md);
    overflow: hidden; margin-bottom: 1.2rem; background: var(--surface); }
  .opt-stat {
    padding: 0.95rem 1.1rem; border-right: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .opt-stat:last-child { border-right: 0; }
  .opt-stat__label {
    font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--fg-mute); font-weight: 600;
  }
  .opt-stat__value {
    font-family: var(--mono); font-size: 1.3rem; font-weight: 700;
    color: var(--fg); font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }
  .opt-stat__value.up { color: var(--up); }
  .opt-stat__value.down { color: var(--down); }
  .opt-stat__value.accent { color: var(--accent); }
  .opt-stat__sub { font-size: 0.72rem; color: var(--fg-mute);
    font-variant-numeric: tabular-nums; }

  .opt-chart { width: 100%; min-height: 360px; }

  .opt-legend {
    display: flex; gap: 1rem; font-size: 0.72rem;
    color: var(--fg-mute); margin-top: 0.4rem;
  }
  .opt-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
  .opt-legend i {
    width: 10px; height: 10px; border-radius: 2px; display: inline-block;
  }
  .opt-explainer {
    font-size: 0.78rem; color: var(--fg-mute); line-height: 1.55;
    border-left: 2px solid var(--border); padding: 0.4rem 0.8rem;
    margin-top: 0.7rem;
  }
  .opt-explainer b { color: var(--fg); font-weight: 600; }
---

{% assign s = site.data.options.snapshot %}

<section class="dh-hero">
  <div class="dh-hero__eyebrow"><span class="pulse-dot"></span> live · 15m cron · NY hours</div>
  <h3 class="dh-hero__title">Options Desk</h3>
  <p class="dh-hero__tagline">
    딜러 <b>감마/베가/차임 노출</b>, 25Δ <b>스큐</b>, IV 기간구조, <b>VRP</b>, 핀·플립·맥스페인.
    실제로 데스크가 보는 신호만 추렸습니다.
  </p>
</section>

{% if s and s.tickers and s.tickers.size > 0 %}

<div class="opt-tabs" id="opt-tabs">
  {% for t in s.tickers %}
  <button class="opt-tab{% if forloop.first %} is-active{% endif %}" data-sym="{{ t.sym }}">
    {{ t.sym }}<span class="opt-tab__sub">{{ t.name }}</span>
  </button>
  {% endfor %}
</div>

<div class="opt-conc" id="opt-conclusion">
  <div class="opt-conc__title">// 오늘의 결론 <span id="opt-conc-sym" style="font-family:var(--mono)"></span></div>
  <ul class="opt-conc__list" id="opt-conc-list"></ul>
  <div class="opt-conc__updated">Updated · {{ s.updated }}</div>
</div>

<div class="opt-snap" id="opt-snap"></div>

<div class="dh-section-title">Dealer Positioning
  <span class="dh-section-title__count">// gamma · vanna · charm by strike</span>
</div>

<div class="dh-dashboard">

  <div class="dh-panel dh-span-12 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">GEX by Strike</h4>
      <span class="dh-panel__sub">+/− = 안정/변동성 / 점선=spot · 빨강 점선=zero-gamma flip</span>
    </div>
    <div id="opt-gex-chart" class="opt-chart"></div>
    <div class="opt-explainer">
      <b>읽는 법</b> — 양의 막대(녹색)는 딜러가 그 가격에서 <b>변동성을 흡수</b>하는 strike, 음의 막대(빨강)는 <b>변동성을 증폭</b>하는 strike.
      누적 GEX가 0을 가로지르는 곳이 <b>제로감마 플립</b>이며, 이 아래로 가면 작은 매도가 큰 매도로 확장됩니다.
      spot 근처 가장 큰 양의 막대는 <b>핀 후보</b> (만기일 종가가 끌리기 쉬움).
    </div>
  </div>

  <div class="dh-panel dh-span-7 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Volatility Surface</h4>
      <span class="dh-panel__sub">moneyness × expiry 히트맵 (OTM IV)</span>
    </div>
    <div id="opt-surface-chart" class="opt-chart" style="min-height:340px"></div>
    <div class="opt-explainer">
      <b>읽는 법</b> — 좌측이 풋(다운사이드), 우측이 콜(업사이드). 좌측이 더 진하면 <b>풋 스큐</b>(다운사이드 헷지 비싸짐, 흔한 상태).
      우측이 진하면 콜 스큐(squeeze 우려). 위에서 아래로 갈수록 만기가 멀어지며, 아래쪽이 진하면 콘탱고.
    </div>
  </div>

  <div class="dh-panel dh-span-5 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Term Structure</h4>
      <span class="dh-panel__sub">ATM IV by DTE</span>
    </div>
    <div id="opt-term-chart" class="opt-chart" style="min-height:340px"></div>
    <div class="opt-explainer">
      <b>콘탱고</b>(우상향) — 정상 / <b>백워데이션</b>(우하향) — 단기 스트레스, 평균회귀 후보.
      가파른 우상향이면 <b>캘린더 spread</b> (단기 매도, 장기 매수) 매력.
    </div>
  </div>

  <div class="dh-panel dh-span-7 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Open Interest by Strike</h4>
      <span class="dh-panel__sub">콜(우) vs 풋(좌) — 헷지 / 포지션 분포</span>
    </div>
    <div id="opt-oi-chart" class="opt-chart" style="min-height:340px"></div>
  </div>

  <div class="dh-panel dh-span-5 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">25Δ Skew × Term</h4>
      <span class="dh-panel__sub">put IV − call IV (vol pts)</span>
    </div>
    <div id="opt-skew-chart" class="opt-chart" style="min-height:340px"></div>
    <div class="opt-explainer">
      양수가 정상 (다운사이드 비싸다). <b>가파름</b>은 헷지 수요 강함, <b>납작</b>은 컴플레이슨시 — 둘 다 mean-revert 자주 함.
    </div>
  </div>

</div>

<script>
  window.OPTIONS_DATA = {{ s | jsonify }};
</script>
<script src="{{ '/assets/js/options.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/reveal.js' | relative_url }}" defer></script>

{% else %}
<div style="padding: 3rem 1rem; text-align: center; color: var(--fg-mute);">
  옵션 데이터가 아직 생성되지 않았습니다.<br>
  <code>scripts/fetch_options.py</code>를 한 번 돌리거나 <code>options-data</code> 워크플로우가 실행되길 기다려주세요.
</div>
{% endif %}
