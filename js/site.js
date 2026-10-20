// 力歐時尚旅館 前台互動：開場動畫、平滑捲動、進場動畫、訂房視窗、相簿
const { gsap, ScrollTrigger, Lenis, Swiper } = window;
gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
};

// ── 平滑捲動 ─────────────────────────────────────────
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const lockScroll = (on) => {
  document.documentElement.classList.toggle('is-locked', on);
  if (lenis) on ? lenis.stop() : lenis.start();
};

// ── 頁首 ─────────────────────────────────────────────
const header = $('#siteHeader');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const toggle = $('#navToggle');
const menu = $('#mobileMenu');
toggle?.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', open);
  menu.setAttribute('aria-hidden', !open);
  lockScroll(open);
});

// ── 開場 Logo 動畫 ───────────────────────────────────
function pageEnter() {
  const panels = $$('.split-panel');
  if (panels.length) {
    gsap.from('.split-panel .sp-content > *', { y: 40, opacity: 0, duration: 1.1, stagger: 0.06, ease: 'power3.out' });
    gsap.from('.split-center', { scale: 0.6, opacity: 0, duration: 1.2, delay: 0.4, ease: 'expo.out' });
  }
  const hero = $$('[data-hero]');
  if (hero.length) gsap.from(hero, { y: 50, opacity: 0, duration: 1.2, stagger: 0.1, ease: 'power3.out', delay: 0.1 });
}

const intro = $('#intro');
// 每次進入首頁都播放 Logo 開場動畫（可按 SKIP 略過）
if (intro) {
  lockScroll(true);
  const stroke = $('.intro-stroke', intro);
  const len = stroke.getTotalLength();
  gsap.set(stroke, { strokeDasharray: len, strokeDashoffset: len });
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    onComplete: () => { intro.remove(); lockScroll(false); },
  });
  gsap.set('.intro-mark', { scale: 0.55, transformOrigin: '50% 50%' });
  tl.to(stroke, { strokeDashoffset: 0, duration: 2.1 })
    .to('.intro-mark', { scale: 1, duration: 2.6, ease: 'power3.out' }, 0)
    .to('.intro-fill', { opacity: 1, duration: 0.9 }, '-=0.5')
    .to(stroke, { opacity: 0, duration: 0.6 }, '<0.3')
    .from('.intro-en span', { yPercent: 110, opacity: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, '-=0.6')
    .from('.intro-line', { scaleX: 0, duration: 0.9 }, '-=0.5')
    .from('.intro-zh', { opacity: 0, y: 12, letterSpacing: '0.2em', duration: 0.9 }, '-=0.6')
    .to('.intro-mark', { scale: 1.18, duration: 0.9, ease: 'power2.inOut' }, '+=0.3')
    .to('.intro-stage', { opacity: 0, scale: 1.06, duration: 0.7, ease: 'power2.in' }, '-=0.4')
    .to('.intro-left', { xPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.15')
    .to('.intro-right', { xPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
    .add(pageEnter, '-=0.6');
  $('#introSkip').addEventListener('click', () => tl.progress(0.9));
} else {
  intro?.remove();
  if (!reduce) pageEnter();
}

// ── 捲動進場 ─────────────────────────────────────────
if (!reduce) {
  $$('[data-reveal]').forEach((el) => {
    const img = el.dataset.reveal === 'img';
    gsap.from(el, {
      ...(img ? { clipPath: 'inset(12% 12% 12% 12%)', scale: 1.04 } : { y: 36, opacity: 0 }),
      duration: img ? 1.4 : 1,
      ease: img ? 'expo.out' : 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  $$('.b-hero-bg, .sp-bg').forEach((bg) => gsap.fromTo(bg, { scale: 1.12 }, { scale: 1, duration: 3, ease: 'power2.out' }));
  const bh = $('.b-hero-bg');
  if (bh) gsap.to(bh, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.b-hero', start: 'top top', end: 'bottom top', scrub: true } });
}

// ── 首頁房型分頁 ─────────────────────────────────────
$$('.tab').forEach((tab) =>
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => { t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', t === tab); });
    $$('[data-tabpanel]').forEach((p) => {
      const show = p.dataset.tabpanel === tab.dataset.tab;
      p.hidden = !show;
      if (show && !reduce) gsap.from(p.children, { y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
    });
    ScrollTrigger.refresh();
  })
);

// ── 訂房視窗 ─────────────────────────────────────────
// 館別頁面的視窗裡本來就只有該館連結；首頁的「立即訂房」若指定館別，也只顯示該館。
const modal = $('#bookModal');
const title = $('#bookTitle');
let lastFocus = null;
function openBook(branch) {
  const options = $$('.book-option', modal);
  const single = !!branch && options.some((o) => o.dataset.branch === branch);
  options.forEach((o) => (o.hidden = single && o.dataset.branch !== branch));
  modal.classList.toggle('is-single', single || options.length === 1);
  title.textContent = single || options.length === 1 ? title.dataset.titleSingle : title.dataset.titleMulti;
  lastFocus = document.activeElement;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  lockScroll(true);
  $('.book-close', modal).focus();
}
function closeBook() {
  modal.classList.remove('is-open');
  setTimeout(() => (modal.hidden = true), 350);
  lockScroll(false);
  lastFocus?.focus();
}
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-book]');
  if (trigger) {
    e.preventDefault();
    e.stopPropagation();
    openBook(trigger.dataset.book);
  } else if (e.target.closest('[data-close]')) closeBook();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeBook();
});

// ── 館別環境相簿 ─────────────────────────────────────
const gs = $('.gallery-swiper');
if (gs) {
  const bar = $('.g-progress i');
  new Swiper(gs, {
    slidesPerView: 1.15, spaceBetween: 16, centeredSlides: true, loop: true, speed: 900, grabCursor: true,
    autoplay: reduce ? false : { delay: 4500, disableOnInteraction: false },
    breakpoints: { 760: { slidesPerView: 1.6, spaceBetween: 28 }, 1200: { slidesPerView: 2.2, spaceBetween: 36 } },
    navigation: { prevEl: '.g-prev', nextEl: '.g-next' },
    on: { slideChange(s) { bar.style.width = ((s.realIndex + 1) / s.slides.filter((x) => !x.classList.contains('swiper-slide-duplicate')).length) * 100 + '%'; } },
  });
}

// ── 房型相簿＋放大檢視 ───────────────────────────────
const rm = $('#roomMain');
if (rm) {
  const thumbs = new Swiper('#roomThumbs', { slidesPerView: 3.5, spaceBetween: 10, watchSlidesProgress: true, breakpoints: { 760: { slidesPerView: 6 } } });
  const count = $('.rm-count b');
  new Swiper(rm, {
    speed: 800, spaceBetween: 0,
    navigation: { prevEl: '.rm-prev', nextEl: '.rm-next' },
    thumbs: { swiper: thumbs },
    on: { slideChange(s) { count.textContent = s.activeIndex + 1; } },
  });
  // 依實際圖片尺寸設定放大比例
  $$('.room-zoom').forEach((a) => {
    const img = $('img', a);
    // 手機顯示的是小圖，放大時改用原圖（寬 2400）比例計算
    const set = () => { const k = Math.max(1, 2400 / img.naturalWidth); a.dataset.pswpWidth = Math.round(img.naturalWidth * k); a.dataset.pswpHeight = Math.round(img.naturalHeight * k); };
    img.complete ? set() : img.addEventListener('load', set);
  });
  const { default: PhotoSwipeLightbox } = await import('/vendor/photoswipe/photoswipe-lightbox.esm.min.js');
  const lb = new PhotoSwipeLightbox({
    gallery: '#roomPswp', children: 'a', bgOpacity: 0.94,
    pswpModule: () => import('/vendor/photoswipe/photoswipe.esm.min.js'),
  });
  lb.on('beforeOpen', () => lenis?.stop());
  lb.on('destroy', () => lenis?.start());
  lb.init();
}

// ── 語言選單（觸控裝置用點擊開關） ───────────────────
const langDrop = $('#langDrop');
if (langDrop) {
  const btn = $('.lang-btn', langDrop);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !langDrop.classList.contains('is-open');
    langDrop.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', () => { langDrop.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); });
}

// ── 聯絡表單（有設定 Web3Forms 金鑰時，直接寄到信箱；旅客的 E-mail 會設為回覆對象） ──
const cform = $('form[data-web3]');
if (cform) {
  cform.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = cform.dataset;
    const f = Object.fromEntries(new FormData(cform));
    const showErr = (msg) => {
      let p = $('.form-err', cform);
      if (!p) { p = document.createElement('p'); p.className = 'form-err'; cform.prepend(p); }
      p.textContent = msg;
    };
    if (f.website) return;
    if (!f.name.trim()) return showErr(d.errName);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return showErr(d.errContact);
    if (!f.message.trim()) return showErr(d.errMessage);
    const btn = $('button[type=submit]', cform);
    const label = btn.innerHTML;
    btn.disabled = true; btn.textContent = d.sending;
    const branch = $(`input[name=branch][value="${f.branch}"]`, cform)?.closest('label')?.textContent.trim() || '';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: d.web3, subject: `${d.subject}${branch ? '－' + branch : ''}－${f.name}`, from_name: f.name,
          name: f.name, email: f.email || undefined, phone: f.phone, branch, message: f.message,
          language: document.documentElement.lang, page: location.href,
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.message);
      cform.outerHTML = `<div class="form-ok"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 12 5 5L20 6"/></svg><h3>${d.okTitle}</h3><p>${d.okBody}</p></div>`;
    } catch {
      showErr(d.fail); btn.disabled = false; btn.innerHTML = label;
    }
  });
}

// ==========================================================
// v17 動畫加強
// ==========================================================
const lang = document.documentElement.lang;
const cjk = /^(zh|ja|ko)/.test(lang);

if (!reduce) {
  // 1. 標題逐字浮現
  $$('.section-head .h-serif, .page-hero .h-serif, .room-title, .b-intro .h-serif').forEach((h) => {
    if (h.children.length || lang === 'th') return;
    const parts = cjk ? [...h.textContent] : h.textContent.split(/(\s+)/);
    h.innerHTML = parts.map((p) => (/^\s+$/.test(p) ? p : `<span class="ch"><span>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></span>`)).join('');
    h.removeAttribute('data-reveal');
    gsap.killTweensOf(h);
    gsap.set(h, { clearProps: 'all' });
    gsap.from($$('.ch > span', h), {
      yPercent: 110, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: cjk ? 0.035 : 0.06,
      scrollTrigger: { trigger: h, start: 'top 90%', once: true },
    });
  });

  // 3. 圖片視差
  $$('.rr-img img, .philo-img img, .ex-img img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
      yPercent: 6, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // 4. 標題前的金線畫出來
  $$('.section-head, .b-intro-grid').forEach((el) =>
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => el.classList.add('is-in') })
  );
}

// 2. 漂浮花瓣（取自 Logo 葉片）
if (!reduce) {
  const leaf = (c) => `<svg viewBox="-20 -36 40 44"><path d="M0 0C-8-11-7-26 0-33C7-26 8-11 0 0Z" fill="${c}"/></svg>`;
  $$('.page-hero, .b-hero, .cta-band').forEach((host) => {
    const box = document.createElement('div');
    box.className = 'petals';
    box.setAttribute('aria-hidden', 'true');
    const n = host.classList.contains('b-hero') ? 14 : 10;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      const size = 10 + Math.random() * 16;
      p.innerHTML = leaf(Math.random() < 0.6 ? 'rgba(255,170,205,.55)' : 'rgba(232,205,150,.55)');
      Object.assign(p.style, {
        left: Math.random() * 100 + '%', width: size + 'px', height: size * 1.1 + 'px',
        animationDuration: 12 + Math.random() * 14 + 's', animationDelay: -Math.random() * 20 + 's',
        '--drift': (Math.random() * 160 - 80).toFixed(0) + 'px', '--spin': (Math.random() * 540 - 270).toFixed(0) + 'deg',
      });
      box.append(p);
    }
    host.append(box);
  });
}

// 6. 換頁淡出／淡入
const fade = $('#pageFade');
if (fade) {
  requestAnimationFrame(() => fade.classList.remove('is-on'));
  addEventListener('pageshow', (e) => { if (e.persisted) fade.classList.remove('is-on'); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname.startsWith('/admin') || /\.(webp|jpg|png|pdf)$/i.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return;
    if (a.closest('#roomPswp')) return;
    e.preventDefault();
    fade.classList.add('is-on');
    setTimeout(() => (location.href = url.href), 380);
  });
}
