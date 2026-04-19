/*
 * World market clock — live local times for major exchanges with an
 * open/closed indicator (approx; ignores holidays & DST edge cases).
 */
(function () {
  "use strict";

  // Hours in the exchange's local timezone.
  // dayjs-like; we use Intl.DateTimeFormat for TZ conversion.
  var MARKETS = [
    { id: "KRX",  name: "Seoul · KRX",    tz: "Asia/Seoul",        flag: "🇰🇷", open: 9,    close: 15.5 },
    { id: "TSE",  name: "Tokyo · TSE",    tz: "Asia/Tokyo",        flag: "🇯🇵", open: 9,    close: 15   },
    { id: "HKEX", name: "Hong Kong",      tz: "Asia/Hong_Kong",    flag: "🇭🇰", open: 9.5,  close: 16   },
    { id: "LSE",  name: "London · LSE",   tz: "Europe/London",     flag: "🇬🇧", open: 8,    close: 16.5 },
    { id: "XETRA",name: "Frankfurt",      tz: "Europe/Berlin",     flag: "🇩🇪", open: 9,    close: 17.5 },
    { id: "NYSE", name: "New York · NYSE",tz: "America/New_York",  flag: "🇺🇸", open: 9.5,  close: 16   },
    { id: "CME",  name: "CME Futures",    tz: "America/Chicago",   flag: "🌎", open: 0,    close: 24, almost247: true },
    { id: "CRYPTO",name:"Crypto · 24/7",  tz: "UTC",               flag: "₿",  open: 0,    close: 24, always: true }
  ];

  function localParts(tz, now) {
    try {
      var fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short"
      });
      var parts = fmt.formatToParts(now);
      var result = {};
      parts.forEach(function (p) {
        if (p.type === "hour") result.hour = parseInt(p.value, 10);
        if (p.type === "minute") result.minute = parseInt(p.value, 10);
        if (p.type === "weekday") result.weekday = p.value;
      });
      return result;
    } catch (e) {
      return { hour: 0, minute: 0, weekday: "" };
    }
  }

  function isOpen(m, parts) {
    if (m.always) return true;
    if (parts.weekday === "Sat" || parts.weekday === "Sun") return m.almost247 ? true : false;
    var t = parts.hour + parts.minute / 60;
    return t >= m.open && t < m.close;
  }

  function render(root) {
    if (!root) return;
    var now = new Date();
    var html = MARKETS.map(function (m) {
      var parts = localParts(m.tz, now);
      var open = isOpen(m, parts);
      var timeStr =
        String(parts.hour).padStart(2, "0") + ":" + String(parts.minute).padStart(2, "0");
      return (
        '<div class="dh-clock__tile ' + (open ? "is-open" : "is-closed") + '">' +
        '<div class="dh-clock__flag">' + m.flag + "</div>" +
        '<div class="dh-clock__name">' + m.name + "</div>" +
        '<div class="dh-clock__time">' + timeStr + "</div>" +
        '<div class="dh-clock__status">' +
          '<span class="dh-clock__dot"></span>' +
          (open ? "OPEN" : "CLOSED") +
        "</div>" +
        "</div>"
      );
    }).join("");
    root.innerHTML = html;
  }

  function init() {
    var root = document.getElementById("dh-market-clock");
    if (!root) return;
    render(root);
    setInterval(function () { render(root); }, 30 * 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
