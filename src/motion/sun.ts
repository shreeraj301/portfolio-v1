// The driver: one variable, the sun. Time plus a lagged pointer set its angle; the light in the
// 3D plaza reads from it, so its shadows drift slowly and lean toward the pointer.
import { gsap } from 'gsap';
import { onPage, prefersReducedMotion, isTouch } from '../engine';

export const sun = { t: 0, px: 0, angle: 0 };

const BASE = 2.0; // radians: shadows fall toward the viewer, onto the open plate

export function startSun() {
  const reduced = prefersReducedMotion();
  let aim = 0;
  if (!reduced && !isTouch()) addEventListener('pointermove', (e) => { aim = e.clientX / innerWidth - 0.5; }, { passive: true });
  sun.angle = BASE;

  onPage(() => {
    // Only the home page has a sun to drive.
    if (reduced || !document.querySelector('[data-cluster]')) return;
    const tick = (time: number) => {
      const r = gsap.ticker.deltaRatio();
      sun.px += (aim - sun.px) * (1 - Math.pow(0.94, r));
      sun.t = time;
      sun.angle = BASE + Math.sin(time * 0.06) * 0.7 + sun.px * 0.9;
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  });
}
