// Global motion for the site. Motion verb: set down like precast.
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setLoaderFormat, setLoaderExit, setTransition, ease } from '../engine';
import { startSun } from './sun';
import { initInteractions } from './interactions';

gsap.registerPlugin(CustomEase, ScrollTrigger);
// Fast drop, hard stop, a 2 percent give, settle.
CustomEase.create('set', 'M0,0 C0.18,0.62 0.32,1.03 0.55,1.02 0.75,1.01 0.86,1 1,1');

// Remember what was clicked, so the curtain can name where you are going.
let next = { label: '', code: '' };
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
  if (!a) return;
  next = { label: a.dataset.label || a.textContent?.trim().split('\n')[0] || '', code: a.dataset.code || '' };
}, true);

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
      const panel = c.querySelector<HTMLElement>('.curtain__panel')!;
      c.querySelector('[data-curtain-label]')!.textContent = next.label || 'Shreeraj Narwade';
      c.querySelector('[data-curtain-code]')!.textContent = next.code ? `${next.code} /` : '';
      return gsap.timeline()
        .set(c, { autoAlpha: 1 })
        .fromTo(panel, { yPercent: -100 }, { yPercent: 0, duration: 0.75, ease: 'set' })
        .fromTo(c.querySelectorAll('.curtain__panel > span'), { yPercent: -60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: ease.out, stagger: 0.05 }, 0.25);
    },
    enter: (c) => gsap.timeline()
      .to(c.querySelectorAll('.curtain__panel > span'), { yPercent: -60, autoAlpha: 0, duration: 0.35, ease: ease.inOut })
      .to(c.querySelector('.curtain__panel'), { yPercent: -100, duration: 0.85, ease: ease.inOut }, 0.1)
      .set(c, { autoAlpha: 0 }),
  });

  startSun();
  initInteractions();
}
