// /portfolio/ — allocation donut chart.
// Reads JSON from <script id="dh-alloc-data"> and renders an ECharts donut
// that re-themes on dark-mode toggle.
(function () {
  function readData() {
    var node = document.getElementById("dh-alloc-data");
    if (!node) return [];
    try {
      return JSON.parse(node.textContent.trim());
    } catch (e) {
      return [];
    }
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function fmtKRW(v) {
    if (v >= 1e6) return "₩" + (v / 1e6).toFixed(2) + "M";
    if (v >= 1e3) return "₩" + (v / 1e3).toFixed(0) + "K";
    return "₩" + v;
  }

  function init() {
    var el = document.getElementById("dh-alloc-donut");
    if (!el || typeof echarts === "undefined") return;

    var raw = readData();
    if (!raw.length) return;

    var total = raw.reduce(function (s, d) { return s + d.value; }, 0);
    var chart = echarts.init(el, isDark() ? "dark" : null, { renderer: "canvas" });

    function render() {
      var dark = isDark();
      chart.setOption({
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          formatter: function (p) {
            return (
              '<b>' + p.name + "</b><br/>" +
              fmtKRW(p.value) + " · " + p.percent + "%"
            );
          },
        },
        legend: { show: false },
        series: [
          {
            name: "Allocation",
            type: "pie",
            radius: ["58%", "82%"],
            center: ["50%", "52%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: dark ? "#0f172a" : "#ffffff",
              borderWidth: 2,
            },
            label: {
              show: true,
              position: "outside",
              formatter: "{b}\n{d}%",
              fontSize: 11,
              color: dark ? "#cbd5e1" : "#475569",
            },
            labelLine: {
              length: 10,
              length2: 12,
              lineStyle: { color: dark ? "#334155" : "#cbd5e1" },
            },
            data: raw.map(function (d) {
              return { name: d.name, value: d.value, itemStyle: { color: d.color } };
            }),
          },
        ],
        graphic: [
          {
            type: "text",
            left: "center",
            top: "44%",
            style: {
              text: "AUM",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2,
              fill: dark ? "#94a3b8" : "#64748b",
            },
          },
          {
            type: "text",
            left: "center",
            top: "52%",
            style: {
              text: fmtKRW(total),
              fontSize: 18,
              fontWeight: 700,
              fill: dark ? "#f1f5f9" : "#0f172a",
            },
          },
        ],
      }, true);
    }

    render();
    window.addEventListener("resize", function () { chart.resize(); });

    var mo = new MutationObserver(function () {
      chart.dispose();
      chart = echarts.init(el, isDark() ? "dark" : null, { renderer: "canvas" });
      render();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
