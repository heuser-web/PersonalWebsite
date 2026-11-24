/*
 * Excel Helper engine. Runs entirely in the page: no network, no key, no cost.
 * Generated files embed this; edit chatbot/src/, then run `npm run chatbot`.
 *
 *   ExcelBrain.reply(text, state) -> { md, chips, kind, id }
 *   ExcelBrain.render(md)         -> safe HTML
 */
var ExcelBrain = (function () {
  'use strict';

  var TOPICS = /*TOPICS*/[];
  var FUNCS = /*FUNCS*/{};

  /* ------------------------------------------------------------------
   * Text handling
   * --------------------------------------------------------------- */
  var STOP = {};
  ('a an the is are was were be been am do does did doing how what why when where which who whom can could should would will shall may might ' +
   'i me my mine we our you your it its this that these those there here of to in on at for from by with about into onto as and or if then so ' +
   'but not no just please help want need know tell show explain teach give get got make makes making use using used way best good right ' +
   'excel formula formulas function functions spreadsheet spreadsheets cell cells sheet work works working thing things something some any all each ' +
   'im ive id dont doesnt cant isnt wont have has had like also up out s t m re ve ll ok okay hey hi whats hows wheres whos').split(' ').forEach(function (w) { STOP[w] = 1; });
  // Words that matter in function names but are noise on their own.
  var SOFT = { show: 1, find: 1, use: 1, write: 1, writing: 1 };

  var PHRASES = [
    [/\bpivot\s*-?\s*tables?\b/g, ' pivot '], [/\bpivots\b/g, ' pivot '],
    [/\b([vhx])[\s-]+look\s*-?\s*ups?\b/g, ' $1lookup '], [/\blook(?:ing)?\s*-?\s*ups?\b/g, ' lookup '],
    [/\bdrop\s*-?\s*downs?\b/g, ' dropdown '], [/\bdropdowns\b/g, ' dropdown '],
    [/\bcond(?:itional)?\.?\s+format(?:ting)?\b/g, ' conditional formatting '],
    [/\b(sum|count|average|max|min)\s+ifs\b/g, ' $1ifs '], [/\b(sum|count|average)\s+if\s+(formula|function)\b/g, ' $1if '],
    [/\bif\s+(?:then|else)\b/g, ' if statement '],
    [/\bper\s?cents?\b/g, ' percent '], [/\bpercentages?\b/g, ' percent '], [/%/g, ' percent '],
    [/\bdupes?\b/g, ' duplicate '], [/\bshort\s*cuts?\b/g, ' shortcut '], [/\bhot\s*keys?\b/g, ' shortcut '],
    [/\b(?:that )?i can see\b/g, ' visible '], [/\bhow old\b/g, ' age '],
    [/\btrend\s+lines?\b/g, ' trendline '], [/\bstd\s*\.?\s*dev\b/g, ' standard deviation '],
    [/\bpower\s*query\b/g, ' power query '], [/\bmacros\b/g, ' macro '],
    [/\bdollar\s+signs?\b/g, ' dollar sign '], [/\bwork\s*sheets?\b/g, ' sheet '], [/\btabs\b/g, ' tab '],
    [/\bdoesn'?t\b/g, ' not '], [/\bisn'?t\b/g, ' not '], [/\bwon'?t\b/g, ' not '], [/\bcan'?t\b/g, ' not ']
  ];
  var SYN = {
    add: 'sum', adding: 'sum', total: 'sum', totals: 'sum', totaling: 'sum', mean: 'average', avg: 'average', averages: 'average',
    graph: 'chart', graphs: 'chart', plot: 'chart', biggest: 'largest', highest: 'largest', top: 'largest', lowest: 'smallest', bottom: 'smallest',
    repeated: 'duplicate', repeats: 'duplicate', repeat: 'duplicate', copies: 'duplicate', dedupe: 'duplicate', colour: 'color',
    empty: 'blank', blanks: 'blank', picklist: 'dropdown', concatenate: 'combine', concat: 'combine', join: 'combine', joining: 'combine',
    separate: 'split', separating: 'split', anchor: 'lock', locking: 'lock', sorting: 'sort', filtering: 'filter', rounding: 'round',
    hashtag: 'hash', hashtags: 'hash', hashes: 'hash', mortgage: 'loan', headers: 'header', heading: 'header', headings: 'header', titles: 'title',
    occurrences: 'times', occurs: 'times', appears: 'times', distinct: 'unique', remaining: 'left', erase: 'delete', remove: 'delete', removing: 'delete',
    rid: 'delete', deleting: 'delete', capitalise: 'capitalize', colored: 'color', birthday: 'age', worksheet: 'sheet', tab: 'sheet',
    scrolling: 'scroll', skip: 'ignore', skipping: 'ignore', ignoring: 'ignore', excluding: 'ignore', exclude: 'ignore', except: 'ignore',
    drag: 'copy', dragging: 'copy', dragged: 'copy', copying: 'copy', copied: 'copy', cursor: 'cell', pounds: 'hash', pound: 'hash'
  };

  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 5 && /(ss|x|ch|sh)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /[^su]s$/.test(w) && !/ifs$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function straighten(s) { return String(s).replace(/[“”„]/g, '"').replace(/[‘’]/g, "'").replace(/ /g, ' '); }
  function flat(s) {
    s = ' ' + straighten(s).toLowerCase() + ' ';
    PHRASES.forEach(function (p) { s = s.replace(p[0], p[1]); });
    return s;
  }
  function words(s) {
    return (flat(s).match(/#[a-z0-9/]+[!?]?|[a-z0-9]+(?:\.[a-z0-9]+)*|\$/g) || []).map(function (w) { return w.replace(/[!?]$/, ''); });
  }
  function tokens(s, keepStop) {
    var out = [];
    words(s).forEach(function (w) {
      if (!keepStop && STOP[w] && !SOFT[w]) return;
      if (SOFT[w] && !keepStop) return;
      w = SYN[w] || w;
      w = stem(w);
      w = SYN[w] || w;
      out.push(w);
    });
    return out;
  }
  function phrase(s) { return ' ' + tokens(s, true).join(' ') + ' '; }

  /* Edit distance with adjacent swaps, stopping early past `max`. */
  function near(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var p2 = null, p = [], c, i, j, best;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      c = [i]; best = i;
      for (j = 1; j <= b.length; j++) {
        c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (p2 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) c[j] = Math.min(c[j], p2[j - 2] + 1);
        if (c[j] < best) best = c[j];
      }
      if (best > max) return max + 1;
      p2 = p; p = c;
    }
    return p[b.length];
  }

  /* ------------------------------------------------------------------
   * Index
   * --------------------------------------------------------------- */
  var BY = {}, VOCAB = {}, DF = {}, INDEX = [];
  TOPICS.forEach(function (t) {
    BY[t.id] = t;
    var w = {};
    function put(text, weight) { tokens(text).forEach(function (k) { if (!w[k] || w[k] < weight) w[k] = weight; }); }
    put(t.body, 0.35);
    t.ask.forEach(function (q) { put(q, 1.6); });
    t.keys.forEach(function (k) { put(k, 2.2); });
    put(t.title, 3);
    var ph = t.keys.concat([t.title]).map(function (k) { return { p: phrase(k), n: tokens(k, true).length, content: tokens(k).length }; });
    var asks = t.ask.map(function (q) { return tokens(q); });
    INDEX.push({ t: t, w: w, ph: ph, asks: asks });
    Object.keys(w).forEach(function (k) { if (w[k] >= 1.6) { DF[k] = (DF[k] || 0) + 1; VOCAB[k] = 1; } });
  });
  Object.keys(FUNCS).forEach(function (f) { VOCAB[f.toLowerCase()] = VOCAB[f.toLowerCase()] || 2; });
  var N = TOPICS.length || 1;
  function idf(k) { return Math.log(1 + N / (DF[k] || 0.6)); }

  // Everyday words a spelling fix must never turn into Excel vocabulary.
  var PLAIN = {};
  ('president poem story weather joke movie music song sport game food recipe love life world people person house home car city country school ' +
   'teacher friend money today tomorrow time year write read tell think weather capital history math science essay paper email letter phone water ' +
   'name names thanks thank hello please sorry great cool nice more less other another same good better write never always meaning dinner cooking pizza').split(' ')
    .forEach(function (w) { PLAIN[w] = 1; });

  function correct(k) {
    if (VOCAB[k] || PLAIN[k] || k.length < 5 || /^[#$\d]/.test(k)) return null;
    var max = k.length >= 7 ? 2 : 1, best = null, bd = max + 1;
    Object.keys(VOCAB).forEach(function (v) {
      if (v.length < 4 || v[0] !== k[0]) return;
      var d = near(k, v, max);
      if (d < bd || (d === bd && best && (DF[v] || 0) > (DF[best] || 0))) { bd = d; best = v; }
    });
    return bd <= max ? best : null;
  }

  function spell(text) {
    return flat(text).replace(/[a-z][a-z0-9]{3,}/g, function (w) {
      if (STOP[w] || SYN[w]) return w;
      var k = stem(w);
      if (VOCAB[k] || VOCAB[w]) return w;
      return correct(k) || w;
    });
  }
  // A word Excel Helper has never seen says little about which topic is meant.
  function weigh(k) { return VOCAB[k] ? idf(k) : 2; }
  function search(text) {
    text = spell(text);
    var q = [], seen = {};
    tokens(text).forEach(function (k) { if (!seen[k]) { seen[k] = 1; q.push({ k: k, w: 1 }); } });
    var total = 0; q.forEach(function (x) { total += weigh(x.k); });
    var ph = phrase(text), fixed = ' ' + q.map(function (x) { return x.k; }).join(' ') + ' ';
    var res = INDEX.map(function (e) {
      var s = 0, hit = 0;
      q.forEach(function (x) {
        var fw = e.w[x.k];
        if (!fw) return;
        s += idf(x.k) * fw * x.w;
        hit += weigh(x.k) * (fw >= 1.6 ? 1 : 0.4);
      });
      var bonus = 0;
      e.ph.forEach(function (p) {
        if (ph.indexOf(p.p) !== -1 || (p.content && fixed.indexOf(p.p) !== -1)) {
          var b = p.content ? 4 + 3.2 * p.n : (p.n > 2 ? 7.5 : p.n > 1 ? 4 : 0);
          if (b > bonus) bonus = b;
        }
      });
      var askBest = 0;
      e.asks.forEach(function (a) {
        if (!a.length || !q.length) return;
        var both = 0, set = {};
        a.forEach(function (k) { set[k] = 1; });
        q.forEach(function (x) { if (set[x.k]) both++; });
        var sim = 2 * both / (a.length + q.length);
        if (sim > askBest) askBest = sim;
      });
      return { t: e.t, s: s + bonus + askBest * 7 + (askBest >= 0.7 ? (askBest - 0.7) * 40 : 0), cover: total ? hit / total : (bonus ? 1 : 0), bonus: bonus, ask: askBest };
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return { top: res, q: q, total: total };
  }

  /* ------------------------------------------------------------------
   * Formula reading
   * --------------------------------------------------------------- */
  var REF = /^\$?[A-Z]{1,3}\$?\d{1,7}$/i;
  var RANGE = /^(?:(?:'[^']+'|[A-Za-z0-9_.]+)!)?\$?[A-Z]{1,3}\$?\d{0,7}:\$?[A-Z]{1,3}\$?\d{0,7}$/i;

  /* Pull the formula out of a message. Returns { f, before, after } or null. */
  function extract(text) {
    var s = straighten(text).replace(/^\s*`+|`+\s*$/g, '');
    var m = /=\s*[-+]?(?:[A-Z][A-Z0-9.]*\s*\(|\$?[A-Z]{1,3}\$?\d+\s*(?:[-+*\/&<>^:=×÷]|x\s*\$?[A-Z]{1,3}\$?\d)|\(|\d+(?:\.\d+)?%?\s*[-+*\/]\s*\$?[A-Z]{1,3}\$?\d|"[^"]*"\s*&|\$?[A-Z]{1,3}\$?\d+\s*$|[A-Za-z0-9_]+!\$?[A-Z]{1,3}\$?\d|'[^']+'!)/i.exec(s);
    var start, bare = false;
    if (m) start = m.index;
    else {
      m = /^\s*([A-Z][A-Z0-9.]{1,})\(\s*[^)\s]/.exec(s);
      if (!m || !(FUNCS[m[1].toUpperCase()] || suggest(m[1]))) return null;
      start = s.indexOf(m[1]); bare = true;
    }
    var rest = s.slice(start), depth = 0, inq = false, end = rest.length, opened = false;
    for (var i = 0; i < rest.length; i++) {
      var ch = rest[i];
      if (ch === '"') inq = !inq;
      if (inq) continue;
      if (ch === '\n' && depth <= 0) { end = i; break; }
      if (ch === '(') { depth++; opened = true; }
      if (ch === ')') depth--;
      if (/\s/.test(ch)) {
        var tail = rest.slice(i);
        var prose = /^\s+(?:and |but )?(?:giv(?:es?|ing)|is|are|isn'?t|doesn'?t|does|returns?|returning|shows?|showing|says|not|why|what|it|keeps?|when|won'?t|can|please|to|work(?:s|ing)?|error|with|because|did|do|i|my|the|in (?:row|col|my|excel)|for (?:my|the|all)|wrong|correct|right|fix|explain|mean)\b/i;
        if (prose.test(tail) && (depth <= 0 || !/^\s+(?:is|not|right)\s*\(/i.test(tail))) { end = i; break; }
        if (depth <= 0 && opened && /^\s+[?.!]*\s*[a-z]{2,}\b(?!\s*\()/.test(tail)) { end = i; break; }
      }
    }
    var f = rest.slice(0, end).replace(/[\s?.;,]+$/, '').replace(/`/g, '').trim();
    if (f.length < 3) return null;
    return { f: f, bare: bare, before: s.slice(0, start).trim(), after: rest.slice(end).trim() };
  }

  /* Split a formula into calls with raw argument text. */
  function parse(f) {
    var calls = [], stack = [], inq = false, sq = false, br = 0, brace = 0, i, ch, nm;
    var quotes = 0, extraClose = 0;
    for (i = 0; i < f.length; i++) {
      ch = f[i];
      if (inq) { if (ch === '"') { inq = false; quotes++; } continue; }
      if (sq) { if (ch === "'") sq = false; continue; }
      if (ch === '"') { inq = true; quotes++; continue; }
      if (ch === "'") { sq = true; continue; }
      if (ch === '[') { br++; continue; }
      if (ch === ']') { br = Math.max(0, br - 1); continue; }
      if (br) continue;
      if (ch === '{') { brace++; continue; }
      if (ch === '}') { brace--; continue; }
      if (brace) continue;
      if (ch === '(') {
        nm = /([A-Za-z_][A-Za-z0-9_.]*)\s*$/.exec(f.slice(0, i));
        stack.push({ name: nm ? nm[1].toUpperCase() : '', start: nm ? nm.index : i, open: i, args: [], from: i + 1, depth: stack.length });
        continue;
      }
      if ((ch === ',' || ch === ';') && stack.length) { var t = stack[stack.length - 1]; t.args.push(f.slice(t.from, i).trim()); t.from = i + 1; continue; }
      if (ch === ')') {
        if (!stack.length) { extraClose++; continue; }
        close(stack.pop(), i);
      }
    }
    var unclosed = stack.length;
    while (stack.length) close(stack.pop(), f.length);
    function close(c, at) {
      var last = f.slice(c.from, at).trim();
      if (last !== '' || c.args.length) c.args.push(last);
      c.end = at;
      calls.push(c);
    }
    calls.sort(function (a, b) { return a.start - b.start; });
    return { calls: calls, unclosed: unclosed, extraClose: extraClose, quotes: quotes };
  }

  function suggest(name) {
    name = name.toUpperCase();
    var best = null, bd = 3;
    Object.keys(FUNCS).forEach(function (f) {
      if (f.length < 2 || name.length < 3) return;
      var max = f.length <= 3 ? 1 : 2;
      var d = near(name, f, max);
      if (d <= max && d < bd) { bd = d; best = f; }
    });
    return best;
  }

  /* Run a fix on the parts of a formula outside quoted text. */
  function outside(f, fn) {
    return f.split(/("(?:[^"]|"")*")/).map(function (part, i) { return i % 2 ? part : fn(part); }).join('');
  }
  function colNum(s) { var n = 0; s = s.replace(/[^A-Z]/gi, '').toUpperCase(); for (var i = 0; i < s.length; i++) n = n * 26 + s.charCodeAt(i) - 64; return n; }
  function rangeInfo(r) {
    var m = /^(?:(?:'[^']+'|[A-Za-z0-9_.]+)!)?(\$?)([A-Z]{1,3})(\$?)(\d*):(\$?)([A-Z]{1,3})(\$?)(\d*)$/i.exec(r.trim());
    if (!m) return null;
    return { cols: Math.abs(colNum(m[6]) - colNum(m[2])) + 1, rows: m[4] && m[8] ? Math.abs(+m[8] - +m[4]) + 1 : null, whole: !m[4], locked: (m[4] ? m[3] === '$' : true) && (m[8] ? m[7] === '$' : true) };
  }
  function lockRange(r) {
    return r.replace(/\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)/i, function (_, a, b, c, d) { return '$' + a.toUpperCase() + '$' + b + ':$' + c.toUpperCase() + '$' + d; });
  }
  function swapArg(f, call, i, value) {
    // Rebuild one call with one argument replaced.
    var args = call.args.slice(); args[i] = value;
    return f.slice(0, call.open + 1) + args.join(', ') + f.slice(call.end);
  }
  function isStr(a) { return /^"(?:[^"]|"")*"$/.test(a || ''); }

  var LOOKUPISH = { VLOOKUP: 1, HLOOKUP: 1, XLOOKUP: 1, MATCH: 1, XMATCH: 1, SUMIF: 1, SUMIFS: 1, COUNTIF: 1, COUNTIFS: 1, AVERAGEIF: 1, AVERAGEIFS: 1, RANK: 1, 'RANK.EQ': 1, 'RANK.AVG': 1, MAXIFS: 1, MINIFS: 1, LARGE: 1, SMALL: 1 };
  var LOCKARG = { VLOOKUP: [1], HLOOKUP: [1], XLOOKUP: [1, 2], MATCH: [1], XMATCH: [1], SUMIF: [0, 2], COUNTIF: [0], AVERAGEIF: [0, 2], RANK: [1], 'RANK.EQ': [1], 'RANK.AVG': [1], LARGE: [0], SMALL: [0] };
  var OLD = { CONCATENATE: 'CONCAT, TEXTJOIN or the & sign', RANK: 'RANK.EQ', STDEV: 'STDEV.S', FORECAST: 'FORECAST.LINEAR', CEILING: null, FLOOR: null };

  function check(input, bare) {
    var bad = [], warn = [], tip = [], f = input, p, m;
    function B(s) { bad.push(s); } function W(s) { warn.push(s); } function T(s) { if (tip.indexOf(s) < 0) tip.push(s); }

    if (bare) { B('It is missing the `=` at the start, so Excel treats it as plain text.'); f = '=' + f; }

    // Operators borrowed from other languages or typed on the wrong key.
    var g = outside(f, function (s) {
      return s.replace(/=\s*</g, function () { B('`=<` is backwards. Excel uses `<=`.'); return '<='; })
        .replace(/=\s*>/g, function () { B('`=>` is backwards. Excel uses `>=`.'); return '>='; })
        .replace(/!=/g, function () { B('`!=` is not an Excel operator. Not equal is `<>`.'); return '<>'; })
        .replace(/([^=<>])==/g, function (_, a) { B('`==` should be a single `=` in Excel.'); return a + '='; })
        .replace(/×/g, function () { B('`×` is not a multiply sign in Excel. Use `*`.'); return '*'; })
        .replace(/÷/g, function () { B('`÷` is not a divide sign in Excel. Use `/`.'); return '/'; })
        .replace(/(\b\$?[A-Z]{1,3}\$?\d+)\s*x\s*(\$?[A-Z]{1,3}\$?\d+\b)/g, function (_, a, b) { B('Use `*` to multiply, not the letter x.'); return a + '*' + b; })
        .replace(/([-+*\/(,=<>]\s*)\$(\d)/g, function (_, a, b) { B('Leave the dollar sign off numbers. Format the cell as currency instead.'); return a + b; });
    });
    f = g;

    p = parse(f);
    if (p.quotes % 2) B('A quotation mark is missing. Text needs a `"` on both sides.');
    if (p.extraClose) {
      B('There ' + (p.extraClose === 1 ? 'is 1 closing bracket' : 'are ' + p.extraClose + ' closing brackets') + ' too many.');
      if (/\)+$/.test(f)) f = f.slice(0, f.length - p.extraClose);
    }
    if (p.unclosed) {
      B('It is missing ' + (p.unclosed === 1 ? 'a closing bracket' : p.unclosed + ' closing brackets') + ' at the end. Excel may guess where it goes and guess wrong.');
      if (p.quotes % 2 === 0) f += new Array(p.unclosed + 1).join(')');
    }
    p = parse(f);

    // Chained comparison, e.g. 70<=A2<90.
    f = outside(f, function (s) {
      return s.replace(/(\d+(?:\.\d+)?)\s*(<=?|>=?)\s*(\$?[A-Z]{1,3}\$?\d+)\s*(<=?|>=?)\s*(\d+(?:\.\d+)?)/gi, function (_, a, o1, r, o2, b) {
        B('Excel cannot read `' + a + o1 + r + o2 + b + '` as "between". Use AND with two tests.');
        var flip = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' };
        return 'AND(' + r + flip[o1] + a + ', ' + r + o2 + b + ')';
      });
    });
    p = parse(f);

    // Unknown functions.
    p.calls.forEach(function (c) {
      if (!c.name || FUNCS[c.name]) return;
      if (/^(_XLFN|_XLWS)/.test(c.name)) { T('`_xlfn` means the file uses a function this version of Excel does not have.'); return; }
      var near1 = suggest(c.name);
      if (near1) B('`' + c.name + '` is not a function. Did you mean `' + near1 + '`?');
      else W('I do not recognize `' + c.name + '`. Unless it is your own LAMBDA or VBA function, Excel will show `#NAME?`.');
    });
    f = outside(f, function (s) {
      return s.replace(/([A-Za-z_][A-Za-z0-9_.]*)(\s*)\(/g, function (all, n) {
        var u = n.toUpperCase();
        if (FUNCS[u]) return u + '(';
        var sg = suggest(u);
        return sg && !/^_XL/.test(u) ? sg + '(' : all;
      });
    });
    p = parse(f);

    // Text that should be in quotes. LET and LAMBDA define names, so skip there.
    var defines = p.calls.some(function (c) { return /^(LET|LAMBDA|MAP|BYROW|BYCOL|REDUCE|SCAN)$/.test(c.name); });
    if (!defines) {
      var bareNames = {};
      f = outside(f, function (s) {
        return s.replace(/'[^']*'!|\[[^\]]*\]|([A-Za-z_][A-Za-z0-9_.]*)(?![A-Za-z0-9_.]*[!(\[:])/g, function (all, n, off, str) {
          if (!n) return all;
          if (/^(TRUE|FALSE)$/i.test(n) || FUNCS[n.toUpperCase()] || REF.test(n)) return all;
          if (/[:!$\]]$/.test(str.slice(0, off)) || /^\s*[:(!\[]/.test(str.slice(off + n.length))) return all;
          if (/[$A-Za-z0-9_.]$/.test(str.slice(0, off))) return all;
          if (/^[A-Z]{1,3}$/.test(n) && /\d/.test(str.slice(off + n.length, off + n.length + 2))) return all;
          // Comparing with it, or using it as an IF result, means it is text.
          var before = str.slice(0, off), textual = /[=<>]\s*$/.test(before) && before.trim() !== '=' || /,\s*$/.test(before);
          bareNames[n] = textual;
          return textual && !/^\w*(Rate|Total|Range|List|Table|Data|Sales)$/.test(n) ? '"' + n + '"' : all;
        });
      });
      var quoteThese = Object.keys(bareNames).filter(function (n) { return bareNames[n] && !/^\w*(Rate|Total|Range|List|Table|Data|Sales)$/.test(n); });
      if (quoteThese.length > 1) B(quoteThese.map(function (n) { return '`' + n + '`'; }).join(' and ') + ' are text, so each needs quotes: ' + quoteThese.map(function (n) { return '`"' + n + '"`'; }).join(' and ') + '. Without them Excel looks for named ranges and shows `#NAME?`.');
      Object.keys(bareNames).forEach(function (n) {
        if (quoteThese.length > 1 && quoteThese.indexOf(n) > -1) return;
        if (bareNames[n] && !/^\w*(Rate|Total|Range|List|Table|Data|Sales)$/.test(n)) B('`' + n + '` is text, so it needs quotes: `"' + n + '"`. Without them Excel looks for a named range and shows `#NAME?`.');
        else T('`' + n + '` must be a named range or Table in your workbook. If it is meant to be text, put it in quotes.');
      });
    }
    p = parse(f);

    // Function by function. Work from the end so earlier positions stay valid.
    var order = p.calls.slice().sort(function (a, b) { return b.start - a.start; });
    order.forEach(function (c) {
      var a = c.args, n = a.length, r, k;
      switch (c.name) {
        case 'VLOOKUP': case 'HLOOKUP':
          var what = c.name === 'VLOOKUP' ? 'column' : 'row';
          if (n < 3) { B(c.name + ' needs at least 3 parts: what to find, the table, and the ' + what + ' number.'); break; }
          r = rangeInfo(a[1]);
          if (/^\d+$/.test(a[2])) {
            k = +a[2];
            if (k < 1) B('The ' + what + ' number starts at 1.');
            else if (r && (c.name === 'VLOOKUP' ? r.cols : r.rows) && k > (c.name === 'VLOOKUP' ? r.cols : r.rows)) B('The table `' + a[1] + '` is only ' + (c.name === 'VLOOKUP' ? r.cols + ' columns wide' : r.rows + ' rows tall') + ', so ' + what + ' ' + k + ' gives `#REF!`.');
            if (c.name === 'VLOOKUP' && k === 1) W('Column 1 is the column you are matching on, so this returns the value you already have.');
          }
          if (n === 3) { B('The fourth part is missing, so Excel uses **approximate** match and can return a wrong answer with no error. Add `FALSE`.'); f = f.slice(0, c.open + 1) + a.concat('FALSE').join(', ') + f.slice(c.end); c = find(f, c.start); a = c.args; }
          else if (/^(TRUE|1)$/i.test(a[3])) W('`' + a[3] + '` means approximate match. That is right for brackets such as tax or grade scales sorted smallest first. For IDs or names, use `FALSE`.');
          if (n > 4) B(c.name + ' takes 4 parts at most, and this has ' + n + '.');
          if (c.name === 'VLOOKUP') T('VLOOKUP only looks right. XLOOKUP (Excel 2021 and later) looks either way.');
          break;
        case 'XLOOKUP':
          if (n < 3) { B('XLOOKUP needs 3 parts: what to find, where to look, and what to return.'); break; }
          var x1 = rangeInfo(a[1]), x2 = rangeInfo(a[2]);
          if (x1 && x2 && x1.rows && x2.rows && x1.rows !== x2.rows && x1.cols === 1) B('The search range has ' + x1.rows + ' rows and the return range has ' + x2.rows + '. They must match, or you get `#VALUE!`.');
          if (n === 3) T('Add a fourth part such as `"Not found"` to replace `#N/A`.');
          if (n > 3 && /^(TRUE|FALSE)$/i.test(a[3])) W('The fourth part of XLOOKUP is the **not found** message, not exact match. XLOOKUP is already exact, so `' + a[3] + '` can go.');
          break;
        case 'MATCH':
          if (n < 2) B('MATCH needs what to find and where to look.');
          else if (n === 2) { B('MATCH is missing its third part. Without `0` it uses approximate match on sorted data.'); f = f.slice(0, c.open + 1) + a.concat('0').join(', ') + f.slice(c.end); c = find(f, c.start); }
          break;
        case 'IF':
          if (n === 1) B('IF needs a test **and** at least one result.');
          else if (n === 2) W('There is no third part, so it shows FALSE when the test fails. Add what you want instead, such as `""`.');
          else if (n > 3) B('IF takes 3 parts and this has ' + n + '. Check for a misplaced bracket, or a comma inside a number such as 1,000.');
          break;
        case 'IFS':
          if (n % 2) B('IFS needs pairs of test and result, and this has an odd number of parts.');
          if (n >= 2 && !/^(TRUE|1=1)$/i.test(a[n - 2])) T('End IFS with `TRUE, "something"` so rows that match nothing do not show `#N/A`.');
          ladder(a, W);
          break;
        case 'IFERROR': case 'IFNA':
          if (n === 1) B(c.name + ' needs a second part: what to show instead.');
          else if (c.name === 'IFERROR' && /LOOKUP|MATCH/i.test(a[0])) T('For lookups, IFNA is safer than IFERROR. It hides "not found" but still shows real mistakes.');
          break;
        case 'COUNTIF':
          if (n !== 2) B('COUNTIF takes exactly 2 parts (range, condition) and this has ' + n + '.' + (n > 2 ? ' For more conditions use COUNTIFS.' : ''));
          crit(c, 1);
          break;
        case 'SUMIF': case 'AVERAGEIF':
          if (n < 2 || n > 3) B(c.name + ' takes 2 or 3 parts and this has ' + n + '.' + (n > 3 ? ' For several conditions use ' + c.name + 'S, with the numbers **first**.' : ''));
          if (n === 3 && isStr(a[0])) B('The range comes first in ' + c.name + ', then the condition.');
          sizes([a[0], a[2]], c.name);
          crit(c, 1);
          break;
        case 'SUMIFS': case 'AVERAGEIFS': case 'MAXIFS': case 'MINIFS':
          if (n < 3 || n % 2 === 0) B(c.name + ' needs the numbers first, then pairs of range and condition. This has ' + n + ' parts' + (n >= 3 ? ', so one half of a pair is missing.' : '.'));
          if (n >= 2 && (isStr(a[1]) || /^[<>=]/.test(a[1]))) B('The numbers to use come **first** in ' + c.name + '. This looks like the order for ' + c.name.slice(0, -1) + '.');
          else { sizes(a.filter(function (_, i) { return i === 0 || i % 2 === 1; }), c.name); for (k = 2; k < n; k += 2) crit(c, k); }
          break;
        case 'COUNTIFS':
          if (n % 2) B('COUNTIFS needs pairs of range and condition, and this has an odd number of parts.');
          sizes(a.filter(function (_, i) { return i % 2 === 0; }), c.name);
          for (k = 1; k < n; k += 2) crit(c, k);
          break;
        case 'SUMPRODUCT':
          sizes(a, c.name);
          break;
        case 'SUM': case 'AVERAGE': case 'MAX': case 'MIN':
          if (n === 1 && /^\$?[A-Z]{1,3}\$?\d+(\s*\+\s*\$?[A-Z]{1,3}\$?\d+)+$/i.test(a[0])) T('With `+` inside it, SUM is not doing anything. Use a range such as `SUM(A1:A5)`, which also skips text.');
          if (n === 1 && /^\$?[A-Z]{1,3}\$?\d+\s*-\s*\$?[A-Z]{1,3}\$?\d+$/i.test(a[0])) W('`' + a[0] + '` subtracts. For a range use a colon: `' + a[0].replace(/\s*-\s*/, ':') + '`.');
          if (n === 2 && REF.test(a[0]) && REF.test(a[1])) T('With a comma this uses only those two cells. For everything between them, use a colon: `' + a[0] + ':' + a[1] + '`.');
          if (n === 0) B(c.name + ' needs a range inside the brackets.');
          break;
        case 'PMT': case 'FV': case 'PV':
          if (n < 3) B(c.name + ' needs a rate, a number of periods and an amount.');
          else if (/^\d+(\.\d+)?%$|^0?\.\d+$/.test(a[0])) W('`' + a[0] + '` is used as the rate for **each period**. If it is a yearly rate and payments are monthly, use `' + a[0] + '/12` and multiply the years by 12.');
          else if (/^\d{1,2}(\.\d+)?$/.test(a[0]) && +a[0] >= 1) B('The rate `' + a[0] + '` means ' + a[0] + '00%. Write it as a percentage: `' + a[0] + '%`.');
          break;
        case 'NPV':
          T('NPV discounts its first value by a full period, so add the time-zero cost outside it.');
          break;
        case 'DATEDIF':
          if (n !== 3) B('DATEDIF takes 3 parts: start, end and a unit such as `"Y"`.');
          break;
        case 'ROUND': case 'ROUNDUP': case 'ROUNDDOWN':
          if (n < 2) B(c.name + ' needs the number of decimals, such as `, 2`.');
          break;
        case 'LEFT': case 'RIGHT': case 'MID':
          if (c.name === 'MID' && n !== 3) B('MID takes 3 parts: text, start position, how many characters.');
          break;
        case 'TEXTJOIN':
          if (n < 3) B('TEXTJOIN takes a separator, TRUE or FALSE for skipping blanks, then the text.');
          break;
        case 'INDIRECT': case 'OFFSET':
          T(c.name + ' recalculates on every change and breaks silently when cells move. INDEX usually does the same job.');
          break;
      }
      // Lock the ranges that must not slide.
      if (LOCKARG[c.name]) {
        var slid = [];
        LOCKARG[c.name].forEach(function (i) {
          var q = a[i] && rangeInfo(a[i]);
          if (q && !q.whole && !q.locked) slid.push(i);
        });
        if (slid.length) {
          W('`' + slid.map(function (i) { return a[i]; }).join('` and `') + '` will slide as you copy the formula down. Lock ' + (slid.length > 1 ? 'them' : 'it') + ' with `$` (F4).');
          c = find(f, c.start);
          slid.forEach(function (i) { f = swapArg(f, c, i, lockRange(c.args[i])); c = find(f, c.start); });
        }
      } else if (/^(SUMIFS|AVERAGEIFS|MAXIFS|MINIFS|COUNTIFS)$/.test(c.name)) {
        var off = c.name === 'COUNTIFS' ? 0 : 1, any = [];
        a.forEach(function (v, i) { var q = rangeInfo(v); if (q && !q.whole && !q.locked && (off ? (i === 0 || i % 2 === 1) : i % 2 === 0)) any.push(i); });
        if (any.length) {
          W('The ranges will slide as you copy the formula down. Lock them with `$` (F4).');
          c = find(f, c.start);
          any.forEach(function (i) { f = swapArg(f, c, i, lockRange(c.args[i])); c = find(f, c.start); });
        }
      }
      if (OLD[c.name]) T('`' + c.name + '` still works, but the current version is ' + OLD[c.name] + '.');
      var fn = FUNCS[c.name];
      if (fn && fn.v && +fn.v >= 2021) T('`' + c.name + '` needs ' + (fn.v === '365' ? 'Microsoft 365' : 'Excel ' + fn.v + ' or Microsoft 365') + '. Older versions show `#NAME?`.');
    });

    function find(s, start) { return parse(s).calls.filter(function (c) { return c.start === start; })[0]; }
    function sizes(list, name) {
      var seen = list.filter(Boolean).map(function (r) { return { r: r, i: rangeInfo(r) }; }).filter(function (x) { return x.i && x.i.rows; });
      for (var i = 1; i < seen.length; i++) if (seen[i].i.rows !== seen[0].i.rows) { B('`' + seen[0].r + '` has ' + seen[0].i.rows + ' rows and `' + seen[i].r + '` has ' + seen[i].i.rows + '. ' + (name === 'SUMIF' || name === 'AVERAGEIF' ? 'They should match, or the wrong rows get used.' : 'They must match, or you get `#VALUE!`.')); return; }
    }
    function crit(c, i) {
      var v = c.args[i], cur;
      if (v == null) return;
      if (/^(<=|>=|<>|<|>|=)/.test(v)) {
        var mm = /^(<=|>=|<>|<|>|=)\s*(.+)$/.exec(v); if (!mm) return;
        var fixed = /^-?[\d.]+%?$/.test(mm[2]) ? '"' + mm[1] + mm[2] + '"' : '"' + mm[1] + '"&' + mm[2];
        B('A condition with an operator needs quotes: `' + fixed + '`.');
        cur = find(f, c.start); f = swapArg(f, cur, i, fixed); c.args[i] = fixed;
      } else if ((m = /^"(<=|>=|<>|<|>|=)\s*(\$?[A-Z]{1,3}\$?\d+)"$/i.exec(v))) {
        var joined = '"' + m[1] + '"&' + m[2];
        B('Inside quotes, `' + m[2] + '` is just letters. Join the cell on: `' + joined + '`.');
        cur = find(f, c.start); f = swapArg(f, cur, i, joined); c.args[i] = joined;
      }
    }
    function ladder(a, say) {
      var last = null;
      for (var i = 0; i < a.length; i += 2) {
        var t = /^(\$?[A-Z]{1,3}\$?\d+)\s*(>=?|<=?)\s*(-?[\d.]+)$/i.exec(a[i]);
        if (!t) { last = null; continue; }
        if (last && last.ref === t[1] && last.op[0] === t[2][0] && ((t[2][0] === '>' && +t[3] > last.v) || (t[2][0] === '<' && +t[3] < last.v))) {
          say('The test `' + a[i] + '` can never be reached, because `' + last.text + '` catches it first. Put the strictest test first.'); return;
        }
        last = { ref: t[1], op: t[2], v: +t[3], text: a[i] };
      }
    }

    // Nested IFs, checked as one ladder.
    p = parse(f);
    var ifs = p.calls.filter(function (c) { return c.name === 'IF'; });
    if (ifs.length >= 3) T('With ' + ifs.length + ' IFs nested, **IFS** is easier to read.');
    if (ifs.length >= 2) { var flatArgs = []; ifs.forEach(function (c) { flatArgs.push(c.args[0] || '', ''); }); ladder(flatArgs, W); }

    // Whole-formula patterns.
    if ((m = /(?:[<>=])\s*"(-?\d+(?:\.\d+)?)"/.exec(f)) && !/(SUMIFS?|COUNTIFS?|AVERAGEIFS?|MAXIFS|MINIFS)\([^)]*"[<>=]*\d/i.test(f)) {
      B('`"' + m[1] + '"` in quotes is text, so comparing it with a number never matches the way you want. Use `' + m[1] + '`.');
      f = f.replace(/([<>=]\s*)"(-?\d+(?:\.\d+)?)"/g, '$1$2');
    }
    if (/\/\s*\$?[A-Z]{1,3}\$?\d+/i.test(outside(f, function (s) { return s; }).replace(/"[^"]*"/g, '')) && !/IFERROR|IF\(/i.test(f)) T('If the cell you divide by can be empty or zero, you will see `#DIV/0!`.');
    if (/^=\s*\$?[A-Z]{1,3}\$?\d+(\s*\+\s*\$?[A-Z]{1,3}\$?\d+){3,}$/i.test(f)) T('A SUM over a range is shorter, and it will not break when one cell holds text.');
    if (/#REF!/i.test(f)) B('`#REF!` inside the formula means a cell it used was deleted. Undo, or type the reference again.');
    if (/;/.test(f.replace(/"[^"]*"/g, '')) && !/,/.test(f.replace(/"[^"]*"/g, '')) && !/\{/.test(f)) T('You are using `;` between parts, which is right for European settings. US Excel uses commas.');

    return { f: f, bad: bad, warn: warn, tip: tip, calls: parse(f).calls };
  }

  /* Plain-English reading of a formula. */
  function splitTop(s, re) {
    var depth = 0, inq = false;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '"') inq = !inq;
      if (inq) continue;
      if (ch === '(' || ch === '[') depth++;
      if (ch === ')' || ch === ']') depth--;
      if (!depth) { var m = re.exec(s.slice(i)); if (m && m.index === 0) return [s.slice(0, i).trim(), m[0].trim(), s.slice(i + m[0].length).trim()]; }
    }
    return null;
  }
  function say(s) {
    s = (s || '').trim();
    if (s === '') return 'nothing';
    if (s === '""') return 'a blank';
    if (isStr(s)) return '"' + s.slice(1, -1) + '"';
    var c = splitTop(s, /^(<=|>=|<>|=|<|>)/);
    if (c && c[0]) return say(c[0]) + ({ '=': ' is ', '<>': ' is not ', '>': ' is more than ', '>=': ' is at least ', '<': ' is less than ', '<=': ' is at most ' })[c[1]] + (c[2] === '""' ? 'blank' : say(c[2]));
    var call = /^([A-Z][A-Z0-9.]*)\(/i.exec(s);
    if (call) {
      var p = parse(s).calls[0];
      if (p && p.start === 0 && p.end === s.length - 1) return sayCall(p.name, p.args);
    }
    return '`' + s + '`';
  }
  function sayCrit(v) {
    var m = /^"(<=|>=|<>|<|>|=)(.*)"$/.exec(v || '');
    var j = /^"(<=|>=|<>|<|>|=)"\s*&\s*(.+)$/.exec(v || '');
    var t = { '=': 'is', '<>': 'is not', '>': 'is more than', '>=': 'is at least', '<': 'is less than', '<=': 'is at most' };
    if (m) return t[m[1]] + ' ' + (m[2] || 'blank');
    if (j) return t[j[1]] + ' ' + say(j[2]);
    return 'is ' + say(v);
  }
  function sayCall(n, a) {
    var i, out;
    switch (n) {
      case 'IF': return 'if ' + say(a[0]) + ', show ' + say(a[1]) + (a.length > 2 ? '; otherwise ' + (/^IF\(/i.test(a[2]) ? say(a[2]) : 'show ' + say(a[2])) : '');
      case 'IFS': out = []; for (i = 0; i + 1 < a.length; i += 2) out.push(/^TRUE$/i.test(a[i]) ? 'anything else gives ' + say(a[i + 1]) : 'if ' + say(a[i]) + ', show ' + say(a[i + 1])); return out.join('; ');
      case 'AND': return a.map(say).join(' and ');
      case 'OR': return a.map(say).join(' or ');
      case 'NOT': return 'not (' + say(a[0]) + ')';
      case 'SUM': return 'the total of ' + a.map(say).join(' and ');
      case 'AVERAGE': return 'the average of ' + a.map(say).join(' and ');
      case 'COUNT': return 'how many numbers are in ' + a.map(say).join(' and ');
      case 'COUNTA': return 'how many cells are filled in ' + a.map(say).join(' and ');
      case 'MAX': return 'the largest value in ' + a.map(say).join(' and ');
      case 'MIN': return 'the smallest value in ' + a.map(say).join(' and ');
      case 'VLOOKUP': return 'find ' + say(a[0]) + ' in the first column of ' + say(a[1]) + ' and return column ' + (a[2] || '?') + (/^(FALSE|0)$/i.test(a[3] || '') ? ', exact match' : ', approximate match');
      case 'XLOOKUP': return 'find ' + say(a[0]) + ' in ' + say(a[1]) + ' and return the matching value from ' + say(a[2]) + (a[3] ? '; if it is missing, show ' + say(a[3]) : '');
      case 'MATCH': return 'the position of ' + say(a[0]) + ' in ' + say(a[1]);
      case 'INDEX': return 'from ' + say(a[0]) + ', return row ' + say(a[1]) + (a[2] ? ', column ' + say(a[2]) : '');
      case 'SUMIF': return 'add ' + say(a[2] || a[0]) + ' where ' + say(a[0]) + ' ' + sayCrit(a[1]);
      case 'AVERAGEIF': return 'average ' + say(a[2] || a[0]) + ' where ' + say(a[0]) + ' ' + sayCrit(a[1]);
      case 'COUNTIF': return 'count the cells in ' + say(a[0]) + ' where the value ' + sayCrit(a[1]);
      case 'SUMIFS': case 'AVERAGEIFS': case 'MAXIFS': case 'MINIFS':
        out = []; for (i = 1; i + 1 < a.length; i += 2) out.push(say(a[i]) + ' ' + sayCrit(a[i + 1]));
        return ({ SUMIFS: 'add ', AVERAGEIFS: 'average ', MAXIFS: 'the largest of ', MINIFS: 'the smallest of ' })[n] + say(a[0]) + ' where ' + out.join(' and ');
      case 'COUNTIFS': out = []; for (i = 0; i + 1 < a.length; i += 2) out.push(say(a[i]) + ' ' + sayCrit(a[i + 1])); return 'count the rows where ' + out.join(' and ');
      case 'IFERROR': return say(a[0]) + '; if that gives any error, show ' + say(a[1]);
      case 'IFNA': return say(a[0]) + '; if it is not found, show ' + say(a[1]);
      case 'ROUND': return say(a[0]) + ', rounded to ' + (a[1] || '?') + ' decimals';
      case 'LEFT': return 'the first ' + (a[1] || '1') + ' characters of ' + say(a[0]);
      case 'RIGHT': return 'the last ' + (a[1] || '1') + ' characters of ' + say(a[0]);
      case 'TRIM': return say(a[0]) + ' without extra spaces';
      case 'PMT': return 'the payment per period on ' + say((a[2] || '').replace(/^-/, '')) + ' over ' + say(a[1]) + ' periods at ' + say(a[0]) + ' a period';
      case 'TODAY': return 'today';
    }
    var fn = FUNCS[n];
    return (fn ? fn.d : n) + (a.length ? ' (using ' + a.map(say).join(', ') + ')' : '');
  }
  function cap(s) { return s.replace(/^(["`]?)([a-z])/, function (_, q, c) { return q === '`' ? q + c : q + c.toUpperCase(); }); }

  function doctor(ex) {
    var r = check(ex.f, ex.bare), out = [], body = r.f.replace(/^=/, '');
    var norm = function (s) { return s.replace(/\s+/g, '').toUpperCase(); };
    var changed = norm(r.f) !== norm(ex.f), nBad = r.bad.length, nWarn = r.warn.length;
    if (nBad) {
      out.push('**Found ' + (nBad === 1 ? 'a problem' : nBad + ' problems') + '**');
      out.push(r.bad.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n'));
    } else out.push('**The structure looks right.** Every bracket closes and the parts are in the order Excel expects.');
    if (nWarn) { out.push('**Check this**'); out.push(r.warn.map(function (s) { return '- ' + s; }).join('\n')); }
    if (changed) { out.push('**Try this instead**'); out.push('```excel\n' + r.f + '\n```'); }
    var known = r.calls.every(function (c) { return !c.name || FUNCS[c.name]; });
    if (known && r.f.length < 220 && !(nBad && !changed)) out.push('**In plain English:** ' + cap(say(body)) + '.');
    if (r.tip.length) out.push(r.tip.slice(0, 2).map(function (s) { return '*Tip:* ' + s; }).join('\n'));
    if (!nBad) out.push('I can read the formula but not your data. If it still goes wrong, tell me the exact error it shows.');
    var ids = [], map = { VLOOKUP: 'vlookup', HLOOKUP: 'vlookup', XLOOKUP: 'xlookup', INDEX: 'index-match', MATCH: 'index-match', IF: 'if', IFS: 'if', SUMIF: 'sumifs', SUMIFS: 'sumifs', COUNTIF: 'countifs', COUNTIFS: 'countifs', AVERAGEIF: 'averageif', IFERROR: 'iferror', IFNA: 'iferror', PMT: 'loan', FV: 'loan', SUMPRODUCT: 'sumproduct', LET: 'let', LAMBDA: 'lambda', FILTER: 'filter-function', UNIQUE: 'unique-list', TEXTJOIN: 'combine-text', DATEDIF: 'date', ROUND: 'round', AND: 'and-or', OR: 'and-or' };
    r.calls.forEach(function (c) { var id = map[c.name]; if (id && ids.indexOf(id) < 0) ids.push(id); });
    return { md: out.join('\n\n'), kind: 'check', id: ids[0] || null, chips: ids.slice(0, 2).map(label).concat(['Explain the error codes', 'Check another formula']), fixed: r.f, report: r };
  }

  /* ------------------------------------------------------------------
   * Formula writing from a sentence
   * --------------------------------------------------------------- */
  var OPS = [
    [/^(?:is |are |=|==)?\s*(?:greater than or equal to|at least|no less than|>=|or more)\s*/i, '>='],
    [/^(?:is |are )?\s*(?:less than or equal to|at most|no more than|<=|up to)\s*/i, '<='],
    [/^(?:is |are )?\s*(?:greater than|more than|bigger than|higher than|larger than|over|above|>)\s*/i, '>'],
    [/^(?:is |are )?\s*(?:less than|lower than|smaller than|fewer than|under|below|<)\s*/i, '<'],
    [/^(?:is not|are not|isn'?t|is n'?t|not equal to|does not equal|<>|!=)\s*(?:equal to )?/i, '<>'],
    [/^(?:contains?|includes?|has)\s+/i, '*'],
    [/^(?:is equal to|equals?|is|are|says?|=)\s*/i, '=']
  ];
  function cond(s) {
    s = s.trim().replace(/[?.!]+$/, '');
    for (var i = 0; i < OPS.length; i++) {
      var m = OPS[i][0].exec(s);
      if (m && m[0]) return { op: OPS[i][1], v: s.slice(m[0].length).trim().replace(/^["']|["']$/g, '') };
    }
    return null;
  }
  function critText(c) {
    var v = c.v.replace(/^\$(?=\d)/, '').replace(/(\d),(?=\d{3}\b)/g, '$1');
    if (/^(?:blank|empty|nothing)$/i.test(v)) return c.op === '<>' ? '"<>"' : '""';
    if (REF.test(v) && /^[A-Z]/.test(v)) return c.op === '=' ? v.toUpperCase() : c.op === '*' ? '"*"&' + v.toUpperCase() + '&"*"' : '"' + c.op + '"&' + v.toUpperCase();
    if (c.op === '*') return '"*' + v + '*"';
    if (c.op === '=') return /^-?[\d.]+%?$/.test(v) ? v : '"' + v + '"';
    return '"' + c.op + v + '"';
  }
  function col(c) { c = c.toUpperCase(); return '$' + c + ':$' + c; }
  function rng(s) {
    var m = /^column\s+([a-z]{1,2})$/i.exec(s.trim()) || /^([a-z]{1,2})$/i.exec(s.trim());
    if (m) return col(m[1]);
    m = /^([a-z]{1,2})(\d+)\s*(?::|to|through|-)\s*([a-z]{1,2})(\d+)$/i.exec(s.trim());
    if (m) return '$' + m[1].toUpperCase() + '$' + m[2] + ':$' + m[3].toUpperCase() + '$' + m[4];
    return null;
  }
  function lit(v) {
    v = v.trim().replace(/[?.!,]+$/, '').replace(/^(?:show|say|display|return|put|write|it says|then|give)\s+/i, '').replace(/^["']|["']$/g, '');
    if (/^-?[\d.]+%?$/.test(v)) return v;
    if (REF.test(v) && /\d/.test(v)) return v.toUpperCase();
    if (/^(?:blank|empty|nothing)$/i.test(v)) return '""';
    if (/^\$?[A-Z]{1,3}\$?\d+\s*[-+*\/]/i.test(v)) return v.toUpperCase();
    return '"' + v.replace(/"/g, '""') + '"';
  }
  function built(f, why, id, extra) {
    return { md: '```excel\n' + f + '\n```\n\n' + why + (extra ? '\n\n' + extra : '') + '\n\nSwap in your own cells if yours are different.', kind: 'write', id: id, fixed: f, chips: [label(id), 'Explain it', 'Write another formula'] };
  }
  var C = '(?:the\\s+)?(?:(?:values?|numbers?|cells?|amounts?)\\s+in\\s+)?(?:the\\s+)?(column\\s+[a-z]{1,2}|[a-z]{1,2}\\d+\\s*(?::|to|through)\\s*[a-z]{1,2}\\d+)';
  function write(text) {
    var s = straighten(text).replace(/\s+/g, ' ').trim(), m, v;
    var cell = '(\\$?[a-z]{1,2}\\$?\\d+)';

    // Add / average / count / max / min, with any number of conditions.
    m = new RegExp('\\b(sum|add(?: up)?|total|average|mean|count|how many|max(?:imum)?|highest|largest|min(?:imum)?|lowest|smallest)\\b(.*)$', 'i').exec(s);
    if (m) {
      var verb = m[1].toLowerCase(), rest = m[2], kind = /sum|add|total/.test(verb) ? 'SUM' : /aver|mean/.test(verb) ? 'AVERAGE' : /count|how many/.test(verb) ? 'COUNT' : /max|high|larg/.test(verb) ? 'MAX' : 'MIN';
      var w = /\b(?:where|when|if|for which|only if|whenever)\b(.*)$/i.exec(rest);
      var head = w ? rest.slice(0, w.index) : rest;
      var target = new RegExp(C, 'i').exec(head), tr = target && rng(target[1]);
      if (w) {
        var conds = w[1].split(/\s+and\s+(?=(?:the\s+)?(?:column\s+[a-z]{1,2}\b|[a-z]{1,2}\d+\s*(?::|to)))/i).map(function (part) {
          var cm = new RegExp('^\\s*' + C + '\\s*(.*)$', 'i').exec(part);
          if (!cm) return null;
          var k = cond(cm[2]);
          return k && k.v ? { r: rng(cm[1]), c: k } : null;
        });
        if (conds.length && conds.every(Boolean)) {
          var pairs = conds.map(function (x) { return x.r + ', ' + critText(x.c); }).join(', ');
          if (kind === 'COUNT') return built('=COUNTIFS(' + pairs + ')', 'COUNTIFS counts the rows where ' + (conds.length > 1 ? 'every condition is' : 'the condition is') + ' met.', 'countifs');
          if (tr) {
            var name = { SUM: 'SUMIFS', AVERAGE: 'AVERAGEIFS', MAX: 'MAXIFS', MIN: 'MINIFS' }[kind];
            return built('=' + name + '(' + tr + ', ' + pairs + ')', 'The numbers come first, then each range with its condition. Whole columns are used so new rows are included.', kind === 'SUM' ? 'sumifs' : kind === 'AVERAGE' ? 'averageif' : 'maxifs', /MAX|MIN/.test(kind) ? name + ' needs Excel 2019 or later.' : '');
          }
        }
      } else if (kind === 'COUNT') {
        m = new RegExp('(?:times|often|cells?|how many)?\\s*["\']?([a-z0-9][\\w .-]*?)["\']?\\s+(?:appears?|shows? up|occurs?|is|are)\\s+(?:listed )?in\\s+' + C, 'i').exec(rest.replace(/^\s*(?:the\s+)?(?:number of\s+)?(?:times|often)?\s*(?:does|do|did|that)?\s*/i, ''));
        if (m && rng(m[2])) return built('=COUNTIF(' + rng(m[2]) + ', ' + lit(m[1]) + ')', 'COUNTIF counts the cells equal to your value. Upper and lower case count the same.', 'countifs');
        if (tr && /\b(unique|different|distinct)\b/i.test(rest)) return built('=COUNTA(UNIQUE(FILTER(' + tr + ', ' + tr + '<>"")))', 'FILTER drops the blanks, UNIQUE keeps one of each, and COUNTA counts them.', 'unique-count', 'Needs Microsoft 365 or Excel 2021.');
        if (tr) return built('=COUNTA(' + tr + ')', 'COUNTA counts every cell that is not empty. Use COUNT instead for numbers only. A header row counts as one.', 'countifs');
      } else if (tr && !/\b(second|third|2nd|3rd|top|bottom)\b/i.test(s)) {
        return built('=' + kind + '(' + tr.replace(/\$/g, '') + ')', 'Type it in a cell **outside** that range, or it will be a circular reference.', 'average');
      }
    }

    // IF sentences.
    m = new RegExp('\\bif\\s+' + cell + '\\s+(.+?)\\s*(?:,|\\bthen\\b|\\bshow\\b|\\bsay\\b|\\breturn\\b|\\bput\\b|\\bdisplay\\b)\\s*(.+?)(?:\\s*[,;]?\\s*\\b(?:otherwise|else|if not|or else)\\b\\s*,?\\s*(.+))?$', 'i').exec(s);
    if (m) {
      var k = cond(m[2]);
      if (k && k.v && m[3]) {
        var ref = m[1].toUpperCase(), test = k.op === '*' ? 'ISNUMBER(SEARCH("' + k.v + '", ' + ref + '))' : ref + k.op + lit(k.v.replace(/^\$(?=\d)/, '').replace(/(\d),(?=\d{3}\b)/g, '$1'));
        return built('=IF(' + test + ', ' + lit(m[3]) + ', ' + (m[4] ? lit(m[4]) : '""') + ')', 'Text goes in quotes and numbers do not.' + (m[4] ? '' : ' You did not say what to show otherwise, so it stays blank.'), 'if');
      }
    }

    // Lookups.
    m = new RegExp('\\b(?:look\\s*up|find|match)\\s+' + cell + '\\s+in\\s+(?:the\\s+)?column\\s+([a-z]{1,2})\\b(.*?)\\b(?:return|get|give me|bring back|pull)\\s+(?:the\\s+)?(?:value\\s+(?:from|in)\\s+)?column\\s+([a-z]{1,2})(.*)$', 'i').exec(s);
    if (m) {
      var sh = /\b(?:on|from|in)\s+(?:the\s+)?(?:sheet\s+(?:called\s+|named\s+)?["']?([\w ]+?)["']?|["']?([\w]+)["']?\s+(?:sheet|tab))\s*(?:,|and\b|$|\.)/i.exec(m[3] + ' ' + m[5]);
      var sn = sh ? (sh[1] || sh[2]) : '', pre = sn ? (/[^A-Za-z0-9_]/.test(sn) ? "'" + sn + "'!" : sn + '!') : '';
      return built('=XLOOKUP(' + m[1].toUpperCase() + ', ' + pre + col(m[2]) + ', ' + pre + col(m[4]) + ', "Not found")', 'It finds your value in column ' + m[2].toUpperCase() + ' and returns the same row from column ' + m[4].toUpperCase() + '.', 'xlookup', 'No XLOOKUP in your version? Use this:\n\n```excel\n=IFNA(INDEX(' + pre + col(m[4]) + ', MATCH(' + m[1].toUpperCase() + ', ' + pre + col(m[2]) + ', 0)), "Not found")\n```');
    }

    // Percent change.
    m = new RegExp('\\b(?:percent(?:age)?|%)\\s+(?:change|increase|decrease|growth|difference)\\b.*?' + cell + '\\s+(?:to|and|vs\\.?)\\s+' + cell, 'i').exec(s);
    if (m) return built('=(' + m[2].toUpperCase() + '-' + m[1].toUpperCase() + ')/' + m[1].toUpperCase(), 'New minus old, divided by old. Format it as a percentage with **Ctrl+Shift+%**.', 'percent-change');

    // Days between.
    m = new RegExp('\\b(days|weekdays|workdays|business days|months|years)\\b.*?\\b(?:between|from)\\s+' + cell + '\\s+(?:and|to)\\s+' + cell, 'i').exec(s);
    if (m) {
      var u = m[1].toLowerCase(), a = m[2].toUpperCase(), b = m[3].toUpperCase();
      if (/week|work|business/.test(u)) return built('=NETWORKDAYS(' + a + ', ' + b + ')', 'Counts Monday to Friday, including both the first and the last day.', 'date');
      if (u === 'days') return built('=' + b + '-' + a, 'Later date minus earlier date. Format the cell as **General** if it shows a date.', 'date');
      return built('=DATEDIF(' + a + ', ' + b + ', "' + (u === 'months' ? 'M' : 'Y') + '")', 'Whole ' + u + ' only. The earlier date must come first.', 'date');
    }

    // Join, round, names.
    m = new RegExp('\\b(?:combine|join|concatenate|merge|put together)\\s+' + cell + '\\s+(?:and|with)\\s+' + cell + '(.*)$', 'i').exec(s);
    if (m) { var sep = /comma/i.test(m[3]) ? ', ' : /dash|hyphen/i.test(m[3]) ? '-' : /no space|without/i.test(m[3]) ? '' : ' '; return built('=' + m[1].toUpperCase() + (sep ? '&"' + sep + '"&' : '&') + m[2].toUpperCase(), 'The part in quotes goes between them.', 'combine-text'); }
    m = new RegExp('\\bround\\s+' + cell + '\\s+(?:up |down )?to\\s+(?:the nearest\\s+)?(\\d+|one|two|three|whole)', 'i').exec(s);
    if (m) {
      var num = { one: 1, two: 2, three: 3, whole: 0 }[m[2].toLowerCase()]; if (num === undefined) num = +m[2];
      if (/nearest\s+\d/i.test(s)) return built('=MROUND(' + m[1].toUpperCase() + ', ' + num + ')', 'Rounds to the nearest multiple of ' + num + '.', 'round');
      return built('=ROUND' + (/round\s+\S+\s+up/i.test(s) ? 'UP' : /round\s+\S+\s+down/i.test(s) ? 'DOWN' : '') + '(' + m[1].toUpperCase() + ', ' + num + ')', 'The second number is how many decimals to keep.', 'round');
    }
    m = new RegExp('\\b(first|last)\\s+name\\b.*?\\b(?:from|in|of)\\s+' + cell, 'i').exec(s);
    if (m) {
      v = m[2].toUpperCase();
      return /first/i.test(m[1]) ? built('=LEFT(' + v + ', FIND(" ", ' + v + ')-1)', 'Takes everything before the first space. Works in every version.', 'split-text')
        : built('=TRIM(RIGHT(SUBSTITUTE(' + v + ', " ", REPT(" ", 100)), 100))', 'Takes everything after the last space. Works in every version.', 'split-text');
    }

    // Loan payment, with the answer worked out.
    m = /\$?\s*([\d,]+(?:\.\d+)?)\s*(k)?\b.*?\b(\d+(?:\.\d+)?)\s*(?:%|percent).*?\b(\d+)\s*[- ]?\s*(year|yr|month)/i.exec(s);
    if (m && /\b(loan|payment|mortgage|borrow|financ|car|pay)\w*/i.test(s)) {
      var P = +m[1].replace(/,/g, '') * (m[2] ? 1000 : 1), R = +m[3], months = /month/i.test(m[4 + 1]) ? +m[4] : +m[4] * 12, rr = R / 1200;
      if (P > 0 && months > 0) {
        var pay = rr ? P * rr / (1 - Math.pow(1 + rr, -months)) : P / months;
        var money = function (x) { return '$' + x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
        return built('=PMT(' + R + '%/12, ' + (/month/i.test(m[5]) ? months : m[4] + '*12') + ', -' + P + ')', 'That comes to **' + money(pay) + ' a month**, with about ' + money(pay * months - P) + ' of interest in total. The yearly rate is divided by 12, and the minus sign makes the answer positive.', 'loan');
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------
   * Quiz
   * --------------------------------------------------------------- */
  var QUIZ = [
    { q: 'You fill `=B2*E1` down to row 3. What does row 3 calculate?', o: ['B3*E1', 'B3*E2', 'B2*E1'], a: 1, w: 'Both references move down one row. To keep E1 fixed, write `$E$1`.', id: 'absolute-reference' },
    { q: 'What does `FALSE` do at the end of a VLOOKUP?', o: ['Hides errors', 'Requires an exact match', 'Sorts the table'], a: 1, w: 'Without it, Excel uses approximate match and can return a wrong answer with no error.', id: 'vlookup' },
    { q: 'Which error means a lookup did not find the value?', o: ['#N/A', '#REF!', '#VALUE!'], a: 0, w: '`#N/A` is "not available". `#REF!` is a deleted reference, and `#VALUE!` is the wrong type.', id: 'na-error' },
    { q: 'Sales went from 400 to 500. What is the percent change?', o: ['20%', '25%', '125%'], a: 1, w: '(500-400)/400 = 25%. Divide by the **old** value.', id: 'percent-change' },
    { q: 'In SUMIFS, which part comes first?', o: ['The condition', 'The range to check', 'The numbers to add'], a: 2, w: 'SUMIFS puts the numbers first. SUMIF puts them last.', id: 'sumifs' },
    { q: 'Your source data changed but the PivotTable did not. What do you do?', o: ['Refresh it', 'Rebuild it', 'Save and reopen'], a: 0, w: 'Right-click → Refresh. PivotTables do not update on their own.', id: 'pivot-refresh' },
    { q: 'Which chart suits monthly sales over three years?', o: ['Pie', 'Line', 'Scatter'], a: 1, w: 'A line shows change over time. A pie shows parts of one whole.', id: 'chart' },
    { q: 'A cell shows `#####`. What is wrong?', o: ['The formula has an error', 'The column is too narrow', 'The file is damaged'], a: 1, w: 'Double-click the column border to widen it.', id: 'hash-width' },
    { q: 'Which formula counts cells that contain the word West?', o: ['=COUNT(A:A, "West")', '=COUNTIF(A:A, "West")', '=COUNTA("West")'], a: 1, w: 'COUNTIF takes the range, then the condition.', id: 'countifs' },
    { q: 'To freeze row 1 **and** column A, which cell do you select first?', o: ['A1', 'B2', 'A2'], a: 1, w: 'Freeze Panes keeps everything above and to the left of the selected cell.', id: 'freeze' },
    { q: 'You format 2.349 to show 2 decimals. What is stored in the cell?', o: ['2.35', '2.34', '2.349'], a: 2, w: 'Formatting changes only what you see. Use ROUND to change the value.', id: 'round' },
    { q: 'What does `=IF(A2>=70, "Pass")` show when A2 is 60?', o: ['A blank', 'FALSE', 'An error'], a: 1, w: 'With no third part, IF returns FALSE when the test fails.', id: 'if' },
    { q: 'Which one tests that A2 is between 70 and 90?', o: ['=70<A2<90', '=AND(A2>70, A2<90)', '=BETWEEN(A2,70,90)'], a: 1, w: 'Excel needs two separate tests joined by AND.', id: 'and-or' },
    { q: 'What is the safest way to add the visible rows after filtering?', o: ['SUM', 'SUBTOTAL', 'COUNT'], a: 1, w: 'SUM still counts hidden rows. SUBTOTAL(109, …) skips them.', id: 'subtotal' }
  ];
  function quizAsk(st) {
    var z = st.quiz, item = QUIZ[z.order[z.i]];
    return { md: '**Question ' + (z.i + 1) + ' of ' + z.order.length + '**\n\n' + item.q, kind: 'quiz', chips: item.o.concat(['Stop quiz']), id: item.id };
  }
  function quizStart(st, rnd) {
    var idx = QUIZ.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor((rnd || Math.random)() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    st.quiz = { order: idx.slice(0, 5), i: 0, score: 0, missed: [] };
    var r = quizAsk(st);
    r.md = 'Five quick questions. Tap an answer.\n\n' + r.md;
    return r;
  }
  function quizAnswer(text, st) {
    var z = st.quiz, item = QUIZ[z.order[z.i]], t = text.trim().toLowerCase();
    if (/^(stop|quit|exit|end|cancel)\b/.test(t)) { st.quiz = null; return { md: 'Quiz stopped at ' + z.score + ' of ' + z.i + '. Ask me anything else about Excel.', kind: 'talk', chips: HOME }; }
    var pick = -1;
    item.o.forEach(function (o, i) { if (o.toLowerCase() === t) pick = i; });
    if (pick < 0 && /^[a-c]$/.test(t)) pick = t.charCodeAt(0) - 97;
    if (pick < 0 && /^[1-3]$/.test(t)) pick = +t - 1;
    if (pick < 0) return null;
    var ok = pick === item.a, out;
    if (ok) z.score++; else z.missed.push(item.id);
    out = (ok ? '**Correct.** ' : '**Not quite.** The answer is ' + item.o[item.a].replace(/^=.*$/, '`$&`') + '. ') + item.w;
    z.i++;
    if (z.i >= z.order.length) {
      var missed = z.missed.filter(function (x, i, arr) { return arr.indexOf(x) === i; });
      out += '\n\n**Score: ' + z.score + ' of ' + z.order.length + '.** ' + (z.score === z.order.length ? 'Perfect.' : 'Review the ones you missed below.');
      st.quiz = null;
      return { md: out, kind: 'talk', chips: missed.slice(0, 3).map(label).concat(['Quiz me again']) };
    }
    var next = quizAsk(st);
    next.md = out + '\n\n' + next.md;
    return next;
  }

  /* ------------------------------------------------------------------
   * Conversation
   * --------------------------------------------------------------- */
  var HOME = ['Check my formula', 'Write a formula for me', 'How does VLOOKUP work?', 'Make a PivotTable', 'Why do I get #N/A?', 'Quiz me'];
  function label(id) { return BY[id] ? BY[id].title : id; }
  function chipsFor(t) {
    var c = [];
    if (t.ex) c.push('Show an example');
    if (t.fix) c.push('It is not working');
    if (t.mac) c.push('On a Mac?');
    return c.concat((t.next || []).slice(0, 3).map(label));
  }
  function topicReply(t, st) { st.last = t.id; return { md: t.body, kind: 'topic', id: t.id, title: t.title, chips: chipsFor(t) }; }
  function funcReply(name, st) {
    var f = FUNCS[name];
    st.last = null; st.func = name;
    return { md: '**' + name + ':** ' + f.d + '.\n\n```excel\n=' + f.s + '\n```' + (f.s.indexOf('[') > -1 ? '\n\nParts in square brackets are optional.' : '') + (f.v ? '\n\nNeeds ' + (f.v === '365' ? 'Microsoft 365' : 'Excel ' + f.v + ' or Microsoft 365') + '.' : ''), kind: 'function', id: name, chips: ['Check my formula', 'Write a formula for me', 'Explain the error codes'] };
  }
  var MULTI = { vlookup: 'lookup-two-criteria', xlookup: 'lookup-two-criteria', 'index-match': 'lookup-two-criteria', 'other-sheet': 'lookup-two-criteria', if: 'and-or' };

  function followUp(text, st) {
    var t = BY[st.last], s = text.trim().toLowerCase().replace(/[?.!]+$/, '');
    if (s.length > 60) return null;
    if (/^(explain( it| that| this)?|what does (it|that) (do|mean)|in plain english|break it down)$/.test(s) && st.formula) {
      return { md: '**In plain English:** ' + cap(say(st.formula.replace(/^=/, ''))) + '.', kind: 'topic', id: st.last, chips: t ? chipsFor(t) : HOME };
    }
    if (!t) return null;
    if (/^(show (me )?)?(an?|another|one more|more)?\s*examples?( please)?$|^(can you )?(show|give) me an(other)? example|^for example$|^like what$/.test(s)) {
      return t.ex ? { md: t.ex, kind: 'topic', id: t.id, title: t.title, chips: chipsFor(t).filter(function (c) { return c !== 'Show an example'; }) } : topicReply(t, st);
    }
    if (/^(it|that|this|mine)?\s*('s| is|s)? ?(still )?(not|isn'?t|doesn'?t|does not|didn'?t) ?(work|working|right)?\b|^(that )?(didn'?t|doesn'?t|did not|does not) work|^what if it (fails|does ?n.t work)|^(i )?(still )?get(ting)? (an )?error$|^why not$|^still (wrong|broken)/.test(s) && s.length < 40) {
      if (t.fix) return { md: '**If ' + t.title + ' is not working**\n\n' + t.fix, kind: 'topic', id: t.id, chips: ['Check my formula', 'Explain the error codes'].concat((t.next || []).slice(0, 2).map(label)) };
      return { md: 'Paste the exact formula, starting with `=`, and tell me the error it shows. I will check it.', kind: 'talk', chips: ['Explain the error codes'].concat((t.next || []).slice(0, 2).map(label)) };
    }
    if (/\b(mac|macbook|macos|cmd|command key)\b/.test(s) && tokens(s).filter(function (k) { return k !== 'mac' && VOCAB[k]; }).length === 0) {
      if (t.mac) return { md: t.mac, kind: 'topic', id: t.id, chips: chipsFor(t).filter(function (c) { return c !== 'On a Mac?'; }) };
      return { md: 'The formulas are identical on a Mac. Most shortcuts swap **Ctrl** for **Cmd**, and the menus have the same names.', kind: 'topic', id: t.id, chips: ['Keyboard shortcuts'].concat((t.next || []).slice(0, 2).map(label)) };
    }
    if (/\bgoogle sheets?\b/.test(s)) return { md: 'Most of this is the same in Google Sheets. FILTER, UNIQUE and SORT work with slightly different options, and `Ctrl+T` Tables and Power Query do not carry over. I am built for Excel, so test it there.', kind: 'topic', id: t.id, chips: chipsFor(t) };
    if (/\b(two|multiple|several|more than one|2|many) (conditions?|criteria|tests?|values?)\b/.test(s) && MULTI[t.id]) return topicReply(BY[MULTI[t.id]], st);
    if (/^(why|how come)$/.test(s)) return t.fix ? { md: t.fix, kind: 'topic', id: t.id, chips: chipsFor(t) } : null;
    if (/^(more|tell me more|go on|continue|and|what else|keep going)$/.test(s)) {
      if (t.ex && !st.sawEx) { st.sawEx = t.id; return { md: t.ex, kind: 'topic', id: t.id, chips: chipsFor(t) }; }
      var n = BY[(t.next || [])[0]]; return n ? topicReply(n, st) : null;
    }
    return null;
  }

  function talk(text) {
    var s = text.trim().toLowerCase().replace(/[?.!,]+$/, '');
    if (/^(hi+|hey+|hello+|yo|sup|howdy|good (morning|afternoon|evening)|what'?s up|hiya)( there| excel helper| bot)?$/.test(s)) return { md: 'Hi. Ask an Excel question, paste a formula to check, or describe what you want and I will write it.', chips: HOME };
    if (/^(thanks|thank you|thx|ty|cheers|appreciate it|perfect|great|awesome|nice|cool|got it|ok|okay|that worked|it worked|that helps)\b.{0,24}$/.test(s)) return { md: 'Glad it helped. What is next?', chips: ['Check my formula', 'Write a formula for me', 'Quiz me'] };
    if (/^(bye|goodbye|see ya|see you|later)\b/.test(s)) return { md: 'See you. Press Ctrl+S on the way out.', chips: HOME };
    if (/\b(who|what) are you\b|\bare you (a |an )?(real|human|bot|ai|gpt|chatgpt|robot)\b|\bwho (made|built|created) you\b|\bhow do you work\b|\bare you (using )?(chat)?gpt\b/.test(s)) return { md: 'I am **Excel Helper**, built by Roman Heuser for this site. I answer from a written Excel knowledge base and I check formulas with real rules, all inside this page. I am not a live language model, so I will not make up a function. If I do not know, I say so.', chips: HOME };
    if (/^(help|menu|what can you do|what do you (do|know)|what can i ask( you)?|how does this work|start|options|topics)$/.test(s)) return { md: 'Four things:\n\n1. **Answer** questions on ' + TOPICS.length + ' Excel topics.\n2. **Check a formula.** Paste it, starting with `=`.\n3. **Write a formula.** Say something like "add column C where column A is West".\n4. **Quiz you** with five quick questions.', chips: HOME };
    if (/^(please )?(check|fix|debug|review|look at) (my|a|another|this|the) formula$|^check another( formula)?$/.test(s)) return { md: 'Paste the formula, starting with `=`. For example:\n\n```excel\n=VLOOKUP(A2,D2:F50,3)\n```', chips: ['=VLOOKUP(A2,D2:F50,3)', '=IF(A2>=70,Pass,Fail)', '=SUMIF(A2:A50,>100,C2:C40)'] };
    if (/^(please )?(write|make|build|create) (me )?(a|another) formula( for me)?$/.test(s)) return { md: 'Describe it in a sentence, with your columns. For example:\n\n- Add column C where column A is West and column B is over 1000\n- If B2 is at least 70 show Pass, otherwise Fail\n- Look up A2 in column D and return column F\n- Payment on $20,000 at 6% for 5 years', chips: ['Add column C where column A is West', 'If B2 is at least 70 show Pass, otherwise Fail', 'Payment on $20,000 at 6% for 5 years'] };
    if (/\b(quiz|test) me\b|^(quiz|practice|start quiz|quiz me again|another quiz)$|\bpractice questions?\b/.test(s)) return { quiz: 1 };
    if (/\b(do|finish|complete|solve) (my|this|the) (homework|assignment|lab|exam|quiz|project|test|midterm|final)\b|\bgive me the answers?\b/.test(s)) return { md: 'I will not do graded work for you, but I can get you through it. Tell me the step you are stuck on, or paste the formula you have so far and I will show you what is wrong.', chips: ['Check my formula', 'Write a formula for me', 'Quiz me'] };
    return null;
  }

  var HINT = /\b(excel|formula|function|cell|column|row|sheet|workbook|worksheet|spreadsheet|data|table|chart|graph|pivot|cursor|ribbon|csv|xlsx|number|percent|average|sum|count|total|date|text)s?\b/i;
  function exactFunc(text) {
    var s = straighten(text), m;
    var bare = s.trim().replace(/[?.!]+$/, '');
    if (/^=?[A-Za-z][A-Za-z0-9.]*(\(\))?$/.test(bare)) { var b = bare.replace(/[=()]/g, '').toUpperCase(); if (FUNCS[b]) return b; }
    if ((m = /\b([A-Za-z][A-Za-z0-9.]{1,})\s+(?:function|formula)\b/i.exec(s)) && FUNCS[m[1].toUpperCase()]) return m[1].toUpperCase();
    if ((m = /\b(?:what (?:does|is)|explain|how (?:do|does|to)(?: (?:i|you))?(?: use)?|use|using)\s+(?:the\s+)?=?([A-Za-z][A-Za-z0-9.]{1,})\b(?:\s+(?:do|mean|work|function|formula))?\s*\??$/i.exec(s)) && FUNCS[m[1].toUpperCase()]) return m[1].toUpperCase();
    var caps = s.match(/\b[A-Z][A-Z0-9.]{2,}\b/g) || [];
    if (s !== s.toUpperCase()) for (var i = 0; i < caps.length; i++) if (FUNCS[caps[i]]) return caps[i];
    return null;
  }

  function reply(text, st) {
    st = st || {};
    text = String(text || '').slice(0, 2000).trim();
    if (!text) return { md: 'Type a question, or paste a formula that starts with `=`.', kind: 'talk', chips: HOME };
    var r;

    if (st.quiz) { r = quizAnswer(text, st); if (r) return r; }

    var ex = extract(text);
    if (ex) {
      st.quiz = null;
      r = doctor(ex);
      st.formula = r.fixed; if (r.id) st.last = r.id;
      return r;
    }

    r = talk(text);
    if (r) {
      if (r.quiz) return quizStart(st);
      r.kind = 'talk';
      return r;
    }
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].title.toLowerCase() === text.toLowerCase()) return topicReply(TOPICS[i], st);

    r = followUp(text, st);
    if (r) return r;

    r = write(text);
    if (r) { st.quiz = null; st.formula = r.fixed; st.last = r.id; return r; }

    // An error code anywhere in the message wins.
    var err = /#(n\/a|value|ref|name|div\/0|spill|num|calc|null)/i.exec(text);
    if (err) {
      var eid = { 'n/a': 'na-error', value: 'value-error', ref: 'ref-error', name: 'name-error', 'div/0': 'div0-error', spill: 'spill-error', num: 'num-error', calc: 'num-error', 'null': 'num-error' }[err[1].toLowerCase()];
      return topicReply(BY[eid], st);
    }
    if (/#{3,}/.test(text)) return topicReply(BY['hash-width'], st);
    if (/^(please )?(explain|list|what are) (the )?(excel )?error (codes|messages)$/i.test(text.replace(/[?.!]+$/, ''))) return topicReply(BY.errors, st);

    var found = search(text), top = found.top[0], fn = exactFunc(text);
    if (fn) {
      var covered = found.top.slice(0, 3).filter(function (x) { return x.t.keys.indexOf(fn.toLowerCase()) > -1; })[0];
      if (covered) return topicReply(covered.t, st);
      return funcReply(fn, st);
    }
    var strong = top && (top.bonus >= 7 && top.cover >= 0.3 || top.s >= 9 && top.cover >= 0.5 || top.ask >= 0.75);
    if (strong) {
      r = topicReply(top.t, st);
      var second = found.top[1];
      if (second && second.s > top.s * 0.86 && r.chips.indexOf(second.t.title) < 0) r.chips.splice(Math.min(2, r.chips.length), 0, second.t.title);
      return r;
    }
    var plain = words(text).some(function (w) { return PLAIN[w] && !VOCAB[w] && !STOP[w] && !/^(name|names|time|times|today|year|write|read|think|less|more|other|another|same|better|never|always|please|sorry|great|nice|city|state|house|person|people|number|email|phone|math|letter|money|water)$/.test(w); });
    var near3 = plain && !HINT.test(text) ? [] : found.top.filter(function (x) { return x.s >= 4 && x.cover >= 0.2; }).slice(0, 3);
    if (near3.length && (top.cover >= 0.34 || HINT.test(text))) {
      return { md: 'I am not certain which one you mean. Is it one of these? If not, try naming the function or the menu you are using.', kind: 'unsure', chips: near3.map(function (x) { return x.t.title; }).concat(['Check my formula']) };
    }
    if (HINT.test(text)) return { md: 'I do not have a reliable answer for that, and I would rather say so than guess. Try naming the function or the menu, or paste the formula you have.', kind: 'miss', chips: ['Check my formula', 'Write a formula for me', 'Explain the error codes'] };
    return { md: 'I only answer Microsoft Excel questions. Ask me about a formula, a PivotTable, a chart, or an error you are stuck on.', kind: 'off', chips: HOME };
  }

  /* ------------------------------------------------------------------
   * Rendering. Everything is escaped before any markup is added.
   * --------------------------------------------------------------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function inline(s) {
    var keep = [];
    s = s.replace(/`([^`\n]+)`/g, function (_, c) { keep.push('<code>' + esc(c) + '</code>'); return '\u0001' + (keep.length - 1) + '\u0002'; });
    s = esc(s)
      .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\*\*([^*\n]+?)\*\*/g, '<b>$1</b>')
      .replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,:;!?]|$)/g, '$1<em>$2</em>');
    return s.replace(/\u0001(\d+)\u0002/g, function (_, i) { return keep[+i]; });
  }
  function render(md) {
    var out = [], lines = String(md).replace(/\r/g, '').replace(/[\u0001\u0002]/g, '').split('\n'), i = 0, para = [], list = null;
    function flush() { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } }
    function endList() { if (list) { out.push('<' + list.tag + (list.start > 1 ? ' start="' + list.start + '"' : '') + '>' + list.items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + list.tag + '>'); list = null; } }
    while (i < lines.length) {
      var l = lines[i], m;
      if ((m = /^\s*```\s*(\w*)\s*$/.exec(l))) {
        flush(); endList();
        var code = []; i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) code.push(lines[i++]);
        i++;
        out.push('<div class="xb-code"><pre><code>' + esc(code.join('\n').replace(/^\n+|\n+$/g, '')) + '</code></pre><button type="button" class="xb-copy">Copy</button></div>');
        continue;
      }
      if ((m = /^\s*#{1,6}\s+(.*)$/.exec(l))) { flush(); endList(); out.push('<p><b>' + inline(m[1].replace(/\*\*/g, '')) + '</b></p>'); i++; continue; }
      if ((m = /^\s*(?:[-*•])\s+(.*)$/.exec(l))) { flush(); if (!list || list.tag !== 'ul') { endList(); list = { tag: 'ul', items: [], start: 1 }; } list.items.push(m[1]); i++; continue; }
      if ((m = /^\s*(\d+)[.)]\s+(.*)$/.exec(l))) { flush(); if (!list || list.tag !== 'ol') { endList(); list = { tag: 'ol', items: [], start: +m[1] }; } list.items.push(m[2]); i++; continue; }
      if (/^\s*$/.test(l)) { flush(); if (!/^\s*(?:[-*•]|\d+[.)])\s+/.test(lines[i + 1] || '')) endList(); i++; continue; }
      if (list && /^\s{2,}\S/.test(l)) { list.items[list.items.length - 1] += ' ' + l.trim(); i++; continue; }
      endList(); para.push(l); i++;
    }
    flush(); endList();
    return out.join('');
  }

  /* Copy buttons, shared by every front end. */
  function wireCopy(root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.xb-copy') : null;
      if (!b) return;
      var text = b.parentNode.querySelector('code').textContent;
      function done(ok) { b.textContent = ok ? 'Copied' : 'Press Ctrl+C'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); }
      function select() {
        var r = document.createRange(), s = window.getSelection();
        r.selectNodeContents(b.parentNode.querySelector('code')); s.removeAllRanges(); s.addRange(r);
        try { done(document.execCommand('copy')); } catch (err) { done(false); }
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, select);
      else select();
    });
  }

  /* ------------------------------------------------------------------
   * Asking. Uses the site's live model when one is switched on, and falls
   * back to the built-in answer whenever it is off, busy or unreachable.
   * --------------------------------------------------------------- */
  function ask(text, st, cfg) {
    var local = reply(text, st);
    var small = local.kind === 'talk' || local.kind === 'quiz' || st.quiz;
    st.history = st.history || [];
    function keep(r) { st.history.push({ role: 'user', text: text }, { role: 'assistant', text: r.md }); st.history = st.history.slice(-6); return r; }
    if (small || !cfg || !Number(cfg.live) || typeof fetch !== 'function') return Promise.resolve(keep(local));

    var stop = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (stop) stop.abort(); }, 45000);
    function post(withNonce) {
      var h = { 'Content-Type': 'application/json' };
      if (withNonce && cfg.nonce) h['X-WP-Nonce'] = cfg.nonce;
      return fetch(cfg.endpoint, { method: 'POST', credentials: withNonce ? 'same-origin' : 'omit', headers: h, signal: stop ? stop.signal : undefined, body: JSON.stringify({ message: text, history: st.history }) })
        .then(function (r) {
          // A cached page carries an expired nonce. The route is public, so try once without it.
          if (r.status === 403 && withNonce) return post(false);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        });
    }
    return post(true).then(function (d) {
      if (d && d.reply) return { md: d.reply, kind: 'live', id: local.id, chips: local.kind === 'off' || local.kind === 'miss' ? HOME : (local.chips || []).filter(function (c) { return c !== 'Explain it'; }) };
      local.note = d && d.error === 'rate_limited' ? 'Live answers have hit their limit for now, so this one is built in.' : 'The live model is unavailable, so this answer is built in.';
      if (d && d.detail) local.note += ' (Only you can see this: ' + d.detail + ')';
      return local;
    }, function () {
      local.note = 'The live model is unavailable, so this answer is built in.';
      return local;
    }).then(function (r) { clearTimeout(timer); return keep(r); });
  }

  /* ------------------------------------------------------------------
   * Chat controller shared by the inline panel and the floating launcher.
   * o = { root, log, chips, form, input, send, reset, cls, greeting, cfg }
   * --------------------------------------------------------------- */
  function mount(o) {
    var st = {}, busy = false, turn = 0, sent = [], at = 0, touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    function push(html, who, note) {
      var d = document.createElement('div');
      d.className = o.cls + '__msg ' + o.cls + '__msg--' + who;
      d.innerHTML = html;
      if (note) { var n = document.createElement('p'); n.className = 'xb-note'; n.textContent = note; d.appendChild(n); }
      o.log.appendChild(d);
      // Long answers start at the question, not at their last line.
      var top = who === 'bot' && d.previousElementSibling ? d.previousElementSibling : d;
      if (who === 'bot') o.log.scrollTop += top.getBoundingClientRect().top - o.log.getBoundingClientRect().top - 12;
      else o.log.scrollTop = o.log.scrollHeight;
      return d;
    }
    function chips(list) {
      o.chips.innerHTML = '';
      (list || HOME).filter(function (c, i, a) { return a.indexOf(c) === i; }).slice(0, 6).forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = o.cls + '__chip'; b.textContent = c;
        b.addEventListener('click', function () { go(c, true); });
        o.chips.appendChild(b);
      });
      o.chips.scrollLeft = 0;
    }
    function grow() { o.input.style.height = 'auto'; o.input.style.height = Math.min(o.input.scrollHeight, 132) + 'px'; }
    function go(text, fromChip) {
      text = String(text).trim();
      if (!text || busy) return;
      busy = true; o.send.disabled = true;
      var mine = ++turn;
      push(esc(text).replace(/\n/g, '<br>'), 'me');
      if (sent[sent.length - 1] !== text) sent.push(text);
      at = sent.length;
      o.input.value = ''; grow();
      var t = document.createElement('div');
      t.className = o.cls + '__typing'; t.innerHTML = '<i></i><i></i><i></i>';
      t.setAttribute('aria-hidden', 'true');
      o.log.appendChild(t); o.log.scrollTop = o.log.scrollHeight;
      var wait = new Promise(function (r) { setTimeout(r, 260); });
      Promise.all([ask(text, st, o.cfg), wait]).then(function (a) { return a[0]; }, function () {
        return { md: 'Something went wrong on this page. Please try that again.', chips: HOME };
      }).then(function (r) {
        t.remove();
        if (mine !== turn) return;
        push(render(r.md), 'bot', r.note);
        chips(r.chips);
        busy = false; o.send.disabled = false;
        if (!(touch && fromChip)) o.input.focus({ preventScroll: true });
      });
    }
    function reset() {
      turn++; st = {}; busy = false; o.send.disabled = false;
      o.log.innerHTML = '';
      push(render(o.greeting), 'bot');
      chips(HOME);
    }
    o.form.addEventListener('submit', function (e) { e.preventDefault(); go(o.input.value); });
    o.input.addEventListener('input', grow);
    o.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); go(o.input.value); }
      else if (e.key === 'ArrowUp' && (o.input.value === '' || o.input.value === sent[at]) && at > 0) { e.preventDefault(); o.input.value = sent[--at]; grow(); }
      else if (e.key === 'ArrowDown' && at < sent.length && o.input.value === sent[at]) { e.preventDefault(); o.input.value = sent[++at] || ''; grow(); }
    });
    if (o.reset) o.reset.addEventListener('click', function () { reset(); o.input.focus({ preventScroll: true }); });
    wireCopy(o.log);
    reset();
    return { ask: go, reset: reset };
  }

  /* OpenAI retires custom GPT pages on this date; links are hidden after it. */
  var GPT_RETIRES = '2026-12-11';
  function gptLive(url, until) { return /^https?:\/\//.test(url || '') && new Date().toISOString().slice(0, 10) < (until || GPT_RETIRES); }

  return { reply: reply, render: render, ask: ask, mount: mount, gptLive: gptLive, wireCopy: wireCopy, home: HOME, topics: TOPICS, funcs: FUNCS, quiz: QUIZ, _check: check, _extract: extract, _search: search };
}());
if (typeof module !== 'undefined' && module.exports) module.exports = ExcelBrain;
