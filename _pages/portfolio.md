---
layout: page
title: portfolio
permalink: /portfolio/
description: 개인 투자 포트폴리오 스냅샷 · 자산군별 배분 · 종목별 P&L. Yahoo Finance 15분 cron.
nav: true
nav_order: 3

chart:
  echarts: true
---

{% assign p = site.data.portfolio %}
{% assign usd = p.holdings.us_equities %}
{% assign krw = p.holdings.kr_equities %}
{% assign crp = p.holdings.crypto %}

<section class="dh-hero">
  <div class="dh-hero__eyebrow"><span class="pulse-dot"></span> live · updated {{ p.updated }}</div>
  <h3 class="dh-hero__title">Portfolio</h3>
  <p class="dh-hero__tagline">
    실제 보유 중인 주식 · ETF · 크립토의 실시간 스냅샷. 모든 수치는
    <b>USD</b>로 통일했고, Yahoo Finance에서 15분마다 재페치 후 재빌드됩니다.
    KRW 포지션은 현재 환율 <code>₩{{ p.fx_usdkrw }} / USD</code>로 환산.
  </p>
</section>

<div class="dh-section-title">
  Book Summary
  <span class="dh-section-title__count">// aum &amp; realized book</span>
</div>

<div class="dh-grid">
  <div class="dh-stat dh-reveal">
    <div class="dh-stat__label">Total AUM</div>
    <div class="dh-stat__value">{{ p.summary.aum_display }}</div>
    <div class="dh-stat__note">보유 주식·ETF·크립토·현금 합계</div>
  </div>
  <div class="dh-stat dh-reveal">
    <div class="dh-stat__label">Unrealized P&amp;L</div>
    {% if p.summary.pnl_usd >= 0 %}
      <div class="dh-stat__value" style="color: var(--up);">{{ p.summary.pnl_display }}</div>
      <div class="dh-stat__note" style="color: var(--up);">▲ {{ p.summary.pnl_pct_display }} vs. cost basis</div>
    {% else %}
      <div class="dh-stat__value" style="color: var(--down);">{{ p.summary.pnl_display }}</div>
      <div class="dh-stat__note" style="color: var(--down);">▼ {{ p.summary.pnl_pct_display }} vs. cost basis</div>
    {% endif %}
  </div>
  <div class="dh-stat dh-reveal">
    <div class="dh-stat__label">Cash</div>
    <div class="dh-stat__value">{{ p.summary.cash_display }}</div>
    <div class="dh-stat__note">KRW + USD sweep</div>
  </div>
  <div class="dh-stat dh-reveal">
    <div class="dh-stat__label">Positions</div>
    <div class="dh-stat__value">{{ p.summary.positions }}</div>
    <div class="dh-stat__note">US · KR · Crypto 합계</div>
  </div>
</div>

<div class="dh-section-title">
  Asset Allocation
  <span class="dh-section-title__count">// by value (USD)</span>
</div>

<div class="dh-dashboard">
  <div class="dh-panel dh-span-7 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Allocation Donut</h4>
      <span class="dh-panel__sub">{{ p.allocation | size }} buckets</span>
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
        <div class="dh-alloc-row">
          <span class="dh-alloc-dot" style="background: {{ slice.color }};"></span>
          <span class="dh-alloc-label">{{ slice.label }}</span>
          <span class="dh-alloc-bar"><span class="dh-alloc-fill" style="width: {{ slice.pct_int }}%; background: {{ slice.color }};"></span></span>
          <span class="dh-alloc-pct">{{ slice.pct_display }}</span>
        </div>
      {% endfor %}
    </div>
  </div>
</div>

<div class="dh-section-title">
  Holdings · US Equities
  <span class="dh-section-title__count">// {{ usd | size }} positions</span>
</div>

<div class="dh-panel dh-reveal">
  <div class="dh-holdings">
    <div class="dh-holdings__head">
      <span>Symbol</span><span>Qty</span><span>Avg</span><span>Last</span><span>Δ%</span><span>Value</span><span>P&amp;L</span>
    </div>
    {% for r in usd %}
    <div class="dh-holdings__row">
      <span class="dh-holdings__sym">
        <span class="dh-holdings__logo">
          {% if r.logo %}<img src="{{ r.logo }}" alt="" loading="lazy" onerror="this.style.display='none'" />{% endif %}
        </span>
        <b class="dh-holdings__ticker">{{ r.sym }}</b>
        <em class="dh-holdings__name">{{ r.name }}</em>
      </span>
      <span>{{ r.qty }}</span>
      <span>{{ r.avg_display }}</span>
      <span>{{ r.last_display }}</span>
      <span class="dh-holdings__pct {% if r.pnl_pct >= 0 %}up{% else %}down{% endif %}">
        {{ r.pnl_pct_display }}
      </span>
      <span>{{ r.value_display }}</span>
      <span class="{% if r.pnl >= 0 %}up{% else %}down{% endif %}">
        {{ r.pnl_display }}
      </span>
    </div>
    {% endfor %}
  </div>
</div>

<div class="dh-section-title">
  Holdings · KR Equities
  <span class="dh-section-title__count">// {{ krw | size }} position · USD converted</span>
</div>

<div class="dh-panel dh-reveal">
  <div class="dh-holdings">
    <div class="dh-holdings__head">
      <span>Symbol</span><span>Qty</span><span>Avg</span><span>Last</span><span>Δ%</span><span>Value</span><span>P&amp;L</span>
    </div>
    {% for r in krw %}
    <div class="dh-holdings__row">
      <span class="dh-holdings__sym">
        <span class="dh-holdings__logo">
          {% if r.logo %}<img src="{{ r.logo }}" alt="" loading="lazy" onerror="this.style.display='none'" />{% endif %}
        </span>
        <b class="dh-holdings__ticker">{{ r.sym }}</b>
        <em class="dh-holdings__name">{{ r.name }}</em>
      </span>
      <span>{{ r.qty }}</span>
      <span>{{ r.avg_display }}</span>
      <span>{{ r.last_display }}</span>
      <span class="dh-holdings__pct {% if r.pnl_pct >= 0 %}up{% else %}down{% endif %}">
        {{ r.pnl_pct_display }}
      </span>
      <span>{{ r.value_display }}</span>
      <span class="{% if r.pnl >= 0 %}up{% else %}down{% endif %}">
        {{ r.pnl_display }}
      </span>
    </div>
    {% endfor %}
  </div>
</div>

<div class="dh-section-title">
  Holdings · Crypto
  <span class="dh-section-title__count">// {{ crp | size }} positions</span>
</div>

<div class="dh-panel dh-reveal">
  <div class="dh-holdings">
    <div class="dh-holdings__head">
      <span>Symbol</span><span>Qty</span><span>Avg</span><span>Last</span><span>Δ%</span><span>Value</span><span>P&amp;L</span>
    </div>
    {% for r in crp %}
    <div class="dh-holdings__row">
      <span class="dh-holdings__sym">
        <span class="dh-holdings__logo">
          {% if r.logo %}<img src="{{ r.logo }}" alt="" loading="lazy" onerror="this.style.display='none'" />{% endif %}
        </span>
        <b class="dh-holdings__ticker">{{ r.sym }}</b>
        <em class="dh-holdings__name">{{ r.name }}</em>
      </span>
      <span>{{ r.qty }}</span>
      <span>{{ r.avg_display }}</span>
      <span>{{ r.last_display }}</span>
      <span class="dh-holdings__pct {% if r.pnl_pct >= 0 %}up{% else %}down{% endif %}">
        {{ r.pnl_pct_display }}
      </span>
      <span>{{ r.value_display }}</span>
      <span class="{% if r.pnl >= 0 %}up{% else %}down{% endif %}">
        {{ r.pnl_display }}
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
      <h4 class="dh-panel__title" style="color: var(--up);">Top Gainers</h4>
      <span class="dh-panel__sub">winners</span>
    </div>
    <div class="dh-perf">
      {% assign all = usd | concat: krw | concat: crp %}
      {% assign sorted = all | sort: "pnl_pct" | reverse %}
      {% for r in sorted limit: 4 %}
        {% if r.pnl_pct >= 0 %}
        <div class="dh-perf__row">
          <span class="dh-perf__sym">
            <span class="dh-perf__logo">{% if r.logo %}<img src="{{ r.logo }}" alt="" loading="lazy" onerror="this.style.display='none'" />{% endif %}</span>
            <b class="dh-perf__ticker">{{ r.sym }}</b>
            <em class="dh-perf__name">{{ r.name }}</em>
          </span>
          <span class="dh-perf__bar"><span class="dh-perf__fill up" style="width: {{ r.pnl_pct | times: 2 | at_most: 100 }}%;"></span></span>
          <span class="dh-perf__pct up">{{ r.pnl_pct_display }}</span>
        </div>
        {% endif %}
      {% endfor %}
    </div>
  </div>

  <div class="dh-panel dh-span-6 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title" style="color: var(--down);">Top Losers</h4>
      <span class="dh-panel__sub">drawdowns</span>
    </div>
    <div class="dh-perf">
      {% assign sorted_dn = all | sort: "pnl_pct" %}
      {% for r in sorted_dn limit: 4 %}
        {% if r.pnl_pct < 0 %}
        {% assign mag = 0 | minus: r.pnl_pct %}
        <div class="dh-perf__row">
          <span class="dh-perf__sym">
            <span class="dh-perf__logo">{% if r.logo %}<img src="{{ r.logo }}" alt="" loading="lazy" onerror="this.style.display='none'" />{% endif %}</span>
            <b class="dh-perf__ticker">{{ r.sym }}</b>
            <em class="dh-perf__name">{{ r.name }}</em>
          </span>
          <span class="dh-perf__bar"><span class="dh-perf__fill down" style="width: {{ mag | times: 2 | at_most: 100 }}%;"></span></span>
          <span class="dh-perf__pct down">{{ r.pnl_pct_display }}</span>
        </div>
        {% endif %}
      {% endfor %}
    </div>
  </div>
</div>

<p class="dh-portfolio-footnote">
  Yahoo Finance 15분 cron이 <code>_data/portfolio.json</code>을 갱신하고 사이트를 재빌드합니다.
  포지션(수량·평단)은 <code>scripts/fetch_portfolio.py</code>의 <code>POSITIONS</code> 리스트에서 수동 관리.
  실시간 시장 데이터는 <a href="{{ '/markets/' | relative_url }}">/markets/</a>에 있습니다.
</p>

<script src="{{ '/assets/js/portfolio.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/reveal.js' | relative_url }}" defer></script>
