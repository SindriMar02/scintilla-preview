// Product page markup, shared by _build/build.mjs (prerender) and assets/js/product.js (?h= swap).
// Layout literals: TEARDOWN.md Module 23.
export const kr = n => Number(n).toLocaleString('is-IS') + ' kr.';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const src = (n, w) => `/scintilla-preview/assets/img/p/${n}-${w}.webp`;

export function gallery(p) {
  const slides = p.images.map((im, i) => `<a class="slot${im.pack ? ' slot--pack' : ''}" href="${src(im.n, 1200)}" data-lb="${i}" id="m${i}" aria-label="Stækka mynd ${i + 1} af ${p.images.length}">
    <img${i ? ' class="fade" loading="lazy" onload="this.classList.add(\'is-loaded\')"' : ' fetchpriority="high"'} src="${src(im.n, 600)}" srcset="${src(im.n, 600)} 600w, ${src(im.n, 1200)} ${im.w}w" sizes="(max-width: 499px) 100vw, (max-width: 999px) 50vw, ${i ? '25vw' : '50vw'}" width="${im.w}" height="${im.h}" alt="${i ? '' : esc(p.title)}"></a>`).join('');
  return slides;
}

export function dots(p) {
  return p.images.length > 1 ? `<div class="pdp__dots" aria-hidden="true">${p.images.map((_, i) => `<span${i ? '' : ' class="is-on"'}></span>`).join('')}</div>` : '';
}

export function thumbs(p) {
  return p.images.length > 1 ? p.images.map((im, i) => `<button type="button" class="slot${im.pack ? ' slot--pack' : ''}" data-thumb="${i}" aria-label="Mynd ${i + 1}"><img src="${src(im.n, 600)}" width="600" height="${Math.round(600 * im.h / im.w)}" alt="" loading="lazy"></button>`).join('') : '';
}

export function stock(p, v) {
  if (!p.available) return 'Uppselt. Engin útgáfa af þessari vöru er til núna.';
  if (v && !v.available) return 'Þessi útgáfa er uppseld. Veldu aðra hér fyrir ofan.';
  return 'Til á lager. Má setja í körfu.';
}

export function info(p) {
  const first = p.variants.find(v => v.available) || p.variants[0];
  const single = p.variants.length <= 1;
  const badges = [p.isNew ? 'Nýtt' : '', !p.available ? 'Uppselt' : ''].filter(Boolean);
  const copy = p.is
    ? `<div class="pdp__copy"><p>${esc(p.is[0])}</p><ul>${p.is[1].map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>
       <details class="pdp__en"><summary>Upprunalegur texti (enska)</summary><div lang="en">${p.en.map(l => `<p>${esc(l)}</p>`).join('')}</div></details>`
    : `<div class="pdp__copy" ${/[ðþæöáéíóúý]/i.test(p.en.join(' ')) ? '' : 'lang="en"'}>${p.en.map(l => `<p>${esc(l)}</p>`).join('')}</div>`;
  return `
  <nav class="crumbs" aria-label="Brauðmolar"><a href="/scintilla-preview/">Forsíða</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.title)}</span></nav>
  ${badges.length ? `<div class="pdp__badges">${badges.map(b => `<span>${b}</span>`).join('')}</div>` : ''}
  <div class="pdp__top"><h1 class="pdp__title">${esc(p.title)}</h1><p class="pdp__price" data-price>${kr(first?.price ?? p.price)}</p></div>
  <form class="pdp__form" data-buy>
    ${single ? '' : `<fieldset class="variants"><legend>${/fyllingu/.test(p.variants[0].name) ? 'Fylling' : /cm/.test(p.variants[0].name) ? 'Stærð' : 'Litur'}</legend>
      ${p.variants.map(v => `<label class="${v.available ? '' : 'is-out'}"><input type="radio" name="variant" value="${v.id}" data-p="${v.price}" data-a="${v.available ? 1 : 0}"${v === first ? ' checked' : ''}><span>${esc(v.name)}${v.available ? '' : '<span class="sr-only">, uppselt</span>'}</span></label>`).join('')}
    </fieldset>`}
    <button class="btn pdp__buy" type="submit" data-buy-btn${first?.available ? '' : ' disabled'}>${first?.available ? 'Setja í körfu' : 'Uppselt'}</button>
    <p class="pdp__stock${first?.available ? '' : ' is-out'}" data-stock aria-live="polite">${stock(p, first)}</p>
  </form>
  ${copy}`;
}
