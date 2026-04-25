// /sentiment/ — Crowd Pulse interactive dashboard.
//   Reads window.SENTIMENT_DATA (server-rendered JSON from
//   _data/sentiment/summary.json) and lazy-fetches the rolling history
//   from window.SENTIMENT_HISTORY_URL on first drill-down click.
(function () {
  "use strict";

  var DATA = window.SENTIMENT_DATA || null;
  if (!DATA || !DATA.tickers || !DATA.tickers.length) return;
  var HISTORY_URL = window.SENTIMENT_HISTORY_URL;
  var historyCache = null;
  var activeSym = DATA.tickers[0].sym;

  // ---------------- helpers ----------------
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fmt(n, d) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return Number(n).toFixed(d == null ? 2 : d);
  }
  function fmtSigned(n, d) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    var s = Number(n).toFixed(d == null ? 2 : d);
    return n > 0 ? "+" + s : s;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sentClass(s) {
    if (s > 0.15) return "bull";
    if (s < -0.15) return "bear";
    return "neutral";
  }
  function sentColor(s) {
    var dark = isDark();
    if (s > 0.15) return dark ? "#34d399" : "#047857";
    if (s < -0.15) return dark ? "#f87171" : "#b91c1c";
    return dark ? "#a1a1aa" : "#78716c";
  }
  function fgColor() { return isDark() ? "#f4f4f5" : "#1c1917"; }
  function gridColor() { return isDark() ? "#242424" : "#e7e5e4"; }
  function muteColor() { return isDark() ? "#a1a1aa" : "#78716c"; }

  // ---------------- top-mentions list ----------------
  function renderMentionsList() {
    var host = document.getElementById("sent-mentions");
    if (!host) return;
    var items = DATA.tickers.slice(0, 25);
    var maxM = items.reduce(function (m, t) { return Math.max(m, t.mentions); }, 1);
    host.innerHTML = items.map(function (t) {
      var pct = clamp(t.mentions / maxM, 0.04, 1) * 100;
      var cls = sentClass(t.sentiment);
      var z = t.z_score;
      var zStr = z == null ? "" :
        '<span class="' + (z >= 0 ? "z-pos" : "z-neg") + '">z=' + fmtSigned(z, 1) + '</span>';
      return '' +
        '<div class="sent-row" data-sym="' + t.sym + '">' +
          '<div class="sent-row__sym">' + t.sym + '</div>' +
          '<div class="sent-row__bar">' +
            '<div class="sent-row__bar-fill ' + cls + '" style="width:' + pct.toFixed(1) + '%">' +
              t.mentions + ' · ' + (t.sentiment > 0 ? "+" : "") + fmt(t.sentiment, 2) +
            '</div>' +
          '</div>' +
          '<div class="sent-row__meta">' +
            '<span>' + t.mentions_24h + '/24h · ' + t.velocity_per_hour + '/h</span>' +
            zStr +
          '</div>' +
        '</div>';
    }).join("");
    host.querySelectorAll(".sent-row").forEach(function (el) {
      el.addEventListener("click", function () {
        setActive(el.getAttribute("data-sym"));
      });
    });
    highlightActiveRow();
  }

  function highlightActiveRow() {
    document.querySelectorAll(".sent-row").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-sym") === activeSym);
    });
  }

  // ---------------- z-score scatter ----------------
  var scatterChart = null;
  function renderScatter() {
    var el = document.getElementById("sent-scatter");
    if (!el || typeof echarts === "undefined") return;
    if (scatterChart) { scatterChart.dispose(); }
    scatterChart = echarts.init(el, isDark() ? "dark" : null, { renderer: "canvas" });

    var pts = DATA.tickers
      .filter(function (t) { return t.z_score != null; })
      .map(function (t) {
        return {
          name: t.sym,
          value: [t.z_score, t.sentiment, t.mentions],
          itemStyle: { color: sentColor(t.sentiment) },
        };
      });

    scatterChart.setOption({
      backgroundColor: "transparent",
      grid: { left: 50, right: 24, top: 24, bottom: 38 },
      tooltip: {
        trigger: "item",
        formatter: function (p) {
          return '<b>' + p.name + '</b><br>z=' + fmtSigned(p.value[0], 2) +
                 '<br>sentiment ' + fmtSigned(p.value[1], 2) +
                 '<br>mentions ' + p.value[2];
        },
      },
      xAxis: {
        name: "z-score (mentions)", nameLocation: "middle", nameGap: 24,
        nameTextStyle: { color: muteColor(), fontSize: 11 },
        axisLine: { lineStyle: { color: muteColor() } },
        splitLine: { lineStyle: { color: gridColor() } },
        axisLabel: { color: muteColor() },
      },
      yAxis: {
        name: "sentiment", nameLocation: "middle", nameGap: 36,
        nameTextStyle: { color: muteColor(), fontSize: 11 },
        min: -1, max: 1,
        axisLine: { lineStyle: { color: muteColor() } },
        splitLine: { lineStyle: { color: gridColor() } },
        axisLabel: { color: muteColor() },
      },
      series: [{
        type: "scatter",
        data: pts,
        symbolSize: function (val) { return Math.max(8, Math.min(36, Math.sqrt(val[2]) * 2.2)); },
        label: {
          show: true, formatter: "{b}", fontSize: 10, color: fgColor(),
          position: "top", distance: 4,
        },
        emphasis: { focus: "self" },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: muteColor(), type: "dashed", width: 1 },
          data: [
            { yAxis: 0 },
            { xAxis: 0 },
            { xAxis: 2, lineStyle: { color: muteColor(), opacity: 0.4 } },
            { xAxis: -2, lineStyle: { color: muteColor(), opacity: 0.4 } },
          ],
        },
      }],
    });
    window.addEventListener("resize", function () { scatterChart.resize(); });
  }

  // ---------------- drill-down ----------------
  function renderSelector() {
    var host = document.getElementById("sent-select");
    if (!host) return;
    host.innerHTML = DATA.tickers.slice(0, 40).map(function (t) {
      return '<button data-sym="' + t.sym + '">' +
        '<span class="sent-drill__sym">' + t.sym + '</span>' +
        '<span>' + t.mentions + '</span>' +
        '</button>';
    }).join("");
    host.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () { setActive(b.getAttribute("data-sym")); });
    });
    highlightActiveButton();
  }
  function highlightActiveButton() {
    document.querySelectorAll("#sent-select button").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-sym") === activeSym);
    });
  }

  function setActive(sym) {
    if (!sym) return;
    activeSym = sym;
    highlightActiveRow();
    highlightActiveButton();
    renderHistory();
    renderSamples();
  }

  // ---------------- history line ----------------
  var historyChart = null;
  function ensureHistory(cb) {
    if (historyCache) return cb(historyCache);
    if (!HISTORY_URL) return cb({});
    fetch(HISTORY_URL).then(function (r) {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    }).then(function (j) {
      historyCache = (j && j.by_symbol) || {};
      cb(historyCache);
    }).catch(function () { historyCache = {}; cb({}); });
  }

  function renderHistory() {
    var el = document.getElementById("sent-history");
    if (!el || typeof echarts === "undefined") return;
    ensureHistory(function (hist) {
      if (historyChart) historyChart.dispose();
      historyChart = echarts.init(el, isDark() ? "dark" : null, { renderer: "canvas" });
      var rows = (hist[activeSym] || []);
      // Always include the live snapshot as the latest point
      var live = DATA.tickers.find(function (t) { return t.sym === activeSym; });
      if (live) {
        rows = rows.concat([{ t: DATA.updated, mentions: live.mentions, sentiment: live.sentiment }]);
      }
      var xs = rows.map(function (r) { return r.t.replace("T", " ").slice(0, 16); });
      var mentionSeries = rows.map(function (r) { return r.mentions; });
      var sentSeries = rows.map(function (r) { return r.sentiment; });
      historyChart.setOption({
        backgroundColor: "transparent",
        grid: { left: 48, right: 56, top: 30, bottom: 36 },
        legend: {
          data: ["mentions", "sentiment"], textStyle: { color: muteColor() },
          top: 0, right: 0,
        },
        tooltip: { trigger: "axis" },
        xAxis: {
          type: "category", data: xs, boundaryGap: false,
          axisLine: { lineStyle: { color: muteColor() } },
          splitLine: { show: false },
          axisLabel: { color: muteColor(), fontSize: 10 },
        },
        yAxis: [
          { type: "value", name: "mentions",
            nameTextStyle: { color: muteColor(), fontSize: 10 },
            axisLine: { lineStyle: { color: muteColor() } },
            splitLine: { lineStyle: { color: gridColor() } },
            axisLabel: { color: muteColor() } },
          { type: "value", name: "sentiment", min: -1, max: 1,
            nameTextStyle: { color: muteColor(), fontSize: 10 },
            axisLine: { lineStyle: { color: muteColor() } },
            splitLine: { show: false },
            axisLabel: { color: muteColor() } },
        ],
        series: [
          { name: "mentions", type: "bar", data: mentionSeries,
            itemStyle: { color: muteColor(), opacity: 0.65 } },
          { name: "sentiment", type: "line", yAxisIndex: 1, data: sentSeries,
            smooth: true, symbol: "circle", symbolSize: 5,
            lineStyle: { color: fgColor(), width: 2 },
            itemStyle: { color: fgColor() } },
        ],
      });
      window.addEventListener("resize", function () { historyChart.resize(); });
    });
  }

  // ---------------- samples ----------------
  function renderSamples() {
    var host = document.getElementById("sent-samples");
    if (!host) return;
    var t = DATA.tickers.find(function (x) { return x.sym === activeSym; });
    if (!t || !t.samples || !t.samples.length) {
      host.innerHTML = '<div class="sent-empty">샘플 글이 없습니다.</div>';
      return;
    }
    host.innerHTML = t.samples.map(function (s) {
      var sentSign = s.sent > 0.15 ? "up" : (s.sent < -0.15 ? "down" : "");
      return '' +
        '<div class="sent-sample">' +
          '<div class="sent-sample__head">' +
            '<span class="sent-sample__pf sent-sample__pf-' + s.platform + '">' + s.platform + '</span>' +
            '<span>↑ ' + s.score + '</span>' +
            '<span class="sent-sample__sent ' + sentSign + '">' + fmtSigned(s.sent, 2) + '</span>' +
          '</div>' +
          '<div class="sent-sample__body">' +
            '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' +
              escapeHtml(s.text || "[no text]") +
            '</a>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  // ---------------- init ----------------
  function init() {
    renderMentionsList();
    renderScatter();
    renderSelector();
    renderHistory();
    renderSamples();

    // Re-render charts on dark-mode toggle
    var mo = new MutationObserver(function () {
      renderScatter();
      renderHistory();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
