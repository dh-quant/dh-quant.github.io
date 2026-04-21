---
layout: page
title: markets
permalink: /markets/
description: 실시간 글로벌 시황 · 섹터 · 채권 · 원자재 · FX · 크립토. 15분 cron으로 데이터 갱신.
nav: true
nav_order: 2

chart:
  echarts: true
---

<section class="dh-hero">
  <div class="dh-hero__eyebrow"><span class="pulse-dot"></span> live · markets open somewhere</div>
  <h3 class="dh-hero__title">Markets Desk</h3>
  <p class="dh-hero__tagline">
    매주 갱신되는 <b>Weekly Thesis</b>와 15분 cron으로 돌아가는 <b>글로벌 시황 대시보드</b>.
    Yahoo Finance와 FRED 데이터를 직접 파이프라이닝해서 그립니다.
  </p>
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

<div class="dh-section-title">
  Trading Stance
  <span class="dh-section-title__count">// week of {{ site.data.regime.updated }}</span>
</div>

<div class="dh-dashboard">

  <div class="dh-panel dh-span-8 dh-reveal">
    <div class="dh-panel__gradient"></div>
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Weekly Thesis</h4>
      <span class="dh-panel__sub">Manually curated</span>
    </div>
    <div class="dh-regime">
      <div class="dh-regime__bias">
        <span class="dh-regime__bias-label">Bias</span>
        <span class="dh-regime__bias-value">{{ site.data.regime.bias }}</span>
        <span class="dh-regime__bias-tag">{{ site.data.regime.tag }}</span>
      </div>
      <div class="dh-regime__body">
        <p class="dh-regime__quote">{{ site.data.regime.quote }}</p>
        <ul class="dh-regime__notes">
          {% for n in site.data.regime.notes %}<li>{{ n }}</li>{% endfor %}
        </ul>
      </div>
      <div class="dh-regime__meta">
        <span>Updated · {{ site.data.regime.updated }}</span>
        <span>Edit · _data/regime.yml</span>
      </div>
    </div>
  </div>

  <div class="dh-panel dh-span-4 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Key Levels</h4>
      <span class="dh-panel__sub">Manual watchlist</span>
    </div>
    <div class="dh-levels">
      {% for L in site.data.regime.levels %}
      <div class="dh-level">
        <div class="dh-level__sym">{{ L.sym }}</div>
        <div class="dh-level__name">{{ L.name }}</div>
        <div class="dh-level__rows">
          {% for r in L.rows %}
          <div class="dh-level__row">
            <span class="dh-level__k">{{ r.k }}</span>
            <span class="dh-level__v {{ r.dir }}">{{ r.v }}</span>
          </div>
          {% endfor %}
        </div>
      </div>
      {% endfor %}
    </div>
  </div>

</div>

<div class="dh-section-title">
  Global Markets Desk
  <span class="dh-section-title__count">// live · 15m cron</span>
</div>

<div class="dh-dashboard">

  <div class="dh-panel dh-span-12 dh-reveal dh-panel--strip">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">World Markets · Sessions</h4>
      <span class="dh-panel__sub">Local time + Headline index</span>
    </div>
    <div id="dh-market-clock" class="dh-clock dh-clock--strip"></div>
  </div>

  <div class="dh-panel dh-span-5 dh-reveal">
    <div class="dh-panel__gradient"></div>
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Fear &amp; Greed</h4>
      <span class="dh-panel__sub">Derived</span>
    </div>
    <div id="dh-fear-greed" class="dh-gauge"></div>
    <div class="dh-gauge-meta"><span>loading…</span></div>
  </div>

  <div class="dh-panel dh-span-7 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Asset Class Pulse</h4>
      <span class="dh-panel__sub">1D · Avg</span>
    </div>
    <div id="dh-asset-bars" class="dh-bars"></div>
  </div>

  <div class="dh-panel dh-span-7 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Global Indices</h4>
      <span class="dh-panel__sub">Last 22 trading days</span>
    </div>
    <div id="dh-indices" class="dh-rows"></div>
  </div>

  <div class="dh-panel dh-span-5 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">US Treasury Curve</h4>
      <span class="dh-panel__sub">Today vs Yesterday</span>
    </div>
    <div id="dh-yield-curve" class="dh-yield-curve"></div>
  </div>

  <div class="dh-panel dh-span-12 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">US Sector Map</h4>
      <span class="dh-panel__sub">Select Sector SPDRs · 1D change</span>
    </div>
    <div id="dh-sector-tree" class="dh-sector-tree"></div>
  </div>

  <div class="dh-panel dh-span-4 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Commodities</h4>
      <span class="dh-panel__sub">Energy · Metals · Grains</span>
    </div>
    <div id="dh-commodities" class="dh-cards"></div>
  </div>

  <div class="dh-panel dh-span-4 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">FX Majors</h4>
      <span class="dh-panel__sub">USD pairs</span>
    </div>
    <div id="dh-fx" class="dh-cards"></div>
  </div>

  <div class="dh-panel dh-span-4 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Crypto</h4>
      <span class="dh-panel__sub">Top cap</span>
    </div>
    <div id="dh-crypto" class="dh-cards"></div>
  </div>

  <div class="dh-panel dh-span-12 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">KOSPI · Live Candlestick</h4>
      <span class="dh-panel__sub">Daily · 6 months · MA20/60</span>
    </div>
    <div id="dh-kospi-chart" class="dh-echarts"></div>
  </div>

  <div class="dh-panel dh-span-7 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Headline Heatmap</h4>
      <span class="dh-panel__sub">Color intensity ∝ |Δ%|</span>
    </div>
    <div id="dh-heatmap" class="dh-heatmap"></div>
  </div>

  <div class="dh-panel dh-span-5 dh-reveal">
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

<script src="{{ '/assets/js/ticker.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/market-clock.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/kospi-chart.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/dashboard.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/reveal.js' | relative_url }}" defer></script>
