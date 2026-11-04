// Page-level motion: the cluster, section heads, the case index, the statement, the Kit scroller,
// the header and the mobile menu. Everything registers through onPage so it is reverted on navigation.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, onScroll, scrollToTarget, prefersReducedMotion, isTouch, isMobile, ease } from '../engine';

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
        gsap.from(el, {
          yPercent: -45, autoAlpha: 0, duration: 1.1, ease: 'set', delay: parseFloat(el.dataset.delay || '0'),
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
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
  const svg = document.querySelector<HTMLElement>('[data-cluster]');
  if (!svg) return;
  const mods = new Map<string, HTMLElement>();
  svg.querySelectorAll<HTMLElement>('[data-mod]').forEach((m) => mods.set(m.dataset.mod!, m));
  const bodies = [...mods.values()].map((m) => m.querySelector<HTMLElement>('.mod__body')!);

  if (!reduced()) {
    const order = ['read', 'play', 'build', 'pause', 'sit', 'gather'];
    const sorted = order.map((id) => mods.get(id)!.querySelector('.mod__body')!);
    gsap.set(sorted, { y: -120, autoAlpha: 0, force3D: true });
    gsap.set(svg.querySelectorAll('[data-shadow]'), { autoAlpha: 0 });
    intro.add(gsap.to(sorted, { y: 0, autoAlpha: 1, duration: 1.3, ease: 'set', stagger: { each: 0.09, ease: 'power1.in' } }), 0.15);
    intro.add(gsap.to(order.map((id) => svg.querySelector(`[data-shadow="${id}"]`)), { autoAlpha: 1, duration: 0.9, ease: ease.soft, stagger: 0.11 }), 0.45);
    // Scroll: the cluster opens into an exploded axonometric as the hero leaves, every part lifted
    // by its height in the stack, the way an assembly drawing shows how a module is put together.
    const hero = svg.closest('.hero') || svg;
    // Phones keep the assembled drawing: a scrubbed SVG costs frames there.
    if (!isMobile() && !isTouch()) {
    const xtl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 20%', scrub: 1 } });
    order.forEach((id, m) => {
      const parts = [...mods.get(id)!.querySelectorAll<SVGSVGElement>('.part')];
      parts.forEach((g, k) => xtl.to(g, { y: -(k + 1) * 22 - m * 3, ease: 'none', duration: 1, force3D: true }, 0));
    });
    xtl.to(svg.querySelector('.cluster__shadows'), { autoAlpha: 0.35, ease: 'none', duration: 1 }, 0)
      .to('.hero__caption', { autoAlpha: 0, ease: 'none', duration: 0.2 }, 0.1)
      .fromTo('[data-exploded]', { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, ease: 'none', duration: 0.3 }, 0.15)
      .to(svg, { yPercent: -6, ease: 'none', duration: 1 }, 0);
    }
  }

  let active = '';
  const activate = (id: string) => {
    if (id === active) return;
    active = id;
    svg.dataset.active = id;
    document.querySelectorAll<HTMLElement>('.hv[data-verb]').forEach((a) => a.classList.toggle('is-active', a.dataset.verb === id));
    const body = mods.get(id)?.querySelector('.mod__body');
    if (body && !reduced()) gsap.fromTo(body, { y: -18 }, { y: 0, duration: 0.75, ease: 'set', overwrite: 'auto', force3D: true });
  };
  const clear = () => { active = ''; delete svg.dataset.active; document.querySelectorAll('.hv.is-active').forEach((a) => a.classList.remove('is-active')); };

  const links = [...document.querySelectorAll<HTMLAnchorElement>('.hv[data-verb]')];
  for (const a of links) {
    const on = () => activate(a.dataset.verb!);
    a.addEventListener('pointerenter', on);
    a.addEventListener('focus', on);
    a.addEventListener('pointerleave', clear);
    a.addEventListener('blur', clear);
    off.push(() => { a.removeEventListener('pointerenter', on); a.removeEventListener('focus', on); a.removeEventListener('pointerleave', clear); a.removeEventListener('blur', clear); });
  }
  // Pointer on the drawing itself: the module under the pointer takes its colour; a click follows its link.
  if (!isTouch()) {
    const move = (e: PointerEvent) => {
      const m = (e.target as Element).closest<HTMLElement>('[data-mod]');
      if (m) activate(m.dataset.mod!); else clear();
    };
    const click = (e: MouseEvent) => {
      const m = (e.target as Element).closest<HTMLElement>('[data-mod]');
      const a = m && links.find((l) => l.dataset.verb === m.dataset.mod);
      a?.click();
    };
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerleave', clear);
    svg.addEventListener('click', click);
    off.push(() => { svg.removeEventListener('pointermove', move); svg.removeEventListener('pointerleave', clear); svg.removeEventListener('click', click); });
  }
  void bodies;
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
