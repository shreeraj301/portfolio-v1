// The driver: one variable, the sun. Time plus a lagged pointer set its angle; every cast shadow
// in the cluster and every sun clock reads from it, so they always agree.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, prefersReducedMotion, isTouch, onScroll } from '../engine';
import { shadow, type Box } from '../lib/iso';

export const sun = { t: 0, px: 0, angle: 0, hour: 15.3 };

const BASE = 2.0; // radians: shadows fall toward the viewer, onto the open plate
const LEN = 0.95; // shadow length per unit of height

function setAngle(a: number) {
  sun.angle = a;
  // Map the swing of the angle onto a believable afternoon: 9:00 to 18:00.
  const k = (Math.sin(a - BASE) + 1) / 2;
  sun.hour = 9 + k * 9;
}

const clockText = () => {
  const h = Math.floor(sun.hour);
  const m = Math.floor((sun.hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export function startSun() {
  const reduced = prefersReducedMotion();
  const touch = isTouch();
  let aim = 0;
  let scrolledAt = 0;
  if (!reduced) {
    // Phones: the sun only follows time; while the page is scrolling, shadows hold still to keep frames free.
    onScroll(() => { scrolledAt = performance.now(); });
    if (!touch) addEventListener('pointermove', (e) => { aim = e.clientX / innerWidth - 0.5; }, { passive: true });
  }
  setAngle(BASE);

  onPage(() => {
    const svg = document.querySelector<SVGSVGElement>('[data-cluster]');
    const clocks = [...document.querySelectorAll<HTMLElement>('[data-sun-clock]')];
    const s = svg ? Number(svg.dataset.scale) : 22;
    const polys = svg
      ? [...svg.querySelectorAll<SVGPolygonElement>('[data-box]')].map((p) => ({
          el: p,
          b: JSON.parse(p.dataset.box!) as Box,
          ox: Number(p.dataset.ox),
          oy: Number(p.dataset.oy),
        }))
      : [];
    const draw = () => {
      const dx = Math.cos(sun.angle) * LEN;
      const dy = Math.sin(sun.angle) * LEN;
      for (const p of polys) p.el.setAttribute('points', shadow(p.b, s, dx, dy, p.ox, p.oy));
      const txt = clockText();
      for (const c of clocks) if (c.textContent !== txt) c.textContent = txt;
    };
    draw();
    if (reduced) return;

    let visible = true;
    let last = 0;
    let drawn = sun.angle;
    const tick = (time: number) => {
      const r = gsap.ticker.deltaRatio();
      sun.px += (aim - sun.px) * (1 - Math.pow(0.94, r));
      sun.t = time;
      setAngle(BASE + Math.sin(time * 0.06) * 0.7 + sun.px * 0.9);
      // Redraw at most ~30 times a second; shadows move slowly.
      const quiet = performance.now() - scrolledAt > 180;
      const step = touch ? 0.006 : 0.0015;
      if (visible && quiet && time - last > 0.033 && Math.abs(sun.angle - drawn) > step) { last = time; drawn = sun.angle; draw(); }
      else if (!visible && time - last > 1) { last = time; draw(); } // keep the footer clock honest
    };
    gsap.ticker.add(tick);
    const st = svg ? ScrollTrigger.create({ trigger: svg, start: 'top bottom', end: 'bottom top', onToggle: (self) => { visible = self.isActive; } }) : null;
    if (!svg) visible = false;
    return () => { gsap.ticker.remove(tick); st?.kill(); };
  });
}
