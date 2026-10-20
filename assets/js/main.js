/* ==========================================================================
   شركة لون الحرف للطباعة — main.js
   No libraries. Loader, dark mode, scroll-down reveal (data-anim),
   count-up numbers, WhatsApp forms, opening hours, menu, gallery, filters.
   Works for Arabic (rtl) and English (ltr) pages.
   ========================================================================== */
(() => {
  'use strict';
  window.__lh = true;
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const EN = root.lang === 'en';
  const RTL = root.dir !== 'ltr';
  const WA = '966537968681';
  const TZ = 'Asia/Riyadh';
  const tr = (ar, en) => (EN ? en : ar);
  const store = {
    get: (s, k) => { try { return window[s].getItem(k); } catch (_) { return null; } },
    set: (s, k, v) => { try { window[s].setItem(k, v); } catch (_) {} }
  };

  /* ---------- dark mode ---------- */
  const themeBtn = $('.theme-tog');
  const syncTheme = () => { if (themeBtn) themeBtn.setAttribute('aria-pressed', String(root.dataset.theme === 'dark')); };
  syncTheme();
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('localStorage', 'lh-theme', next);
    syncTheme();
  });


  /* ---------- sky: twinkling stars (dark) / twinkling ink dots (light) ---------- */
  const sky = $('.sky');
  if (sky && sky.getContext) {
    const ctx = sky.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const INK = ['0,160,220', '226,0,122', '255,209,0', '201,162,74', '201,162,74'];
    let W = 0, H = 0, dpr = 1, dots = [], dark = false, raf = 0, last = 0;
    const build = () => {
      dpr = 1;
      W = innerWidth; H = innerHeight;
      sky.width = Math.round(W * dpr); sky.height = Math.round(H * dpr);
      dark = root.dataset.theme === 'dark';
      const n = Math.round(W * H / (dark ? 5200 : 8500));
      dots = Array.from({ length: n }, () => {
        const big = Math.random() < (dark ? .07 : .05);
        return {
          x: Math.random() * W, y: Math.random() * H, big,
          r: dark ? (big ? 1.3 + Math.random() * .9 : .45 + Math.random() * .85) : (big ? 2.4 + Math.random() * 1.2 : .9 + Math.random() * 1.4),
          c: dark ? (Math.random() < .3 ? '197,204,216' : '255,255,255') : INK[Math.floor(Math.random() * INK.length)],
          a: dark ? .35 + Math.random() * .4 : .16 + Math.random() * .26,
          amp: dark ? .25 + Math.random() * .35 : .1 + Math.random() * .18,
          s: .45 + Math.random() * 1.5, p: Math.random() * 6.283
        };
      });
    };
    /* Drawing is batched by colour and brightness level: no gradients and only a
       handful of fill calls per frame, so it stays cheap on laptops whose canvas
       runs without GPU help. */
    const LV = 6;
    const draw = t => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const k = t / 1000;
      const buckets = new Map();
      const get = (c, a) => {
        const l = Math.max(1, Math.min(LV, Math.round(a * LV)));
        const key = c + l;
        let b = buckets.get(key);
        if (!b) { b = { c, l, rects: [], path: new Path2D(), arcs: 0 }; buckets.set(key, b); }
        return b;
      };
      for (const d of dots) {
        const a = Math.max(0, Math.min(1, d.a + d.amp * Math.sin(k * d.s + d.p)));
        if (a < .06) continue;
        const b = get(d.c, a);
        if (d.r < 1) b.rects.push(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
        else { b.path.moveTo(d.x + d.r, d.y); b.path.arc(d.x, d.y, d.r, 0, 6.283); b.arcs++; }
        if (d.big) {
          const h = get(d.c, a * (dark ? .2 : .16));
          h.path.moveTo(d.x + d.r * 2.6, d.y); h.path.arc(d.x, d.y, d.r * 2.6, 0, 6.283); h.arcs++;
          if (dark) {
            const L = d.r * 4.2 * (.6 + a * .5), sp = get(d.c, a * .75);
            sp.rects.push(d.x - L, d.y - .35, L * 2, .7, d.x - .35, d.y - L, .7, L * 2);
          }
        }
      }
      buckets.forEach(b => {
        ctx.fillStyle = 'rgba(' + b.c + ',' + (b.l / LV).toFixed(2) + ')';
        for (let i = 0; i < b.rects.length; i += 4) ctx.fillRect(b.rects[i], b.rects[i + 1], b.rects[i + 2], b.rects[i + 3]);
        if (b.arcs) ctx.fill(b.path);
      });
    };
    let scrolling = 0;
    addEventListener('scroll', () => { scrolling = performance.now(); }, { passive: true });
    const loop = t => {
      raf = requestAnimationFrame(loop);
      if (t - last < 50 || t - scrolling < 180) return;
      last = t; draw(t);
    };
    const start = () => { cancelAnimationFrame(raf); build(); if (still) draw(0); else raf = requestAnimationFrame(loop); };
    start();
    let rt, lw = innerWidth, lh = innerHeight;
    addEventListener('resize', () => {
      if (innerWidth === lw && Math.abs(innerHeight - lh) < 140) return;
      lw = innerWidth; lh = innerHeight;
      clearTimeout(rt); rt = setTimeout(start, 200);
    });
    new MutationObserver(start).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* ---------- scroll-down animation + count-up ---------- */
  const countUp = el => {
    const end = +el.dataset.count;
    if (!end || el.dataset.done) return;
    el.dataset.done = '1';
    const t0 = performance.now(), dur = 1600;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  };
  const startReveal = () => {
    if (!root.classList.contains('anim')) return;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('[data-count]', e.target).forEach(countUp);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    $$('[data-anim]').forEach(el => {
      const items = el.dataset.anim === 'group' ? [...el.children] : [el];
      items.forEach((it, i) => {
        it.classList.add('anim-item');
        if (items.length > 1) it.style.setProperty('--i', i % 8);
        io.observe(it);
      });
    });
  };

  /* ---------- loader ---------- */
  const loader = $('.loader');
  const bar = loader ? $('.loader__bar', loader) : null;
  const pct = loader ? $('.loader__pct', loader) : null;
  const firstVisit = store.get('sessionStorage', 'lh-seen') !== '1';
  store.set('sessionStorage', 'lh-seen', '1');
  const t0 = performance.now();
  const minShow = firstVisit ? 1100 : 350;
  let shown = 0;
  const setProgress = v => {
    shown = Math.max(shown, v);
    if (bar) bar.style.setProperty('--lp', shown.toFixed(3));
    if (pct) pct.textContent = Math.round(shown * 100) + '%';
  };
  const imgs = $$('img').filter(i => i.loading !== 'lazy');
  let loadedImgs = imgs.filter(i => i.complete).length;
  const track = () => setProgress(.15 + .75 * (imgs.length ? loadedImgs / imgs.length : 1));
  imgs.forEach(i => { if (!i.complete) i.addEventListener('load', () => { loadedImgs++; track(); }, { once: true }); });
  track();
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    setProgress(1);
    const wait = Math.max(0, minShow - (performance.now() - t0));
    setTimeout(() => {
      root.classList.add('loaded');
      setTimeout(() => { root.classList.remove('loading'); if (loader) loader.remove(); }, 650);
      startReveal();
    }, wait + 150);
  };
  if (document.readyState === 'complete') finish();
  else { addEventListener('load', finish, { once: true }); setTimeout(finish, 3500); }

  /* ---------- header + back to top ---------- */
  const top = $('.top'), totop = $('.totop');
  const onScroll = () => {
    if (top) top.classList.toggle('is-scrolled', scrollY > 10);
    if (totop) {
      const h = document.documentElement.scrollHeight - innerHeight;
      totop.style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(3) : 0);
      totop.classList.toggle('is-on', scrollY > 600);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (totop) totop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- WhatsApp ---------- */
  const waUrl = msg => 'https://wa.me/' + WA + (msg ? '?text=' + encodeURIComponent(msg) : '');
  $$('[data-wa]').forEach(a => { a.href = waUrl(a.dataset.wa); });

  /* ---------- opening hours (always Riyadh time) ---------- */
  let HOURS = {};
  try { HOURS = JSON.parse(($('#lh-hours') || {}).textContent || '{}'); } catch (_) {}
  const DAYS = EN ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const riyadh = () => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const g = t => (p.find(x => x.type === t) || {}).value;
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), min: (+g('hour') % 24) * 60 + +g('minute') };
  };
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const clock = s => { let [h, m] = s.split(':').map(Number); const pm = h >= 12; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ' ' + (pm ? tr('م', 'PM') : tr('ص', 'AM')); };
  const status = () => {
    const { day, min } = riyadh();
    const today = HOURS[day] || [];
    const now = today.find(([a, b]) => min >= toMin(a) && min < toMin(b));
    if (now) return { open: true, text: tr('مفتوح الآن · يغلق ', 'Open now · closes ') + clock(now[1]), day };
    const later = today.find(([a]) => toMin(a) > min);
    if (later) return { open: false, text: tr('مغلق الآن · يفتح ', 'Closed · opens ') + clock(later[0]), day };
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7, r = HOURS[d];
      if (r && r.length) return { open: false, text: tr('مغلق الآن · يفتح ', 'Closed · opens ') + (i === 1 ? tr('غداً', 'tomorrow') : DAYS[d]) + ' ' + clock(r[0][0]), day };
    }
    return { open: false, text: tr('مغلق الآن', 'Closed'), day };
  };
  const paintStatus = () => {
    const s = status();
    $$('[data-status]').forEach(el => {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      const t = $('span', el); if (t) t.textContent = s.text;
    });
    $$('[data-day]').forEach(el => el.classList.toggle('is-today', +el.dataset.day === s.day));
  };
  paintStatus();
  setInterval(paintStatus, 60000);

  /* ---------- quote forms → WhatsApp (window.open runs synchronously) ---------- */
  $$('form[data-wa-form]').forEach(form => {
    const req = $$('[required]', form);
    req.forEach(f => f.addEventListener('input', () => f.removeAttribute('aria-invalid')));
    form.addEventListener('submit', e => {
      e.preventDefault();
      let first = null;
      req.forEach(f => {
        const v = f.value.trim();
        const bad = !v || (f.type === 'tel' && !/^[+\d\s()-]{8,}$/.test(v));
        f.setAttribute('aria-invalid', String(bad));
        if (bad && !first) first = f;
      });
      if (first) { first.focus(); return; }
      const lines = [form.dataset.waForm];
      $$('[data-label]', form).forEach(f => { const v = f.value.trim(); if (v) lines.push('• ' + f.dataset.label + ': ' + v); });
      const url = waUrl(lines.join('\n'));
      const w = window.open(url, '_blank');
      if (w) { try { w.opener = null; } catch (_) {} } else { location.href = url; }
      const done = $('.form__done', form); if (done) done.hidden = false;
    });
  });

  /* ---------- mobile menu ---------- */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = open => {
    root.classList.toggle('menu-open', open);
    if (burger) { burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? tr('إغلاق القائمة', 'Close menu') : tr('فتح القائمة', 'Open menu')); }
    if (menu) menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (burger) burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  if (menu) $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('resize', () => { if (innerWidth > 1100 && root.classList.contains('menu-open')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); if (burger) burger.focus(); } });

  /* ---------- home page: the logo scrolls back to the top instead of reloading ---------- */
  if (document.body.dataset.page === 'index') {
    $$('.brand').forEach(a => a.addEventListener('click', e => {
      if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;   // keep "open in new tab"
      e.preventDefault();
      if (root.classList.contains('menu-open')) setMenu(false);
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    }));
  }

  /* ---------- testimonials: buttons + mouse drag ---------- */
  $$('.quotes').forEach(q => {
    const track = $('.quotes__track', q);
    const step = () => (track.firstElementChild ? track.firstElementChild.offsetWidth : 300) + 20;
    const dir = RTL ? -1 : 1;
    const prev = $('[data-q="prev"]', q), next = $('[data-q="next"]', q);
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -dir * step(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: dir * step(), behavior: 'smooth' }));
    let down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-drag'); }
      track.scrollLeft = sl - dx;
    });
    addEventListener('pointerup', () => { if (!down) return; down = false; track.classList.remove('is-drag'); });
    track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ---------- lightbox ---------- */
  const lightbox = (() => {
    const el = document.createElement('div');
    el.className = 'lb';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', tr('معرض الصور', 'Image gallery'));
    const ico = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
    const right = 'M9 6l6 6-6 6', left = 'M15 6l-6 6 6 6';
    el.innerHTML = '<div class="lb__bar"><span class="lb__count ltr"></span><button class="lb__btn lb__close" type="button" aria-label="' + tr('إغلاق المعرض', 'Close gallery') + '">' + ico('M6 6l12 12M18 6L6 18') + '</button></div>'
      + '<div class="lb__stage"><img alt="" decoding="async">'
      + '<button class="lb__btn lb__prev" type="button" aria-label="' + tr('الصورة السابقة', 'Previous image') + '">' + ico(RTL ? right : left) + '</button>'
      + '<button class="lb__btn lb__next" type="button" aria-label="' + tr('الصورة التالية', 'Next image') + '">' + ico(RTL ? left : right) + '</button></div>'
      + '<p class="lb__cap" aria-live="polite"></p>';
    document.body.appendChild(el);
    const img = $('img', el), cap = $('.lb__cap', el), count = $('.lb__count', el), stage = $('.lb__stage', el);
    let items = [], i = 0, back = null;
    const show = n => {
      i = (n + items.length) % items.length;
      const it = items[i];
      img.src = it.href; img.alt = it.alt; cap.textContent = it.cap; count.textContent = (i + 1) + ' / ' + items.length;
    };
    const close = () => { el.classList.remove('is-open'); document.body.style.overflow = ''; if (back) back.focus(); };
    const open = (list, n, from) => {
      items = list; back = from;
      show(n);
      el.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      $('.lb__close', el).focus();
    };
    $('.lb__close', el).addEventListener('click', close);
    $('.lb__prev', el).addEventListener('click', () => show(i - 1));
    $('.lb__next', el).addEventListener('click', () => show(i + 1));
    el.addEventListener('click', e => { if (e.target === el || e.target === stage) close(); });
    document.addEventListener('keydown', e => {
      if (!el.classList.contains('is-open')) return;
      const fwd = RTL ? 'ArrowLeft' : 'ArrowRight', bwd = RTL ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === 'Escape') close();
      else if (e.key === fwd) show(i + 1);
      else if (e.key === bwd) show(i - 1);
      else if (e.key === 'Tab') { const f = $$('button', el); const k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });
    let sx = null;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; });
    stage.addEventListener('pointerup', e => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show((dx > 0) === RTL ? i + 1 : i - 1);
    });
    return { open };
  })();
  $$('[data-gallery]').forEach(g => {
    g.addEventListener('click', e => {
      const a = e.target.closest('a[data-lb]');
      if (!a) return;
      e.preventDefault();
      const links = $$('a[data-lb]', g).filter(l => !l.closest('[hidden]'));
      const list = links.map(l => { const im = $('img', l); return { href: l.getAttribute('href'), alt: im ? im.alt : '', cap: l.dataset.cap || (im ? im.alt : '') }; });
      lightbox.open(list, Math.max(0, links.indexOf(a)), a);
    });
  });

  /* ---------- filters ---------- */
  $$('[data-filter-for]').forEach(group => {
    const chips = $$('.chip', group);
    const box = document.getElementById(group.dataset.filterFor);
    if (!box) return;
    const items = $$('[data-cat]', box);
    chips.forEach(chip => chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
      items.forEach(it => { it.hidden = !(f === 'all' || it.dataset.cat.split(' ').includes(f)); });
    }));
  });
})();
