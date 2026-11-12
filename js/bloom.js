// 力歐時尚旅館「花漾版」前台互動
// 速度原則：
//   1. 頁面先顯示，再做動畫；動畫只動 transform／opacity。
//   2. 大型套件（three.js 3D 花瓣、Atropos 立體視差）等頁面完全開好、瀏覽器有空時才在背景載入，
//      而且只在電腦版載入；手機或「節省流量」模式不下載。
const { gsap, ScrollTrigger, SplitText, Swiper } = window;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)').matches;
const saveData = !!(navigator.connection && navigator.connection.saveData);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const lang = document.documentElement.lang;
const charSplit = /^(zh|ja)/.test(lang); // 中文、日文逐字；其他語言逐詞；泰文不拆
const noSplit = lang === 'th';
const animate = !!gsap && !reduce;
// 目前的風格代號：bloom 花漾／mag 雜誌／city 台北城市／trip 旅行手帳
const S = (document.body.className.match(/style-([a-z]+)/) || [])[1] || 'bloom';
if (!animate) document.documentElement.classList.remove('js');

const lockScroll = (on) => document.documentElement.classList.toggle('is-locked', on);

// ── 頁首 ─────────────────────────────────────────────
const header = $('#siteHeader');
const topBtn = Object.assign(document.createElement('button'), { className: 'bl-top', type: 'button', innerHTML: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg>' });
topBtn.setAttribute('aria-label', 'Top');
topBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
document.body.append(topBtn);
let ticking = false;
const onScroll = () => {
  header.classList.toggle('is-scrolled', scrollY > 20);
  topBtn.classList.toggle('is-on', scrollY > 700);
  ticking = false;
};
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

const toggle = $('#navToggle');
const menu = $('#mobileMenu');
toggle?.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open);
  toggle.setAttribute('aria-expanded', open);
  menu.setAttribute('aria-hidden', !open);
  lockScroll(open);
  if (open && animate) gsap.fromTo($$('nav > *, .m-langs, .m-contact', menu), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.045, ease: 'power3.out', delay: 0.15 });
});

// ── 訂房視窗 ─────────────────────────────────────────
// 館別頁面的視窗裡本來就只有該館連結；首頁按某一館的「立即訂房」，也只顯示該館。
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
  lastFocus?.focus?.();
}
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-book]');
  if (trigger) { e.preventDefault(); e.stopPropagation(); openBook(trigger.dataset.book); }
  else if (e.target.closest('[data-close]')) closeBook();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeBook();
  if (e.key === 'Enter' && e.target.matches?.('span[data-book]')) { e.preventDefault(); openBook(e.target.dataset.book); }
});

// ── 語言選單 ─────────────────────────────────────────
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

// ── 館別環境相簿 ─────────────────────────────────────
const gs = $('.gallery-swiper');
if (gs && Swiper) {
  const bar = $('.g-progress i');
  const total = $$('.swiper-slide', gs).length;
  new Swiper(gs, {
    slidesPerView: 1.2, spaceBetween: 14, centeredSlides: true, loop: true, speed: 900, grabCursor: true,
    autoplay: reduce ? false : { delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true },
    breakpoints: { 760: { slidesPerView: 1.8, spaceBetween: 24 }, 1200: { slidesPerView: 2.4, spaceBetween: 32 } },
    navigation: { prevEl: '.g-prev', nextEl: '.g-next' },
    on: { slideChange(s) { bar.style.width = ((s.realIndex + 1) / total) * 100 + '%'; } },
  });
}

// ── 房型相簿＋放大檢視 ───────────────────────────────
const rm = $('#roomMain');
if (rm && Swiper) {
  const thumbs = new Swiper('#roomThumbs', { slidesPerView: 3.5, spaceBetween: 10, watchSlidesProgress: true, breakpoints: { 760: { slidesPerView: 6 } } });
  const count = $('.rm-count b');
  new Swiper(rm, {
    speed: 800, spaceBetween: 0,
    navigation: { prevEl: '.rm-prev', nextEl: '.rm-next' },
    thumbs: { swiper: thumbs },
    on: { slideChange(s) { count.textContent = s.activeIndex + 1; } },
  });
  $$('.room-zoom').forEach((a) => {
    const img = $('img', a);
    const set = () => { const k = Math.max(1, 2400 / img.naturalWidth); a.dataset.pswpWidth = Math.round(img.naturalWidth * k); a.dataset.pswpHeight = Math.round(img.naturalHeight * k); };
    img.complete ? set() : img.addEventListener('load', set);
  });
  // 放大檢視的程式等使用者真的要用時才載入
  import('/vendor/photoswipe/photoswipe-lightbox.esm.min.js').then(({ default: PhotoSwipeLightbox }) => {
    new PhotoSwipeLightbox({ gallery: '#roomPswp', children: 'a', bgOpacity: 0.94, pswpModule: () => import('/vendor/photoswipe/photoswipe.esm.min.js') }).init();
  });
}

// ── 聯絡表單（Web3Forms：直接寄到信箱；旅客的 E-mail 會設為回覆對象） ──
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
// 動畫
// ==========================================================
// 把標題拆成一個個字（或詞），之後可以逐字升起
function split(el) {
  if (noSplit || !SplitText || el.children.length) return null;
  try {
    const type = charSplit ? 'chars' : 'words';
    const s = SplitText.create(el, { type, mask: type });
    return s[type];
  } catch { return null; }
}
function riseText(el, opts = {}) {
  const parts = split(el);
  gsap.set(el, { opacity: 1 });
  if (parts) return gsap.fromTo(parts, { yPercent: 115 }, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: charSplit ? 0.06 : 0.08, ...opts });
  return gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', ...opts });
}

// 頁面最上方的進場
let entered = false;
function enter() {
  if (entered) return;
  entered = true;
  $$('[data-split], .page-hero .h-serif, .room-title').forEach((el, i) => riseText(el, { delay: 0.05 + i * 0.1 }));
  const arches = $$('[data-arch]');
  if (arches.length) {
    gsap.fromTo(arches, { opacity: 0, y: 70, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'expo.out', stagger: 0.18 });
    gsap.fromTo('.bl-arch img', { scale: 1.3 }, { scale: 1, duration: 2.2, ease: 'power3.out' });
    if (S === 'trip') gsap.fromTo('.bl-hero-media > .bl-badge', { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.45, ease: 'power4.in', delay: 1.1 });
    else gsap.fromTo('.bl-hero-media > .bl-badge', { scale: 0, rotate: -120 }, { scale: 1, rotate: 0, duration: 1.2, ease: 'back.out(1.6)', delay: 0.7 });
  }
  gsap.fromTo('[data-hero]', { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, delay: 0.2 });
  if (S === 'city') cityMap();
  if (S === 'trip') {
    gsap.fromTo('.bl-home-badge .bl-badge', { scale: 2.6, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.45, ease: 'power4.in', delay: 1.2 });
    gsap.fromTo('.bl-snap', { opacity: 0, y: -90, rotation: (i) => (i % 2 ? 40 : -40) }, { opacity: 1, y: 0, rotation: 0, duration: 1.2, ease: 'bounce.out', stagger: 0.16, delay: 0.5 });
  } else if ($('.bl-home-badge')) gsap.fromTo('.bl-home-badge .bl-badge', { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, duration: 1.3, ease: 'back.out(1.5)', delay: 0.6 });
}

if (animate) {
  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);

  // 1. 開場（首頁）：Logo 描線 → 上色 → 粉色布幕向上收起
  const intro = $('#intro');
  if (intro) {
    lockScroll(true);
    const path = $('path', intro);
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    const tl = gsap.timeline({ onComplete: () => { intro.remove(); lockScroll(false); } });
    tl.to(path, { strokeDashoffset: 0, duration: 1.25, ease: 'power2.inOut' })
      .to(path, { fillOpacity: 1, duration: 0.45, ease: 'power1.out' }, '-=0.35')
      .from('.bl-intro-en', { yPercent: 120, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.75')
      .from('.bl-intro-zh', { opacity: 0, y: 10, duration: 0.5 }, '-=0.35')
      .to('.bl-intro-mark', { scale: 1.12, duration: 0.5, ease: 'power2.in' }, '+=0.1')
      .to(intro, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '-=0.25')
      .add(enter, '-=0.55');
    intro.addEventListener('click', () => tl.timeScale(5));
  } else enter();

  // 2. 頂端捲動進度條
  const bar = Object.assign(document.createElement('div'), { className: 'bl-progress' });
  document.body.append(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // 3. 館別介紹大標：隨捲動逐字由淡轉深
  $$('.b-intro .h-serif').forEach((h) => {
    h.removeAttribute('data-reveal');
    const parts = split(h);
    if (!parts) return h.setAttribute('data-reveal', '');
    gsap.fromTo(parts, { opacity: 0.16 }, { opacity: 1, ease: 'none', stagger: 0.06, scrollTrigger: { trigger: h, start: 'top 88%', end: 'top 42%', scrub: 0.4 } });
  });

  // 4. 區塊標題逐字升起
  $$('.section-head .h-serif, .cta-inner .h-serif, .svc-intro .h-serif').forEach((h) => {
    const parts = split(h);
    if (parts) gsap.from(parts, { yPercent: 115, duration: 0.95, ease: 'power4.out', stagger: charSplit ? 0.045 : 0.07, scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
  });

  // 5. 捲動進場（一批一批處理，比每個元素各自監聽省資源）
  const texts = $$('[data-reveal]:not([data-reveal="img"])');
  const imgs = $$('[data-reveal="img"]');
  gsap.set(texts, { opacity: 0, y: 36 });
  const wipe = { mag: 'inset(0% 100% 0% 0%)' }[S]; // 雜誌版：照片由左往右滑開
  const drop = S === 'trip'; // 手帳版：拍立得從上方落下、晃一下停住
  if (wipe) gsap.set(imgs, { clipPath: wipe });
  else if (drop) gsap.set(imgs, { opacity: 0, y: -70, rotation: (i) => (i % 2 ? 14 : -14) });
  else gsap.set(imgs, { opacity: 0, scale: 0.9, rotate: (i) => (S === 'bloom' ? (i % 2 ? 2.5 : -2.5) : 0) });
  ScrollTrigger.batch(texts, { start: 'top 92%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.08, overwrite: true }) });
  ScrollTrigger.batch(imgs, { start: 'top 88%', once: true, onEnter: (els) => gsap.to(els, wipe ? { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', stagger: 0.15, overwrite: true } : drop ? { opacity: 1, y: 0, rotation: 0, duration: 1.1, ease: 'elastic.out(1, 0.6)', stagger: 0.14, overwrite: true } : { opacity: 1, scale: 1, rotate: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12, overwrite: true }) });

  // 6. 小卡片一張張彈出（設施、特色、常見問題、交通資訊）
  ['.feat-grid', '.faq-list', '.loc-list', '.rr-feats', '.pillars', '.facts'].forEach((sel) =>
    $$(sel).forEach((box) => {
      box.removeAttribute('data-reveal');
      gsap.set(box, { opacity: 1, y: 0 });
      gsap.from(box.children, { opacity: 0, y: 26, scale: 0.94, duration: 0.7, ease: 'back.out(1.4)', stagger: 0.06, scrollTrigger: { trigger: box, start: 'top 90%', once: true } });
    })
  );

  // 7. 大數字 01 02 03 滑入
  $$('.rr-num').forEach((n) => {
    n.removeAttribute('data-reveal');
    gsap.fromTo(n, { opacity: 0, x: -50 }, { opacity: 1, x: 0, y: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 92%', once: true } });
  });

  // 8. 圖片視差（只在電腦版，手機省電）
  if (desktop) {
    if (S !== 'trip') $$('.bl-arch img').forEach((img) => gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    if (S !== 'trip') $$('.philo-img img').forEach((img) => gsap.fromTo(img, { yPercent: -5, scale: 1.14 }, { yPercent: 5, scale: 1.14, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('.bl-hero-mini').forEach((m) => gsap.to(m, { y: -60, ease: 'none', scrollTrigger: { trigger: '.bl-hero', start: 'top top', end: 'bottom top', scrub: true } }));
    const foot = $('.site-footer');
    if (foot) gsap.fromTo(foot, { '--fx': '-8%' }, { '--fx': '8%', ease: 'none', scrollTrigger: { trigger: foot, start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  // 9. 跟著滑鼠的「進入」小球（電腦版；花漾版與雜誌版）
  if (desktop && (S === 'bloom' || S === 'mag')) {
    const cur = Object.assign(document.createElement('div'), { className: 'bl-cursor', innerHTML: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16M14 6l6 6-6 6"/></svg>' });
    cur.setAttribute('aria-hidden', 'true');
    document.body.append(cur);
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    const hot = '.bl-door-frame, .rc-img, a.rr-img, .bp-img, .oc-img, .nc-img';
    addEventListener('pointermove', (e) => {
      xTo(e.clientX); yTo(e.clientY);
      cur.classList.toggle('is-on', !!e.target.closest?.(hot));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  }

  // 9b. 首頁第一屏的標題與地圖在兩種版面各有一份，隱藏的那份不需要動畫
  // 10. 手機／平板：用輕量的 CSS 花瓣；電腦版改用下方的 3D 花瓣
  if (S === 'bloom' && (!desktop || saveData)) cssPetals();

  // 11. 雜誌版：館別頁的房型卡片改成「往下捲＝橫向滑過」
  const hgrid = S === 'mag' && desktop ? $('.page-branch .room-grid') : null;
  if (hgrid && hgrid.children.length >= 3) {
    hgrid.classList.add('is-h');
    const dist = () => Math.max(0, hgrid.scrollWidth - hgrid.parentElement.clientWidth + 40);
    gsap.to(hgrid, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: hgrid.closest('.section'), start: 'center center', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true } });
    // 釘住的區塊會把後面的內容往下推，重新排序讓後面的進場動畫位置正確
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

} else if ($('#intro')) $('#intro').remove();

function cssPetals() {
  const leaf = (c) => `<svg viewBox="-20 -36 40 44"><path d="M0 0C-8-11-7-26 0-33C7-26 8-11 0 0Z" fill="${c}"/></svg>`;
  $$('.bl-home, .bl-hero:not(.is-sub), .cta-band').forEach((host) => {
    const box = document.createElement('div');
    box.className = 'petals';
    box.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('i');
      const size = 12 + Math.random() * 14;
      p.innerHTML = leaf(Math.random() < 0.7 ? 'rgba(239,150,185,.6)' : 'rgba(226,196,140,.6)');
      Object.assign(p.style, { left: Math.random() * 100 + '%', width: size + 'px', height: size * 1.1 + 'px', animationDuration: 13 + Math.random() * 12 + 's', animationDelay: -Math.random() * 20 + 's' });
      p.style.setProperty('--drift', (Math.random() * 160 - 80).toFixed(0) + 'px');
      p.style.setProperty('--spin', (Math.random() * 540 - 270).toFixed(0) + 'deg');
      box.append(p);
    }
    host.append(box);
  });
}

// ==========================================================
// 大型套件：頁面開好之後才在背景載入（不影響開頁速度）
// ==========================================================
const whenIdle = (fn) => {
  const run = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 800));
  document.readyState === 'complete' ? run() : addEventListener('load', run, { once: true });
};

if (animate && desktop && !saveData && S === 'bloom') {
  whenIdle(() => {
    // Atropos：首頁兩扇拱門跟著滑鼠立體傾斜，照片與編號有前後層次
    const doors = $$('.bl-door');
    if (doors.length) {
      import('/vendor/atropos/atropos.min.mjs').then(({ default: Atropos }) => {
        doors.forEach((door) => Atropos({ el: $('.atropos', door), eventsEl: door, activeOffset: 26, shadow: false, highlight: false, rotateXMax: 10, rotateYMax: 12, duration: 500 }));
      }).catch(() => {});
    }
    // three.js：3D 花瓣（有遠近、會旋轉、會被滑鼠輕輕帶動）
    const host = $('.bl-home, .bl-hero:not(.is-sub), .page-hero');
    if (host) petals3D(host).catch(() => cssPetals());
  });
}

async function petals3D(host) {
  const T = await import('/vendor/three/three.module.min.js');
  const canvas = document.createElement('canvas');
  canvas.className = 'bl-gl';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  host.append(canvas);

  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(40, 1, 0.1, 80);
  cam.position.z = 16;

  // 花瓣形狀（與 Logo 葉片相同的水滴形）
  const s = new T.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.34, 0.42, -0.3, 1.0, 0, 1.3);
  s.bezierCurveTo(0.3, 1.0, 0.34, 0.42, 0, 0);
  const geo = new T.ShapeGeometry(s, 10);
  geo.translate(0, -0.65, 0);
  // 讓花瓣微微彎曲，旋轉時才有立體感
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.pow(pos.getX(i), 2) * 0.9 + Math.pow(pos.getY(i), 2) * 0.12);
  const mat = new T.MeshBasicMaterial({ side: T.DoubleSide, transparent: true, opacity: 0.78, depthWrite: false });
  const N = 64;
  const mesh = new T.InstancedMesh(geo, mat, N);
  const palette = ['#f6a6c4', '#f9c3d6', '#ee8fb3', '#fbd9e4', '#e8c98f'].map((c) => new T.Color(c));
  const tan = Math.tan((cam.fov * Math.PI) / 360);
  let aspect = 1;
  const half = (z) => { const h = tan * (cam.position.z - z); return [h * aspect, h]; };
  const P = Array.from({ length: N }, (_, i) => {
    mesh.setColorAt(i, palette[i % palette.length]);
    return { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: -8 + Math.random() * 14, v: 0.035 + Math.random() * 0.05, ph: Math.random() * 6.28, rx: Math.random() * 6.28, ry: Math.random() * 6.28, rz: Math.random() * 6.28, sp: 0.4 + Math.random() * 0.9, sc: 0.22 + Math.random() * 0.3 };
  });
  scene.add(mesh);

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    aspect = w / h;
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(host);

  let mx = 0, wind = 0;
  addEventListener('pointermove', (e) => { mx = (e.clientX / innerWidth) * 2 - 1; }, { passive: true });

  const d = new T.Object3D();
  let visible = true, last = performance.now(), raf = 0;
  const frame = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    wind += (mx - wind) * 0.03;
    for (let i = 0; i < N; i++) {
      const p = P[i];
      p.y -= p.v * dt * 1.6;
      p.x += (Math.sin(t * 0.6 + p.ph) * 0.02 + wind * 0.06) * dt;
      if (p.y < -1.15) { p.y = 1.15; p.x = Math.random() * 2 - 1; }
      if (p.x > 1.2) p.x = -1.2; else if (p.x < -1.2) p.x = 1.2;
      const [hw, hh] = half(p.z);
      d.position.set(p.x * hw, p.y * hh, p.z);
      d.rotation.set(p.rx + t * p.sp, p.ry + t * p.sp * 0.7, p.rz + Math.sin(t + p.ph) * 0.6);
      d.scale.setScalar(p.sc);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  // 捲出畫面或切到別的分頁時暫停，不浪費效能
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(host);
  document.addEventListener('visibilitychange', kick);
  kick();
  gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1.6 });
}

// 台北城市版首頁：地圖道路與路線一筆一筆畫出來，圖釘落下
function cityMap() {
  const map = $('.city-map');
  if (!map) return;
  const tl = gsap.timeline({ delay: 0.2 });
  $$('.cm-road, .cm-route', map).forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: p.classList.contains('cm-route') ? '10 ' + len : len, strokeDashoffset: len }); });
  tl.to($$('.cm-road', map), { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.12 })
    .fromTo($$('.cm-place', map), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.8')
    .fromTo($$('.cm-pin', map), { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.9, ease: 'bounce.out', stagger: 0.25 }, '-=0.3')
    .add(() => { const r = $('.cm-route', map); gsap.set(r, { strokeDasharray: '2 12', strokeDashoffset: 0 }); gsap.fromTo(r, { opacity: 0 }, { opacity: 1, duration: 0.6 }); gsap.to(r, { strokeDashoffset: -140, duration: 6, ease: 'none', repeat: -1 }); }, '-=0.2');
}

// 台北城市版首頁：滑到卡片時地圖上對應的圖釘放大，反之亦然
$$('.city-card, .cm-link').forEach((el) => {
  const id = (el.className.baseVal ?? el.className).match(/(?:cc|cm)-(zhanqian|ximen)/)?.[1];
  const pair = $$('.cc-' + id + ', .cm-' + id);
  el.addEventListener('pointerenter', () => pair.forEach((p) => p.classList.add('is-hot')));
  el.addEventListener('pointerleave', () => pair.forEach((p) => p.classList.remove('is-hot')));
});
