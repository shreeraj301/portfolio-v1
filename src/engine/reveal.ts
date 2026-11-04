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

const durations = { lines: 1.2, words: 1.1, chars: 0.9 } as const;
const staggers = { lines: 0.08, words: 0.035, chars: 0.018 } as const;

// autoSplit re-splits after font load / resize. A text that already revealed must stay revealed,
// so the state lives outside onSplit.
function splitTween(el: HTMLElement, isIntro: boolean) {
  const type = (el.dataset.split || 'lines') as keyof typeof durations;
  const delay = parseFloat(el.dataset.delay || '0');
  const s = { tween: undefined as gsap.core.Tween | undefined, done: false, requested: false };
  SplitText.create(el, {
    type: type === 'lines' ? 'lines' : `lines,${type}`,
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit(self) {
      gsap.set(el, { visibility: 'visible' });
      if (s.done) return;
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
        scrollTrigger: isIntro ? undefined : { trigger: el, start: 'top 88%', once: true },
      });
      return s.tween;
    },
  });
  return () => { s.requested = true; s.tween?.play(); };
}

function blockTween(el: HTMLElement, paused: boolean) {
  const kind = el.dataset.reveal || 'up';
  const delay = parseFloat(el.dataset.delay || '0');
  const st = paused ? undefined : { trigger: el, start: 'top 90%', once: true };
  gsap.set(el, { visibility: 'visible' });
  // Project change: 'clip' and 'scale' are built from transforms only (a mask that moves one way while
  // its content moves the other), so they run on the compositor instead of repainting a clip-path each frame.
  const inner = el.firstElementChild as HTMLElement | null;
  if ((kind === 'clip' || kind === 'scale') && inner) {
    gsap.set(el, { overflow: 'hidden' });
    const tl = gsap.timeline({ paused, delay, scrollTrigger: st, defaults: { duration: 1.35, ease: ease.out, force3D: true },
      onComplete: () => gsap.set([el, inner], { clearProps: 'overflow,transform' }) });
    if (kind === 'clip') {
      tl.fromTo(el, { yPercent: 100, autoAlpha: 1 }, { yPercent: 0 }, 0)
        .fromTo(inner, { yPercent: -100 }, { yPercent: 0 }, 0);
    } else {
      // 'scale' is lowered into place: the frame rises and fades in while the picture settles inside it.
      // Translation only, so large images are never re-rasterised at a new scale mid-animation.
      tl.fromTo(el, { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2 }, 0)
        .fromTo(inner, { yPercent: -12 }, { yPercent: 0, duration: 1.6 }, 0);
    }
    return tl;
  }
  return gsap.fromTo(el, kind === 'fade' ? { autoAlpha: 0 } : { y: 48, autoAlpha: 0 }, {
    y: 0,
    autoAlpha: 1,
    duration: kind === 'fade' ? 1 : 1.3,
    ease: ease.out,
    delay,
    paused,
    force3D: true,
    scrollTrigger: st,
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
