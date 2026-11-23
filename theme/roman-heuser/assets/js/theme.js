/**
 * Heuser theme behaviour.
 *
 * Five small things, no dependencies:
 *   1. Swap `no-js` for `js` so reveal styles only ever hide content that JS
 *      is guaranteed to bring back.
 *   2. Sticky-header condense on scroll.
 *   3. Mobile nav drawer with focus + Escape handling.
 *   4. Photo lightbox for gallery images.
 *   5. IntersectionObserver scroll reveals that no-op under reduced motion.
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
  // Back/Forward can restore the page exactly as it was left, drawer and all.
  window.addEventListener('pageshow', function (e) { if (e.persisted) setNav(false); });

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

  /* ---- 4. Photo lightbox ------------------------------------------------ */
  var photos = Array.prototype.slice.call(document.querySelectorAll('.rh-gallery__item a[href]'))
    .filter(function (a) { return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(a.getAttribute('href')); });
  if (photos.length && window.HTMLDialogElement) {
    var box = document.createElement('dialog');
    box.className = 'rh-lightbox';
    box.setAttribute('aria-label', 'Photo viewer');
    box.innerHTML = '<img alt=""><div class="rh-lightbox__bar">' +
      '<button type="button" data-step="-1" aria-label="Previous photo">&larr;</button>' +
      '<p class="rh-lightbox__cap" aria-live="polite"></p>' +
      '<button type="button" data-step="1" aria-label="Next photo">&rarr;</button></div>' +
      '<button type="button" class="rh-lightbox__x" aria-label="Close photo">&times;</button>';
    body.appendChild(box);
    var boxImg = box.querySelector('img'), boxCap = box.querySelector('.rh-lightbox__cap'), at = 0;
    var show = function (i) {
      at = (i + photos.length) % photos.length;
      var a = photos[at], im = a.querySelector('img'), cap = a.parentNode.querySelector('figcaption');
      boxImg.src = a.href;
      boxImg.alt = im ? im.alt : '';
      boxCap.textContent = (cap ? cap.textContent.replace(/^\s*\d+\s*/, '') + ' · ' : '') + (at + 1) + ' of ' + photos.length;
    };
    photos.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;   // let "open in new tab" work
        e.preventDefault();
        show(i);
        root.style.overflow = 'hidden';
        box.showModal();
      });
    });
    box.addEventListener('close', function () { root.style.overflow = ''; photos[at].focus({ preventScroll: true }); });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (b && b.hasAttribute('data-step')) show(at + parseInt(b.getAttribute('data-step'), 10));
      else if (b || e.target !== boxImg) box.close();
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
  }

  /* ---- 5. Scroll reveal ------------------------------------------------ */
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
