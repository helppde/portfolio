/* ============================================================
   张普朝 · 作品集  —  交互与渲染
   无依赖，直接读 window.SITE（由 tools/build_data.py 生成）
   ============================================================ */
(function () {
  'use strict';

  var S = window.SITE || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------- 1. 首屏数据条 ---------------- */
  function renderStats() {
    var host = $('#statstrip');
    if (!host) return;
    var pick = (S.numbers || []).filter(function (n) {
      return /实体装置|文档|三维|选题|赛事|峰值/.test(n.label);
    }).slice(0, 6);
    if (!pick.length) return;

    host.innerHTML = pick.map(function (n) {
      var m = String(n.value).match(/^\s*([\d.,]+)\s*(.*)$/);
      var num = m ? m[1].replace(/,/g, '') : null;
      var unit = m ? m[2] : '';
      var decimals = num && num.indexOf('.') > -1 ? 1 : 0;
      var shown = num == null
        ? esc(n.value)
        : '<span class="js-count" data-to="' + esc(num) + '" data-dec="' + decimals + '">0</span>' +
          (unit ? '<i>' + esc(unit) + '</i>' : '');
      return '<div class="reveal"><b>' + shown + '</b><span>' + esc(n.label) + '</span>' +
        (n.note ? '<small>' + esc(String(n.note).split('；')[0]) + '</small>' : '') + '</div>';
    }).join('');
  }

  /* ---------------- 2. 能力矩阵 ---------------- */  function renderCapabilities() {
    var host = $('#cap-list');
    if (!host) return;
    var caps = S.capabilities || [];
    host.innerHTML = caps.map(function (c, i) {
      var level = Number(c.level) || 0;
      var ticks = '';
      for (var t = 1; t <= 10; t++) ticks += '<i class="' + (t <= Math.round(level * 2) ? 'on' : '') + '"></i>';
      var en = String(c.id || '').replace(/-/g, ' ').toUpperCase();
      return '<div class="cap__row reveal" style="--i:' + i + '">' +
        '<span class="cap__idx">' + pad(i + 1) + '</span>' +
        '<div><h3 class="cap__name">' + esc(c.title) + '</h3><span class="cap__en">' + esc(en) + '</span>' +
          '<p class="cap__desc">' + esc(c.desc) + '</p></div>' +
        '<ul class="cap__ev">' + (c.evidence || []).map(function (e) {
          return '<li>' + esc(e) + '</li>';
        }).join('') + '</ul>' +
        '<div class="cap__score"><span class="cap__num">' + level.toFixed(1).replace('.0', '') +
          '<small>/ 5</small></span><div class="cap__bar" aria-hidden="true">' + ticks + '</div></div>' +
        '</div>';
    }).join('');

    var bounds = S.boundaries || [];
    var legend = $('.cap__legend');
    if (bounds.length && legend) {
      var wrap = document.createElement('div');
      wrap.className = 'boundaries';
      wrap.innerHTML = '<span class="boundaries__k">能力边界 · 不冒充的部分</span>' +
        bounds.map(function (b) {
          return '<span class="boundaries__item"><b>' + esc(b.title) + '</b>' + esc(b.desc) + '</span>';
        }).join('');
      legend.parentNode.insertBefore(wrap, legend);
    }
  }

  /* ---------------- 2.5 差异化优势 ---------------- */
  function renderStrengths() {
    var host = $('#strengths');
    var list = S.strengths || [];
    if (!host || !list.length) { if (host) host.remove(); return; }
    host.innerHTML = list.map(function (s, i) {
      return '<div class="strengths__item reveal" style="--i:' + i + '">' +
        '<span class="strengths__no">' + pad(i + 1) + ' / WHY ME</span>' +
        '<h3>' + esc(s.title) + '</h3><p>' + esc(s.desc) + '</p></div>';
    }).join('');
  }

  /* ---------------- 3. 精选案例 ---------------- */
  var CASE_INDEX = {};
  function renderCases() {
    var host = $('#case-list');
    var cases = S.cases || [];
    if (!host) return;
    if (!cases.length) {
      host.innerHTML = '<p class="case__summary">案例数据尚未生成，请运行 python tools/build_data.py。</p>';
      return;
    }

    host.innerHTML = cases.map(function (c, i) {
      CASE_INDEX[c.id] = c;
      var idx = pad(i + 1);
      var imgs = c.images || [];
      var cover = imgs[0];
      var stackList = c.stack || [];
      var frame;
      if (cover) {
        frame = '<div class="case__frame"><img src="' + esc(cover.file) + '" alt="' +
          esc(cover.caption || c.title) + '" loading="lazy" decoding="async"></div>';
      } else {
        frame = '<div class="case__frame case__frame--plate">' +
            '<div class="plate__head"><span>TECH FILE</span><b>NO.' + idx + '</b></div>' +
            '<ol class="plate__list">' + stackList.map(function (s, k) {
              return '<li><i>' + pad(k + 1) + '</i><span>' + esc(s) + '</span></li>';
            }).join('') + '</ol>' +
            '<div class="plate__foot"><span>' + esc(c.category || '') + '</span>' +
              '<span>' + esc(c.year || '') + '</span></div>' +
          '</div>';
      }
      var plate = '<b>FIG.' + idx + '</b><span>' + esc(c.category || '') + '</span>' +
        '<span>' + esc(cover ? (cover.caption || '') : '技术档案 · 无实拍图') + '</span>';

      var hl = (c.highlights || []).map(function (h, k) {
        return '<li><span class="k">' + pad(k + 1) + '</span><div><b>' + esc(h.title) + '</b>' +
          '<p>' + esc(h.desc) + '</p></div></li>';
      }).join('');

      var metrics = (c.metrics || []).map(function (m) {
        return '<div><b>' + esc(m.value) + '</b><span>' + esc(m.label) + '</span></div>';
      }).join('');

      var role = (c.role || []).join(' · ');
      var deliv = (c.deliverables || []).join(' · ');
      var stack = (c.stack || []).join(' · ');

      return '<article class="case reveal' + (cover ? '' : ' case--noimg') + '" data-case="' + esc(c.id) + '">' +
        '<div class="case__media">' + frame +
          '<div class="case__plate">' + plate + '</div>' +
        '</div>' +
        '<div class="case__body">' +
          '<div class="case__kicker"><em>NO.' + idx + '</em><s></s>' + esc(c.category || '') +
            '<s></s>' + esc(c.year || '') + '</div>' +
          '<h3 class="case__title">' + esc(c.title) + '</h3>' +
          '<p class="case__tagline">' + esc(c.tagline) + '</p>' +
          '<p class="case__summary">' + esc(c.summary) + '</p>' +
          '<ol class="case__hl">' + hl + '</ol>' +
          (metrics ? '<div class="case__metrics">' + metrics + '</div>' : '') +
          '<dl>' +
            '<div class="case__row"><dt>技术栈</dt><dd>' + esc(stack) + '</dd></div>' +
            '<div class="case__row"><dt>我的角色</dt><dd>' + esc(role) + '</dd></div>' +
            '<div class="case__row"><dt>交付物</dt><dd>' + esc(deliv) + '</dd></div>' +
          '</dl>' +
          '<button class="case__more" data-open="' + esc(c.id) + '">查看技术档案 <span aria-hidden="true">→</span></button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  /* ---------------- 4. 技术档案弹层 ---------------- */
  var modal = $('#modal');
  var modalContent = $('#modal-content');
  var modalClose = $('#modal-close');
  var lastFocus = null;

  function openCase(id) {
    var c = CASE_INDEX[id];
    if (!c || !modal) return;
    var cases = S.cases || [];
    var no = pad(cases.map(function (x) { return x.id; }).indexOf(id) + 1);
    var imgs = c.images || [];

    var gallery = imgs.length
      ? '<div class="ms__gallery' + (imgs.length === 1 ? ' ms__gallery--one' : imgs.length === 2 ? ' ms__gallery--two' : '') + '">' +
        imgs.map(function (im) {
          return '<figure><img src="' + esc(im.file) + '" alt="' + esc(im.caption || c.title) + '" loading="lazy">' +
            (im.caption ? '<figcaption>' + esc(im.caption) + '</figcaption>' : '') + '</figure>';
        }).join('') + '</div>'
      : '';

    var hl = (c.highlights || []).map(function (h, k) {
      return '<li><span class="k">' + pad(k + 1) + '</span><div><b>' + esc(h.title) + '</b><p>' + esc(h.desc) + '</p></div></li>';
    }).join('');

    var metrics = (c.metrics || []).map(function (m) {
      return '<div><b>' + esc(m.value) + '</b><span>' + esc(m.label) + '</span></div>';
    }).join('');

    modalContent.innerHTML =
      '<div class="ms__head">' +
        '<div class="ms__kicker"><b>SHEET ' + no + '</b><span>' + esc(c.category || '') + '</span>' +
          '<span>' + esc(c.year || '') + '</span><span>TECHNICAL FILE / 张普朝</span></div>' +
        '<h3 class="ms__title" id="modal-title">' + esc(c.title) + '</h3>' +
        '<p class="ms__tag">' + esc(c.tagline) + '</p>' +
      '</div>' +
      gallery +
      '<div class="ms__cols">' +
        '<div class="ms__block"><h4>问题 / PROBLEM</h4><p>' + esc(c.problem || c.summary || '') + '</p></div>' +
        '<div class="ms__block"><h4>方案 / SOLUTION</h4><p>' + esc(c.solution || '') + '</p></div>' +
      '</div>' +
      (hl ? '<h4 class="ms__block" style="margin-bottom:10px">关键点 / HIGHLIGHTS</h4><ol class="ms__hl">' + hl + '</ol>' : '') +
      (metrics ? '<div class="ms__spec">' + metrics + '</div>' : '') +
      '<table class="ms__table"><tbody>' +
        '<tr><th>技术栈</th><td>' + esc((c.stack || []).join(' · ')) + '</td></tr>' +
        '<tr><th>我的角色</th><td>' + esc((c.role || []).join(' · ')) + '</td></tr>' +
        '<tr><th>交付物</th><td>' + esc((c.deliverables || []).join(' · ')) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="ms__foot"><span>PORTFOLIO 2026 · 张普朝</span><span>SHEET ' + no + ' OF ' + pad(cases.length) + '</span></div>';

    lastFocus = document.activeElement;
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('modal-open');
    modal.querySelector('.modal__sheet').scrollTop = 0;
    modalClose.focus();
  }

  function closeCase() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function bindModal() {
    document.addEventListener('click', function (e) {
      var opener = e.target.closest ? e.target.closest('[data-open]') : null;
      if (opener) { e.preventDefault(); openCase(opener.getAttribute('data-open')); return; }
      if (e.target.closest && e.target.closest('[data-close]')) { closeCase(); return; }
      var media = e.target.closest ? e.target.closest('.case__media') : null;
      if (media) {
        var card = media.closest('.case');
        if (card) openCase(card.getAttribute('data-case'));
      }
    });
    if (modalClose) modalClose.addEventListener('click', closeCase);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCase();
    });
  }

  /* ---------------- 5. 项目全景 ---------------- */
  var ARC = { items: [], cat: 'all', q: '' };

  function renderCatalog() {
    var host = $('#archive-rows');
    var cat = S.catalog || {};
    var items = cat.items || [];
    if (!host) return;
    if (!items.length) {
      host.innerHTML = '<p class="archive__empty">目录数据尚未生成。</p>';
      return;
    }
    ARC.items = items;

    var totalEl = $('#archive-total');
    if (totalEl) totalEl.textContent = items.length + ' 项';

    // 过滤 chips
    var chipsHost = $('#archive-chips');
    if (chipsHost) {
      var cats = (cat.categories || []).slice();
      chipsHost.innerHTML =
        '<button class="is-on" data-cat="all">全部<b>' + items.length + '</b></button>' +
        cats.map(function (c) {
          return '<button data-cat="' + esc(c.name) + '">' + esc(c.name) + '<b>' + c.count + '</b></button>';
        }).join('');
      chipsHost.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        ARC.cat = b.getAttribute('data-cat');
        $$('button', chipsHost).forEach(function (x) { x.classList.toggle('is-on', x === b); });
        paint();
      });
    }

    host.innerHTML = items.map(function (it, i) {
      return '<div class="arc" data-cat="' + esc(it.category || '') + '" data-key="' +
        esc((it.title + ' ' + (it.tagline || '') + ' ' + (it.stack || '') + ' ' + (it.category || '')).toLowerCase()) + '">' +
        '<button class="arc__row" aria-expanded="false">' +
          '<span class="arc__no">' + pad(i + 1) + '</span>' +
          '<span class="arc__title">' + esc(it.title) + '<i>↗</i></span>' +
          '<span class="arc__cat">' + esc(it.category || '') + '</span>' +
          '<span class="arc__stack">' + esc(it.stack || '') + '</span>' +
          '<span class="arc__year">' + esc(it.year || '') + '</span>' +
          '<span class="arc__st" data-s="' + esc(it.status || '') + '" title="完成度">' + esc(it.status || '') + '</span>' +
        '</button>' +
        '<div class="arc__detail"><div>' +
          '<span><b>创新点</b> ' + esc(it.tagline || '') + '</span>' +
          (it.scale ? '<span class="mono">规模 ' + esc(it.scale) + '</span>' : '') +
          '<span class="mono">TRACK ' + esc(it.track || '') + '</span>' +
        '</div></div>' +
      '</div>';
    }).join('');

    // 行展开
    host.addEventListener('click', function (e) {
      var row = e.target.closest('.arc__row');
      if (!row) return;
      var wrap = row.parentNode;
      var open = wrap.classList.toggle('arc__open');
      row.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // 搜索
    var search = $('#archive-search');
    if (search) {
      var t = null;
      search.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { ARC.q = search.value.trim().toLowerCase(); paint(); }, 140);
      });
    }

    paint();
  }

  function paint() {
    var host = $('#archive-rows');
    if (!host) return;
    var rows = $$('.arc', host);
    var shown = 0;
    rows.forEach(function (row) {
      var okCat = ARC.cat === 'all' || row.getAttribute('data-cat') === ARC.cat;
      var okQ = !ARC.q || row.getAttribute('data-key').indexOf(ARC.q) > -1;
      var ok = okCat && okQ;
      row.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    var st = $('#archive-status');
    if (st) {
      st.textContent = shown === ARC.items.length
        ? '显示全部 ' + shown + ' 项 · 点击任意一行展开技术要点'
        : '筛选结果 ' + shown + ' / ' + ARC.items.length + ' 项';
    }
    var empty = $('#archive-empty');
    if (!shown) {
      if (!empty) {
        empty = document.createElement('p');
        empty.id = 'archive-empty';
        empty.className = 'archive__empty';
        empty.textContent = '没有匹配的项目 — 换个关键词，或点"全部"回到全表。';
        host.parentNode.insertBefore(empty, host.nextSibling);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  /* ---------------- 6. 时间线 ---------------- */
  function renderTimeline() {
    var host = $('#timeline-list');
    var tl = S.timeline || [];
    if (!host || !tl.length) return;
    host.innerHTML = tl.map(function (t, i) {
      return '<li class="reveal' + (i === tl.length - 1 ? ' is-now' : '') + '" style="--i:' + i + '">' +
        '<time>' + esc(t.year) + '</time>' +
        '<div><h3>' + esc(t.title) + '</h3><p>' + esc(t.desc) + '</p></div>' +
      '</li>';
    }).join('');
  }

  /* ---------------- 7. 滚动与动效 ---------------- */
  function bindScroll() {
    // 顶部进度条
    var bar = $('.scroll-progress i');
    // 章节高亮
    var links = $$('#rail-nav a');
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });

    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';

      var pos = h.scrollTop + h.clientHeight * 0.42;
      var current = -1;
      sections.forEach(function (sec, i) {
        if (sec && sec.offsetTop <= pos) current = i;
      });
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function bindReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window) || REDUCED) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function bindCount() {
    var els = $$('.js-count');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || REDUCED) {
      els.forEach(function (el) { el.textContent = fmt(el.getAttribute('data-to'), +el.getAttribute('data-dec')); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var to = parseFloat(el.getAttribute('data-to'));
        var dec = +el.getAttribute('data-dec') || 0;
        var t0 = performance.now(), dur = 1100;
        function step(t) {
          var p = Math.min(1, (t - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(to * e, dec);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = fmt(to, dec);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }
  function fmt(v, dec) {
    var s = dec ? Number(v).toFixed(dec) : String(Math.round(v));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function bindNav() {
    var toggle = $('#navtoggle');
    var nav = $('#topnav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('a', nav).forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
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

  /* ---------------- 8. 联系信息 ---------------- */
  function bindContact() {
    var id = S.identity || {};
    if (id.email) {
      var mail = $('#contact-mail');
      if (mail) { mail.href = 'mailto:' + id.email; mail.textContent = id.email; }
    }
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- init ---------------- */
  function init() {
    renderStats();
    renderCapabilities();
    renderStrengths();
    renderCases();
    renderCatalog();
    renderTimeline();
    bindModal();
    bindScroll();
    bindNav();
    bindContact();
    bindReveal();
    bindCount();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
