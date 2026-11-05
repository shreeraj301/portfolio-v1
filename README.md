# Shreeraj Narwade portfolio

Astro 7 + GSAP + Lenis. Static site, no backend.

## Run
    npm install
    npm run dev        # http://localhost:4321
    npm run build      # static output in dist/
    npm run preview
    npm run check      # typecheck, build, then accessibility tests (axe on every page + phone menu keyboard test)

First time before `test:a11y`: `npx playwright install chromium`.

## Deploy (Vercel)
Import the folder in Vercel (framework: Astro), or run `npx vercel` here. Before deploying,
set the real domain in `astro.config.mjs` (`site`) and `public/robots.txt`.

## Where things live
- All copy and project data: `src/data/site.ts`
- Resume page copy: `src/data/resume.ts` (the PDF in `public/resume/` is the original)
- Images: `src/assets/` (optimised to WebP at build); product loops in `public/covers/`
- The Kit in 3D: `src/kit3d/` (hero plaza `kit3d.ts`, Build cluster `cluster.ts`, shared parts `modules.ts`, `stage.ts`); stills and fallbacks in `src/components/Cluster.astro` and `Module.astro`
- Motion: `src/motion/` (setup, sun driver, interactions) on top of the engine in `src/engine/`
- Accessibility test: `scripts/a11y.mjs`
- Design decisions: `DESIGN.md`
