// /options/ — Options Desk dashboard.
//   Reads window.OPTIONS_DATA (from _data/options/snapshot.json) and renders
//   five ECharts panels per ticker. Switching tickers re-renders everything.
(function () {
  "use strict";

  var DATA = window.OPTIONS_DATA || null;
  if (!DATA || !DATA.tickers || !DATA.tickers.length) return;
  var bySym = {};
  DATA.tickers.forEach(function (t) { bySym[t.sym] = t; });
  var activeSym = DATA.tickers[0].sym;
  var charts = {}; // keyed by id

  // ---------------- helpers ----------------
  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }
  function fgColor() { return isDark() ? "#f4f4f5" : "#1c1917"; }
  function muteColor() { return isDark() ? "#a1a1aa" : "#78716c"; }
  function gridColor() { return isDark() ? "#242424" : "#e7e5e4"; }
  function upColor() { return isDark() ? "#34d399" : "#047857"; }
  function downColor() { return isDark() ? "#f87171" : "#b91c1c"; }
  function accentColor() { return isDark() ? "#fbbf24" : "#b45309"; }

  function fmt(n, d) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return Number(n).toFixed(d == null ? 2 : d);
  }
  function fmtPct(n, d) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return (Number(n) * 100).toFixed(d == null ? 1 : d) + "%";
  }
  function fmtSigned(n, d) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    var s = Number(n).toFixed(d == null ? 2 : d);
    return n > 0 ? "+" + s : s;
  }
  function fmtBn(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    var v = Number(n);
    var sign = v >= 0 ? "+" : "";
    var ab = Math.abs(v);
    if (ab >= 1e9) return sign + (v / 1e9).toFixed(2) + "B";
    if (ab >= 1e6) return sign + (v / 1e6).toFixed(2) + "M";
    if (ab >= 1e3) return sign + (v / 1e3).toFixed(1) + "K";
    return sign + v.toFixed(0);
  }

  function dispose(id) {
    if (charts[id]) { charts[id].dispose(); delete charts[id]; }
  }
  function newChart(id) {
    var el = document.getElementById(id);
    if (!el || typeof echarts === "undefined") return null;
    dispose(id);
    var c = echarts.init(el, isDark() ? "dark" : null, { renderer: "canvas" });
    charts[id] = c;
    return c;
  }

  // ---------------- conclusion + snap stats ----------------
  function renderConclusion() {
    var t = bySym[activeSym];
    document.getElementById("opt-conc-sym").textContent = " · " + t.sym + " @ " + fmt(t.spot, 2);
    var list = document.getElementById("opt-conc-list");
    list.innerHTML = (t.conclusions || []).map(function (c) {
      return '<li class="opt-conc__row tone-' + (c.tone || "info") + '">' +
        '<span class="opt-conc__icon">' + (c.icon || "•") + '</span>' +
        '<span>' + c.text + '</span></li>';
    }).join("") || '<li class="opt-conc__row"><span>아직 결론 생성 중.</span></li>';
  }

  function renderSnap() {
    var t = bySym[activeSym];
    var s = t.summary || {};
    var stats = [
      { label: "Spot", value: fmt(t.spot, 2), cls: "" },
      { label: "ATM IV 30D", value: fmtPct(s.atm_iv_30d, 1),
        sub: "vs RV30 " + fmtPct(s.realized_vol_30d, 1), cls: "" },
      { label: "VRP", value: fmtSigned(s.vrp_30d * 100, 1) + " vp",
        sub: "IV − Realized", cls: (s.vrp_30d || 0) > 0 ? "up" : "down" },
      { label: "IV %ile",
        value: s.iv_pct_history == null ? ("n=" + s.iv_history_n) : fmtPct(s.iv_pct_history, 0),
        sub: "rolling history (n=" + s.iv_history_n + ")",
        cls: s.iv_pct_history >= 0.8 ? "down" : s.iv_pct_history <= 0.2 ? "up" : "" },
      { label: "25Δ Skew", value: fmtSigned(s.skew_25_30d * 100, 1) + " vp",
        sub: "put − call", cls: "" },
      { label: "Term", value: s.term_state || "—",
        sub: "slope " + fmtSigned(s.term_slope * 100, 1) + " vp",
        cls: s.term_state === "backwardation" ? "down" : "" },
      { label: "Net GEX", value: fmtBn(s.net_gex) + "$",
        sub: (s.net_gex || 0) >= 0 ? "stabilizing" : "destabilizing",
        cls: (s.net_gex || 0) >= 0 ? "up" : "down" },
      { label: "γ Flip",
        value: s.zero_gamma_flip ? fmt(s.zero_gamma_flip, 2) : "—",
        sub: s.zero_gamma_flip ? fmtSigned((s.zero_gamma_flip - t.spot) / t.spot * 100, 2) + "% vs spot" : "",
        cls: "accent" },
      { label: "Pin", value: s.pin_candidate ? fmt(s.pin_candidate.strike, 2) : "—",
        sub: s.pin_candidate ? fmtBn(s.pin_candidate.gex) + "$ GEX" : "", cls: "accent" },
      { label: "P/C OI", value: fmt(s.pcr_oi, 2),
        sub: "vol " + fmt(s.pcr_vol, 2),
        cls: s.pcr_oi >= 1.4 ? "down" : s.pcr_oi <= 0.7 ? "up" : "" },
    ];
    document.getElementById("opt-snap").innerHTML = stats.map(function (st) {
      return '<div class="opt-stat">' +
        '<div class="opt-stat__label">' + st.label + '</div>' +
        '<div class="opt-stat__value ' + (st.cls || "") + '">' + st.value + '</div>' +
        (st.sub ? '<div class="opt-stat__sub">' + st.sub + '</div>' : '') +
        '</div>';
    }).join("");
  }

  // ---------------- GEX by Strike ----------------
  function renderGex() {
    var c = newChart("opt-gex-chart");
    if (!c) return;
    var t = bySym[activeSym];
    var rows = (t.by_strike || []).filter(function (r) {
      return Math.abs(r.strike - t.spot) / t.spot <= 0.10;
    });
    if (!rows.length) { c.setOption({ title: { text: "no data", textStyle: { color: muteColor() } } }); return; }
    var x = rows.map(function (r) { return r.strike; });
    var gex = rows.map(function (r) { return r.gex; });
    var s = t.summary || {};
    var marks = [];
    marks.push({ name: "spot", xAxis: t.spot,
      lineStyle: { color: muteColor(), type: "dashed", width: 1 },
      label: { color: muteColor(), formatter: "spot " + fmt(t.spot, 2), position: "end" } });
    if (s.zero_gamma_flip) {
      marks.push({ name: "γ flip", xAxis: s.zero_gamma_flip,
        lineStyle: { color: downColor(), type: "dashed", width: 1.5 },
        label: { color: downColor(), formatter: "γ flip " + fmt(s.zero_gamma_flip, 2), position: "start" } });
    }
    if (s.pin_candidate && s.pin_candidate.strike) {
      marks.push({ name: "pin", xAxis: s.pin_candidate.strike,
        lineStyle: { color: accentColor(), type: "solid", width: 1.5, opacity: 0.5 },
        label: { color: accentColor(), formatter: "pin", position: "insideEndTop" } });
    }
    c.setOption({
      backgroundColor: "transparent",
      grid: { left: 64, right: 24, top: 24, bottom: 36 },
      tooltip: {
        trigger: "axis",
        formatter: function (ps) {
          var p = ps[0];
          var r = rows[p.dataIndex];
          return '<b>K=' + r.strike + '</b><br>' +
            'GEX ' + fmtBn(r.gex) + '$<br>' +
            'OI call ' + r.call_oi + ' / put ' + r.put_oi;
        },
      },
      xAxis: {
        type: "category", data: x.map(function (v) { return v.toString(); }),
        axisLabel: { color: muteColor(), fontSize: 10 },
        axisLine: { lineStyle: { color: muteColor() } },
      },
      yAxis: {
        type: "value", name: "GEX ($)",
        nameTextStyle: { color: muteColor(), fontSize: 10 },
        axisLabel: { color: muteColor(), formatter: function (v) { return fmtBn(v); } },
        splitLine: { lineStyle: { color: gridColor() } },
        axisLine: { lineStyle: { color: muteColor() } },
      },
      series: [{
        type: "bar", data: gex,
        itemStyle: {
          color: function (p) { return p.value >= 0 ? upColor() : downColor(); },
        },
        markLine: { silent: true, symbol: "none", data: marks },
      }],
    });
  }

  // ---------------- Volatility Surface heatmap ----------------
  function renderSurface() {
    var c = newChart("opt-surface-chart");
    if (!c) return;
    var t = bySym[activeSym];
    var surf = t.vol_surface || {};
    var moneyness = surf.moneyness || [];
    var expiries = surf.expiries || [];
    var iv = surf.iv || [];
    if (!moneyness.length || !expiries.length) {
      c.setOption({ title: { text: "no surface data", textStyle: { color: muteColor() } } });
      return;
    }
    var data = [];
    var minV = 100, maxV = 0;
    iv.forEach(function (row, ei) {
      row.forEach(function (v, mi) {
        if (v == null) return;
        data.push([mi, ei, v]);
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      });
    });
    c.setOption({
      backgroundColor: "transparent",
      grid: { left: 80, right: 56, top: 16, bottom: 56 },
      tooltip: {
        position: "top",
        formatter: function (p) {
          return 'M ' + moneyness[p.value[0]] + ' · ' + expiries[p.value[1]] + '<br>IV ' + (p.value[2] * 100).toFixed(1) + '%';
        },
      },
      xAxis: {
        type: "category", data: moneyness.map(function (m) { return m.toFixed(2); }),
        name: "moneyness K/S", nameLocation: "middle", nameGap: 30,
        nameTextStyle: { color: muteColor(), fontSize: 10 },
        axisLabel: { color: muteColor(), fontSize: 10 },
        splitArea: { show: true },
      },
      yAxis: {
        type: "category", data: expiries,
        axisLabel: { color: muteColor(), fontSize: 10 },
      },
      visualMap: {
        min: Math.max(0, minV), max: maxV, calculable: true,
        orient: "vertical", right: 6, top: "middle",
        textStyle: { color: muteColor(), fontSize: 10 },
        inRange: {
          color: isDark()
            ? ["#1e3a8a", "#3b82f6", "#fbbf24", "#dc2626"]
            : ["#dbeafe", "#60a5fa", "#fbbf24", "#dc2626"],
        },
        formatter: function (v) { return (v * 100).toFixed(0) + "%"; },
      },
      series: [{
        type: "heatmap", data: data,
        label: {
          show: true, fontSize: 9,
          formatter: function (p) { return (p.value[2] * 100).toFixed(0); },
          color: fgColor(),
        },
      }],
    });
  }

  // ---------------- Term structure ----------------
  function renderTerm() {
    var c = newChart("opt-term-chart");
    if (!c) return;
    var t = bySym[activeSym];
    var rows = (t.by_expiry || []).filter(function (e) { return e.atm_iv != null; });
    if (!rows.length) { c.setOption({ title: { text: "no term data" } }); return; }
    c.setOption({
      backgroundColor: "transparent",
      grid: { left: 56, right: 24, top: 24, bottom: 36 },
      tooltip: {
        trigger: "axis",
        formatter: function (ps) {
          var p = ps[0]; var r = rows[p.dataIndex];
          return '<b>' + r.expiry + ' (' + r.dte + 'd)</b><br>' +
            'ATM IV ' + (r.atm_iv * 100).toFixed(2) + '%<br>' +
            'Implied move ' + (r.implied_move_pct ? (r.implied_move_pct * 100).toFixed(2) + '%' : '—');
        },
      },
      xAxis: {
        type: "category", data: rows.map(function (r) { return r.dte + "d"; }),
        axisLine: { lineStyle: { color: muteColor() } },
        axisLabel: { color: muteColor(), fontSize: 10 },
      },
      yAxis: {
        type: "value", name: "ATM IV",
        nameTextStyle: { color: muteColor(), fontSize: 10 },
        axisLabel: { color: muteColor(), formatter: function (v) { return (v * 100).toFixed(0) + "%"; } },
        splitLine: { lineStyle: { color: gridColor() } },
        axisLine: { lineStyle: { color: muteColor() } },
      },
      series: [{
        type: "line", smooth: true, symbol: "circle", symbolSize: 6,
        data: rows.map(function (r) { return r.atm_iv; }),
        lineStyle: { color: accentColor(), width: 2.5 },
        itemStyle: { color: accentColor() },
        areaStyle: { color: accentColor(), opacity: 0.08 },
      }],
    });
  }

  // ---------------- OI by strike (call vs put) ----------------
  function renderOi() {
    var c = newChart("opt-oi-chart");
    if (!c) return;
    var t = bySym[activeSym];
    var rows = (t.by_strike || []).filter(function (r) {
      return Math.abs(r.strike - t.spot) / t.spot <= 0.08;
    });
    if (!rows.length) { c.setOption({ title: { text: "no oi data" } }); return; }
    var x = rows.map(function (r) { return r.strike.toString(); });
    var calls = rows.map(function (r) { return r.call_oi; });
    var puts = rows.map(function (r) { return -r.put_oi; }); // negative for left direction
    c.setOption({
      backgroundColor: "transparent",
      grid: { left: 60, right: 24, top: 30, bottom: 36 },
      legend: { data: ["call OI", "put OI"], top: 0, right: 0,
        textStyle: { color: muteColor() } },
      tooltip: {
        trigger: "axis",
        formatter: function (ps) {
          var i = ps[0].dataIndex; var r = rows[i];
          return '<b>K=' + r.strike + '</b><br>' +
            'call OI ' + r.call_oi + '<br>put OI ' + r.put_oi;
        },
      },
      xAxis: {
        type: "category", data: x,
        axisLine: { lineStyle: { color: muteColor() } },
        axisLabel: { color: muteColor(), fontSize: 10 },
      },
      yAxis: {
        type: "value", name: "OI",
        nameTextStyle: { color: muteColor(), fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor() } },
        axisLine: { lineStyle: { color: muteColor() } },
        axisLabel: { color: muteColor(), formatter: function (v) { return Math.abs(v).toLocaleString(); } },
      },
      series: [
        { name: "call OI", type: "bar", stack: "oi", data: calls,
          itemStyle: { color: upColor(), opacity: 0.8 } },
        { name: "put OI", type: "bar", stack: "oi", data: puts,
          itemStyle: { color: downColor(), opacity: 0.8 } },
      ],
    });
  }

  // ---------------- Skew × Term ----------------
  function renderSkew() {
    var c = newChart("opt-skew-chart");
    if (!c) return;
    var t = bySym[activeSym];
    var rows = (t.by_expiry || []).filter(function (e) { return e.skew_25 != null; });
    if (!rows.length) { c.setOption({ title: { text: "no skew data" } }); return; }
    c.setOption({
      backgroundColor: "transparent",
      grid: { left: 56, right: 24, top: 24, bottom: 36 },
      tooltip: {
        trigger: "axis",
        formatter: function (ps) {
          var p = ps[0]; var r = rows[p.dataIndex];
          return '<b>' + r.expiry + ' (' + r.dte + 'd)</b><br>' +
            '25Δ skew ' + (r.skew_25 * 100).toFixed(2) + ' vp';
        },
      },
      xAxis: {
        type: "category", data: rows.map(function (r) { return r.dte + "d"; }),
        axisLine: { lineStyle: { color: muteColor() } },
        axisLabel: { color: muteColor(), fontSize: 10 },
      },
      yAxis: {
        type: "value", name: "25Δ skew (vp)",
        nameTextStyle: { color: muteColor(), fontSize: 10 },
        axisLabel: { color: muteColor(), formatter: function (v) { return (v * 100).toFixed(1); } },
        splitLine: { lineStyle: { color: gridColor() } },
        axisLine: { lineStyle: { color: muteColor() } },
      },
      series: [{
        type: "bar", data: rows.map(function (r) { return r.skew_25; }),
        itemStyle: {
          color: function (p) {
            return p.value >= 0.05 ? downColor() : p.value <= 0.01 ? upColor() : muteColor();
          },
        },
        markLine: {
          silent: true, symbol: "none",
          lineStyle: { color: muteColor(), type: "dashed" },
          data: [{ yAxis: 0 }],
        },
      }],
    });
  }

  // ---------------- ticker switch ----------------
  function setActive(sym) {
    if (!bySym[sym]) return;
    activeSym = sym;
    document.querySelectorAll("#opt-tabs .opt-tab").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-sym") === sym);
    });
    renderAll();
  }

  function renderAll() {
    renderConclusion();
    renderSnap();
    renderGex();
    renderSurface();
    renderTerm();
    renderOi();
    renderSkew();
  }

  function init() {
    document.querySelectorAll("#opt-tabs .opt-tab").forEach(function (b) {
      b.addEventListener("click", function () { setActive(b.getAttribute("data-sym")); });
    });
    renderAll();
    window.addEventListener("resize", function () {
      Object.values(charts).forEach(function (c) { c.resize(); });
    });
    var mo = new MutationObserver(function () {
      // Re-init all charts on theme change
      renderAll();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
