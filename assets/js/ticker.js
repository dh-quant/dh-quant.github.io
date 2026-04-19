/*
 * Ticker renderer — fetches the latest market snapshot from the repo's
 * raw.githubusercontent.com file (updated every ~15 min by a GitHub Action)
 * and populates the scrolling track. Falls back to the in-site JSON if
 * the remote fetch fails (e.g. rate limits, offline, CORS edge cases).
 */
(function () {
  "use strict";

  var REMOTE_URL =
    "https://raw.githubusercontent.com/dh-quant/dh-quant.github.io/main/assets/data/ticker.json";
  var LOCAL_URL = "/assets/data/ticker.json";
  var REFRESH_MS = 5 * 60 * 1000; // 5 min; raw.githubusercontent edge cache is ~5 min

  function fmtPct(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return "";
    var sign = pct >= 0 ? "+" : "";
    return sign + pct.toFixed(2) + "%";
  }

  function buildItem(item) {
    if (item.error) {
      return (
        '<span class="dh-ticker__item dh-ticker__item--stale">' +
        '<span class="dh-ticker__symbol">' + escapeHtml(item.symbol) + "</span>" +
        '<span class="dh-ticker__price">—</span>' +
        "</span>"
      );
    }
    var dirClass =
      item.direction === "up"
        ? "dh-ticker__chg--up"
        : item.direction === "down"
        ? "dh-ticker__chg--down"
        : "";
    var arrow = item.direction === "up" ? "▲" : item.direction === "down" ? "▼" : "·";
    return (
      '<span class="dh-ticker__item">' +
      '<span class="dh-ticker__symbol">' + escapeHtml(item.symbol) + "</span> " +
      '<span class="dh-ticker__price">' + escapeHtml(item.price_display || String(item.price)) + "</span> " +
      '<span class="dh-ticker__chg ' + dirClass + '">' + arrow + " " + escapeHtml(fmtPct(item.change_pct)) + "</span>" +
      "</span>"
    );
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function render(root, data) {
    if (!data || !data.items || !data.items.length) return;
    var track = root.querySelector(".dh-ticker__track");
    if (!track) return;

    // Duplicate the item list once so the marquee wraps seamlessly
    var html = data.items.map(buildItem).join("") + data.items.map(buildItem).join("");
    track.innerHTML = html;

    var stamp = root.querySelector(".dh-ticker__updated");
    if (stamp && data.updated_at) {
      try {
        var d = new Date(data.updated_at);
        stamp.textContent =
          "updated " +
          d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        stamp.setAttribute("title", d.toISOString());
      } catch (e) {
        /* ignore */
      }
    }
  }

  function fetchJson(url) {
    var busted = url + (url.indexOf("?") > -1 ? "&" : "?") + "_=" + Date.now();
    return fetch(busted, { cache: "no-store" }).then(function (resp) {
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      return resp.json();
    });
  }

  function load(root) {
    fetchJson(REMOTE_URL)
      .catch(function () { return fetchJson(LOCAL_URL); })
      .then(function (data) { render(root, data); })
      .catch(function (err) {
        console.warn("[ticker] load failed", err);
      });
  }

  function init() {
    var root = document.getElementById("dh-ticker");
    if (!root) return;
    load(root);
    setInterval(function () { load(root); }, REFRESH_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
