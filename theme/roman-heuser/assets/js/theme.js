/**
 * Heuser theme behaviour.
 *
 * Three small things, no dependencies:
 *   1. Swap `no-js` for `js` so reveal styles only ever hide content that JS
 *      is guaranteed to bring back.
 *   2. Sticky-header condense on scroll.
 *   3. Mobile nav drawer with focus + Escape handling.
 *   4. IntersectionObserver scroll reveals that no-op under reduced motion.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;

  /* ---- 1. JS flag ------------------------------------------------------ */
  body.classList.remove('no-js');
  body.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 2. Sticky header ------------------------------------------------ */
  var header = document.getElementById('rh-header');
  if (header) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-stuck', window.scrollY > 12);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- 3. Mobile drawer ------------------------------------------------ */
  var burger = document.getElementById('rh-burger');
  var nav = document.getElementById('rh-nav');
  var scrim = document.getElementById('rh-scrim');

  function setNav(open) {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('is-open', open);
    body.classList.toggle('rh-nav-open', open);
    if (scrim) {
      scrim.hidden = !open;
      scrim.classList.toggle('is-on', open);
    }
    if (open) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    }
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger && burger.getAttribute('aria-expanded') === 'true') {
      setNav(false);
      burger.focus();
    }
  });

  // Close the drawer when the viewport grows back to desktop.
  var wide = window.matchMedia('(min-width: 901px)');
  var onWide = function (e) { if (e.matches) setNav(false); };
  if (wide.addEventListener) wide.addEventListener('change', onWide);
  else if (wide.addListener) wide.addListener(onWide);

  /* ---- 4. Scroll reveal ------------------------------------------------ */
  var targets = document.querySelectorAll('.rh-reveal');
  if (!targets.length) return;

  // Reduced motion or no IntersectionObserver: show everything immediately.
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  Array.prototype.forEach.call(targets, function (el, i) {
    // Small stagger inside a row, capped so nothing waits long.
    el.style.transitionDelay = (Math.min(i % 4, 3) * 90) + 'ms';
    io.observe(el);
  });
}());
