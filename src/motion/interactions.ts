// Page-level motion: the cluster, section heads, the case index, the statement, the Kit scroller,
// the header and the mobile menu. Everything registers through onPage so it is reverted on navigation.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, onScroll, scrollToTarget, stopScroll, startScroll, prefersReducedMotion, isTouch, isMobile, ease } from '../engine';
import { sun } from './sun';
import { webglOK } from '../kit3d/gl-check';
import { REVEAL_START, onScreenAtStart } from '../engine/reveal';

const reduced = () => prefersReducedMotion();

export function initInteractions() {
  // Loader cells read the real progress through a CSS variable.
  const loader = document.getElementById('loader');
  if (loader) {
    const count = loader.querySelector('[data-loader-count]');
    if (count) new MutationObserver(() => loader.style.setProperty('--p', String(Number(count.textContent) / 100))).observe(count, { childList: true });
  }

  // Same-page section links scroll with Lenis instead of jumping (and never trigger a page swap).
  addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !url.hash || url.pathname !== location.pathname) return;
    const target = document.querySelector<HTMLElement>(url.hash);
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
    scrollToTarget(target);
    history.replaceState(null, '', url.hash);
    target.setAttribute('tabindex', '-1');
    setTimeout(() => target.focus({ preventScroll: true }), reduced() ? 0 : 900);
  }, true);

  // Header: steps aside while reading down, returns on the way up. Inverts over the ink footer.
  let lastY = 0;
  onScroll(({ y }) => {
    const hdr = document.querySelector<HTMLElement>('[data-hdr]');
    if (!hdr) return;
    const down = y > lastY + 4;
    const up = y < lastY - 4;
    hdr.classList.toggle('is-scrolled', y > 40);
    if (y < 120 || up) hdr.classList.remove('is-hidden');
    else if (down && !document.documentElement.classList.contains('menu-open')) hdr.classList.add('is-hidden');
    lastY = y;
  });

  onPage(({ intro }) => {
    const off: (() => void)[] = [];
    const hdr = document.querySelector<HTMLElement>('[data-hdr]');
    hdr?.classList.remove('is-hidden');

    // Mobile menu
    const btn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
    const toggle = () => (document.documentElement.classList.contains('menu-open') ? closeMenu() : openMenu());
    btn?.addEventListener('click', toggle);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(true); };
    addEventListener('keydown', esc);
    off.push(() => { btn?.removeEventListener('click', toggle); removeEventListener('keydown', esc); closeMenu(); });

    // Header marks the section in view on the home page.
    document.querySelectorAll<HTMLElement>('[data-section]').forEach((sec) => {
      const id = sec.dataset.section!;
      ScrollTrigger.create({
        trigger: sec, start: 'top 45%', end: 'bottom 45%',
        onToggle: (self) => {
          document.querySelectorAll(`.hdr__nav [data-verb="${id}"]`).forEach((a) => a.classList.toggle('is-here', self.isActive));
          if (id === 'gather') hdr?.classList.toggle('is-on-ink', self.isActive);
        },
      });
    });

    // Section heads and anything marked data-set: lowered into place.
    if (!reduced()) {
      document.querySelectorAll<HTMLElement>('[data-set]').forEach((el) => {
        gsap.set(el, { visibility: 'visible' });
        if (onScreenAtStart(el)) return; // in view at load: already set down
        gsap.from(el, {
          yPercent: -30, autoAlpha: 0, duration: 0.7, ease: 'set', delay: parseFloat(el.dataset.delay || '0'),
          scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
        });
      });
    }

    // Decode images before they scroll into view, so a reveal never waits on (or stutters for) a decode.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); (e.target as HTMLImageElement).decode?.().catch(() => {}); }
      }, { rootMargin: '1200px 0px' });
      document.querySelectorAll<HTMLImageElement>('main img').forEach((img) => io.observe(img));
      off.push(() => io.disconnect());
    }

    cluster(intro, off);
    kitCluster(off);
    tileTurns(off);
    turners(off);
    heroLoop(off);
    cardLoops(off);
    timeline();
    marks();
    statement();
    caseIndex(off);
    kitScroll();

    return () => off.forEach((f) => f());
  });
}

// Everything except the menu and its Close button: Tab cannot reach it and screen readers skip it.
function setBehind(on: boolean) {
  document.querySelectorAll<HTMLElement>('.skip-link, .hdr__home, .hdr__nav, #main, .ftr').forEach((el) => { el.inert = on; });
}

function openMenu() {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
  if (!menu || !btn) return;
  menu.hidden = false;
  document.documentElement.classList.add('menu-open');
  setBehind(true);
  // The page behind holds still while the menu is open; the menu scrolls on its own (data-lenis-prevent).
  stopScroll();
  btn.setAttribute('aria-expanded', 'true');
  btn.querySelector('.hdr__menu-label')!.textContent = 'Close';
  if (!reduced()) {
    gsap.fromTo(menu, { yPercent: -100 }, { yPercent: 0, duration: 0.75, ease: ease.inOut });
    gsap.fromTo(menu.querySelectorAll('li'), { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'set', stagger: 0.04, delay: 0.2 });
  }
  menu.querySelector<HTMLElement>('a')?.focus();
}

function closeMenu(refocus = false) {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
  if (!menu || menu.hidden || !btn) return;
  document.documentElement.classList.remove('menu-open');
  setBehind(false);
  startScroll();
  btn.setAttribute('aria-expanded', 'false');
  btn.querySelector('.hdr__menu-label')!.textContent = 'Menu';
  const done = () => { menu.hidden = true; if (refocus) btn.focus(); };
  if (reduced()) done();
  else gsap.to(menu, { yPercent: -100, duration: 0.5, ease: ease.inOut, onComplete: done });
}

// The hero cluster: modules are lowered in at load; hovering or focusing a verb lowers its module
// again and lets it keep its colour while the others go back to bare concrete.
function cluster(intro: gsap.core.Timeline, off: (() => void)[]) {
  const box = document.querySelector<HTMLElement>('[data-cluster]');
  if (!box) return;
  const hero = box.closest<HTMLElement>('.hero') || box;
  const links = [...document.querySelectorAll<HTMLAnchorElement>('.hv[data-verb]')];
  const recastBtn = document.querySelector<HTMLButtonElement>('[data-recast]');
  const use3d = webglOK();
  const desktopish = !isMobile() && !isTouch();
  let kit: import('../kit3d/kit3d').Kit3D | null = null;
  let dead = false;
  const triggers: ScrollTrigger[] = [];

  let active = '';
  const activate = (id: string) => {
    if (id === active) return;
    active = id;
    links.forEach((a) => a.classList.toggle('is-active', a.dataset.verb === id));
    kit?.focus(id as never);
  };
  const clear = () => {
    active = '';
    links.forEach((a) => a.classList.remove('is-active'));
    kit?.focus(null);
  };
  for (const a of links) {
    const on = () => activate(a.dataset.verb!);
    a.addEventListener('pointerenter', on);
    a.addEventListener('focus', on);
    a.addEventListener('pointerleave', clear);
    a.addEventListener('blur', clear);
    off.push(() => { a.removeEventListener('pointerenter', on); a.removeEventListener('focus', on); a.removeEventListener('pointerleave', clear); a.removeEventListener('blur', clear); });
  }

  // Caption hand-off as the hero scrolls away (the drawing opens into an exploded view).
  if (!reduced() && desktopish) {
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 20%', scrub: 1 } })
      .to('.hero__caption', { autoAlpha: 0, ease: 'none', duration: 0.2 }, 0.1)
      .fromTo('[data-exploded]', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.3 }, 0.15)
      .set({}, {}, 1);
  }

  if (use3d) {
    // The real thing: the 3D plaza. A render of the empty plate holds the place until it is ready.
    box.classList.add('is-3d');
    const gl = document.createElement('div');
    gl.className = 'cluster__gl';
    box.appendChild(gl);
    let introPlayed = false;
    if (!reduced()) intro.add(() => { introPlayed = true; kit?.drop(); }, 0.05);
    import('../kit3d/kit3d').then(({ Kit3D }) => {
      if (dead) return;
      kit = new Kit3D(gl, { reduced: reduced(), touch: isTouch(), mobile: isMobile(), sunAngle: () => sun.angle, pointerX: () => sun.px });
      kit.onHover = (id) => (id ? activate(id) : clear());
      kit.onPick = (id) => links.find((l) => l.dataset.verb === id)?.click();
      kit.onDisplaced = (d) => {
        if (!recastBtn) return;
        if (d) { recastBtn.hidden = false; gsap.fromTo(recastBtn, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: ease.out }); }
        else gsap.to(recastBtn, { autoAlpha: 0, duration: 0.3, onComplete: () => { recastBtn.hidden = true; } });
      };
      gl.querySelector('canvas')?.addEventListener('webglcontextlost', () => {
        if (dead) return;
        kit?.dispose(); kit = null; gl.remove(); box.classList.remove('is-3d', 'is-3d-ready');
      }, { once: true });
      requestAnimationFrame(() => box.classList.add('is-3d-ready'));
      if (reduced()) kit.settleAll();
      else if (introPlayed || document.documentElement.classList.contains('is-loaded') && intro.progress() > 0) kit.drop();
      triggers.push(ScrollTrigger.create({ trigger: gl, start: 'top bottom', end: 'bottom top', onToggle: (st) => kit?.setVisible(st.isActive) }));
      if (!reduced() && desktopish) {
        triggers.push(ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom 20%', onUpdate: (st) => kit?.setExplode(st.progress) }));
      }
    }).catch(() => box.classList.remove('is-3d'));
    const recast = () => kit?.recast();
    recastBtn?.addEventListener('click', recast);
    off.push(() => { dead = true; recastBtn?.removeEventListener('click', recast); triggers.forEach((t) => t.kill()); kit?.dispose(); kit = null; gl.remove(); });
    return;
  }

  // Without WebGL the full render of the plaza stands in (see Cluster.astro); the verb list still drives focus.
}

// Sit: the paragraph reads normally, then its three behaviours are marked in, one after another.
function marks() {
  document.querySelectorAll<HTMLElement>('[data-marks]').forEach((p) => {
    const hl = p.querySelectorAll<HTMLElement>('.hl');
    if (reduced()) { gsap.set(hl, { backgroundSize: '100% 0.5em' }); return; }
    gsap.to(hl, { backgroundSize: '100% 0.5em', duration: 0.75, ease: 'power2.inOut', stagger: 0.45, delay: 0.35,
      scrollTrigger: { trigger: p, start: 'top 72%', once: true } });
  });
}

// About: the timeline rail draws itself as you read down it.
function timeline() {
  const fill = document.querySelector<HTMLElement>('.tl__fill');
  if (!fill || reduced()) return;
  gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 75%', end: 'bottom 60%', scrub: 0.4 } });
}

// Kit modules beside section heads turn through a short swing as you scroll past them.
// The sprite (15 frames) is fetched only when the head comes near; until it is decoded the still shows.
function turners(off: (() => void)[]) {
  if (reduced()) return;
  const els = [...document.querySelectorAll<HTMLElement>('.kmod[data-turn]')];
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target as HTMLElement;
      const img = new Image();
      img.src = el.dataset.turn!;
      img.decode().then(() => {
        el.style.backgroundImage = `url(${img.src})`;
        const set = (p: number) => {
          const k = Math.round(p * 14);
          el.style.backgroundPosition = `${(k % 5) * 25}% ${Math.floor(k / 5) * 50}%`;
        };
        const st = ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onUpdate: (s) => set(s.progress) });
        set(st.progress);
        el.classList.add('is-turning');
        off.push(() => st.kill());
      }).catch(() => {});
    }
  }, { rootMargin: '600px 0px' });
  els.forEach((el) => io.observe(el));
  off.push(() => io.disconnect());
}

// Build strip: pointing at a tile turns its module through the swing and back to rest (frame 7).
function tileTurns(off: (() => void)[]) {
  if (reduced() || isTouch()) return;
  document.querySelectorAll<HTMLElement>('[data-tile-turn]').forEach((tile) => {
    let layer: HTMLElement | null = null;
    const st = { f: 7 };
    const draw = () => { if (layer) { const k = Math.round(st.f); layer.style.backgroundPosition = `${(k % 5) * 25}% ${Math.floor(k / 5) * 50}%`; } };
    const ready = () => {
      if (layer) return Promise.resolve();
      const img = new Image(); img.src = tile.dataset.tileTurn!;
      return img.decode().then(() => { layer = document.createElement('span'); layer.className = 'strip__turn'; layer.style.backgroundImage = `url(${img.src})`; tile.appendChild(layer); draw(); layer.classList.add('is-on'); });
    };
    const on = () => { ready().then(() => { gsap.killTweensOf(st); gsap.timeline().to(st, { f: 14, duration: 0.55, ease: 'power2.out', onUpdate: draw }).to(st, { f: 0, duration: 1.1, ease: 'power2.inOut', onUpdate: draw }).to(st, { f: 7, duration: 0.6, ease: 'power2.out', onUpdate: draw }); }).catch(() => {}); };
    const leave = () => { gsap.to(st, { f: 7, duration: 0.5, ease: 'power2.out', overwrite: true, onUpdate: draw }); };
    tile.addEventListener('pointerenter', on); tile.addEventListener('pointerleave', leave);
    off.push(() => { tile.removeEventListener('pointerenter', on); tile.removeEventListener('pointerleave', leave); gsap.killTweensOf(st); layer?.remove(); });
  });
}

// Build: the live Kit cluster. Loaded only as the section comes near, run only while it is on screen,
// and assembled by scroll. The stage pins once the Kit is fully on screen (centred, or at the top if it
// is taller than the window), and the next stretch of scroll puts it together while you watch, then
// the page moves on. Desktop pins the Kit with its text; phones pin the Kit alone.
function kitCluster(off: (() => void)[]) {
  const box = document.querySelector<HTMLElement>('[data-kit-cluster]');
  if (!box || !webglOK()) return;
  const label = box.querySelector<HTMLElement>('[data-kit-piece]');
  let kit: import('../kit3d/cluster').KitCluster | null = null;
  let dead = false;
  let progress = reduced() ? 1 : 0;
  const triggers: ScrollTrigger[] = [];
  // The pin is set up now, not when the 3D arrives, so the page below never shifts under the reader.
  const mm = gsap.matchMedia();
  if (!reduced()) {
    const stage = box.closest<HTMLElement>('.build__stage') ?? box;
    mm.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)' }, (c) => {
      const el = c.conditions?.wide ? stage : box;
      ScrollTrigger.create({
        // No anticipatePin: it pins a frame early to beat native scrolling, and with Lenis that early
        // pin is a visible snap that Lenis then glides back out of.
        trigger: el, pin: true, scrub: 0.6, invalidateOnRefresh: true,
        start: () => (el.offsetHeight > innerHeight * 0.92 ? 'top top' : 'center center'),
        end: () => `+=${Math.round(innerHeight * 1.1)}`,
        onUpdate: (st) => { progress = st.progress; kit?.setProgress(progress); },
        onRefresh: (st) => { progress = st.progress; kit?.setProgress(progress); },
      });
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  const gl = document.createElement('div');
  gl.className = 'kitc__gl';
  box.appendChild(gl);
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    import('../kit3d/cluster').then(({ KitCluster }) => {
      if (dead) return;
      kit = new KitCluster(gl, { reduced: reduced(), touch: isTouch(), mobile: isMobile() });
      kit.onHover = (l) => { if (!label) return; if (l) label.textContent = l; label.classList.toggle('is-on', !!l); };
      gl.querySelector('canvas')?.addEventListener('webglcontextlost', () => {
        if (dead) return;
        kit?.dispose(); kit = null; gl.remove(); box.classList.remove('is-3d-ready');
      }, { once: true });
      requestAnimationFrame(() => box.classList.add('is-3d-ready'));
      // Watch the figure, not the box: on phones the box itself is pinned, which skews its own trigger.
      const watch = box.closest<HTMLElement>('figure') ?? box;
      triggers.push(ScrollTrigger.create({ trigger: watch, start: 'top bottom', end: 'bottom top', onToggle: (s) => kit?.setVisible(s.isActive) }));
      kit.setProgress(progress); // arriving mid-page: show the state that scroll position implies
    }).catch(() => {});
  }, { rootMargin: '800px 0px' });
  io.observe(box);
  off.push(() => { dead = true; io.disconnect(); mm.revert(); triggers.forEach((t) => t.kill()); kit?.dispose(); kit = null; gl.remove(); box.classList.remove('is-3d-ready'); });
}

// The statement lights up word by word as it crosses the middle of the screen.
function statement() {
  const p = document.querySelector<HTMLElement>('[data-words]');
  if (!p || reduced()) return;
  const words = p.querySelectorAll('.w');
  gsap.fromTo(words, { opacity: 0.5 }, { // 0.5 keeps unread words at 3.3:1, AA for large text
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
  });
}

// Product cover loops: fetched only when about to play, shown over the still once frames are running.
function playCover(cover: HTMLElement | null | undefined) {
  const v = cover?.querySelector<HTMLVideoElement>('video');
  if (!cover || !v || reduced()) return;
  if (!v.dataset.loaded) {
    v.dataset.loaded = '1';
    for (const [src, type] of [[v.dataset.mp4!, 'video/mp4'], [v.dataset.webm!, 'video/webm']]) { const s = document.createElement('source'); s.src = src; s.type = type; v.appendChild(s); }
    v.load();
  }
  v.currentTime = 0;
  v.play().then(() => cover.classList.add('is-playing')).catch(() => {});
}
function stopCover(cover: HTMLElement | null | undefined) {
  const v = cover?.querySelector<HTMLVideoElement>('video');
  if (!cover || !v) return;
  cover.classList.remove('is-playing');
  v.pause();
}

// Play: each experiment's card plays a few seconds of it running while you point at it.
function cardLoops(off: (() => void)[]) {
  if (reduced() || isTouch()) return;
  document.querySelectorAll<HTMLElement>('.card__link').forEach((a) => {
    const cover = a.querySelector<HTMLElement>('[data-cover]');
    const on = () => playCover(cover);
    const offf = () => stopCover(cover);
    a.addEventListener('pointerenter', on); a.addEventListener('pointerleave', offf);
    a.addEventListener('focus', on); a.addEventListener('blur', offf);
    off.push(() => { a.removeEventListener('pointerenter', on); a.removeEventListener('pointerleave', offf); a.removeEventListener('focus', on); a.removeEventListener('blur', offf); stopCover(cover); });
  });
}

// Case page: the cover's loop plays while the hero is on screen.
function heroLoop(off: (() => void)[]) {
  const cover = document.querySelector<HTMLElement>('[data-hero] [data-cover]');
  if (!cover || reduced()) return;
  const io = new IntersectionObserver(([e]) => (e.isIntersecting ? playCover(cover) : stopCover(cover)), { threshold: 0.35 });
  io.observe(cover);
  off.push(() => { io.disconnect(); stopCover(cover); });
}

// The case index: the hovered product's cover is lowered into the frame beside the list, and its loop plays.
function caseIndex(off: (() => void)[]) {
  const root = document.querySelector<HTMLElement>('[data-index]');
  if (!root || isTouch() || isMobile()) return;
  const imgs = [...root.querySelectorAll<HTMLElement>('[data-preview]')];
  let current = -1;
  let armed = false; // loops play only once the visitor is pointing at the list
  const show = (i: number) => {
    if (i === current) return;
    const prev = imgs[current];
    current = i;
    stopCover(prev?.querySelector<HTMLElement>('[data-cover]'));
    if (armed) playCover(imgs[i].querySelector<HTMLElement>('[data-cover]'));
    root.classList.add('has-preview');
    const el = imgs[i];
    gsap.set(el, { zIndex: 2 });
    if (prev) gsap.set(prev, { zIndex: 1 });
    if (reduced()) { imgs.forEach((x, k) => gsap.set(x, { autoAlpha: k === i ? 1 : 0, clipPath: 'inset(0% 0% 0% 0%)' })); return; }
    gsap.fromTo(el, { autoAlpha: 1, clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'set', overwrite: true,
      onComplete: () => imgs.forEach((x, k) => k !== current && gsap.set(x, { autoAlpha: 0 })) });
    gsap.fromTo(el.querySelector('.cover'), { yPercent: -6, scale: 1.08 }, { yPercent: 0, scale: 1, duration: 1, ease: ease.out, overwrite: true });
  };
  const rows = [...root.querySelectorAll<HTMLElement>('[data-row]')];
  rows.forEach((r) => {
    const on = () => show(Number(r.dataset.row));
    r.addEventListener('pointerenter', on);
    r.addEventListener('focus', on);
    off.push(() => { r.removeEventListener('pointerenter', on); r.removeEventListener('focus', on); });
  });
  const enter = () => { armed = true; playCover(imgs[current]?.querySelector<HTMLElement>('[data-cover]')); };
  const leave = () => { armed = false; stopCover(imgs[current]?.querySelector<HTMLElement>('[data-cover]')); };
  root.addEventListener('pointerenter', enter);
  root.addEventListener('pointerleave', leave);
  off.push(() => { root.removeEventListener('pointerenter', enter); root.removeEventListener('pointerleave', leave); imgs.forEach((x) => stopCover(x.querySelector<HTMLElement>('[data-cover]'))); });
  show(0);
}

// Build page: the Kit list is pinned and each module's render is lowered in as you scroll.
function kitScroll() {
  const root = document.querySelector<HTMLElement>('[data-kitscroll]');
  if (!root || reduced() || isMobile()) return;
  const items = [...root.querySelectorAll<HTMLElement>('[data-kit-item]')];
  const imgs = [...root.querySelectorAll<HTMLElement>('[data-kit-img]')];
  const n = items.length;
  gsap.set(imgs.slice(1), { clipPath: 'inset(0% 0% 100% 0%)' });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: root, start: 'top top', end: () => `+=${innerHeight * (n - 1) * 0.8}`, pin: root.querySelector('.kitscroll__pin'),
      scrub: 0.6, invalidateOnRefresh: true,
      onUpdate: (self) => {
        const k = Math.min(n - 1, Math.round(self.progress * (n - 1)));
        items.forEach((it, i) => it.classList.toggle('is-on', i === k));
      },
    },
  });
  imgs.slice(1).forEach((img, i) => {
    tl.to(img, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'none' }, i)
      .fromTo(img.querySelector('img'), { yPercent: -8 }, { yPercent: 0, duration: 1, ease: 'none' }, i);
  });
}
