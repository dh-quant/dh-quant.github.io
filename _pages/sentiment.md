---
layout: page
title: sentiment
permalink: /sentiment/
description: 실시간 개미 동향 — Reddit · StockTwits · Bluesky · 4chan · HN을 30분 cron으로 크롤링해 종목 멘션·감성·이상치를 종합 분석합니다.
nav: true
nav_order: 2

chart:
  echarts: true

_styles: >
  /* sentiment-specific bits — use the global dh-* design system for the rest */
  .sent-conc {
    border: 1px solid var(--accent-line);
    background: var(--accent-soft);
    border-radius: var(--r-md);
    padding: 1.1rem 1.3rem 1.2rem;
    margin: 0.4rem 0 1.6rem;
  }
  .sent-conc__title {
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 0.55rem;
  }
  .sent-conc__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.35rem; }
  .sent-conc__row {
    display: flex; gap: 0.7rem; align-items: baseline;
    font-size: 0.95rem; line-height: 1.5;
  }
  .sent-conc__row .sent-conc__icon {
    flex: 0 0 1.4rem; font-size: 1rem; opacity: 0.85;
  }
  .sent-conc__row.tone-warn { color: var(--fg); }
  .sent-conc__row.tone-warn b { color: var(--accent); }
  .sent-conc__updated { font-size: 0.72rem; color: var(--fg-mute); margin-top: 0.6rem; font-variant-numeric: tabular-nums; }

  .sent-platforms {
    display: flex; flex-wrap: wrap; gap: 0.55rem;
    margin: 0 0 1.2rem; font-size: 0.78rem;
  }
  .sent-pf {
    border: 1px solid var(--border); border-radius: 999px;
    padding: 0.35rem 0.85rem; background: var(--surface);
    display: inline-flex; gap: 0.4rem; align-items: baseline;
    font-variant-numeric: tabular-nums;
  }
  .sent-pf b { color: var(--fg); font-weight: 600; }
  .sent-pf--total { background: var(--fg); color: var(--surface); border-color: var(--fg); }
  .sent-pf--total b { color: var(--surface); }

  .sent-mentions { display: grid; grid-template-columns: 1fr; gap: 0.35rem; }
  .sent-row {
    display: grid;
    grid-template-columns: 2.6rem 1fr auto;
    gap: 0.7rem; align-items: center;
    padding: 0.45rem 0.4rem;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.18s var(--ease);
  }
  .sent-row:hover { background: var(--surface-mute); }
  .sent-row.is-active { background: var(--accent-soft); }
  .sent-row__sym { font-weight: 700; font-family: var(--mono); font-size: 0.92rem; }
  .sent-row__bar {
    position: relative; height: 22px; background: var(--surface-sunken); border-radius: 4px;
    overflow: hidden;
  }
  .sent-row__bar-fill {
    position: absolute; left: 0; top: 0; bottom: 0;
    background: var(--fg-mute); border-radius: 4px;
    display: flex; align-items: center; padding-left: 0.55rem;
    font-size: 0.72rem; color: var(--surface);
    font-variant-numeric: tabular-nums;
  }
  .sent-row__bar-fill.bull { background: var(--up); }
  .sent-row__bar-fill.bear { background: var(--down); }
  .sent-row__bar-fill.neutral { background: var(--fg-mute); }
  .sent-row__meta {
    font-variant-numeric: tabular-nums;
    font-size: 0.78rem; color: var(--fg-mute);
    text-align: right;
    display: flex; flex-direction: column; gap: 0.1rem; line-height: 1.15;
  }
  .sent-row__meta .z-pos { color: var(--accent); font-weight: 600; }
  .sent-row__meta .z-neg { color: var(--fg-mute); font-weight: 600; }

  .sent-chart { width: 100%; min-height: 320px; }

  .sent-drill {
    display: grid; grid-template-columns: minmax(160px, 220px) 1fr;
    gap: 1.2rem;
  }
  @media (max-width: 768px) { .sent-drill { grid-template-columns: 1fr; } }
  .sent-drill__select {
    display: flex; flex-direction: column; gap: 0.25rem;
    max-height: 380px; overflow-y: auto;
    border: 1px solid var(--border); border-radius: var(--r-sm);
    padding: 0.4rem;
  }
  .sent-drill__select button {
    text-align: left; background: none; border: none; padding: 0.45rem 0.6rem;
    border-radius: 6px; cursor: pointer; font-size: 0.82rem;
    color: var(--fg); font-family: var(--sans);
    display: flex; justify-content: space-between; gap: 0.5rem;
  }
  .sent-drill__select button:hover { background: var(--surface-mute); }
  .sent-drill__select button.is-active {
    background: var(--accent-soft); color: var(--accent); font-weight: 600;
  }
  .sent-drill__select .sent-drill__sym { font-family: var(--mono); }

  .sent-samples { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.55rem; }
  .sent-sample {
    border: 1px solid var(--border); border-radius: var(--r-sm);
    padding: 0.6rem 0.8rem; font-size: 0.83rem; line-height: 1.45;
    background: var(--surface);
  }
  .sent-sample__head {
    font-size: 0.7rem; color: var(--fg-mute);
    display: flex; gap: 0.6rem; margin-bottom: 0.3rem;
    font-variant-numeric: tabular-nums;
  }
  .sent-sample__pf {
    text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;
  }
  .sent-sample__pf-reddit { color: #ff4500; }
  .sent-sample__pf-stocktwits { color: #1d8efe; }
  .sent-sample__pf-bluesky { color: #0085ff; }
  .sent-sample__pf-4chan { color: #117743; }
  .sent-sample__pf-hn { color: #ff6600; }
  .sent-sample__sent {
    margin-left: auto; font-weight: 600;
  }
  .sent-sample__sent.up { color: var(--up); }
  .sent-sample__sent.down { color: var(--down); }
  .sent-sample__body {
    color: var(--fg);
    overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  .sent-sample a { color: var(--accent); text-decoration: none; }
  .sent-sample a:hover { text-decoration: underline; }

  .sent-empty {
    padding: 3rem 1rem; text-align: center; color: var(--fg-mute);
    font-size: 0.9rem;
  }
---

{% assign s = site.data.sentiment.summary %}

<section class="dh-hero">
  <div class="dh-hero__eyebrow"><span class="pulse-dot"></span> live · 30m cron</div>
  <h3 class="dh-hero__title">Crowd Pulse</h3>
  <p class="dh-hero__tagline">
    Reddit · StockTwits · Bluesky · 4chan/biz · HackerNews를 30분 cron으로 긁어와
    종목 <b>멘션</b>, <b>감성</b>, <b>이상치 z-score</b>를 종합합니다.
    상단 결론은 규칙 기반 자동 생성 — 매매 결정은 본인 판단으로.
  </p>
</section>

{% if s %}
<div class="sent-conc">
  <div class="sent-conc__title">// 오늘의 결론</div>
  {% if s.conclusions.size > 0 %}
  <ul class="sent-conc__list">
    {% for c in s.conclusions %}
    <li class="sent-conc__row tone-{{ c.tone }}">
      <span class="sent-conc__icon">{{ c.icon }}</span>
      <span>{{ c.text }}</span>
    </li>
    {% endfor %}
  </ul>
  {% else %}
  <div class="sent-empty">아직 결론 생성 중 — 첫 cron 후 확인.</div>
  {% endif %}
  <div class="sent-conc__updated">
    Updated · {{ s.updated }} · {{ s.doc_count }} docs
  </div>
</div>

<div class="sent-platforms">
  {% for p in s.platforms %}
    <span class="sent-pf"><span>{{ p[0] }}</span><b>{{ p[1] }}</b></span>
  {% endfor %}
  <span class="sent-pf sent-pf--total"><span>total</span><b>{{ s.doc_count }}</b></span>
</div>

<div class="dh-section-title">Top Mentions
  <span class="dh-section-title__count">// {{ s.tickers.size }} symbols</span>
</div>

<div class="dh-dashboard">

  <div class="dh-panel dh-span-7 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Mentions × Sentiment</h4>
      <span class="dh-panel__sub">bar = mention count, color = sentiment, click to drill</span>
    </div>
    <div class="sent-mentions" id="sent-mentions"></div>
  </div>

  <div class="dh-panel dh-span-5 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Z-score × Sentiment</h4>
      <span class="dh-panel__sub">우상단 = 과열, 우하단 = 패닉</span>
    </div>
    <div id="sent-scatter" class="sent-chart" style="min-height:340px"></div>
  </div>

  <div class="dh-panel dh-span-12 dh-reveal">
    <div class="dh-panel__head">
      <h4 class="dh-panel__title">Per-ticker drill-down</h4>
      <span class="dh-panel__sub">시계열 + 대표 글</span>
    </div>
    <div class="sent-drill">
      <div class="sent-drill__select" id="sent-select"></div>
      <div>
        <div id="sent-history" class="sent-chart" style="min-height:240px"></div>
        <div class="sent-samples" id="sent-samples"></div>
      </div>
    </div>
  </div>

</div>

<script>
  window.SENTIMENT_DATA = {{ s | jsonify }};
  window.SENTIMENT_HISTORY_URL = "{{ '/_data/sentiment/history.json' | relative_url }}";
</script>
<script src="{{ '/assets/js/sentiment.js' | relative_url }}" defer></script>
<script src="{{ '/assets/js/reveal.js' | relative_url }}" defer></script>

{% else %}
<div class="sent-empty">
  Sentiment 데이터가 아직 생성되지 않았습니다.<br>
  <code>scripts/fetch_sentiment.py</code>를 한 번 돌리거나 <code>sentiment-data</code> 워크플로우가 실행되길 기다려주세요.
</div>
{% endif %}
