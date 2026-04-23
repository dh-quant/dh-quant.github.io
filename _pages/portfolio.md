---
layout: page
title: portfolio
permalink: /portfolio/
description: 개인 투자 포트폴리오 스냅샷 · 자산군별 배분 · 종목별 P&L. 수동 갱신.
nav: true
nav_order: 3

chart:
  echarts: true
---

{% assign p = site.data.portfolio %}
{% assign usd = p.holdings.us_equities.rows %}
{% assign krw = p.holdings.kr_equities.rows %}
{% assign crp = p.holdings.crypto.rows %}

<section class="dh-hero">
  <div class="dh-hero__eyebrow"><span class="pulse-dot"></span> snapshot · {{ p.updated }}</div>
  <h3 class="dh-hero__title">Portfolio</h3>
  <p class="dh-hero__tagline">
    실제 보유 중인 주식 · ETF · 크립토의 <b>스냅샷</b>. 자산군 배분과 종목별 손익을 한 번에 본다.
    수치는 브로커 앱 원본 기준이며, 환율 <code>₩{{ p.fx_usdkrw }}/USD</code>로 통화 통일.
  </p>
  <div class="dh-chips">
    <span class="dh-chip dh-chip--gold">📸 Manual snapshot</span>
    <span class="dh-chip dh-chip--cyan">₩ Base currency</span>
    <span class="dh-chip">🔒 PII-free</span>
  </div>
</section>

<div class="dh-section-title">
  Book Summary
  <span class="dh-section-title__count">// aum &amp; realized book</span>
</div>

<div class="dh-grid">
  <div class="dh-stat dh-reveal">
    <div class="dh-stat__label">Total AUM</div>
    <div class="dh-stat__value">₩{{ p.summary.aum_krw | default: 0 | divided_by: 1000 | round }}K</div>
    <div class="dh-stat__note">보유 주식·ETF·크립토·현금 합계</div>
  </div>
  <div class="dh-stat dh-reveal">
    <div class="dh-stat__label">Unrealized P&amp;L</div>
    {% if p.summary.pnl_krw >= 0 %}
      <div class="dh-stat__value" style="color: var(--up-color);">+₩{{ p.summary.pnl_krw }}</div>
      <div class="dh-stat__note" style="color: var(--up-color);">▲ +{{ p.summary.pnl_pct }}% vs. cost basis</div>
    {% else %}
      <div class="dh-stat__value" style="color: var(--down-color);">₩{{ p.summary.pnl_krw }}</div>
      <div class="dh-stat__note" style="color: var(--down-color);">▼ {{ p.summary.pnl_pct }}% vs. cost basis</div>
    {% endif %}
  </div>
  <div class="dh-stat dh-reveal">
    <div class="dh-stat__label">Cash</div>
    <div class="dh-stat__value">₩{{ p.summary.cash_krw }}</div>
    <div class="dh-stat__note">KRW + USD 현금 합계</div>
  </div>
  <div class="dh-stat dh-reveal">
    <div class="dh-stat__label">Positions</div>
    <div class="dh-stat__value">{{ p.summary.positions }}</div>
    <div class="dh-stat__note">US · KR · Crypto 포지션 수</div>
  </div>
</div>

<div class="dh-section-title">
  Asset Allocation
  <span class="dh-section-title__count">// by value</span>
</div>

<div class="dh-dashboard">
  <div class="dh-panel dh-span-7 dh-reveal">
    <div class="dh-panel__gradient"></div>
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Allocation Donut</h4>
      <span class="dh-panel__sub">5 buckets</span>
    </div>
    <div id="dh-alloc-donut" class="dh-echarts dh-echarts--mid"></div>
    <script type="application/json" id="dh-alloc-data">
    [{% for slice in p.allocation %}
      {"name":"{{ slice.label }}","value":{{ slice.value }},"color":"{{ slice.color }}"}{% unless forloop.last %},{% endunless %}
    {% endfor %}]
    </script>
  </div>

  <div class="dh-panel dh-span-5 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Exposure Breakdown</h4>
      <span class="dh-panel__sub">share of AUM</span>
    </div>
    <div class="dh-alloc-list">
      {% for slice in p.allocation %}
        {% assign pct = slice.value | times: 1000 | divided_by: p.summary.aum_krw %}
        {% assign pct_int = pct | divided_by: 10 %}
        {% assign pct_frac = pct | modulo: 10 %}
        <div class="dh-alloc-row">
          <span class="dh-alloc-dot" style="background: {{ slice.color }};"></span>
          <span class="dh-alloc-label">{{ slice.label }}</span>
          <span class="dh-alloc-bar"><span class="dh-alloc-fill" style="width: {{ pct_int }}%; background: {{ slice.color }};"></span></span>
          <span class="dh-alloc-pct">{{ pct_int }}.{{ pct_frac }}%</span>
        </div>
      {% endfor %}
    </div>
  </div>
</div>

<div class="dh-section-title">
  Holdings · US Equities
  <span class="dh-section-title__count">// {{ usd | size }} positions · quoted in USD</span>
</div>

<div class="dh-panel dh-reveal">
  <div class="dh-holdings">
    <div class="dh-holdings__head">
      <span>Symbol</span><span>Qty</span><span>Avg</span><span>Last</span><span>Δ%</span><span>Value (₩)</span><span>P&amp;L (₩)</span>
    </div>
    {% for r in usd %}
    <div class="dh-holdings__row">
      <span class="dh-holdings__sym">
        <b>{{ r.sym }}</b>
        <em>{{ r.name }}</em>
      </span>
      <span>{{ r.qty }}</span>
      <span>${{ r.avg }}</span>
      <span>${{ r.last }}</span>
      <span class="dh-holdings__pct {% if r.pnl_pct >= 0 %}up{% else %}down{% endif %}">
        {% if r.pnl_pct >= 0 %}+{% endif %}{{ r.pnl_pct }}%
      </span>
      <span>₩{{ r.value_krw }}</span>
      <span class="{% if r.pnl_krw >= 0 %}up{% else %}down{% endif %}">
        {% if r.pnl_krw >= 0 %}+{% endif %}₩{{ r.pnl_krw }}
      </span>
    </div>
    {% endfor %}
  </div>
</div>

<div class="dh-section-title">
  Holdings · KR Equities
  <span class="dh-section-title__count">// {{ krw | size }} position · quoted in KRW</span>
</div>

<div class="dh-panel dh-reveal">
  <div class="dh-holdings">
    <div class="dh-holdings__head">
      <span>Symbol</span><span>Qty</span><span>Avg</span><span>Last</span><span>Δ%</span><span>Value (₩)</span><span>P&amp;L (₩)</span>
    </div>
    {% for r in krw %}
    <div class="dh-holdings__row">
      <span class="dh-holdings__sym">
        <b>{{ r.sym }}</b>
        <em>{{ r.name }}</em>
      </span>
      <span>{{ r.qty }}</span>
      <span>₩{{ r.avg }}</span>
      <span>₩{{ r.last }}</span>
      <span class="dh-holdings__pct {% if r.pnl_pct >= 0 %}up{% else %}down{% endif %}">
        {% if r.pnl_pct >= 0 %}+{% endif %}{{ r.pnl_pct }}%
      </span>
      <span>₩{{ r.value_krw }}</span>
      <span class="{% if r.pnl_krw >= 0 %}up{% else %}down{% endif %}">
        {% if r.pnl_krw >= 0 %}+{% endif %}₩{{ r.pnl_krw }}
      </span>
    </div>
    {% endfor %}
  </div>
</div>

<div class="dh-section-title">
  Holdings · Crypto
  <span class="dh-section-title__count">// {{ crp | size }} positions · quoted in KRW</span>
</div>

<div class="dh-panel dh-reveal">
  <div class="dh-holdings">
    <div class="dh-holdings__head">
      <span>Symbol</span><span>Qty</span><span>Avg</span><span>Last</span><span>Δ%</span><span>Value (₩)</span><span>P&amp;L (₩)</span>
    </div>
    {% for r in crp %}
    <div class="dh-holdings__row">
      <span class="dh-holdings__sym">
        <b>{{ r.sym }}</b>
        <em>{{ r.name }}</em>
      </span>
      <span>{{ r.qty }}</span>
      <span>₩{{ r.avg }}</span>
      <span>₩{{ r.last }}</span>
      <span class="dh-holdings__pct {% if r.pnl_pct >= 0 %}up{% else %}down{% endif %}">
        {% if r.pnl_pct >= 0 %}+{% endif %}{{ r.pnl_pct }}%
      </span>
      <span>₩{{ r.value_krw }}</span>
      <span class="{% if r.pnl_krw >= 0 %}up{% else %}down{% endif %}">
        {% if r.pnl_krw >= 0 %}+{% endif %}₩{{ r.pnl_krw }}
      </span>
    </div>
    {% endfor %}
  </div>
</div>

<div class="dh-section-title">
  Performers
  <span class="dh-section-title__count">// by % return</span>
</div>

<div class="dh-dashboard">
  <div class="dh-panel dh-span-6 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title" style="color: var(--up-color);">🚀 Top Gainers</h4>
      <span class="dh-panel__sub">winners</span>
    </div>
    <div class="dh-perf">
      {% assign all = usd | concat: krw | concat: crp %}
      {% assign sorted = all | sort: "pnl_pct" | reverse %}
      {% for r in sorted limit: 4 %}
        {% if r.pnl_pct >= 0 %}
        <div class="dh-perf__row">
          <span class="dh-perf__sym"><b>{{ r.sym }}</b><em>{{ r.name }}</em></span>
          <span class="dh-perf__bar"><span class="dh-perf__fill up" style="width: {{ r.pnl_pct | times: 2 | at_most: 100 }}%;"></span></span>
          <span class="dh-perf__pct up">+{{ r.pnl_pct }}%</span>
        </div>
        {% endif %}
      {% endfor %}
    </div>
  </div>

  <div class="dh-panel dh-span-6 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title" style="color: var(--down-color);">🩸 Top Losers</h4>
      <span class="dh-panel__sub">drawdowns</span>
    </div>
    <div class="dh-perf">
      {% assign sorted_dn = all | sort: "pnl_pct" %}
      {% for r in sorted_dn limit: 4 %}
        {% if r.pnl_pct < 0 %}
        {% assign mag = 0 | minus: r.pnl_pct %}
        <div class="dh-perf__row">
          <span class="dh-perf__sym"><b>{{ r.sym }}</b><em>{{ r.name }}</em></span>
          <span class="dh-perf__bar"><span class="dh-perf__fill down" style="width: {{ mag | times: 2 | at_most: 100 }}%;"></span></span>
          <span class="dh-perf__pct down">{{ r.pnl_pct }}%</span>
        </div>
        {% endif %}
      {% endfor %}
    </div>
  </div>
</div>

<p class="dh-portfolio-footnote">
  Snapshot는 수동으로 <code>_data/portfolio.yml</code>을 갱신할 때마다 다시 그려집니다.
  환율, 평단, 현재가는 브로커 앱 기준 스냅샷이며 실시간이 아닙니다.
  실시간 시장 데이터는 <a href="{{ '/markets/' | relative_url }}">/markets/</a>에서 확인하세요.
</p>

<script src="{{ '/assets/js/portfolio.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/reveal.js' | relative_url }}" defer></script>
