// Product page behaviour: ?h=<handle> swaps the prerendered product; variants, gallery dots,
// thumbnails, lightbox and the optimistic add-to-cart toast (TEARDOWN Modules 23–24).
import { gallery, dots, thumbs, info, kr, stock } from './pdp-render.mjs';

const pdp = document.querySelector('[data-pdp]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let product = null;

async function load() {
  const h = new URLSearchParams(location.search).get('h');
  const data = await fetch('/scintilla-preview/assets/data/products.json').then(r => r.json());
  if (h && data[h] && h !== pdp.dataset.handle) {
    const p = data[h];
    pdp.dataset.handle = h;
    pdp.querySelector('[data-gallery]').innerHTML = gallery(p);
    pdp.querySelector('[data-dots]').innerHTML = dots(p);
    pdp.querySelector('[data-thumbs]').innerHTML = thumbs(p);
    pdp.querySelector('[data-info]').innerHTML = info(p);
    document.title = `${p.title}. Scintilla`;
  }
  product = data[pdp.dataset.handle];
  wire();
}

function wire() {
  const form = pdp.querySelector('[data-buy]');
  const btn = form.querySelector('[data-buy-btn]');
  const price = pdp.querySelector('[data-price]');
  form.addEventListener('change', e => {
    const r = e.target.closest('input[name=variant]'); if (!r) return;
    price.textContent = kr(r.dataset.p);
    const ok = r.dataset.a === '1';
    btn.disabled = !ok; btn.textContent = ok ? 'Setja í körfu' : 'Uppselt';
    const st = pdp.querySelector('[data-stock]');
    st.textContent = stock(product, product.variants.find(v => String(v.id) === r.value));
    st.classList.toggle('is-out', !ok);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (btn.disabled) return;
    const v = form.querySelector('input[name=variant]:checked');
    const name = v ? v.nextElementSibling.firstChild.textContent : '';
    const im = product.images[0];
    window.__cart?.add(1);
    window.__toast?.(`<div class="toast__row"><div class="slot${im.pack ? ' slot--pack' : ''}"><img src="/scintilla-preview/assets/img/p/${im.n}-600.webp" alt=""></div>
      <div><p>Komið í körfu</p><p>${product.title}${name ? `, ${name}` : ''}</p></div></div>
      <div class="toast__acts"><a class="btn" href="#proto" data-proto>Skoða körfu</a><button class="btn btn--stroke" type="button" data-toast-close>Halda áfram</button></div>`);
  });

  // phone gallery: dots follow the scroll position
  const gal = pdp.querySelector('[data-gallery]');
  const dotEls = pdp.querySelectorAll('.pdp__dots span');
  if (dotEls.length) gal.addEventListener('scroll', () => {
    const i = Math.round(gal.scrollLeft / (gal.firstElementChild.getBoundingClientRect().width + 2));
    dotEls.forEach((d, j) => d.classList.toggle('is-on', j === i));
  }, { passive: true });

  // desktop thumbnails: native smooth scrollIntoView, as the reference does
  pdp.querySelectorAll('[data-thumb]').forEach(t => t.addEventListener('click', () => {
    const target = document.getElementById('m' + t.dataset.thumb);
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(target, { offset: -34 });
    else target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
  }));

  // lightbox: white ground, 300ms, Escape / close, focus returns to the opener
  pdp.querySelectorAll('[data-lb]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    openLb(a);
  }));
}

let lb, lbOpener;
function openLb(a) {
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Mynd'); lb.tabIndex = -1;
    lb.innerHTML = '<div class="lb__bar"><button class="navbtn" type="button" data-lb-close>Loka</button></div><div class="lb__img"><img alt=""></div>';
    document.body.appendChild(lb);
    lb.addEventListener('click', e => { if (e.target.closest('[data-lb-close]') || e.target.classList.contains('lb__img')) closeLb(); });
    document.addEventListener('keydown', e => { if (lb.classList.contains('is-open') && (e.key === 'Escape' || e.key === 'Tab')) { if (e.key === 'Escape') closeLb(); else { e.preventDefault(); lb.querySelector('[data-lb-close]').focus(); } } });
  }
  lbOpener = a;
  lb.querySelector('img').src = a.getAttribute('href');
  lb.classList.add('is-open');
  window.__lenis?.stop(); document.body.style.overflow = 'hidden';
  const viaKey = document.documentElement.dataset.input === 'key';
  requestAnimationFrame(() => (viaKey ? lb.querySelector('[data-lb-close]') : lb).focus({ preventScroll: true }));
}
function closeLb() {
  lb.classList.remove('is-open');
  window.__lenis?.start(); document.body.style.overflow = '';
  if (document.documentElement.dataset.input === 'key') lbOpener?.focus({ preventScroll: true });
}

load();
