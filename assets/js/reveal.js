/*
 * Gentle scroll-reveal — observes every .dh-reveal and toggles
 * .is-visible once it enters the viewport. Reveal happens only once.
 * Respects prefers-reduced-motion (handled entirely in CSS).
 */
(function () {
  "use strict";

  function run() {
    var targets = document.querySelectorAll(".dh-reveal");
    if (!targets.length) return;

    // Fallback: if IntersectionObserver unsupported, reveal all immediately.
    if (typeof IntersectionObserver !== "function") {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    // Stagger reveal per sibling so a grid animates in waves.
    targets.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 40, 400) + "ms";
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    targets.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
