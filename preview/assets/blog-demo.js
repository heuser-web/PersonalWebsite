/**
 * PREVIEW-ONLY comment engine.
 *
 * WordPress provides comments natively — this exists so the flow can be seen and
 * tested before the site is installed. It renders the *same* markup and classes
 * the theme's comments.php emits (.comment-list, .comment-body, .bypostauthor,
 * .children), so what you see here is what WordPress will render.
 *
 * State lives in localStorage. Nothing is sent anywhere.
 */
(function () {
  'use strict';

  var KEY = 'rh-blog-demo-v1';
  var AUTHOR = 'Roman Heuser';

  var SEED = [
    { id: 1, parent: 0, name: 'Marcus Webb', when: 'August 24, 2026', approved: true, author: false,
      text: "This happened to my mom last year with a moving company. 4.8 stars, hundreds of reviews, and they held her furniture hostage for an extra $1,900. I looked afterward and every single review was posted in three big clumps. I had no idea that was a tell." },
    { id: 2, parent: 1, name: AUTHOR, when: 'August 24, 2026', approved: true, author: true,
      text: "That's the exact pattern, and moving companies are one of the worst categories for it — you book once, under time pressure, from a list you can't verify. The clumping happens because the reviews get bought in batches. Sorting by newest and looking at the gaps costs about five seconds and would have caught it. Sorry about your mom's $1,900." },

    { id: 3, parent: 0, name: 'Priya Raman', when: 'August 25, 2026', approved: true, author: false,
      text: "I waited tables for three years and we absolutely had the card at the register offering a free dessert for a five-star. Management framed it as 'rewarding happy customers.' Reading this I realize we were filtering, not rewarding. Nobody ever handed the card to a table that looked annoyed." },
    { id: 4, parent: 3, name: AUTHOR, when: 'August 25, 2026', approved: true, author: true,
      text: "This is the part I couldn't see from the data, so thank you. I could measure the distribution but I couldn't tell you how it got that shape. 'Nobody handed the card to a table that looked annoyed' is a better explanation of selection bias than anything in my stats textbook. If I rewrite the post that line goes in it." },

    { id: 5, parent: 0, name: 'Devon Clarke', when: 'August 25, 2026', approved: true, author: false,
      text: "Honest question — is anyone actually going to run five checks before ordering dinner? I believe you that it works, I just don't believe I'd do it. Feels like the kind of advice that's correct and still never gets used." },
    { id: 6, parent: 5, name: AUTHOR, when: 'August 26, 2026', approved: true, author: true,
      text: "Totally fair, and no — I don't run all five for dinner either. If you only ever do one, do this: sort by newest and look at the dates. Bursts with dead air between them catch most of it and it takes about three seconds. Save the other four for when there's real money involved: a contractor, a landlord, a used car." },

    { id: 7, parent: 0, name: 'Susan Heuser', when: 'August 26, 2026', approved: true, author: false,
      text: "I've been reading reviews for twenty years and I have never once thought about who was writing them. The bit about the missing middle is what got me — I always assumed lots of five stars meant lots of happy people. Sending this to your aunt." },
    { id: 8, parent: 7, name: AUTHOR, when: 'August 26, 2026', approved: true, author: true,
      text: "That's exactly why it works so well — it doesn't feel like a scam, it feels like a list. The missing middle is the one I'd want everyone to know, because it's the hardest thing to fake: you can buy fives and you can't buy a believable spread. Tell Aunt Carol to read the three-star ones first." }
  ];

  var root = document.getElementById('rh-blog-demo');
  if (!root) return;

  var state = load();

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* private mode */ }
    return { items: SEED.slice(), next: 100 };
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function initials(n) {
    return n.trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }

  function commentHTML(c, kids) {
    var cls = 'rh-comment' + (c.author ? ' bypostauthor' : '') + (c.approved ? '' : ' rh-pending');
    return '' +
      '<li id="comment-' + c.id + '" class="' + cls + '">' +
        '<article class="comment-body">' +
          '<footer class="comment-meta">' +
            '<span class="avatar rh-avatar" aria-hidden="true">' + esc(initials(c.name)) + '</span>' +
            '<div>' +
              '<b class="fn">' + esc(c.name) + '</b>' +
              '<div class="comment-metadata">' + esc(c.when) + '</div>' +
            '</div>' +
          '</footer>' +
          (c.approved ? '' :
            '<p class="comment-awaiting-moderation"><em>Your comment is awaiting moderation.</em> ' +
            '<button type="button" class="rh-approve" data-approve="' + c.id + '">Approve it</button></p>') +
          '<div class="comment-content"><p>' + esc(c.text).replace(/\n+/g, '</p><p>') + '</p></div>' +
          '<div class="reply"><button type="button" class="comment-reply-link" data-reply="' + c.id +
            '" data-name="' + esc(c.name) + '">Reply</button></div>' +
        '</article>' +
        (kids ? '<ol class="children">' + kids + '</ol>' : '') +
      '</li>';
  }

  function render() {
    var byParent = {};
    state.items.forEach(function (c) { (byParent[c.parent] = byParent[c.parent] || []).push(c); });

    function build(parent) {
      return (byParent[parent] || []).map(function (c) {
        return commentHTML(c, build(c.id));
      }).join('');
    }

    var approved = state.items.filter(function (c) { return c.approved; }).length;
    var replies = state.items.filter(function (c) { return c.author && c.approved; }).length;
    var top = state.items.filter(function (c) { return c.approved && !c.author && c.parent === 0; }).length;

    root.innerHTML =
      '<div class="rh-demoflag">' +
        '<b>Live preview</b> — this comment thread really works: post one, reply to it, approve it. ' +
        'It is saved in this browser only. On the real site WordPress does all of this for you.' +
        ' <button type="button" class="rh-reset" id="rh-demo-reset">Reset thread</button>' +
      '</div>' +
      '<div class="rh-comments">' +
        '<p class="rh-eyebrow">' + approved + ' response' + (approved === 1 ? '' : 's') + '</p>' +
        '<p class="rh-tally' + (top >= 4 && replies >= 4 ? ' is-ok' : '') + '">' +
          'Rubric check: <b>' + top + '</b> of 4 comments &middot; <b>' + replies + '</b> of 4 author replies' +
        '</p>' +
        '<ol class="comment-list">' + build(0) + '</ol>' +
        '<div class="comment-respond" id="rh-respond">' +
          '<h3 class="comment-reply-title">Join the conversation' +
            '<small id="rh-cancel" hidden> <a href="#">Cancel reply</a></small>' +
          '</h3>' +
          '<p class="rh-formnote">Every comment is read before it appears, so give it a minute. ' +
            'Your email is never published.</p>' +
          '<form class="comment-form rh-commentform" id="rh-demo-form">' +
            '<p class="comment-form-author"><label for="d-author">Name <span class="req">*</span></label>' +
              '<input id="d-author" required maxlength="60"></p>' +
            '<p class="comment-form-email"><label for="d-email">Email <span class="req">*</span></label>' +
              '<input id="d-email" type="email" required>' +
              '<span class="rh-formhint">Not published. Used for your avatar.</span></p>' +
            '<p class="comment-form-comment"><label for="d-comment">Your comment</label>' +
              '<textarea id="d-comment" rows="5" required placeholder="What did this make you think of?"></textarea></p>' +
            '<p class="form-submit"><button type="submit" class="rh-btn rh-btn--primary">Post comment</button></p>' +
          '</form>' +
        '</div>' +
      '</div>';

    wire();
  }

  var replyTo = 0;

  function wire() {
    var form = document.getElementById('rh-demo-form');
    var cancel = document.getElementById('rh-cancel');
    var respond = document.getElementById('rh-respond');

    root.querySelectorAll('[data-reply]').forEach(function (b) {
      b.addEventListener('click', function () {
        replyTo = parseInt(b.getAttribute('data-reply'), 10);
        // Move the form under the comment being replied to — same as WordPress.
        var li = document.getElementById('comment-' + replyTo);
        var kids = li.querySelector(':scope > ol.children');
        if (!kids) { kids = document.createElement('ol'); kids.className = 'children'; li.appendChild(kids); }
        kids.appendChild(respond);
        respond.querySelector('.comment-reply-title').firstChild.nodeValue =
          'Replying to ' + b.getAttribute('data-name');
        cancel.hidden = false;
        document.getElementById('d-comment').focus();
      });
    });

    root.querySelectorAll('[data-approve]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = parseInt(b.getAttribute('data-approve'), 10);
        state.items.forEach(function (c) { if (c.id === id) c.approved = true; });
        save(); render();
      });
    });

    cancel.addEventListener('click', function (e) {
      e.preventDefault();
      replyTo = 0;
      root.querySelector('.rh-comments').appendChild(respond);
      respond.querySelector('.comment-reply-title').firstChild.nodeValue = 'Join the conversation';
      cancel.hidden = true;
    });

    document.getElementById('rh-demo-reset').addEventListener('click', function () {
      if (!window.confirm('Reset the demo thread to its original state?')) return;
      state = { items: SEED.slice(), next: 100 };
      save(); render();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('d-author').value.trim();
      var text = document.getElementById('d-comment').value.trim();
      if (!name || !text) return;
      var isAuthor = name.toLowerCase() === AUTHOR.toLowerCase();
      state.items.push({
        id: state.next++, parent: replyTo, name: name, author: isAuthor,
        when: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        // Author replies post live; visitor comments land in moderation, like WP.
        approved: isAuthor,
        text: text
      });
      replyTo = 0;
      save(); render();
      var last = root.querySelector('.rh-pending') || root.querySelector('.comment-list');
      if (last) last.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  render();
}());
