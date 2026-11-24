/**
 * Excel Helper: floating launcher.
 *
 * The chat itself lives in excel-brain.js. When the live model is on, questions
 * go to this WordPress site's own REST route; the API key stays on the server
 * and nothing secret is in this file or in the page source.
 */
(function () {
  'use strict';

  var root = document.getElementById('rhxg-root');
  if (!root || typeof ExcelBrain === 'undefined') return;

  var cfg = window.RHXG || {};
  var one = function (c) { return root.querySelector('.rhxg__' + c); };
  var launch = one('launch'), panel = one('panel'), input = one('input'), foot = one('foot'), chat = null;

  if (Number(cfg.live)) one('kicker').textContent = 'Live GPT';
  if (ExcelBrain.gptLive(cfg.gptUrl, cfg.gptUntil)) { foot.querySelector('a').href = cfg.gptUrl; foot.hidden = false; }

  function open(yes) {
    root.classList.toggle('is-open', yes);
    panel.hidden = !yes;
    launch.setAttribute('aria-expanded', yes ? 'true' : 'false');
    if (!yes) { launch.focus(); return; }
    if (!chat) {
      chat = ExcelBrain.mount({
        root: root, log: one('log'), chips: one('chips'), form: one('form'), input: input, send: one('send'), reset: one('reset'),
        cls: 'rhxg', cfg: cfg,
        greeting: cfg.greeting || 'Hi, I am **Excel Helper**. Ask a question, paste a formula to check, or describe what you need.'
      });
    }
    input.focus();
  }

  launch.addEventListener('click', function () { open(true); });
  one('close').addEventListener('click', function () { open(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) open(false);
  });
}());
