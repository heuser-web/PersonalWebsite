/**
 * Excel GPT Assistant — front end.
 *
 * Talks only to this WordPress site's own REST route. The API key lives on the
 * server; nothing secret is ever present in this file or in the page source.
 */
(function () {
  'use strict';

  var root = document.getElementById('rhxg-root');
  if (!root || typeof RHXG === 'undefined') return;

  var launch = root.querySelector('.rhxg__launch');
  var panel  = root.querySelector('.rhxg__panel');
  var close  = root.querySelector('.rhxg__close');
  var log    = root.querySelector('.rhxg__log');
  var form   = root.querySelector('.rhxg__form');
  var input  = root.querySelector('.rhxg__input');
  var send   = root.querySelector('.rhxg__send');

  var history = [];
  var busy = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Minimal, safe formatting: `code` spans and **bold** only. */
  function fmt(s) {
    return esc(s)
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>');
  }

  function push(html, who) {
    var d = document.createElement('div');
    d.className = 'rhxg__msg rhxg__msg--' + who;
    d.innerHTML = html;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function typing() {
    var d = document.createElement('div');
    d.className = 'rhxg__typing';
    d.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function open(yes) {
    root.classList.toggle('is-open', yes);
    panel.hidden = !yes;
    launch.setAttribute('aria-expanded', yes ? 'true' : 'false');
    if (yes) {
      if (!log.childElementCount) push(fmt(RHXG.greeting), 'bot');
      input.focus();
    } else {
      launch.focus();
    }
  }

  launch.addEventListener('click', function () { open(true); });
  close.addEventListener('click', function () { open(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) open(false);
  });

  function fallback() {
    var msg = 'The live assistant is not switched on right now.';
    if (RHXG.gptUrl) {
      msg += ' You can ask the full Custom GPT instead — the link is at the bottom of this panel.';
    }
    push(fmt(msg), 'err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;

    var q = input.value.trim();
    if (!q) return;

    push(esc(q), 'me');
    input.value = '';

    if (!Number(RHXG.live)) { fallback(); return; }

    busy = true;
    send.disabled = true;
    var t = typing();

    fetch(RHXG.endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': RHXG.nonce },
      body: JSON.stringify({ message: q, history: history.slice(-6) })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        t.remove();
        if (data && data.reply) {
          push(fmt(data.reply), 'bot');
          history.push({ role: 'user', text: q });
          history.push({ role: 'assistant', text: data.reply });
        } else if (data && data.error === 'rate_limited') {
          push(fmt('You have hit the hourly question limit for this site. Try again later, or open the full Custom GPT below.'), 'err');
        } else if (data && data.error === 'not_configured') {
          fallback();
        } else {
          push(fmt('Something went wrong reaching the model. ' +
            ((data && data.detail) ? data.detail : 'Please try again.')), 'err');
        }
      })
      .catch(function () {
        t.remove();
        push(fmt('Could not reach the server. Check your connection and try again.'), 'err');
      })
      .then(function () {
        busy = false;
        send.disabled = false;
        input.focus();
      });
  });
}());
