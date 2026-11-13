/* ============================================================
   ZPC PORTFOLIO / V2 — "黑场档案"
   数据：../assets/js/data.js（与 V1 同一份内容源）
   ============================================================ */
(function () {
  'use strict';

  var S = window.SITE || {};
  var IMG = '';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SHOT = /(?:^|[?&])shot=1/.test(location.search);
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var img = function (src) { return src ? IMG + src : ''; };
  function num(v) {
    return String(v).replace(/^\s*([\d.,]+)\s*(.*)$/, '$1').replace(/,/g, '') || '0';
  }
  function unit(v) {
    var m = String(v).match(/^\s*([\d.,]+)\s*(.*)$/);
    return m ? m[2] : '';
  }

  /* ---------- 1. 顶栏 ---------- */
  function initNav() {
    var nav = $('#nav'), links = $$('#nav-links a');
    var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var burger = $('#burger'), menu = $('#nav-links');

    function onScroll() {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('is-solid', y > 40);
      var pos = y + window.innerHeight * 0.35, cur = -1;
      secs.forEach(function (s, i) { if (s && s.offsetTop <= pos) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('a', menu).forEach(function (a) {
        a.addEventListener('click', function () {
          menu.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
        });
      });
    }
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var el = document.getElementById(id.slice(1));
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- 2. 首屏数据 ---------- */
  function renderHeroStats() {
    var host = $('#hero-stats');
    if (!host) return;
    var pick = (S.numbers || []).slice(0, 4);
    host.innerHTML = pick.map(function (n) {
      return '<div class="stat"><b><span class="js-count" data-to="' + esc(num(n.value)) + '">0</span>' +
        (unit(n.value) ? '<i>' + esc(unit(n.value)) + '</i>' : '') + '</b>' +
        '<span>' + esc(n.label) + '</span></div>';
    }).join('');
  }

  /* ---------- 3. marquee ---------- */
  function renderMarquee() {
    var host = $('#marquee');
    if (!host) return;
    var words = ['Portfolio 2026', '71 Devices', 'Hardware R&D', 'Embedded', 'CAD / 3D', 'Documentation', 'Curriculum', 'Beijing'];
    var half = words.map(function (w, i) {
      return '<span>' + esc(w) + (i < words.length - 1 ? ' <b>✳</b>' : '') + '</span>';
    }).join('');
    host.innerHTML = half + half;
  }

  /* ---------- 4. 关于 ---------- */
  function renderFacts() {
    var host = $('#facts');
    var list = S.strengths || [];
    if (!host || !list.length) { if (host) host.remove(); return; }
    host.innerHTML = list.map(function (s, i) {
      return '<div><b>' + pad(i + 1) + '</b><h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p></div>';
    }).join('');
  }

  /* ---------- 5. 数字带 ---------- */
  function renderNumbers() {
    var host = $('#numbers');
    if (!host) return;
    var items = [
      { v: '1,450', u: '条', l: '原创选题' },
      { v: '820', u: '个', l: '课题方案' },
      { v: '18', u: '台', l: '单月峰值' },
      { v: '33', u: '项', l: '整机交付' }
    ];
    host.innerHTML = items.map(function (it) {
      return '<div class="num"><b>' + it.v + '<i style="font-style:normal;font-size:.42em;color:rgba(10,10,10,.55)">' + it.u + '</i></b>' +
        '<span>' + it.l + '</span></div>';
    }).join('');
  }

  /* ---------- 6. 精选作品 ---------- */
  var CASE_INDEX = {};

  function renderWork() {
    var track = $('#work-track');
    var cases = S.cases || [];
    if (!track) return;
    if (!cases.length) { track.innerHTML = '<p style="color:#8d897f">案例数据尚未生成</p>'; return; }

    track.innerHTML = cases.map(function (c, i) {
      CASE_INDEX[c.id] = c;
      var idx = pad(i + 1);
      var cover = (c.images || [])[0];
      var media;
      if (cover) {
        media = '<img src="' + esc(img(cover.file)) + '" alt="' + esc(cover.caption || c.title) + '" decoding="async">';
      } else {
        media = '<div class="wcard__plate">' +
            '<div class="pl"><span>TECH FILE</span><span>NO.' + idx + '</span></div>' +
            '<ul>' + (c.stack || []).slice(0, 6).map(function (s, k) {
              return '<li><b>' + pad(k + 1) + '</b>' + esc(s) + '</li>';
            }).join('') + '</ul>' +
            '<div class="pl"><span>' + esc(c.category || '') + '</span><span>' + esc(c.year || '') + '</span></div>' +
          '</div>';
      }
      var metrics = (c.metrics || []).slice(0, 2).map(function (m) {
        return '<div><b>' + esc(m.value) + '</b><span>' + esc(m.label) + '</span></div>';
      }).join('');

      return '<article class="wcard" data-id="' + esc(c.id) + '">' +
        '<div class="wcard__media">' + media + '</div>' +
        '<div class="wcard__body">' +
          '<span class="wcard__no">' + idx + '</span>' +
          '<span class="wcard__cat">' + esc(c.category || '') + ' · ' + esc(c.year || '') + '</span>' +
          '<h3 class="wcard__title">' + esc(c.title) + '</h3>' +
          '<p class="wcard__tag">' + esc(c.tagline) + '</p>' +
          '<p class="wcard__sum">' + esc(c.summary) + '</p>' +
          '<div class="wcard__meta">' + metrics + '</div>' +
          '<span class="wcard__open">OPEN FILE <i>↗</i></span>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function initWorkScroll() {
    var section = $('#work');
    var viewport = section ? $('.work__viewport', section) : null;
    var track = $('#work-track');
    var count = $('#work-count');
    var bar = $('#work-bar');
    if (!section || !track || !viewport) return;

    var extra = 0, pinned = false, total = (S.cases || []).length || 12;

    function layout() {
      pinned = window.innerWidth > 900;
      section.style.height = '';
      if (!pinned) { viewport.scrollLeft = 0; return; }
      extra = Math.max(0, track.scrollWidth - viewport.clientWidth);
      section.style.height = (window.innerHeight + extra) + 'px';
    }
    function update() {
      if (!pinned) return;
      var rect = section.getBoundingClientRect();
      var scrollable = section.offsetHeight - window.innerHeight;
      var p = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
      viewport.scrollLeft = p * extra;
      if (count) count.textContent = pad(clamp(Math.round(p * (total - 1)) + 1, 1, total));
      if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    }
    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t); t = setTimeout(function () { layout(); update(); }, 120);
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('load', function () { layout(); update(); });
    layout(); update();
    setTimeout(function () { layout(); update(); }, 400);
  }

  /* ---------- 7. 项目全景 ---------- */
  var ARC = { items: [], cat: 'all', q: '', active: null };
  var STATUS = { '●': '整机 + 成套材料', '◐': '样机 / 材料不全', '○': '仅代码或 CAD', '△': '创意阶段' };

  function renderArchive() {
    var grid = $('#archive-grid');
    var chips = $('#archive-chips');
    var cat = S.catalog || {};
    var items = cat.items || [];
    if (!grid) return;
    ARC.items = items;

    var tot = $('#archive-total');
    if (tot) tot.textContent = items.length + ' ENTRIES';

    if (chips) {
      chips.innerHTML = '<button class="is-on" data-cat="all">全部 <b>' + items.length + '</b></button>' +
        (cat.categories || []).map(function (c) {
          return '<button data-cat="' + esc(c.name) + '">' + esc(c.name) + ' <b>' + c.count + '</b></button>';
        }).join('');
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        ARC.cat = b.getAttribute('data-cat');
        $$('button', chips).forEach(function (x) { x.classList.toggle('is-on', x === b); });
        paint();
      });
    }

    grid.innerHTML = items.map(function (it, i) {
      return '<button class="item" data-i="' + i + '" data-cat="' + esc(it.category || '') + '">' +
        '<span class="item__no">' + pad(i + 1) + '</span>' +
        '<span class="item__t">' + esc(it.title) + '</span>' +
        '<span class="item__c">' + esc(it.category || '') + '</span>' +
      '</button>';
    }).join('');

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.item');
      if (!b) return;
      select(+b.getAttribute('data-i'));
    });

    var search = $('#archive-search');
    if (search) {
      var tid = null;
      search.addEventListener('input', function () {
        clearTimeout(tid);
        tid = setTimeout(function () { ARC.q = search.value.trim().toLowerCase(); paint(); }, 140);
      });
    }

    paint();
    select(0);
  }

  function paint() {
    var grid = $('#archive-grid');
    if (!grid) return;
    var shown = 0, first = -1;
    $$('.item', grid).forEach(function (el) {
      var i = +el.getAttribute('data-i');
      var it = ARC.items[i];
      var okCat = ARC.cat === 'all' || it.category === ARC.cat;
      var hay = (it.title + ' ' + (it.tagline || '') + ' ' + (it.stack || '') + ' ' + (it.category || '')).toLowerCase();
      var okQ = !ARC.q || hay.indexOf(ARC.q) > -1;
      var ok = okCat && okQ;
      el.style.display = ok ? '' : 'none';
      if (ok) { shown++; if (first < 0) first = i; }
    });

    var empty = $('#archive-empty');
    if (!shown) {
      if (!empty) {
        empty = document.createElement('p');
        empty.id = 'archive-empty';
        empty.className = 'archive__empty';
        empty.textContent = '没有匹配的项目 — 换个关键词，或点「全部」。';
        grid.appendChild(empty);
      }
    } else if (empty) { empty.remove(); }

    var st = $('#archive-status');
    if (st) st.textContent = shown === ARC.items.length
      ? '全部 ' + shown + ' 项 · 点击任意一行，右侧读取要点'
      : '筛选 ' + shown + ' / ' + ARC.items.length + ' 项';

    if (first >= 0 && (ARC.active == null || ARC.items[ARC.active].category !== (ARC.cat === 'all' ? ARC.items[ARC.active].category : ARC.cat) || ARC.q)) {
      select(first);
    }
  }

  function select(i) {
    var it = ARC.items[i];
    if (!it) return;
    ARC.active = i;
    $$('.item').forEach(function (el) {
      el.classList.toggle('is-on', +el.getAttribute('data-i') === i);
    });
    var no = $('#readout-no'), title = $('#readout-title'), catEl = $('#readout-cat'),
        tag = $('#readout-tag'), dl = $('#readout-dl'), statusEl = $('#readout-status');
    if (no) no.textContent = pad(i + 1);
    if (title) title.textContent = it.title;
    if (catEl) catEl.textContent = it.category || '';
    if (tag) tag.textContent = it.tagline || '';
    if (dl) {
      dl.innerHTML =
        '<div><dt>技术栈</dt><dd>' + esc(it.stack || '—') + '</dd></div>' +
        (it.scale ? '<div><dt>规模</dt><dd>' + esc(it.scale) + '</dd></div>' : '') +
        '<div><dt>年份</dt><dd>' + esc(it.year || '—') + '</dd></div>';
    }
    if (statusEl) statusEl.textContent = (STATUS[it.status] || it.status || '') + ' / ' + (it.year || '');
  }

  /* ---------- 7.5 装置图录 ---------- */
  var LB = { items: [], i: 0 };
  var lb, lbImg, lbNo, lbCap, lastLBFocus;

  function renderPlates() {
    var host = $('#plates-grid');
    var items = S.gallery || [];
    LB.items = items;
    if (!host) return;
    var tot = $('#plates-total');
    if (tot) tot.textContent = items.length + ' PLATES';

    host.innerHTML = items.map(function (it, i) {
      return '<button class="plate" data-i="' + i + '" aria-label="查看大图：' + esc(it.caption || '') + '">' +
        '<span class="plate__img"><img src="' + esc(img(it.file)) + '" width="' + it.w + '" height="' + it.h +
          '" alt="' + esc(it.caption || '') + '"></span>' +
        '<span class="plate__cap"><span class="plate__no">' + pad(i + 1) + '</span>' +
          '<em>' + esc(it.caption || '') + '</em></span>' +
      '</button>';
    }).join('');

    host.addEventListener('click', function (e) {
      var b = e.target.closest('.plate');
      if (b) openLB(+b.getAttribute('data-i'));
    });

    layoutPlates();
  }

  function layoutPlates() {
    var grid = $('#plates-grid');
    if (!grid) return;
    var items = $$('.plate', grid);
    if (!items.length) return;
    var cs = getComputedStyle(grid);
    var rowH = parseFloat(cs.gridAutoRows) || 8;
    var rowGap = parseFloat(cs.rowGap) || 8;
    var unit = rowH + rowGap;
    items.forEach(function (el) {
      var h = el.offsetHeight;
      el.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((h + rowGap) / unit));
    });
  }

  function openLB(i) {
    if (!lb) return;
    LB.i = i;
    updateLB();
    lastLBFocus = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('lightbox-open');
    var close = $('.lightbox__close', lb);
    if (close) close.focus();
  }

  function updateLB() {
    var it = LB.items[LB.i];
    if (!it) return;
    if (lbImg) { lbImg.src = img(it.file); lbImg.alt = it.caption || ''; }
    if (lbNo) lbNo.textContent = pad(LB.i + 1);
    if (lbCap) lbCap.textContent = it.caption || '';
  }

  function stepLB(d) {
    if (!LB.items.length) return;
    LB.i = (LB.i + d + LB.items.length) % LB.items.length;
    updateLB();
  }

  function closeLB() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    document.body.classList.remove('lightbox-open');
    if (lastLBFocus && lastLBFocus.focus) lastLBFocus.focus();
  }

  function initLB() {
    lb = $('#lightbox');
    if (!lb) return;
    lbImg = $('#lightbox-img');
    lbNo = $('#lightbox-no');
    lbCap = $('#lightbox-cap');
    $$('[data-lb-close]', lb).forEach(function (el) { el.addEventListener('click', closeLB); });
    var prev = $('[data-lb-prev]', lb), next = $('[data-lb-next]', lb);
    if (prev) prev.addEventListener('click', function () { stepLB(-1); });
    if (next) next.addEventListener('click', function () { stepLB(1); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLB();
      else if (e.key === 'ArrowLeft') stepLB(-1);
      else if (e.key === 'ArrowRight') stepLB(1);
    });
    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(layoutPlates, 150);
    });
    window.addEventListener('load', layoutPlates);
  }

  /* ---------- 8. 能力 ---------- */
  function renderCaps() {
    var host = $('#caps-list');
    var caps = S.capabilities || [];
    if (host) {
      host.innerHTML = caps.map(function (c, i) {
        var level = Number(c.level) || 0;
        var ticks = '';
        for (var t = 1; t <= 10; t++) ticks += '<i class="' + (t <= Math.round(level * 2) ? 'on' : '') + '"></i>';
        var en = String(c.id || '').replace(/-/g, ' ');
        return '<div class="cap" data-reveal>' +
          '<span class="cap__no">' + pad(i + 1) + '</span>' +
          '<div><h3 class="cap__name">' + esc(c.title) + '<em>' + esc(en) + '</em></h3>' +
            '<p class="cap__desc">' + esc(c.desc) + '</p></div>' +
          '<div class="cap__score"><b>' + level.toFixed(1).replace('.0', '') + '<i>/5</i></b>' +
            '<div class="cap__meter">' + ticks + '</div></div>' +
          '<ul class="cap__ev">' + (c.evidence || []).map(function (e) {
            return '<li>' + esc(e) + '</li>';
          }).join('') + '</ul>' +
        '</div>';
      }).join('');
    }
    var host2 = $('#bounds');
    var b = S.boundaries || [];
    if (host2) {
      if (!b.length) { host2.remove(); }
      else {
        host2.innerHTML = '<span class="bounds__k">BOUNDARIES / 不冒充的部分</span>' +
          b.map(function (x) { return '<div><b>' + esc(x.title) + '</b><p>' + esc(x.desc) + '</p></div>'; }).join('');
      }
    }
  }

  /* ---------- 9. 教研 / 履历 ---------- */
  function renderEduNumbers() {
    var host = $('#edu-numbers');
    if (!host) return;
    var items = [
      { v: '1,450', u: '条', l: '原创选题' },
      { v: '36', u: '次课', l: '课程体系' },
      { v: '2', u: '门', l: '可直接开班' },
      { v: '10', u: '个', l: '赛事 / 活动覆盖' }
    ];
    host.innerHTML = items.map(function (it) {
      return '<div><b>' + it.v + '<i>' + it.u + '</i></b><span>' + it.l + '</span></div>';
    }).join('');
  }

  function renderLog() {
    var host = $('#log');
    var tl = S.timeline || [];
    if (!host || !tl.length) return;
    host.innerHTML = tl.map(function (t) {
      return '<li><time>' + esc(t.year) + '</time><h3>' + esc(t.title) + '</h3><p>' + esc(t.desc) + '</p></li>';
    }).join('');
  }

  /* ---------- 10. 弹层 ---------- */
  var modal, modalBody, lastFocus;

  function openCase(id) {
    var c = CASE_INDEX[id];
    if (!c || !modal) return;
    var cases = S.cases || [];
    var no = pad(cases.map(function (x) { return x.id; }).indexOf(id) + 1);
    var imgs = c.images || [];

    var gallery = imgs.length
      ? '<div class="ms__gallery' + (imgs.length === 1 ? ' ms__gallery--1' : imgs.length === 2 ? ' ms__gallery--2' : '') + '">' +
        imgs.map(function (im) {
          return '<figure><img src="' + esc(img(im.file)) + '" alt="' + esc(im.caption || c.title) + '">' +
            (im.caption ? '<figcaption>' + esc(im.caption) + '</figcaption>' : '') + '</figure>';
        }).join('') + '</div>'
      : '';

    modalBody.innerHTML =
      '<div class="ms__kicker"><b>FILE ' + no + '</b><span>' + esc(c.category || '') + '</span>' +
        '<span>' + esc(c.year || '') + '</span><span>技术档案 · DOSSIER</span></div>' +
      '<h3 class="ms__title" id="modal-title">' + esc(c.title) + '</h3>' +
      '<p class="ms__tag">' + esc(c.tagline) + '</p>' +
      '<div class="ms__hr"></div>' +
      gallery +
      '<div class="ms__cols">' +
        '<div class="ms__block"><h4>PROBLEM / 问题</h4><p>' + esc(c.problem || c.summary || '') + '</p></div>' +
        '<div class="ms__block"><h4>SOLUTION / 方案</h4><p>' + esc(c.solution || '') + '</p></div>' +
      '</div>' +
      '<h4 class="ms__block" style="margin:24px 0 6px"><span style="font-family:var(--mono);font-size:8.5px;letter-spacing:.16em;color:var(--accent)">HIGHLIGHTS / 关键点</span></h4>' +
      '<ol class="ms__hl">' + (c.highlights || []).map(function (h, k) {
        return '<li><span class="k">' + pad(k + 1) + '</span><div><b>' + esc(h.title) + '</b><p>' + esc(h.desc) + '</p></div></li>';
      }).join('') + '</ol>' +
      '<div class="ms__spec">' + (c.metrics || []).map(function (m) {
        return '<div><b>' + esc(m.value) + '</b><span>' + esc(m.label) + '</span></div>';
      }).join('') + '</div>' +
      '<table class="ms__table"><tbody>' +
        '<tr><th>技术栈</th><td>' + esc((c.stack || []).join(' · ')) + '</td></tr>' +
        '<tr><th>我的角色</th><td>' + esc((c.role || []).join(' · ')) + '</td></tr>' +
        '<tr><th>交付物</th><td>' + esc((c.deliverables || []).join(' · ')) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="ms__foot"><span>ZPC // PORTFOLIO V2 · 2026</span><span>FILE ' + no + ' / ' + pad(cases.length) + '</span></div>';

    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var scroller = $('.modal__scroll', modal);
    if (scroller) scroller.scrollTop = 0;
    var close = $('#modal-close');
    if (close) close.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initModal() {
    modal = $('#modal');
    modalBody = $('#modal-body');
    if (!modal) return;
    document.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.wcard') : null;
      if (card) { openCase(card.getAttribute('data-id')); return; }
      if (e.target.closest && e.target.closest('[data-close]')) closeModal();
    });
    var close = $('#modal-close');
    if (close) close.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  /* ---------- 11. 入场 / 计数 ---------- */
  function initReveal() {
    var els = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || REDUCED || SHOT) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    var els = $$('.js-count');
    if (!els.length) return;
    function run(el) {
      var to = parseFloat(el.getAttribute('data-to')) || 0;
      if (REDUCED || SHOT) { el.textContent = to.toLocaleString('en-US'); return; }
      var t0 = performance.now(), dur = 900;
      function step(t) {
        var p = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (SHOT) { els.forEach(run); return; }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: .4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- init ---------- */
  function init() {
    var id = S.identity || {};
    if (id.email) {
      var mail = $('#contact-mail');
      if (mail) { mail.href = 'mailto:' + id.email; mail.textContent = id.email; }
    }
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    renderHeroStats();
    renderMarquee();
    renderFacts();
    renderNumbers();
    renderWork();
    renderPlates();
    renderArchive();
    renderCaps();
    renderEduNumbers();
    renderLog();
    initModal();
    initLB();
    initNav();
    initWorkScroll();
    initReveal();
    initCounters();

    document.body.classList.remove('is-loading');
    var ready = function () { document.body.classList.add('is-ready'); };
    requestAnimationFrame(ready);
    setTimeout(ready, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

