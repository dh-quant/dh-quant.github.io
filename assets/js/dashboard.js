/*
 * Dashboard orchestrator — loads markets.json once and renders every panel
 * that exists on the page. Panels are self-contained render functions below.
 *
 * Data shape (from scripts/fetch_market.py):
 *   data: {
 *     headline: [...], global_indices: [...], sectors_us: [...],
 *     yields_us: [...], commodities: [...], fx: [...], crypto: [...]
 *   },
 *   derived: { fear_greed, fear_greed_label, vix }
 */
(function () {
  "use strict";

  var REMOTE_URL =
    "https://raw.githubusercontent.com/dh-quant/dh-quant.github.io/main/assets/data/markets.json";
  var LOCAL_URL = "/assets/data/markets.json";
  var REFRESH_MS = 5 * 60 * 1000;

  /* ---------- utilities --------------------------------------------- */
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
    });
  }

  function fmtPct(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return "—";
    return (pct >= 0 ? "+" : "") + Number(pct).toFixed(2) + "%";
  }

  function fetchJson(url) {
    var bust = url + (url.indexOf("?") > -1 ? "&" : "?") + "_=" + Date.now();
    return fetch(bust, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function cssVar(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  /* ---------- SVG sparkline generator ------------------------------- */
  function sparklineSvg(values, options) {
    if (!values || values.length < 2) return "";
    options = options || {};
    var w = options.w || 60;
    var h = options.h || 20;
    var pad = 1;
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var rng = max - min || 1;
    var step = (w - pad * 2) / (values.length - 1);
    var pts = values.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - ((v - min) / rng) * (h - pad * 2);
      return x.toFixed(1) + "," + y.toFixed(1);
    });

    var first = values[0];
    var last = values[values.length - 1];
    var color = last >= first
      ? (options.up   || "var(--bull-color)")
      : (options.down || "var(--bear-color)");

    var areaPoints = pad + ",0 " + pts.join(" ") + " " + (w - pad) + "," + h;
    var area = options.fill
      ? '<polygon points="' + areaPoints + '" fill="' + color + '" opacity="0.14" />'
      : "";

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h +
      '" preserveAspectRatio="none" width="100%" height="100%">' +
      area +
      '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + color +
      '" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round" />' +
      "</svg>"
    );
  }

  /* ---------- flag emoji mapping ------------------------------------ */
  var FLAGS = {
    "KOSPI": "🇰🇷", "KOSDAQ": "🇰🇷", "Nikkei 225": "🇯🇵", "Hang Seng": "🇭🇰",
    "Shanghai": "🇨🇳", "S&P 500": "🇺🇸", "Nasdaq 100": "🇺🇸", "Dow": "🇺🇸",
    "FTSE 100": "🇬🇧", "DAX": "🇩🇪", "CAC 40": "🇫🇷", "STOXX 50": "🇪🇺",
    "Sensex": "🇮🇳",
    "Bitcoin": "₿", "Ethereum": "Ξ", "Solana": "◎", "BNB": "🟡", "XRP": "✕", "Dogecoin": "🐕",
    "Crude WTI": "🛢️", "Brent": "🛢️", "NatGas": "🔥", "Gold": "🥇", "Silver": "🥈",
    "Copper": "🟧", "Corn": "🌽", "Wheat": "🌾",
    "EURUSD": "🇪🇺", "GBPUSD": "🇬🇧", "USDJPY": "🇯🇵", "USDCNY": "🇨🇳",
    "USDKRW": "🇰🇷", "AUDUSD": "🇦🇺", "USDCAD": "🇨🇦", "USDCHF": "🇨🇭"
  };

  /* =============== PANEL RENDERERS ================================== */

  /* --- Fear & Greed gauge ------------------------------------------- */
  function renderFearGreed(el, derived) {
    if (!el || !window.echarts) return;
    var score = derived && typeof derived.fear_greed === "number" ? derived.fear_greed : 50;
    var label = derived && derived.fear_greed_label ? derived.fear_greed_label : "Neutral";

    var chart = echarts.init(el, null, { renderer: "canvas" });
    var opt = {
      backgroundColor: "transparent",
      series: [{
        type: "gauge",
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        progress: { show: false },
        axisLine: {
          lineStyle: {
            width: 16,
            color: [
              [0.25, "#ff4757"],
              [0.45, "#f59e0b"],
              [0.55, "#f2c94c"],
              [0.75, "#a3e635"],
              [1.00, "#11d68b"]
            ]
          }
        },
        axisTick: { show: false },
        splitLine: {
          length: 8,
          lineStyle: { color: "rgba(255,255,255,0.6)", width: 2 }
        },
        axisLabel: {
          color: cssVar("--global-text-color-light", "#888"),
          fontSize: 10,
          distance: -30,
          formatter: function (v) {
            if (v === 0) return "Fear";
            if (v === 50) return "50";
            if (v === 100) return "Greed";
            return "";
          }
        },
        pointer: {
          length: "60%",
          width: 4,
          itemStyle: { color: cssVar("--global-text-color", "#111") }
        },
        anchor: {
          show: true, size: 12, showAbove: true,
          itemStyle: { color: cssVar("--global-text-color", "#111"), borderWidth: 0 }
        },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, "35%"],
          fontSize: 26,
          fontWeight: 700,
          color: cssVar("--global-text-color", "#111"),
          formatter: "{value}"
        },
        data: [{ value: score }]
      }]
    };
    chart.setOption(opt);
    window.addEventListener("resize", function () { chart.resize(); });

    // Update meta text
    var meta = el.parentElement.querySelector(".dh-gauge-meta");
    if (meta) {
      meta.innerHTML =
        "<span>Fear & Greed Proxy · VIX + SPX momentum</span>" +
        "<span><b>" + escapeHtml(label) + "</b></span>";
    }
  }

  /* --- Asset class bars --------------------------------------------- */
  function avgChange(rows) {
    var vals = rows.filter(function (r) { return typeof r.change_pct === "number"; })
                   .map(function (r) { return r.change_pct; });
    if (!vals.length) return null;
    return vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  }

  function renderAssetClasses(el, data) {
    if (!el) return;
    var buckets = [
      { label: "Global Equities",  rows: data.global_indices || [] },
      { label: "US Sectors (avg)", rows: data.sectors_us || [] },
      { label: "Commodities",      rows: data.commodities || [] },
      { label: "FX Majors",        rows: data.fx || [] },
      { label: "Crypto",           rows: data.crypto || [] },
      { label: "US Yields (avg)",  rows: data.yields_us || [] }
    ];

    // Find max magnitude for scaling bars to viewport
    var mags = buckets.map(function (b) {
      var v = avgChange(b.rows);
      return v == null ? 0 : Math.abs(v);
    });
    var scale = Math.max.apply(null, mags.concat([1.5])); // at least 1.5% half-width

    var html = buckets.map(function (b) {
      var v = avgChange(b.rows);
      if (v == null) {
        return (
          '<div class="dh-bar">' +
          '<div class="dh-bar__label">' + escapeHtml(b.label) + "</div>" +
          '<div class="dh-bar__track"><div class="dh-bar__midline"></div></div>' +
          '<div class="dh-bar__pct">—</div></div>'
        );
      }
      var width = Math.min(49, (Math.abs(v) / scale) * 49);
      var leftPos = v >= 0 ? 50 : (50 - width);
      var cls = v >= 0 ? "dh-bar__fill--up" : "dh-bar__fill--down";
      return (
        '<div class="dh-bar">' +
        '<div class="dh-bar__label">' + escapeHtml(b.label) + "</div>" +
        '<div class="dh-bar__track">' +
          '<div class="dh-bar__midline"></div>' +
          '<div class="dh-bar__fill ' + cls + '" style="left:' + leftPos + '%;width:' + width + '%"></div>' +
        "</div>" +
        '<div class="dh-bar__pct ' + (v >= 0 ? "up" : "down") + '">' + fmtPct(v) + "</div>" +
        "</div>"
      );
    }).join("");

    el.innerHTML = html;
  }

  /* --- Indices table with sparklines -------------------------------- */
  function renderIndicesTable(el, rows) {
    if (!el || !rows) return;
    var html = rows.map(function (r) {
      if (r.error) {
        return (
          '<div class="dh-row"><div class="dh-row__flag">🌐</div>' +
          '<div class="dh-row__label">' + escapeHtml(r.label) + '</div>' +
          '<div class="dh-row__spark">—</div>' +
          '<div class="dh-row__price">—</div>' +
          '<div class="dh-row__pct">—</div></div>'
        );
      }
      var flag = FLAGS[r.label] || "🌐";
      var dir = r.change_pct >= 0 ? "up" : "down";
      var spark = sparklineSvg(r.sparkline || [], { w: 60, h: 20 });
      return (
        '<div class="dh-row">' +
        '<div class="dh-row__flag">' + flag + "</div>" +
        '<div class="dh-row__label">' + escapeHtml(r.label) + "</div>" +
        '<div class="dh-row__spark">' + spark + "</div>" +
        '<div class="dh-row__price">' + escapeHtml(r.price_display || "") + "</div>" +
        '<div class="dh-row__pct ' + dir + '">' + fmtPct(r.change_pct) + "</div>" +
        "</div>"
      );
    }).join("");
    el.innerHTML = html;
  }

  /* --- Yield curve (ECharts line) ----------------------------------- */
  function renderYieldCurve(el, rows) {
    if (!el || !window.echarts || !rows) return;
    var sorted = rows.slice().filter(function (r) { return !r.error && typeof r.price === "number"; });
    var order = ["3M", "2Y", "5Y", "10Y", "30Y"];
    sorted.sort(function (a, b) { return order.indexOf(a.label) - order.indexOf(b.label); });

    var tenors = sorted.map(function (r) { return r.label; });
    var current = sorted.map(function (r) { return +r.price.toFixed(3); });
    // Previous curve from sparkline[-2] of each (if available)
    var previous = sorted.map(function (r) {
      var s = r.sparkline || [];
      return s.length >= 2 ? +s[s.length - 2].toFixed(3) : null;
    });

    var chart = echarts.init(el, isDark() ? "dark-fresh-cut" : null, { renderer: "canvas" });
    chart.setOption({
      backgroundColor: "transparent",
      grid: { left: 38, right: 14, top: 24, bottom: 28 },
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      legend: {
        data: ["Today", "Yesterday"],
        top: 2, right: 6,
        textStyle: { fontSize: 10 },
        itemWidth: 16, itemHeight: 8
      },
      xAxis: {
        type: "category",
        data: tenors,
        axisLine: { lineStyle: { opacity: 0.3 } },
        axisLabel: { fontSize: 10 }
      },
      yAxis: {
        type: "value",
        scale: true,
        splitLine: { lineStyle: { opacity: 0.1 } },
        axisLabel: { fontSize: 10, formatter: "{value}%" }
      },
      series: [
        {
          name: "Yesterday",
          type: "line",
          data: previous,
          smooth: true,
          lineStyle: { color: "rgba(124,92,255,0.55)", width: 1.5, type: "dashed" },
          symbol: "circle", symbolSize: 5,
          itemStyle: { color: "rgba(124,92,255,0.55)" }
        },
        {
          name: "Today",
          type: "line",
          data: current,
          smooth: true,
          lineStyle: { width: 3, color: "#22d3ee" },
          areaStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(34,211,238,0.4)" },
                { offset: 1, color: "rgba(34,211,238,0.02)" }
              ]
            }
          },
          symbol: "circle", symbolSize: 7,
          itemStyle: { color: "#22d3ee" }
        }
      ]
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  /* --- Sector treemap ----------------------------------------------- */
  function renderSectorTreemap(el, rows) {
    if (!el || !window.echarts || !rows) return;
    var clean = rows.filter(function (r) { return !r.error && typeof r.change_pct === "number"; });
    if (!clean.length) return;

    var colorFor = function (pct) {
      var mag = Math.min(Math.abs(pct) / 3, 1);
      if (pct >= 0) {
        var base = "17,214,139";
        return "rgba(" + base + "," + (0.25 + mag * 0.65) + ")";
      }
      return "rgba(255,71,87," + (0.25 + mag * 0.65) + ")";
    };

    var data = clean.map(function (r) {
      return {
        name: r.label,
        value: Math.max(1, Math.abs(r.change_pct) + 1), // size drives area
        itemStyle: { color: colorFor(r.change_pct), borderRadius: 4 },
        label: {
          show: true,
          formatter: function () {
            return "{b|" + r.label + "}\n{c|" + fmtPct(r.change_pct) + "}";
          },
          rich: {
            b: { fontWeight: 700, fontSize: 12, color: "#fff", textShadowColor: "rgba(0,0,0,0.35)", textShadowBlur: 2 },
            c: { fontSize: 11, color: "#fff", textShadowColor: "rgba(0,0,0,0.35)", textShadowBlur: 2 }
          }
        },
        upshift_pct: r.change_pct,
        upshift_price: r.price_display
      };
    });

    var chart = echarts.init(el, isDark() ? "dark-fresh-cut" : null, { renderer: "canvas" });
    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        formatter: function (info) {
          var d = info.data;
          return (
            '<b>' + d.name + "</b><br/>" +
            'Last: ' + (d.upshift_price || "—") + "<br/>" +
            '1D: <b style="color:' + (d.upshift_pct >= 0 ? "#11d68b" : "#ff4757") + '">' +
            fmtPct(d.upshift_pct) + "</b>"
          );
        }
      },
      series: [{
        type: "treemap",
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        width: "100%",
        height: "100%",
        data: data,
        leafDepth: 1
      }]
    });
    window.addEventListener("resize", function () { chart.resize(); });
  }

  /* --- Generic mini-cards (commodities, fx, crypto) ---------------- */
  function renderCards(el, rows, opts) {
    if (!el || !rows) return;
    opts = opts || {};
    var html = rows.map(function (r) {
      if (r.error) {
        return (
          '<div class="dh-card"><div class="dh-card__label">' + escapeHtml(r.label) + "</div>" +
          '<div class="dh-card__price">—</div></div>'
        );
      }
      var dir = r.change_pct >= 0 ? "up" : "down";
      var flag = opts.showFlag ? (FLAGS[r.label] || "") + " " : "";
      return (
        '<div class="dh-card">' +
        '<div class="dh-card__label">' + flag + escapeHtml(r.label) + "</div>" +
        '<div class="dh-card__price">' + escapeHtml(r.price_display || "") + "</div>" +
        '<div class="dh-card__pct ' + dir + '">' + fmtPct(r.change_pct) + "</div>" +
        '<div class="dh-card__spark">' + sparklineSvg(r.sparkline || [], { w: 120, h: 28, fill: true }) + "</div>" +
        "</div>"
      );
    }).join("");
    el.innerHTML = html;
  }

  /* --- Heatmap + movers (driven by headline) ----------------------- */
  function heatColor(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) {
      return { bg: "transparent", border: "rgba(0,0,0,0.08)" };
    }
    var mag = Math.min(Math.abs(pct) / 3, 1);
    if (pct >= 0) {
      return {
        bg: "rgba(17,214,139," + (0.08 + mag * 0.52) + ")",
        border: "rgba(17,214,139," + (0.35 + mag * 0.45) + ")"
      };
    }
    return {
      bg: "rgba(255,71,87," + (0.08 + mag * 0.52) + ")",
      border: "rgba(255,71,87," + (0.35 + mag * 0.45) + ")"
    };
  }

  function renderHeatmapAndMovers(rows) {
    var heat = document.getElementById("dh-heatmap");
    var up = document.getElementById("dh-movers-up");
    var down = document.getElementById("dh-movers-down");

    if (heat && rows) {
      heat.innerHTML = rows.map(function (r) {
        if (r.error || typeof r.change_pct !== "number") {
          return (
            '<div class="dh-heatmap__tile dh-heatmap__tile--stale">' +
            '<div class="dh-heatmap__sym">' + escapeHtml(r.label || r.symbol) + "</div>" +
            '<div class="dh-heatmap__pct">—</div></div>'
          );
        }
        var c = heatColor(r.change_pct);
        var tip = (r.label || r.symbol) + " · " + (r.price_display || "—") + " · " + fmtPct(r.change_pct);
        return (
          '<div class="dh-heatmap__tile" data-tip="' + escapeHtml(tip) +
          '" style="background:' + c.bg + ';border-color:' + c.border + '">' +
          '<div class="dh-heatmap__sym">' + escapeHtml(r.label || r.symbol) + "</div>" +
          '<div class="dh-heatmap__price">' + escapeHtml(r.price_display || "") + "</div>" +
          '<div class="dh-heatmap__pct ' + (r.change_pct >= 0 ? "up" : "down") + '">' +
          fmtPct(r.change_pct) + "</div></div>"
        );
      }).join("");
    }

    if ((up || down) && rows) {
      var sortable = rows.filter(function (r) { return typeof r.change_pct === "number"; });
      var best = sortable.slice().sort(function (a, b) { return b.change_pct - a.change_pct; }).slice(0, 5);
      var worst = sortable.slice().sort(function (a, b) { return a.change_pct - b.change_pct; }).slice(0, 5);

      function row(r, rank) {
        var dir = r.change_pct >= 0 ? "up" : "down";
        return (
          '<li class="dh-movers__row">' +
          '<span class="dh-movers__rank">' + rank + "</span>" +
          '<span class="dh-movers__sym">' + escapeHtml(r.label || r.symbol) + "</span>" +
          '<span class="dh-movers__price">' + escapeHtml(r.price_display || "") + "</span>" +
          '<span class="dh-movers__pct ' + dir + '">' + fmtPct(r.change_pct) + "</span>" +
          "</li>"
        );
      }
      if (up)   up.innerHTML   = best.map(function (r, i)  { return row(r, i + 1); }).join("");
      if (down) down.innerHTML = worst.map(function (r, i) { return row(r, i + 1); }).join("");
    }
  }

  /* --- Stamp updated-at + source on each panel that has a time slot -- */
  function stampUpdated(doc) {
    var ts = doc && doc.fetched_at ? new Date(doc.fetched_at) : new Date();
    var pretty = ts.toLocaleString("en-US", { hour12: false });
    document.querySelectorAll("[data-dh-stamp]").forEach(function (n) {
      n.textContent = pretty;
    });
  }

  /* --- Error-state painter (show retry chip in every empty panel) --- */
  function paintErrorState(panelIds) {
    panelIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      // Don't overwrite if data already painted something real.
      if (el.dataset.dhPainted === "1") return;
      el.innerHTML =
        '<div class="dh-fallback">' +
        '<span class="dh-fallback__icon">⚠️</span>' +
        '<div class="dh-fallback__text">데이터를 불러올 수 없습니다</div>' +
        '<button type="button" class="dh-fallback__retry">다시 시도</button>' +
        "</div>";
      var btn = el.querySelector(".dh-fallback__retry");
      if (btn) btn.addEventListener("click", load);
    });
  }

  /* =============== ORCHESTRATION ==================================== */
  var lastData = null;
  var ALL_PANELS = [
    "dh-fear-greed", "dh-asset-bars", "dh-indices", "dh-yield-curve",
    "dh-sector-tree", "dh-commodities", "dh-fx", "dh-crypto",
    "dh-heatmap", "dh-movers-up", "dh-movers-down"
  ];

  function markPainted(id) {
    var el = document.getElementById(id);
    if (el) el.dataset.dhPainted = "1";
  }

  function renderAll(doc) {
    lastData = doc;
    if (!doc) return;
    var d = doc.data || {};

    // Panels render against specific DOM ids; all are optional.
    renderFearGreed(document.getElementById("dh-fear-greed"), doc.derived);   markPainted("dh-fear-greed");
    renderAssetClasses(document.getElementById("dh-asset-bars"), d);          markPainted("dh-asset-bars");
    renderIndicesTable(document.getElementById("dh-indices"), d.global_indices); markPainted("dh-indices");
    renderYieldCurve(document.getElementById("dh-yield-curve"), d.yields_us); markPainted("dh-yield-curve");
    renderSectorTreemap(document.getElementById("dh-sector-tree"), d.sectors_us); markPainted("dh-sector-tree");
    renderCards(document.getElementById("dh-commodities"), d.commodities);    markPainted("dh-commodities");
    renderCards(document.getElementById("dh-fx"), d.fx, { showFlag: true });  markPainted("dh-fx");
    renderCards(document.getElementById("dh-crypto"), d.crypto);              markPainted("dh-crypto");

    // Expose for world-map.js and other consumers
    window.DH_MARKETS = doc;
    document.dispatchEvent(new CustomEvent("dh:markets-loaded", { detail: doc }));

    // heatmap + movers use the headline bucket here rather than ticker.json
    // so all panels stay coherent
    renderHeatmapAndMovers(d.headline);
    markPainted("dh-heatmap"); markPainted("dh-movers-up"); markPainted("dh-movers-down");

    stampUpdated(doc);
  }

  function load() {
    fetchJson(REMOTE_URL)
      .catch(function () { return fetchJson(LOCAL_URL); })
      .then(renderAll)
      .catch(function (err) {
        console.warn("[dashboard] load failed", err);
        paintErrorState(ALL_PANELS);
      });
  }

  function init() {
    load();
    setInterval(load, REFRESH_MS);

    // Re-render on theme switch so ECharts picks up new colors
    new MutationObserver(function () {
      if (lastData) renderAll(lastData);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  // Wait for echarts if the page requested it via frontmatter
  (function waitAndInit() {
    var attempts = 0;
    function go() {
      if (window.echarts || attempts > 40) {
        init();
      } else {
        attempts++;
        setTimeout(go, 100);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", go);
    } else {
      go();
    }
  })();
})();
