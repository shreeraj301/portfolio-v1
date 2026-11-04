// Declarative motion through data attributes. Authoring happens in markup:
//   data-split="lines|words|chars"   masked text reveal (SplitText), on scroll or on intro
//   data-reveal="up|fade|clip|scale"  block reveal
//   data-intro                        play with the page intro instead of on scroll
//   data-delay="0.2"                  extra delay (seconds)
//   data-parallax="0.15"              scrubbed vertical drift (fraction of element height)
// Every effect is skipped under reduced motion; CSS keeps content visible without JS.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ease, prefersReducedMotion } from './env';

gsap.registerPlugin(ScrollTrigger, SplitText);

const durations = { lines: 0.75, words: 0.7, chars: 0.6 } as const;
const staggers = { lines: 0.06, words: 0.025, chars: 0.014 } as const;

// Reveals start the moment an element touches the viewport, so you never scroll into blank space.
export const REVEAL_START = 'top bottom';
// Anything already on screen when the page starts is simply there: no waiting on a scroll.
export const onScreenAtStart = (el: Element) => el.getBoundingClientRect().top < innerHeight;

// autoSplit re-splits after font load / resize. A text that already revealed must stay revealed,
// so the state lives outside onSplit.
function splitTween(el: HTMLElement, isIntro: boolean) {
  const type = (el.dataset.split || 'lines') as keyof typeof durations;
  const delay = parseFloat(el.dataset.delay || '0');
  const s = { tween: undefined as gsap.core.Tween | undefined, done: false, requested: false };
  SplitText.create(el, {
    type: type === 'lines' ? 'lines' : `lines,${type}`,
    // Accessibility: lines and words keep their text readable as is. Letters are hidden from screen
    // readers and named once: on the heading itself, or (for a span) by its parent's aria-label.
    aria: type !== 'chars' ? 'none' : /^H[1-6]$/.test(el.tagName) ? 'auto' : 'hidden',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit(self) {
      gsap.set(el, { visibility: 'visible' });
      if (s.done) return;
      if (!isIntro && onScreenAtStart(el)) { s.done = true; return; }
      const targets = type === 'lines' ? self.lines : type === 'words' ? self.words : self.chars;
      s.tween = gsap.from(targets, {
        yPercent: 110,
        rotate: type === 'chars' ? 0 : 2,
        duration: durations[type],
        stagger: staggers[type],
        ease: ease.out,
        delay,
        paused: isIntro && !s.requested,
        onComplete: () => { s.done = true; },
        scrollTrigger: isIntro ? undefined : { trigger: el, start: REVEAL_START, once: true },
      });
      return s.tween;
    },
  });
  return () => { s.requested = true; s.tween?.play(); };
}

function blockTween(el: HTMLElement, paused: boolean) {
  const kind = el.dataset.reveal || 'up';
  const delay = parseFloat(el.dataset.delay || '0');
  gsap.set(el, { visibility: 'visible' });
  if (!paused && onScreenAtStart(el)) return gsap.timeline(); // already in view: no entrance, nothing hidden
  const st = paused ? undefined : { trigger: el, start: REVEAL_START, once: true };
  // Big blocks (images, frames) are never hidden: they start partly visible and settle the last 40px,
  // so a picture is always there as you scroll to it. Transforms and opacity only.
  const big = kind === 'clip' || kind === 'scale';
  const from = kind === 'fade' ? { autoAlpha: 0 } : { y: big ? 40 : 32, autoAlpha: big ? 0.35 : 0 };
  return gsap.fromTo(el, from, {
    y: 0,
    autoAlpha: 1,
    duration: kind === 'fade' ? 0.6 : big ? 0.7 : 0.6,
    ease: ease.out,
    delay,
    paused,
    force3D: true,
    scrollTrigger: st,
    clearProps: 'transform',
  });
}

/** Wire every reveal inside `root`. Returns the intro timeline (paused) for the page entrance. */
export function initReveals(root: ParentNode = document) {
  const intro = gsap.timeline({ paused: true });
  if (prefersReducedMotion()) return intro;

  root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const isIntro = el.hasAttribute('data-intro');
    const play = splitTween(el, isIntro);
    if (isIntro) intro.add(play, 0);
  });
  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const isIntro = el.hasAttribute('data-intro');
    const t = blockTween(el, isIntro);
    if (isIntro) intro.add(() => t.play(), 0);
  });
  root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax || '0.15');
    gsap.set(el, { willChange: 'transform' }); // project: keep the parallax layer composited for its whole life
    gsap.fromTo(el, { yPercent: -amount * 100 }, {
      yPercent: amount * 100,
      ease: 'none',
      force3D: true,
      scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  return intro;
}
