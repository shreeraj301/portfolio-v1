# DESIGN.md: Shreeraj Narwade portfolio

## Brief
- Subject: Shreeraj Narwade, architect (B.Arch 2026, SEA Mumbai) turned product designer, UX researcher and design engineer. Product design intern at Acuai Labs.
- Audience: hiring managers and design leads at product teams (AI tools, fintech), plus freelance clients from Behance.
- Job: get hired. Prove that the architecture training changes how he designs software, then let the case studies carry the proof.
- Sources: every link on linktr.ee/shreeraj301 (resume, Behance, 6 case studies, 17 prototypes, architecture portfolio PDF, thesis manuals, 4 poetry books, Substack, showreel).

## Concept card
```
Idea:        The site is organised like his thesis: a kit of modules, each built for one behaviour.
Metaphor:    The Kit (Syntax of Behavior, B.Arch thesis): precast concrete modules sorted by action, coded like a catalogue.
Signature:   Hero isometric cluster of six modules, one per verb (Read, Play, Build, Pause, Sit, Gather).
             Hover or focus a verb and its module is lowered into place; the sun moves across the cluster and the shadows follow.
Emotion:     Calm and exact. A drawing you could build from.
Motion verb: Set down like precast: things arrive from slightly above, decelerate hard and settle with a 2px give.
Screenshot:  The cluster at golden hour with READ lowered and lit in blue, the name set huge and condensed beside it.
```
Anchor: the thesis manual "The Kit" (modules To Sit, Play, Read, Perform, Balance, Refresh) and his line "I read an app the way I read a building".

### Concepts considered
| Concept | Territory | Orig | Fit | Feas | Portability (low is good) |
|---|---|---|---|---|---|
| Syntax of Behavior (chosen) | his thesis, how he works | 5 | 5 | 4 | 1 |
| The drawing set | profession's material | 3 | 4 | 5 | 3 |
| The otla threshold | name, place and culture | 4 | 4 | 3 | 2 |

## Art direction
- Palette (from the Kit renders):
  - ground `#E8E4DC` precast paper; ground-2 `#DED9CF`
  - ink `#151413`; muted `#57534D` (6.2:1 on ground); line `rgb(21 20 19 / 0.16)`
  - verb codes (fills and markers only, never body text on ground): read `#7FA4DA`, play `#8DBF7C`, build `#DE7A5E`, pause `#E2C463`, sit `#EDB088`, gather = ink
  - curtain = ink
- Type: Archivo variable (wdth 62 to 125, wght 100 to 900). Display: wdth 62, wght 800, uppercase for verbs, sentence case for headlines. Body Archivo wdth 100 / 400 at 17 to 18px, leading 1.5. Newsreader italic for quotes and poem lines. IBM Plex Mono for module codes and meta.
- Grid: 12 columns, fluid gutter. Codes and meta hang in columns 1 to 2, content from column 3. Section rhythm varies: tight index, wide stage, dense grid.
- Shape: radius 0 everywhere (precast edges). Hairline rules, no shadows except the cast shadows in the cluster.
- Motion: expo.out entrances, expo.inOut transitions, a custom "set" ease (fast drop, hard stop, tiny give) for anything lowered into place.

## Composition
```
HERO      [code col][ NAME (huge condensed) ........ ][ iso cluster (6 modules) ]
          [meta: now / based / sun clock ]  verbs list = nav into sections
STATEMENT big Newsreader italic quote from the showreel, full width, left hung
READ      index rows: code | title | one line | evidence | year  (+ preview frame that is set down on hover)
PLAY      dense 3-col grid of experiments with live links, mixed sizes
BUILD     sticky stage: Kit render pinned left, thesis text and other architecture scrolling right
PAUSE     four book spines on a shelf (lift on hover) + essays list
SIT       portrait + short story + timeline
GATHER    ink footer: email large, socials, sun clock
```

## Micro-interactions (one per role)
- Nav verbs: width axis opens (wdth 62 to 100) and the verb's module glyph is set down.
- Primary buttons: fill is lowered from the top edge.
- Project rows and cards: preview image clip-revealed from the top, title shifts 0.5em.
- Inline links: underline at rest, rises to a band.
- Utility links: color only.

## Idle state
The sun. One driver variable (sun angle) from time plus pointer x moves every cast shadow in the cluster and the sun clock in the meta. Paused off screen, still under reduced motion.

## Genericness test
- Generic answer: dark hero, gradient blob, three cards. Changed to a concrete-paper ground with a drawn isometric object that comes from his own thesis.
- Generic answer: project cards grid. Changed to a coded catalogue index (RD-01...) because his Kit is a coded catalogue.
- Generic answer: fade-up on every section. Changed to "set down" drops only where something is placed, plain line reveals elsewhere.

## Decisions made during the build
- Gather's module is precast grey (#AAA49A), not ink, so it reads as a module on the plate.
- Idle motion lives on the home page only (the sun and its clock). Inner pages stay still at rest on purpose: they are for reading. Their life is in hovers, the slab transition, set-down section heads and the Kit scroller.
- The hero cluster opens into an exploded axonometric as the hero scrolls away: each part lifts by its position in the stack.
- The header is a solid strip once you scroll (no blend mode) so text never sits on an image.
- Lease Lens uses the Behance case study (22 testers), which supersedes the older in-app case page that used sample data.

## Motion pass for smoothness
- Only transform and opacity animate. Width-axis (font-variation) hovers became transform shifts, because they relaid out text on every frame.
- The hero cluster is built from layers: one SVG for the plate, one for the shadows, and one small SVG per box. Drops, hovers and the exploded view move composited layers instead of repainting one big drawing.
- Mask reveals ('clip', 'scale') are a mask moving one way while its content moves the other: no clip-path animation, no mid-animation rescaling of big images.
- Images are decoded ahead of time (1200px before they arrive), so reveals never wait on a decode.
- The "set" ease keeps weight but its give is now 0.6 percent; CSS hovers use a clean ease-out with no overshoot. Curtains and the mobile menu use expo/power4 in-out, never an overshoot that would open a gap.
- Lenis glides a touch heavier (lerp 0.085). Sun shadows redraw every frame the light moves on desktop, and pause while scrolling.

## Hero v2: the plaza in 3D
- Three.js (orthographic, true isometric) and cannon-es physics, loaded only on the home page after first paint. The SVG drawing stays as the no-WebGL fallback and as the placeholder plate.
- Modules are modelled after the Kit renders: bevelled precast parts, an open arch, curved amphitheatre steps, a shelf wall with books, stepped blocks with planters, a table seat with stools, a planter with a tree. Faint precast grain, paving grid on the plate.
- Light: hemisphere fill plus one sun that follows the site's simulated sun; soft (VSM) shadows updated only when something moved; contact shadows under every module.
- Motion: modules are lowered from above the frame one by one and land with weight (impact ring, dust, a tiny camera shake). Hover lifts a module on a spring like a crane; the others go back to bare concrete. On desktop a module can be picked up, carried and dropped; it knocks into its neighbours. "Put the modules back" re-casts the plaza. Scroll opens an exploded axonometric. The tree sways; the camera leans a little toward the pointer.
- Quality adapts: if frames run long it drops to 1x pixels and crisp shadows, then to contact shadows only. Reduced motion: placed at rest, rendered on demand.

## Round 3: motion fixes, the Kit everywhere, covers, resume
- Reveals start the moment an element touches the viewport (0.6 to 0.75s). Anything on screen at load is simply there. Big images are never fully hidden.
- Hero motion is designed, not simulated: modules fall under gravity and land with a hard stop and a tiny give; hover lifts on a critically damped spring; a carried module rises over the others and is set down in a bay of the plan, and the module already there slides into the bay you emptied. cannon-es removed.
- The six hero modules are the only module graphics on the site: rendered from the same scene into turning sprites (section heads, turning with scroll) and stills (nav, menu, footer, 404, loader). The old SVG glyphs and the SVG hero drawing are gone; renders of the plaza stand in before 3D and without WebGL.
- Read is products (seven, all live), with Otla Pages as RD-03. Every product has a designed 4:3 cover in its own visual language, built from the live app's real copy and screens, plus a 6s loop that starts and ends on the still. Clicking a product carries its cover into the case page hero.
- Play covers are the experiments running live (screen recordings, seamless loops). Build covers are re-cut from the portfolio PDF at print resolution. Pause has four book covers in the colours of the Otla Pages spines; no generated imagery.
- About: one-column timeline on a single rail, newest first. Resume is a page (/resume/) with a print stylesheet and the original PDF.
- Removed: the sun clock (hero and footer), the evidence column, the portrait ground line, Why Otla.

## Round 4
- Sit line: "Pull up a seat on the otla." with a mono note explaining the otla. The three behaviours in the intro are marked in their module colours as the paragraph enters.
- Section heads sit on the 12-column grid: verb and module in columns 1 to 7, the line from column 8 (column 6 on About, where its text column starts). Sit, case heroes and the Build image follow the same columns.
- Build: a live 3D cluster (kit3d/cluster.ts) of eight pieces locked together like the Manual 01 cover, three of them new (bridge with a round window, planted terraces, a path with a curved bench). Scroll lowers the pieces in; hover lifts one and names it; the sun follows the pointer. It shares renderer and light setup with the hero (kit3d/stage.ts) and loads only near the section.
- Books link to their pages on Otla Pages. Resume has no print button.
