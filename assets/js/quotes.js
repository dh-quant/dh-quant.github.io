/*
 * Rotating trader/market quotes — one every ~12 seconds with a fill-up
 * progress bar. Starts on a random quote so every visit feels fresh.
 */
(function () {
  "use strict";

  var ROTATE_MS = 12000;

  var QUOTES = [
    { text: "The market can stay irrational longer than you can stay solvent.", author: "John Maynard Keynes" },
    { text: "Cut your losses short and let your winners run.", author: "David Ricardo" },
    { text: "It's not whether you're right or wrong that's important, but how much money you make when you're right and how much you lose when you're wrong.", author: "George Soros" },
    { text: "Be fearful when others are greedy, and greedy when others are fearful.", author: "Warren Buffett" },
    { text: "In investing, what is comfortable is rarely profitable.", author: "Robert Arnott" },
    { text: "The four most dangerous words in investing are: 'This time it's different.'", author: "Sir John Templeton" },
    { text: "Every battle is won before it is ever fought.", author: "Sun Tzu (on preparation)" },
    { text: "The goal of a successful trader is to make the best trades. Money is secondary.", author: "Alexander Elder" },
    { text: "I'm only rich because I know when I'm wrong.", author: "George Soros" },
    { text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett" },
    { text: "Markets are never wrong — opinions often are.", author: "Jesse Livermore" },
    { text: "There is a time to go long, a time to go short, and a time to go fishing.", author: "Jesse Livermore" },
    { text: "The big money is not in the buying and the selling, but in the waiting.", author: "Charlie Munger" },
    { text: "투자는 기다림의 예술이다.", author: "박현주 (미래에셋)" },
    { text: "좋은 매매는 지루하다. 흥분된다면 뭔가 잘못된 것이다.", author: "트레이딩 격언" },
    { text: "손절은 기술이 아니라 원칙이다.", author: "무명의 선물 트레이더" },
    { text: "시장이 네 의견에 동의할 때까지, 네 의견은 가설에 불과하다.", author: "아론 브라운" },
    { text: "포지션 사이징이 시그널보다 중요하다.", author: "Ed Seykota" }
  ];

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
    });
  }

  function render(root, idx) {
    var q = QUOTES[idx];
    var text = root.querySelector(".dh-quote__text");
    var auth = root.querySelector(".dh-quote__author");
    var bar = root.querySelector(".dh-quote__progress > span");
    if (!text || !auth) return;

    // fade transition
    root.classList.remove("is-active");
    void root.offsetWidth; // force reflow
    text.textContent = "“" + q.text + "”";
    auth.textContent = "— " + q.author;
    root.classList.add("is-active");

    if (bar) {
      bar.style.transition = "none";
      bar.style.width = "0%";
      // next frame: start animating to 100%
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bar.style.transition = "width " + ROTATE_MS + "ms linear";
          bar.style.width = "100%";
        });
      });
    }
  }

  function init() {
    var root = document.getElementById("dh-quote");
    if (!root) return;

    var idx = Math.floor(Math.random() * QUOTES.length);
    render(root, idx);

    setInterval(function () {
      idx = (idx + 1) % QUOTES.length;
      render(root, idx);
    }, ROTATE_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
