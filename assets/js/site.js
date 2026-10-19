/* Scintilla prototype, shared behaviour. Motion values from MOTION-FEEL.md / TEARDOWN.md (estudioniksen-2026-10-18). */
(() => {
  const root = document.documentElement;
  const en = root.lang === 'en';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');

  /* Lenis 1.3.17: lerp .1, smooth wheel only, native touch (MOTION-FEEL §2). Fine pointers only. */
  let lenis = null;
  if (window.Lenis && fine.matches && !reduced.matches) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1, touchMultiplier: 1, autoRaf: true });
  }
  window.__lenis = lenis;

  /* images that finished before this script ran still need their class */
  document.querySelectorAll('img.fade').forEach(img => { if (img.complete && img.naturalWidth) img.classList.add('is-loaded'); });

  /* toast (cart confirmation, Module 24: 300ms ease-out in, auto-hide 4500ms) */
  const toastEl = document.querySelector('[data-toast]');
  let toastTimer;
  window.__toast = (html) => {
    if (!toastEl) return;
    toastEl.innerHTML = html;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 4500);
  };
  toastEl?.addEventListener('click', e => { if (e.target.closest('[data-toast-close]')) toastEl.classList.remove('is-on'); });

  /* links to pages outside the prototype say so instead of 404ing */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-proto]');
    if (!a) return;
    e.preventDefault();
    window.__toast(en ? '<p>This page is not part of the prototype.</p>' : '<p>Þessi síða er ekki hluti af frumgerðinni.</p>');
  });

  /* mobile menu (Module 19) + Escape, focus trap, scroll lock, focus-guard pattern */
  const menu = document.getElementById('menu');
  const opener = document.querySelector('[data-menu-open]');
  if (menu && opener) {
    const panel = menu.querySelector('.menu__panel');
    const focusables = () => [...panel.querySelectorAll('a[href], button:not([disabled])')].filter(el => el.offsetParent !== null);
    let lastViaKey = false;
    const open = (e) => {
      lastViaKey = e.detail === 0; // Enter/Space give 0, a tap or click 1+
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      opener.setAttribute('aria-expanded', 'true');
      root.classList.add('has-menu');
      lenis?.stop();
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => (lastViaKey ? panel.querySelector('.menu__list a, .menu__list button') || panel : panel).focus({ preventScroll: true }));
    };
    const close = () => {
      if (!menu.classList.contains('is-open')) return;
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      opener.setAttribute('aria-expanded', 'false');
      root.classList.remove('has-menu');
      document.body.style.overflow = '';
      lenis?.start();
      if (lastViaKey || root.dataset.input === 'key') opener.focus({ preventScroll: true });
    };
    opener.addEventListener('click', open);
    menu.addEventListener('click', e => {
      if (e.target.closest('[data-menu-close]')) close();
      else if (e.target.closest('a[href]') && !e.target.closest('[data-proto]')) close();
    });
    document.addEventListener('keydown', e => {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    matchMedia('(min-width: 1000px)').addEventListener('change', m => { if (m.matches) close(); });
    /* exclusive accordions */
    menu.querySelectorAll('.menu__acc > button').forEach(btn => btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-expanded') !== 'true';
      menu.querySelectorAll('.menu__acc > button').forEach(b => b.setAttribute('aria-expanded', 'false'));
      btn.setAttribute('aria-expanded', String(on));
    }));
  }

  /* rails: one tile per click (Swiper slidesPerGroup 1), edges disable the arrows */
  document.querySelectorAll('[data-rail]').forEach(rail => {
    const track = rail.querySelector('[data-track]');
    const prev = rail.querySelector('[data-prev]'), next = rail.querySelector('[data-next]');
    if (!track || !prev || !next) return;
    const step = () => (track.firstElementChild?.getBoundingClientRect().width || 0) + 2;
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth - 1;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max;
    };
    const go = dir => track.scrollBy({ left: dir * step(), behavior: reduced.matches ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', sync, { passive: true });
    rail.addEventListener('rail:sync', () => requestAnimationFrame(sync));
    addEventListener('resize', sync);
    sync();
  });

  /* sticky product grid: pin only if it fits the viewport (vite-sticky-grid, minWidth 768) */
  const grids = document.querySelectorAll('[data-sticky-grid]');
  const fit = () => grids.forEach(g => {
    const top = 34;
    const fits = innerWidth >= 768 && g.getBoundingClientRect().height + top <= innerHeight;
    g.classList.toggle('is-sticky', fits);
  });
  if (grids.length) { fit(); addEventListener('resize', fit); addEventListener('load', fit); }

  /* newsletter: prototype, sends nothing */
  document.querySelectorAll('[data-news]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const note = form.querySelector('[data-news-note]');
    const email = form.querySelector('input[type=email]');
    if (!email.value || !email.checkValidity()) { note.textContent = en ? 'Enter a valid email address.' : 'Sláðu inn gilt netfang.'; email.focus(); return; }
    note.textContent = en ? 'Thanks. This is a prototype, so nothing was sent.' : 'Takk. Þetta er frumgerð, svo ekkert var sent.';
    form.reset();
  }));

  /* collection: view switcher writes the column count instantly (Module 25), sort reorders in place */
  const grid = document.querySelector('[data-grid]');
  if (grid) {
    const setCols = () => {
      const m = document.querySelector('input[name=view-m]:checked')?.value || 2;
      const d = document.querySelector('input[name=view-d]:checked')?.value || 4;
      grid.style.setProperty('--cols-m', m); grid.style.setProperty('--cols-d', d); grid.dataset.colsD = d;
    };
    document.querySelectorAll('[data-view] input').forEach(i => i.addEventListener('change', setCols));
    setCols();
    document.querySelector('[data-sort]')?.addEventListener('change', e => {
      const v = e.target.value, items = [...grid.children];
      const by = { manual: (a, b) => a.dataset.i - b.dataset.i, 'price-asc': (a, b) => a.dataset.price - b.dataset.price,
        'price-desc': (a, b) => b.dataset.price - a.dataset.price, title: (a, b) => a.dataset.title.localeCompare(b.dataset.title, 'is'),
        new: (a, b) => b.dataset.date.localeCompare(a.dataset.date) }[v];
      items.sort(by).forEach(li => grid.appendChild(li));
    });
  }

  /* shop by print: one rail per motif, chosen motif lives in ?munstur= */
  const chips = document.querySelectorAll('[data-motif]');
  if (chips.length) {
    const show = (k, push) => {
      if (!document.querySelector(`[data-motif-panel="${k}"]`)) return;
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.motif === k)));
      document.querySelectorAll('[data-motif-panel]').forEach(p => { p.hidden = p.dataset.motifPanel !== k; });
      const panel = document.querySelector(`[data-motif-panel="${k}"]`);
      panel.querySelector('[data-track]').scrollLeft = 0;
      panel.dispatchEvent(new Event('rail:sync'));
      if (push) { const u = new URL(location.href); u.searchParams.set('munstur', k); history.replaceState(null, '', u); }
    };
    chips.forEach(c => c.addEventListener('click', () => show(c.dataset.motif, true)));
    const start = new URLSearchParams(location.search).get('munstur');
    if (start) show(start, false);
  }

  /* quick add from a tile (one-variant products only; others link to the product to pick a size) */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    e.preventDefault();
    window.__cart.add(1);
    const t = b.dataset.title;
    window.__toast(`<div class="toast__row"><div class="slot${b.dataset.pack === '1' ? ' slot--pack' : ''}"><img src="/scintilla-preview/assets/img/p/${b.dataset.img}-600.webp" alt=""></div>
      <div><p>${en ? 'Added to cart' : 'Komið í körfu'}</p><p>${t}</p></div></div>
      <div class="toast__acts"><a class="btn" href="#proto" data-proto>${en ? 'View cart' : 'Skoða körfu'}</a><button class="btn btn--stroke" type="button" data-toast-close>${en ? 'Keep shopping' : 'Halda áfram'}</button></div>`);
  });

  /* cart count lives in sessionStorage so it survives page-to-page in the prototype */
  const count = () => { try { return +sessionStorage.getItem('sc-cart') || 0; } catch { return 0; } };
  window.__cart = { get: count, add(n = 1) { try { sessionStorage.setItem('sc-cart', count() + n); } catch {} paint(); } };
  const paint = () => document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = count());
  paint();
})();
