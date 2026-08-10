/* ============================================================================
   premium_motion.js — runtime helpers for the global motion system (Phase 1)

   - Staggers dynamically-rendered list items WITHOUT touching the render code,
     by observing known LMS containers (MutationObserver). This keeps the render
     JS (safety_modules.js / assessments.js / dashboard.js) untouched.
   - Exposes window.PremiumMotion.{stagger, reveal, skeleton} for opt-in use in
     any page's data-fetch code (e.g. show skeletons before a request, reveal
     real content after).

   Honors prefers-reduced-motion. Framework-agnostic (LMS 9.0.3 + legacy 1.4.2).
   GPU-only: only toggles classes / sets animation-delay.
   ============================================================================ */
(function (w, d) {
    'use strict';

    var reduce = false;
    try {
        reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { }

    var STEP = 45; // ms per item — keep in sync with --pm-stagger-step
    var MAX = 12;  // cap staggered items so long lists don't feel laggy

    /* Containers whose items are (re)rendered dynamically and should stagger.
       #dv_Module_List is intentionally excluded — safety_modules.js already
       sets its own per-card animation-delay. */
    var STAGGER_CONTAINERS = ['#dv_Assessments_List', '#dv_Dashboard_List'];

    function applyStagger(container) {
        if (!container || reduce) return;
        var items = container.children;
        for (var i = 0; i < items.length; i++) {
            items[i].style.animationDelay = (Math.min(i, MAX) * STEP) + 'ms';
        }
    }

    function stagger(target) {
        var el = typeof target === 'string' ? d.querySelector(target) : target;
        applyStagger(el);
    }

    function reveal(target) {
        var el = typeof target === 'string' ? d.querySelector(target) : target;
        if (el) el.classList.add('pm-fade-in');
    }

    /* Fill a container with N card-shaped shimmer skeletons. */
    function skeleton(target, count) {
        var el = typeof target === 'string' ? d.querySelector(target) : target;
        if (!el) return;
        var n = count || 3, html = '';
        for (var i = 0; i < n; i++) {
            html += '<div class="pm-skeleton-card">' +
                '<div class="pm-skeleton-block"></div>' +
                '<div class="pm-skeleton-pad">' +
                '<div class="pm-skeleton-text pm-w-80"></div>' +
                '<div class="pm-skeleton-text pm-w-60"></div>' +
                '<div class="pm-skeleton-text pm-w-40"></div>' +
                '</div>' +
                '</div>';
        }
        el.innerHTML = html;
    }

    function observe() {
        if (reduce || !w.MutationObserver) return;
        STAGGER_CONTAINERS.forEach(function (sel) {
            var el = d.querySelector(sel);
            if (!el) return;
            applyStagger(el); // stagger whatever is already there
            var mo = new MutationObserver(function () { applyStagger(el); });
            mo.observe(el, { childList: true });
        });
    }

    function init() { observe(); }

    if (d.readyState === 'loading') {
        d.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    // Containers can mount late (after native bridge is up) — re-scan then.
    d.addEventListener('deviceready', init, false);

    w.PremiumMotion = { stagger: stagger, reveal: reveal, skeleton: skeleton };
})(window, document);
