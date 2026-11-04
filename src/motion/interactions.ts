// Page-level motion: the cluster, section heads, the case index, the statement, the Kit scroller,
// the header and the mobile menu. Everything registers through onPage so it is reverted on navigation.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, onScroll, scrollToTarget, prefersReducedMotion, isTouch, isMobile, ease } from '../engine';
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
    statement();
    caseIndex(off);
    kitScroll();

    return () => off.forEach((f) => f());
  });
}

function openMenu() {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
  if (!menu || !btn) return;
  menu.hidden = false;
  document.documentElement.classList.add('menu-open');
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
    if (kit) { kit.focus(id as never); return; }
    box.dataset.active = id;
    const body = box.querySelector(`[data-mod="${id}"] .mod__body`);
    if (body && !reduced()) gsap.fromTo(body, { y: -18 }, { y: 0, duration: 0.75, ease: 'set', overwrite: 'auto', force3D: true });
  };
  const clear = () => {
    active = '';
    links.forEach((a) => a.classList.remove('is-active'));
    if (kit) kit.focus(null); else delete box.dataset.active;
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
    // The real thing: a 3D plaza with physics. The SVG plate holds the place until it is ready.
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

  // Fallback without WebGL: the layered SVG drawing.
  const order = ['read', 'play', 'build', 'pause', 'sit', 'gather'];
  const mods = new Map<string, HTMLElement>();
  box.querySelectorAll<HTMLElement>('[data-mod]').forEach((m) => mods.set(m.dataset.mod!, m));
  if (!reduced()) {
    const sorted = order.map((id) => mods.get(id)!.querySelector('.mod__body')!);
    gsap.set(sorted, { y: -120, autoAlpha: 0, force3D: true });
    gsap.set(box.querySelectorAll('[data-shadow]'), { autoAlpha: 0 });
    intro.add(gsap.to(sorted, { y: 0, autoAlpha: 1, duration: 1.3, ease: 'set', stagger: { each: 0.09, ease: 'power1.in' } }), 0.15);
    intro.add(gsap.to(order.map((id) => box.querySelector(`[data-shadow="${id}"]`)), { autoAlpha: 1, duration: 0.9, ease: ease.soft, stagger: 0.11 }), 0.45);
  }
  if (!isTouch()) {
    const move = (e: PointerEvent) => { const m = (e.target as Element).closest<HTMLElement>('[data-mod]'); if (m) activate(m.dataset.mod!); else clear(); };
    const click = (e: MouseEvent) => { const m = (e.target as Element).closest<HTMLElement>('[data-mod]'); links.find((l) => l.dataset.verb === m?.dataset.mod)?.click(); };
    box.addEventListener('pointermove', move);
    box.addEventListener('pointerleave', clear);
    box.addEventListener('click', click);
    off.push(() => { box.removeEventListener('pointermove', move); box.removeEventListener('pointerleave', clear); box.removeEventListener('click', click); });
  }
}

// The statement lights up word by word as it crosses the middle of the screen.
function statement() {
  const p = document.querySelector<HTMLElement>('[data-words]');
  if (!p || reduced()) return;
  const words = p.querySelectorAll('.w');
  gsap.fromTo(words, { opacity: 0.16 }, {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: p, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
  });
}

// The case index: the hovered study's cover is lowered into the frame beside the list.
function caseIndex(off: (() => void)[]) {
  const root = document.querySelector<HTMLElement>('[data-index]');
  if (!root || isTouch() || isMobile()) return;
  const imgs = [...root.querySelectorAll<HTMLElement>('[data-preview]')];
  let current = -1;
  const show = (i: number) => {
    if (i === current) return;
    const prev = imgs[current];
    current = i;
    root.classList.add('has-preview');
    const el = imgs[i];
    gsap.set(el, { zIndex: 2 });
    if (prev) gsap.set(prev, { zIndex: 1 });
    if (reduced()) { imgs.forEach((x, k) => gsap.set(x, { autoAlpha: k === i ? 1 : 0, clipPath: 'inset(0% 0% 0% 0%)' })); return; }
    gsap.fromTo(el, { autoAlpha: 1, clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'set', overwrite: true,
      onComplete: () => imgs.forEach((x, k) => k !== current && gsap.set(x, { autoAlpha: 0 })) });
    gsap.fromTo(el.querySelector('img'), { yPercent: -6, scale: 1.08 }, { yPercent: 0, scale: 1, duration: 1, ease: ease.out, overwrite: true });
  };
  const rows = [...root.querySelectorAll<HTMLElement>('[data-row]')];
  rows.forEach((r) => {
    const on = () => show(Number(r.dataset.row));
    r.addEventListener('pointerenter', on);
    r.addEventListener('focus', on);
    off.push(() => { r.removeEventListener('pointerenter', on); r.removeEventListener('focus', on); });
  });
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
