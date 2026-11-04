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
