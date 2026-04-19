/*
 * World market clock — rich tile per financial center with local time,
 * headline index price + 1D change, open/closed indicator. Listens for
 * the markets-loaded event to enrich tiles with live prices from the
 * global_indices bucket in markets.json.
 */
(function () {
  "use strict";

  // Each tile ties a market session to its headline index label (matches
  // labels in markets.json -> data.global_indices).
  var MARKETS = [
    { id: "KRX",   name: "Seoul",     flag: "🇰🇷", tz: "Asia/Seoul",       open: 9,    close: 15.5, index: "KOSPI" },
    { id: "TSE",   name: "Tokyo",     flag: "🇯🇵", tz: "Asia/Tokyo",       open: 9,    close: 15,   index: "Nikkei 225" },
    { id: "SSE",   name: "Shanghai",  flag: "🇨🇳", tz: "Asia/Shanghai",    open: 9.5,  close: 15,   index: "Shanghai" },
    { id: "HKEX",  name: "Hong Kong", flag: "🇭🇰", tz: "Asia/Hong_Kong",   open: 9.5,  close: 16,   index: "Hang Seng" },
    { id: "LSE",   name: "London",    flag: "🇬🇧", tz: "Europe/London",    open: 8,    close: 16.5, index: "FTSE 100" },
    { id: "XETRA", name: "Frankfurt", flag: "🇩🇪", tz: "Europe/Berlin",    open: 9,    close: 17.5, index: "DAX" },
    { id: "NYSE",  name: "New York",  flag: "🇺🇸", tz: "America/New_York", open: 9.5,  close: 16,   index: "S&P 500" },
    { id: "CRYPTO",name: "Crypto",    flag: "₿",  tz: "UTC",              open: 0,    close: 24,   always: true, index: "Bitcoin" }
  ];

  function localParts(tz, now) {
    try {
      var fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz, hour12: false, hour: "2-digit", minute: "2-digit", weekday: "short"
      });
      var r = {};
      fmt.formatToParts(now).forEach(function (p) {
        if (p.type === "hour")    r.hour = parseInt(p.value, 10);
        if (p.type === "minute")  r.minute = parseInt(p.value, 10);
        if (p.type === "weekday") r.weekday = p.value;
      });
      return r;
    } catch (e) { return { hour: 0, minute: 0, weekday: "" }; }
  }

  function isOpen(m, parts) {
    if (m.always) return true;
    if (parts.weekday === "Sat" || parts.weekday === "Sun") return false;
    var t = parts.hour + parts.minute / 60;
    return t >= m.open && t < m.close;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
    });
  }

  function fmtPct(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return "";
    return (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
  }

  // Lookup table for the index price (populated from markets-loaded event)
  var INDEX_MAP = {};

  function indexLabel(name) {
    var row = INDEX_MAP[name];
    if (!row || row.error) return '<span class="dh-clock__pricebar"><span class="dh-clock__idx">' + escapeHtml(name) + '</span></span>';
    var dir = row.change_pct >= 0 ? "up" : "down";
    return (
      '<span class="dh-clock__pricebar">' +
        '<span class="dh-clock__idx">' + escapeHtml(name) + '</span>' +
        '<span class="dh-clock__idxprice">' + escapeHtml(row.price_display || "") + '</span>' +
        '<span class="dh-clock__idxpct ' + dir + '">' + fmtPct(row.change_pct) + '</span>' +
      '</span>'
    );
  }

  function render(root) {
    if (!root) return;
    var now = new Date();
    var html = MARKETS.map(function (m) {
      var parts = localParts(m.tz, now);
      var open = isOpen(m, parts);
      var timeStr = String(parts.hour).padStart(2, "0") + ":" + String(parts.minute).padStart(2, "0");
      return (
        '<div class="dh-clock__tile ' + (open ? "is-open" : "is-closed") + '">' +
          '<div class="dh-clock__top">' +
            '<span class="dh-clock__flag">' + m.flag + '</span>' +
            '<span class="dh-clock__name">' + m.name + '</span>' +
            '<span class="dh-clock__status"><span class="dh-clock__dot"></span>' + (open ? "OPEN" : "CLOSED") + '</span>' +
          '</div>' +
          '<div class="dh-clock__time">' + timeStr + '</div>' +
          indexLabel(m.index) +
        '</div>'
      );
    }).join("");
    root.innerHTML = html;
  }

  function init() {
    var root = document.getElementById("dh-market-clock");
    if (!root) return;
    render(root);
    setInterval(function () { render(root); }, 30 * 1000);

    document.addEventListener("dh:markets-loaded", function (ev) {
      var doc = ev.detail || {};
      var src = (doc.data && doc.data.global_indices) || [];
      // crypto tile uses the crypto bucket
      var crypto = (doc.data && doc.data.crypto) || [];
      INDEX_MAP = {};
      src.concat(crypto).forEach(function (r) { INDEX_MAP[r.label] = r; });
      render(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
