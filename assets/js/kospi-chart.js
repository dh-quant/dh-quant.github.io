/*
 * KOSPI candlestick chart using ECharts and live daily OHLCV data
 * published by the market-data GitHub Action.
 */
(function () {
  "use strict";

  var REMOTE_URL =
    "https://raw.githubusercontent.com/dh-quant/dh-quant.github.io/main/assets/data/kospi_candles.json";
  var LOCAL_URL = "/assets/data/kospi_candles.json";

  function fetchCandles() {
    var bust = "?_=" + Date.now();
    return fetch(REMOTE_URL + bust, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("remote " + r.status); return r.json(); })
      .catch(function () {
        return fetch(LOCAL_URL + bust, { cache: "no-store" }).then(function (r) { return r.json(); });
      });
  }

  function formatDate(unixSec) {
    var d = new Date(unixSec * 1000);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + dd;
  }

  function sma(arr, window) {
    var out = [];
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
      sum += arr[i];
      if (i >= window) sum -= arr[i - window];
      out.push(i >= window - 1 ? +(sum / window).toFixed(2) : null);
    }
    return out;
  }

  function render(container, data) {
    if (!window.echarts) {
      console.warn("[kospi-chart] echarts not loaded");
      return;
    }
    var candles = data.candles || [];
    if (!candles.length) return;

    var dates = candles.map(function (c) { return formatDate(c.t); });
    // ECharts candlestick convention: [open, close, low, high]
    var ohlc = candles.map(function (c) { return [c.o, c.c, c.l, c.h]; });
    var closes = candles.map(function (c) { return c.c; });
    var volumes = candles.map(function (c, i) {
      return { value: c.v || 0, itemStyle: { color: c.c >= c.o ? "rgba(17,214,139,0.55)" : "rgba(255,71,87,0.55)" } };
    });

    var ma20 = sma(closes, 20);
    var ma60 = sma(closes, 60);

    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    var chart = echarts.init(container, isDark ? "dark-fresh-cut" : null, { renderer: "canvas" });

    var latest = candles[candles.length - 1];
    var prev = candles[candles.length - 2] || latest;
    var change = latest.c - prev.c;
    var changePct = (change / prev.c) * 100;
    var subtitle =
      "latest " + latest.c.toLocaleString() +
      "   Δ " + (change >= 0 ? "+" : "") + change.toFixed(2) +
      "  (" + (changePct >= 0 ? "+" : "") + changePct.toFixed(2) + "%)";

    chart.setOption({
      backgroundColor: "transparent",
      animation: true,
      title: {
        text: "KOSPI · ^KS11",
        subtext: subtitle,
        left: 10,
        top: 6,
        textStyle: { fontSize: 13, fontWeight: 600 },
        subtextStyle: { fontSize: 11, color: change >= 0 ? "#11d68b" : "#ff4757" }
      },
      legend: {
        data: ["Candles", "MA20", "MA60"],
        top: 6,
        right: 10,
        textStyle: { fontSize: 11 }
      },
      grid: [
        { left: 50, right: 20, top: 60, height: "58%" },
        { left: 50, right: 20, top: "75%", height: "18%" }
      ],
      xAxis: [
        { type: "category", data: dates, boundaryGap: true, axisLine: { lineStyle: { opacity: 0.3 } }, axisLabel: { fontSize: 10 } },
        { type: "category", gridIndex: 1, data: dates, boundaryGap: true, axisLine: { lineStyle: { opacity: 0.3 } }, axisTick: { show: false }, axisLabel: { show: false } }
      ],
      yAxis: [
        { scale: true, splitArea: { show: false }, splitLine: { lineStyle: { opacity: 0.12 } }, axisLabel: { fontSize: 10 } },
        { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false } }
      ],
      dataZoom: [
        { type: "inside", xAxisIndex: [0, 1], start: 60, end: 100 },
        { type: "slider", xAxisIndex: [0, 1], top: "94%", height: 14, start: 60, end: 100 }
      ],
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        backgroundColor: "rgba(30,30,40,0.92)",
        borderWidth: 0,
        textStyle: { color: "#fff", fontSize: 11 }
      },
      series: [
        {
          name: "Candles",
          type: "candlestick",
          data: ohlc,
          itemStyle: {
            color: "#11d68b",        // bullish body
            color0: "#ff4757",       // bearish body
            borderColor: "#11d68b",
            borderColor0: "#ff4757"
          }
        },
        {
          name: "MA20",
          type: "line",
          data: ma20,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#7c5cff" }
        },
        {
          name: "MA60",
          type: "line",
          data: ma60,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 1.5, color: "#f2c94c" }
        },
        {
          name: "Volume",
          type: "bar",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: volumes
        }
      ]
    });

    window.addEventListener("resize", function () { chart.resize(); });

    // React to light/dark mode toggle by re-instantiating with the right theme
    var observer = new MutationObserver(function () {
      var nowDark = document.documentElement.getAttribute("data-theme") === "dark";
      if (nowDark !== isDark) {
        chart.dispose();
        isDark = nowDark;
        render(container, data);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function init() {
    var container = document.getElementById("dh-kospi-chart");
    if (!container) return;

    // Wait briefly for echarts to finish loading (it's a deferred script tag)
    var attempts = 0;
    (function waitForEcharts() {
      if (window.echarts) {
        fetchCandles().then(function (data) { render(container, data); }).catch(function (e) {
          console.warn("[kospi-chart] fetch failed", e);
        });
      } else if (attempts++ < 40) {
        setTimeout(waitForEcharts, 100);
      }
    })();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
