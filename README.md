# Shreeraj Narwade portfolio

Astro 7 + GSAP + Lenis. Static site, no backend.

## Run
    npm install
    npm run dev        # http://localhost:4321
    npm run build      # static output in dist/
    npm run preview

## Deploy (Vercel)
Import the folder in Vercel (framework: Astro), or run `npx vercel` here. Before deploying,
set the real domain in `astro.config.mjs` (`site`) and `public/robots.txt`.

## Where things live
- All copy and project data: `src/data/site.ts`
- Images: `src/assets/` (optimised to WebP at build)
- The isometric modules: `src/lib/iso.ts`, `src/components/Cluster.astro`, `Glyph.astro`
- Motion: `src/motion/` (setup, sun driver, interactions) on top of the engine in `src/engine/`
- Design decisions: `DESIGN.md`
