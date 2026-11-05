// The resume, from Shreeraj's own PDF (Resume_SAN.pdf, Nov 2026). Phone number left off on purpose:
// the web page shows email only. ** marks the figures the PDF sets in bold.

export type Entry = { name: string; role?: string; href?: string; tag?: string; place?: string; when: string; points: string[] };

export const resume = {
  title: 'Product designer',
  sub: 'UX research, interaction design and AI prototyping',
  summary:
    'Architect-trained product designer (B.Arch, 2026) who turns observed behaviour into systems. I design and ship web prototypes with Figma, AI tools (Claude, Figma Make, Grok, Cursor, Google AI Studio), GitHub and Vercel.',
  experience: [
    { name: 'An AI lab', role: 'Product designer intern', place: 'Remote', when: 'Oct 2026 to present', points: [
      'Redesigning the core app UI for a **B2B SaaS** platform that automates **AI product feeds and ad creatives** for e-commerce brands.',
      'Smoothed in-app flows and user journeys to improve the overall experience.',
    ] },
    { name: 'Anagram Architects', role: 'Architectural intern', place: 'New Delhi', when: 'Nov 2024 to Apr 2025, 5 months', points: [
      'Owned plans, sections, renders and client presentations for Prakriti School (Greater Noida) from concept through execution-set release, coordinating with structural and MEP consultants. Repeated client changes and scattered approvals became the brief for Ledger.',
      'When the ARKS Studio (Mumbai) client felt 7 ft beams made the store feel low, I iterated on mirror-clad beam fascias reflecting the Barrisol ceiling to add perceived height. It was built.',
    ] },
    { name: 'LocalxSociety', role: 'Architectural intern', place: 'Paris, Barcelona, Madrid, Lisbon', when: 'Apr to May 2024, 1 month', points: [
      'For a Government of Portugal and FabLab Lisbon market-site brief, led a two-person team: field research in 4 cities and precedent analysis, leading to the ABRIR / OPEN adaptive-reuse proposal.',
    ] },
  ] as Entry[],
  projects: [
    { name: 'Found It', role: 'Privacy-first subscription tracker', href: '/work/found-it/', tag: 'Case study and live prototype', when: 'Oct 2026, 4 weeks', points: [
      'Ran interviews, a diary study and a **214-person survey** on losing track of subscriptions (**64% would not link a bank** to another app, for lack of trust). Designed a tracker built on local CSV statement imports.',
      'Evaluated bank linking, email scanning and manual tracking; designed a recurring-charge detection workflow and a spending overview, refined through usability testing rounds.',
    ] },
    { name: 'Otla Pages', role: 'A hand-drawn digital library', href: '/work/otla-pages/', tag: 'Design and build, live', when: 'Oct 2026', points: [
      'Hand-drew, designed and coded a digital library for my writing, from first sketch to live site: **four rooms** (poetry shelf, story shelf, writing room, guestbook) with a shareable link for every book and piece.',
      'Sketched every visual by hand and translated the drawings into code, with no stock or AI imagery. Built a **custom reader** for my 4 poetry books with keyboard page turns, a plain-text edition and a skip link.',
      'Created the name (from the otla, the Maharashtrian doorstep seat), the brand and all interface copy.',
    ] },
    { name: 'Ledger', role: 'Decision and approval app for architects and clients', href: '/work/ledger/', tag: 'Case study and live prototype', when: 'Oct 2026, 3 weeks', points: [
      'Saw approvals and client changes at Anagram scattered across email, WhatsApp and files, causing rework. Designed **one shared record** for drawings, decisions, changes and explicit client sign-off.',
      'Defined the information architecture, project timeline and no-account client access. Built with AI tools, GitHub and Vercel; live concept on sample data.',
    ] },
    { name: 'Plain Paper', role: 'Research reader design concept', href: '/work/plain-paper/', tag: 'Case study and live prototype', when: 'Oct 2026, 4 weeks', points: [
      'Explored why dense abstracts and jargon keep non-specialists from understanding research. Compared **six solution directions** and designed an AI reader concept with a structured summary, in-context jargon explanations and guided questions, keeping the original text and its limitations in view.',
    ] },
    { name: 'B.Arch thesis', role: 'Behaviour-driven modular system', href: '/build/', tag: 'Thesis', when: 'Aug 2025 to Apr 2026, 8 months', points: [
      'Research: asked how street form (width, edges, plinths, walls, thresholds) shapes behaviour; mapped density, duration, activity and demographics on 4 street types (**50+ hours at each site**).',
      'Synthesised the observations through Gibson’s affordances: a median becomes a labour hub, parked cars become evening seating, and what a space affords shifts with gender, age, class and time of day.',
      'Design: turned the insights into **The Kit**, precast concrete modules grouped by behaviour (To Sit, Play, Read, Perform, Balance, Refresh), with specs and two manuals, much like a design system.',
    ] },
    { name: 'Other builds', when: '2022 to 2026', points: [
      'A Delta 3D printer (hardware and Python, team of 2); Hiring Panel (a Grok bot resume critic); web experiments. Also live on this site: Settle, Plainform and Lease Lens.',
    ] },
  ] as Entry[],
  education: [
    { name: 'School of Environment and Architecture', role: 'Bachelor of Architecture', place: 'Mumbai', when: 'Dec 2021 to Apr 2026', points: [
      '**CGPA 3.5/4**. 1st place, Esri StoryMaps contest, CEPT University (2022). Class representative, 2021 to 2022.',
      'Google UX Design Certificate, Coursera (Dec 2025 to May 2026). UI/UX courses: Minoti Mehta (2026), Kaarwan (2023).',
    ] },
  ] as Entry[],
  writing:
    '4 poetry books (The Universe Between Us; Window Seat, Facing Backward; Learning You, by Heart; Two Time Zones From Home) on Otla Pages, plus essays on perception and decision-making on Substack.',
  skills: [
    { group: 'UX and research', items: 'User research (qualitative and quantitative), survey design, behavioural mapping, competitive analysis, personas, journey mapping, information architecture, user flows, wireframing, prototyping' },
    { group: 'Design', items: 'Figma, Framer, Photoshop, Illustrator, InDesign; AI prototyping, HTML/CSS, GitHub, Vercel' },
    { group: '3D and visualisation', items: 'Rhino, Grasshopper, SketchUp, Blender, Enscape, Lumion, V-Ray, AutoCAD, Revit' },
    { group: 'Other', items: 'Python (basic), QGIS, Premiere Pro, DaVinci Resolve. Languages: English, Hindi, Marathi' },
  ],
  pdf: '/resume/Shreeraj-Narwade-Resume.pdf',
};
