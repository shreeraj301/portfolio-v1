// Global motion for the site. Motion verb: set down like precast.
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLoaderFormat, setLoaderExit, setTransition, ease } from '../engine';
import { startSun } from './sun';
import { initInteractions } from './interactions';

gsap.registerPlugin(CustomEase, ScrollTrigger);
// Fast drop, hard stop, a 2 percent give, settle.
// A long, heavy deceleration with the faintest give at the end (0.6 percent): weight, not bounce.
CustomEase.create('set', 'M0,0 C0.12,0.6 0.24,0.94 0.48,1.004 0.66,1.006 0.82,1 1,1');

// Remember what was clicked, so the curtain can name where you are going.
let next = { label: '', code: '' };
// A product picked from the index carries its cover with it: the cover grows out of the preview frame
// and is set down as the hero of the case page.
let flip: { rect: DOMRect; src: string } | null = null;
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
  if (!a) return;
  next = { label: a.dataset.label || shortName(a), code: a.dataset.code || '' };
  flip = null;
  if (a.dataset.row !== undefined && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const frame = document.querySelector<HTMLElement>('.index__frame');
    const img = document.querySelector<HTMLImageElement>(`[data-preview="${a.dataset.row}"] .cover img`);
    if (frame && img && frame.offsetParent) flip = { rect: frame.getBoundingClientRect(), src: img.currentSrc || img.src };
  }
}, true);

// Without a data-label, the curtain names the page by its address, never by a long link text.
const PAGES: Record<string, string> = { '/': 'Home', '/about/': 'About', '/build/': 'Build', '/resume/': 'Resume' };
function shortName(a: HTMLAnchorElement) {
  const t = (a.textContent || '').trim().split('\n')[0];
  if (t && t.length <= 18) return t;
  try { const u = new URL(a.href); return PAGES[u.pathname] || (u.pathname.split('/').filter(Boolean).pop() || 'Home').replace(/-/g, ' '); } catch { return 'Shreeraj Narwade'; }
}

function flipLayer(c: HTMLElement) {
  let el = c.querySelector<HTMLImageElement>('.curtain__flip');
  if (!el) { el = document.createElement('img'); el.className = 'curtain__flip'; el.alt = ''; c.appendChild(el); }
  return el;
}

export function setupMotion() {
  setLoaderFormat((p) => String(Math.round(p)).padStart(3, '0'));
  // Second and later visits in a session skip the casting: the loader is only for the first impression.
  // Phones skip it too: on a slow connection the first screen should be the hero, not a counter.
  const phone = matchMedia('(max-width: 767px), (hover: none)').matches;
  if (document.documentElement.classList.contains('seen') || phone) document.getElementById('loader')?.remove();
  // Phones: the hero text is there from the first frame (it is the LCP); only the modules are lowered in.
  if (phone) document.querySelectorAll('.hero [data-split], .hero [data-reveal], .nf [data-split], .nf [data-reveal]').forEach((el) => { el.removeAttribute('data-split'); el.removeAttribute('data-reveal'); });

  // Loader: cells are cast one by one with progress (CSS reads --p), then the formwork lifts off.
  setLoaderExit((root) => gsap.timeline()
    .to(root.querySelectorAll('[data-loader-out], .loader__cells li'), { yPercent: -120, autoAlpha: 0, duration: 0.45, ease: ease.inOut, stagger: 0.02 })
    .to(root, { yPercent: -100, duration: 0.7, ease: ease.inOut }, '-=0.3'));

  // Page transition: an ink slab is lowered over the page carrying the destination, then lifted.
  setTransition({
    leave: (c) => {
      if (flip) {
        // The cover leaves the index frame and grows toward the middle while the page goes quiet behind it.
        const f = flip; const img = flipLayer(c); img.src = f.src;
        const panel = c.querySelector<HTMLElement>('.curtain__panel')!;
        const w = Math.min(innerWidth * 0.62, innerHeight * 0.78 * 4 / 3);
        document.documentElement.classList.add('is-flip');
        return gsap.timeline()
          .set(c, { autoAlpha: 1 })
          .set(c.querySelectorAll('.curtain__panel > span'), { autoAlpha: 0 })
          .set(panel, { backgroundColor: 'var(--c-bg)' })
          .set(img, { display: 'block', left: f.rect.left, top: f.rect.top, width: f.rect.width, height: f.rect.height })
          .fromTo(panel, { autoAlpha: 0, yPercent: 0 }, { autoAlpha: 1, duration: 0.45, ease: ease.out }, 0)
          .to(img, { left: (innerWidth - w) / 2, top: (innerHeight - w * 0.75) / 2, width: w, height: w * 0.75, duration: 0.75, ease: 'power4.inOut' }, 0);
      }
      const panel = c.querySelector<HTMLElement>('.curtain__panel')!;
      const lab = c.querySelector<HTMLElement>('[data-curtain-label]')!;
      lab.textContent = next.label || 'Shreeraj Narwade';
      lab.style.setProperty('--len', String(Math.max(6, lab.textContent.length)));
      c.querySelector('[data-curtain-code]')!.textContent = next.code ? `${next.code} /` : '';
      return gsap.timeline()
        .set(c, { autoAlpha: 1 })
        .fromTo(panel, { yPercent: -100 }, { yPercent: 0, duration: 0.8, ease: 'power4.inOut' })
        .fromTo(c.querySelectorAll('.curtain__panel > span'), { yPercent: -60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: ease.out, stagger: 0.05 }, 0.25);
    },
    enter: (c) => {
      if (flip) {
        // Set down as the hero: the cover travels to where the case page keeps it, then hands over.
        flip = null;
        const img = flipLayer(c);
        const panel = c.querySelector<HTMLElement>('.curtain__panel')!;
        const hero = document.querySelector<HTMLElement>('[data-hero] .cover');
        const r = hero?.getBoundingClientRect();
        const tl = gsap.timeline({ onComplete: () => { gsap.set(img, { display: 'none' }); gsap.set(panel, { clearProps: 'backgroundColor,opacity,visibility' }); gsap.set(c, { autoAlpha: 0 }); document.documentElement.classList.remove('is-flip'); } });
        if (r) tl.to(img, { left: r.left, top: r.top, width: r.width, height: r.height, duration: 0.9, ease: 'set' }, 0);
        tl.to(panel, { autoAlpha: 0, duration: 0.5, ease: ease.out }, 0.35)
          .to(img, { autoAlpha: 0, duration: 0.25 }, r ? 0.95 : 0.3)
          .set(img, { autoAlpha: 1 });
        return tl;
      }
      return gsap.timeline()
      .to(c.querySelectorAll('.curtain__panel > span'), { yPercent: -60, autoAlpha: 0, duration: 0.35, ease: ease.inOut })
      .to(c.querySelector('.curtain__panel'), { yPercent: -100, duration: 0.85, ease: ease.inOut }, 0.1)
      .set(c, { autoAlpha: 0 });
    },
  });

  startSun();
  initInteractions();
}
