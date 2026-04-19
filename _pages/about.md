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
  chartjs: true
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

<div class="dh-ticker" aria-hidden="true">
  <div class="dh-ticker__track">
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">KOSPI</span> <span class="dh-ticker__price">2,712.34</span> <span class="dh-ticker__chg dh-ticker__chg--up">▲ 0.82%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">KOSDAQ</span> <span class="dh-ticker__price">878.12</span> <span class="dh-ticker__chg dh-ticker__chg--down">▼ 0.35%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">S&P 500</span> <span class="dh-ticker__price">5,204.10</span> <span class="dh-ticker__chg dh-ticker__chg--up">▲ 1.13%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">NDX</span> <span class="dh-ticker__price">18,330.70</span> <span class="dh-ticker__chg dh-ticker__chg--up">▲ 1.46%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">NQ1!</span> <span class="dh-ticker__price">18,402.25</span> <span class="dh-ticker__chg dh-ticker__chg--up">▲ 0.91%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">WTI</span> <span class="dh-ticker__price">82.41</span> <span class="dh-ticker__chg dh-ticker__chg--down">▼ 0.44%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">GOLD</span> <span class="dh-ticker__price">2,391.60</span> <span class="dh-ticker__chg dh-ticker__chg--up">▲ 0.27%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">BTC</span> <span class="dh-ticker__price">63,110</span> <span class="dh-ticker__chg dh-ticker__chg--down">▼ 1.12%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">USDKRW</span> <span class="dh-ticker__price">1,378.20</span> <span class="dh-ticker__chg dh-ticker__chg--up">▲ 0.18%</span></span>
    <span class="dh-ticker__item"><span class="dh-ticker__symbol">VIX</span> <span class="dh-ticker__price">14.32</span> <span class="dh-ticker__chg dh-ticker__chg--down">▼ 3.12%</span></span>
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

### 샘플 에쿼티 커브

실험 전략의 누적 수익 곡선(예시). 벤치마크 대비 알파와 드로우다운을 한눈에 봅니다.

<div class="dh-chart-wrap">
  <h4>Equity Curve · Strategy vs. Benchmark</h4>
  <canvas id="dhEquityChart" height="140"></canvas>
</div>

<script>
  (function () {
    function initChart() {
      var el = document.getElementById("dhEquityChart");
      if (!el || typeof Chart === "undefined") return;

      // Synthetic but plausible equity curves (not real P&L)
      var labels = [];
      var n = 120;
      for (var i = 0; i < n; i++) labels.push("D" + (i + 1));

      function walk(seed, drift, vol) {
        var out = [100];
        var s = seed;
        for (var i = 1; i < n; i++) {
          s = (s * 9301 + 49297) % 233280;
          var r = (s / 233280 - 0.5) * 2;
          out.push(+(out[i - 1] * (1 + drift + r * vol)).toFixed(2));
        }
        return out;
      }

      var strat = walk(42, 0.0018, 0.011);
      var bench = walk(7,  0.0007, 0.009);

      var styles = getComputedStyle(document.documentElement);
      var bull = styles.getPropertyValue("--bull-color").trim() || "#11d68b";
      var accent = styles.getPropertyValue("--accent-violet").trim() || "#7c5cff";
      var textCol = styles.getPropertyValue("--global-text-color").trim() || "#111";
      var gridCol = styles.getPropertyValue("--global-divider-color").trim() || "rgba(0,0,0,0.08)";

      new Chart(el.getContext("2d"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Strategy",
              data: strat,
              borderColor: bull,
              backgroundColor: bull + "22",
              tension: 0.25,
              fill: true,
              pointRadius: 0,
              borderWidth: 2
            },
            {
              label: "Benchmark",
              data: bench,
              borderColor: accent,
              backgroundColor: "transparent",
              borderDash: [4, 4],
              tension: 0.25,
              pointRadius: 0,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { color: textCol, font: { size: 11 } } },
            tooltip: { mode: "index", intersect: false }
          },
          scales: {
            x: { ticks: { color: textCol, maxTicksLimit: 6 }, grid: { color: gridCol } },
            y: { ticks: { color: textCol }, grid: { color: gridCol } }
          }
        }
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initChart);
    } else {
      setTimeout(initChart, 50);
    }
  })();
</script>

### 연락 · 링크

관심사가 겹치거나 이야기 나누고 싶으시면 메일·깃허브로 편하게 연락 주세요.
