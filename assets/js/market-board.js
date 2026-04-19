/*
 * Market board — renders a color-coded heatmap and top gainers/losers
 * from the live ticker.json (same data source as the scrolling ticker).
 */
(function () {
  "use strict";

  var REMOTE_URL =
    "https://raw.githubusercontent.com/dh-quant/dh-quant.github.io/main/assets/data/ticker.json";
  var LOCAL_URL = "/assets/data/ticker.json";
  var REFRESH_MS = 5 * 60 * 1000;

  function fetchJson(url) {
    var bust = url + (url.indexOf("?") > -1 ? "&" : "?") + "_=" + Date.now();
    return fetch(bust, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
    });
  }

  // Color interpolation between neutral and bull/bear based on |pct|
  function colorFor(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return { bg: "transparent", border: "rgba(0,0,0,0.08)" };
    var mag = Math.min(Math.abs(pct) / 3, 1); // 3% = full intensity
    if (pct >= 0) {
      // green
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

  function fmtPct(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return "—";
    return (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
  }

  function renderHeatmap(el, items) {
    if (!el) return;
    var html = items.map(function (it) {
      if (it.error || typeof it.change_pct !== "number") {
        return (
          '<div class="dh-heatmap__tile dh-heatmap__tile--stale">' +
          '<div class="dh-heatmap__sym">' + escapeHtml(it.symbol) + "</div>" +
          '<div class="dh-heatmap__pct">—</div>' +
          "</div>"
        );
      }
      var c = colorFor(it.change_pct);
      return (
        '<div class="dh-heatmap__tile" style="background:' + c.bg + ';border-color:' + c.border + '">' +
        '<div class="dh-heatmap__sym">' + escapeHtml(it.symbol) + "</div>" +
        '<div class="dh-heatmap__price">' + escapeHtml(it.price_display || "") + "</div>" +
        '<div class="dh-heatmap__pct ' + (it.change_pct >= 0 ? "up" : "down") + '">' +
        fmtPct(it.change_pct) + "</div>" +
        "</div>"
      );
    }).join("");
    el.innerHTML = html;
  }

  function renderMovers(upEl, downEl, items) {
    var sortable = items.filter(function (i) { return typeof i.change_pct === "number"; });
    var up = sortable.slice().sort(function (a, b) { return b.change_pct - a.change_pct; }).slice(0, 5);
    var down = sortable.slice().sort(function (a, b) { return a.change_pct - b.change_pct; }).slice(0, 5);

    function row(it, rank) {
      var dir = it.change_pct >= 0 ? "up" : "down";
      return (
        '<li class="dh-movers__row">' +
        '<span class="dh-movers__rank">' + rank + "</span>" +
        '<span class="dh-movers__sym">' + escapeHtml(it.symbol) + "</span>" +
        '<span class="dh-movers__price">' + escapeHtml(it.price_display || "") + "</span>" +
        '<span class="dh-movers__pct ' + dir + '">' + fmtPct(it.change_pct) + "</span>" +
        "</li>"
      );
    }

    if (upEl) upEl.innerHTML = up.map(function (it, i) { return row(it, i + 1); }).join("");
    if (downEl) downEl.innerHTML = down.map(function (it, i) { return row(it, i + 1); }).join("");
  }

  function load() {
    var heat = document.getElementById("dh-heatmap");
    var up = document.getElementById("dh-movers-up");
    var down = document.getElementById("dh-movers-down");
    if (!heat && !up && !down) return;

    fetchJson(REMOTE_URL)
      .catch(function () { return fetchJson(LOCAL_URL); })
      .then(function (data) {
        var items = (data && data.items) || [];
        renderHeatmap(heat, items);
        renderMovers(up, down, items);
      })
      .catch(function (err) {
        console.warn("[market-board] load failed", err);
      });
  }

  function init() {
    load();
    setInterval(load, REFRESH_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
