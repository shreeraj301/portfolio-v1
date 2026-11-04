// All site content. Sources: every link on linktr.ee/shreeraj301, read on 4 Nov 2026.
// Case study copy is condensed from Shreeraj's own case studies; numbers are his, as published.

export type Verb = 'read' | 'play' | 'build' | 'pause' | 'sit' | 'gather';

export const site = {
  name: 'Shreeraj Narwade',
  role: 'Product designer and design engineer',
  url: 'https://shreerajnarwade.vercel.app',
  description:
    'Architect turned product designer. I design for how people think and decide, from AI tools to fintech, and I build what I design. Seven live products, architecture and poems.',
  email: 'shreerajn.work@gmail.com',
  based: 'India',
  now: 'Product designer intern at AcuAI Labs',
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shreerajnarwade301/' },
    { label: 'Behance', href: 'https://www.behance.net/shreerajnarwade1' },
    { label: 'Substack', href: 'https://substack.com/@shreeraj301' },
    { label: 'Instagram', href: 'https://instagram.com/_shreeraj__' },
    { label: 'X', href: 'https://x.com/_shreeraj__' },
    { label: 'Linktree', href: 'https://linktr.ee/shreeraj301' },
  ],
  resume: '/resume/',
  showreel: 'https://youtu.be/GGkTevFw6dA',
};

// The six behaviours. Order = the hero cluster and the home page sections.
export const verbs: { id: Verb; label: string; code: string; href: string; line: string }[] = [
  { id: 'read', label: 'Read', code: 'RD', href: '/#read', line: 'Products, built and live' },
  { id: 'play', label: 'Play', code: 'PL', href: '/#play', line: 'Prototypes and experiments' },
  { id: 'build', label: 'Build', code: 'BD', href: '/build/', line: 'Architecture' },
  { id: 'pause', label: 'Pause', code: 'PS', href: '/#pause', line: 'Poems and essays' },
  { id: 'sit', label: 'Sit', code: 'ST', href: '/about/', line: 'About' },
  { id: 'gather', label: 'Gather', code: 'GT', href: '#gather', line: 'Contact' },
];

export const statement =
  'I read an app the way I read a building: how it moves you, what it hides, and where it makes you hesitate.';

export type Decision = { title: string; options: string; chose: string; cost: string };
export type Shot = { src: string; alt: string; caption?: string; wide?: boolean };
export type Case = {
  slug: string;
  code: string;
  title: string;
  name: string;
  oneLiner: string;
  year: string;
  role: string;
  platform: string;
  timeline: string;
  status: string;
  tools: string;
  cover: string; // a still in src/assets/covers/; its loop lives in public/covers/<slug>.mp4 and .webm
  glance: string;
  problem: string[];
  hmw: string;
  audience?: { name: string; line: string }[];
  discovery: string;
  findings?: string[];
  turn?: string;
  decisions: Decision[];
  shots: Shot[];
  shipped: string[];
  scrapped?: string[];
  outcomes?: string[];
  learned: string;
  next: string;
  live: string;
  full?: string;
  caveat: string;
};

export const cases: Case[] = [
  {
    slug: 'found-it',
    code: 'RD-01',
    name: 'Found It',
    title: 'Found It: a private subscription tracker',
    oneLiner: 'Finds every recurring charge in a bank statement without the statement ever leaving the browser.',
    year: '2026',
    role: 'Product designer, UX researcher, AI builder (solo)',
    platform: 'Web, desktop and mobile, runs in the browser',
    timeline: 'Oct 2026, 4 weeks, self-initiated',
    status: 'Live prototype',
    tools: 'AI design and coding tools built the prototype from my prompts. I ran the research and wrote the detection rules, flows and copy.',
    cover: 'found-it',
    glance:
      '8 interviews, a 2-week diary study with 12 people, a survey of 214 students, an audit of 6 tools, then 3 usability rounds of 5. In round 3, 13 of 15 people completed the import without help, and trust in the local CSV import rose from 2.9 to 4.4 out of 5.',
    problem: [
      'Subscriptions are designed to be forgotten. Free trials roll into paid plans, prices rise by a dollar or two without notice, and annual renewals arrive when nobody remembers signing up. Students I surveyed underestimated their monthly subscription spend by 2.5x on average.',
      'The tools that fix this ask for bank credentials. The students most worried about leaking money were also the most worried about leaking data, so they never used them.',
    ],
    hmw: 'How might we help students see every recurring charge they pay, and act on the ones they forgot, without asking them to hand over bank access?',
    audience: [
      { name: 'Juggling many subscriptions', line: '10+ subscriptions, no time to audit. 38% of the survey.' },
      { name: 'On tight budgets', line: 'A $15 charge actually matters. 27% of the survey.' },
      { name: 'Privacy-conscious', line: 'Will not link a bank, on principle. 71% of the survey.' },
    ],
    discovery:
      'My starting assumption was that the problem was effort: if tracking were easier, people would do it. The research said otherwise.',
    findings: [
      'Diary participants caught only 58% of the recurring charges their statements showed.',
      '64% of survey respondents had been charged for something they meant to cancel.',
      '71% said they would not link a bank account to a third-party app.',
      'All 6 audited tools required bank linking; 4 made money by upselling financial products.',
    ],
    turn: 'Trust was the blocker. Any design that started with “give us your bank login” would lose the people who needed it most, so trust became the constraint every other decision had to fit inside.',
    decisions: [
      {
        title: 'Local CSV import',
        options: 'Bank linking, PDF statement parsing, inbox scanning, manual entry, or a CSV import.',
        chose: 'A CSV import parsed entirely in the browser. Every bank exports CSV, and on-device parsing is a privacy promise people can check for themselves. PDF parsing was 71% accurate in my tests against 99% for CSV.',
        cost: 'Convenience: one statement export a month.',
      },
      {
        title: 'One focal number',
        options: 'A dashboard led by charts, or one led by a single number: monthly spend.',
        chose: 'The single number. Testers given charts spent their time reading axes; testers given one number went straight to “which of these do I actually use?”',
        cost: 'Depth: no trend analysis on the main screen.',
      },
      {
        title: 'No passphrase recovery',
        options: 'Offer recovery, or offer none.',
        chose: 'None. Statements live in an AES-GCM encrypted vault in IndexedDB, keyed from the passphrase. Any recovery path means someone other than the user can decrypt.',
        cost: 'A lost passphrase means lost data, said up front on the vault screen.',
      },
    ],
    shots: [
      { src: 'found-it/06_vault_import.jpg', alt: 'Found It vault creation and CSV import screens', caption: 'The vault comes before any data. Required columns are listed before upload.', wide: true },
      { src: 'found-it/07_dashboard.jpg', alt: 'Found It dashboard with monthly spend and the Worth a look list', caption: 'Monthly spend leads. “Worth a look” holds only items that need a decision, each explained in one sentence.' },
      { src: 'found-it/08_cancel.jpg', alt: 'Four-step guided cancellation flow', caption: 'Found It never cancels for you. It walks you through the provider\u2019s own steps, then updates the total.' },
      { src: 'found-it/05_before_after.jpg', alt: 'Before and after: chart-first dashboard against one-number dashboard', caption: 'Charts first became one number first after testers put off deciding.', wide: true },
      { src: 'found-it/09_edge_cases.jpg', alt: 'Error states for missing columns and wrong passphrase', caption: 'Each error says what went wrong and what to do next.' },
      { src: 'found-it/10_mobile.jpg', alt: 'Found It at phone width', caption: 'At phone width the vault form stays first and flags stack into single cards.' },
    ],
    shipped: [
      'Recurring charge detection by merchant, cadence and amount tolerance',
      'Price-increase and likely-unused flags in “Worth a look”',
      'AES-GCM encrypted vault keyed from a passphrase',
      'Guided 4-step cancellation with savings shown up front',
    ],
    scrapped: [
      'Automatic cancellation: needs credentials and a server',
      'Cloud sync: deferred until there is demand',
      'PDF parsing: 71% accuracy, more errors than value',
      'Passphrase recovery: someone else could decrypt',
    ],
    outcomes: [
      '$219 average monthly subscription spend found per user, against $86 guessed before import.',
      '4.1 forgotten subscriptions surfaced per user (median).',
      '48s median from CSV drop to full ledger, down from 9 minutes in a spreadsheet.',
      '0 bytes of statement data left the device.',
    ],
    learned:
      'Architecture taught me to design around a site’s real constraint before adding features: the slope, the light, the load. Here the constraint was trust. Once I treated it like a load-bearing wall, the hard calls stopped being losses and became the structure of the product.',
    next: 'A 4-week diary study to test whether a monthly re-import habit holds and whether cancellations stick, plus CSV format detection for Indian bank exports.',
    live: 'https://final-queue-71535764.figma.site',
    full: 'https://alivecoldness301.notion.site/Found-It-Case-Study-3fd3d01bf9e7812383b4d75a4e74fac5',
    caveat: 'Every participant came from one college, so treat this as direction, not proof.',
  },
  {
    slug: 'ledger',
    code: 'RD-02',
    name: 'Ledger',
    title: 'Ledger: a shared approval record for architects and clients',
    oneLiner: 'Every drawing, decision and change, signed off from a link, so the invoice never arrives as a surprise.',
    year: '2026',
    role: 'Product designer and UX researcher (solo)',
    platform: 'Web, responsive: studio on desktop, client on phone',
    timeline: 'Oct 2026, 3 weeks, self-initiated',
    status: 'Live prototype',
    tools: 'AI coding tools wrote most of the code from my specs. I ran the research and wrote the stage model, flows and every client-facing sentence.',
    cover: 'ledger',
    glance:
      'A 6-month architectural internship, two research rounds with 6 architects and 4 homeowners in Pune, Bengaluru and Mumbai, and an audit of six approaches. In round 2, all 6 architects found what was open and all 4 clients approved from a link and read the fee before saying yes.',
    problem: [
      'Before I designed software, I drew buildings. At Anagram Architects I owned plans, sections, renders and client presentations for a school, from concept to the execution set. The hard part was keeping track of what the client had agreed to.',
      'Approvals arrived wherever was nearest: chat apps, an email reply, a remark in a meeting. Every revision added another “final” to the folder, and a change not written down with its cost came back as rework or an invoice dispute.',
    ],
    hmw: 'How might we give an architect and a client one shared record of what was agreed, sheet by sheet and fee by fee, without asking the client to learn new software?',
    audience: [
      { name: 'Architects', line: 'Chasing a yes, defending scope, rebuilding the trail from chat.' },
      { name: 'Homeowners', line: 'Deciding on a phone, unsure what a yes commits them to.' },
      { name: 'Consultants', line: 'Structural and MEP engineers who need the agreed sheet.' },
    ],
    discovery: 'My starting assumption: this was a storage problem. Put every drawing in one place and approvals would follow.',
    findings: [
      '5 of 6 architects had had a client deny a yes given only in chat.',
      'Rebuilding a chat trail before an invoice took 40 minutes.',
      'Folders store sheets but never record which revision the client agreed to.',
      'Fees surfaced after the work, so scope was argued at invoice time.',
    ],
    turn: 'The real problem was agreement, not storage. “Approve from a link” was solved for builders; the gap was earlier, in the design stages, where a yes is given on a sheet or in a chat and its cost should be visible before anyone says it.',
    decisions: [
      {
        title: 'Organised by the stages of practice',
        options: 'A task board, or a timeline built on the five stages: Concept, Design development, Working drawings, Site supervision, Handover.',
        chose: 'The stages. Architects and clients already contract and invoice in them, so the structure needs no explaining. Each sheet sits in the stage it was issued in, like a drawing register.',
        cost: 'Flexibility: real projects overlap stages. Custom stage lists are deferred.',
      },
      {
        title: 'A shared link, no account',
        options: 'A client portal with accounts, or a link that opens one request on a phone.',
        chose: 'The link. If saying yes in Ledger is harder than replying in chat, the yes goes back to chat. 4 of 4 homeowners would abandon a link that asked them to sign up.',
        cost: 'Proof: a named, timestamped record is weaker than a verified signature.',
      },
      {
        title: 'The fee sits on the approval',
        options: 'A separate billing module, or the money on the decision itself.',
        chose: 'The decision. An out-of-scope change shows the fee and extra time above “Agree to this change”, and its invoice stays a draft until the client agrees.',
        cost: 'Scope: Ledger shows money but does not collect it.',
      },
    ],
    shots: [
      { src: 'ledger/06_timeline.jpg', alt: 'Ledger studio timeline organised by stages of practice', caption: 'The timeline answers “whose turn is it?” in one sentence and files every sheet under its stage.', wide: true },
      { src: 'ledger/07_client_approval.jpg', alt: 'Client approving a drawing sheet from a link on a phone', caption: 'Per-sheet sign-off on a phone: open the link, confirm a name, done.' },
      { src: 'ledger/08_change_billing.jpg', alt: 'Out-of-scope change with fee and draft invoice', caption: 'A change is written for the client, with a required fee, and creates a draft invoice.' },
      { src: 'ledger/03_break.jpg', alt: 'Diagram of one change passing through six handoffs', caption: 'One change, six handoffs: the pattern I lived at the studio.', wide: true },
      { src: 'ledger/09_drawings_decisions.jpg', alt: 'Drawing revisions and a pasted chat message saved as a note', caption: 'Revisions are kept; one is marked Latest approved. A pasted chat becomes an attributed note.' },
      { src: 'ledger/11_mobile_a11y.jpg', alt: 'Ledger at 390px with focus rings and dark mode', caption: 'At 390px the five sections fit one bar, with skip link, focus rings and screen-reader labels.' },
    ],
    shipped: [
      'Stage record from concept to handover',
      'Drawing revisions with one Latest approved',
      'Fee before yes on out-of-scope changes',
      'Invoices that cite the approvals behind them',
      'Client link with Approve, Comment, Request a change',
    ],
    scrapped: [
      'Client accounts: one more login for a one-project client',
      'Chat in the product: the conversation already lives in chat apps',
      'Payments: Ledger shows the fee but does not collect it',
      'Internal notes: if it is in Ledger, the client sees it',
    ],
    outcomes: [
      'All 6 architects found what was open (18s) and pasted a chat message into the record (35s).',
      '5 of 6 tied an invoice to an approval (28s).',
      'All 4 clients approved from a link (42s) and read the fee before saying yes.',
      'Client confidence: 4.5 that they knew what they were signing, 4.8 that they did not need an account.',
    ],
    learned:
      'Architecture had already solved half of this. Stages, sheet numbers and revisions are an information architecture architects and clients have shared for decades. My job was to attach the missing piece, the agreement, to a structure that already worked.',
    next: 'Pilot with two small residential studios in Pune and Mumbai for one working-drawings stage, then signed expiring links and a tamper-evident log with an engineer.',
    live: 'https://ledger-chi-rust.vercel.app',
    full: 'https://alivecoldness301.notion.site/Ledger-Case-Study-3fd3d01bf9e7814589cad8bb848a6ccb',
    caveat: 'Ten people across two rounds, so treat this as direction, not proof. No pilot has run yet.',
  },
  {
    slug: 'otla-pages',
    code: 'RD-03',
    name: 'Otla Pages',
    title: 'Otla Pages: a hand-drawn digital library',
    oneLiner: 'A library for my poems and stories, drawn by hand and coded into four quiet rooms.',
    year: '2026',
    role: 'Designer, illustrator, writer and builder (solo)',
    platform: 'Web, desktop and mobile',
    timeline: 'Oct 2026, self-initiated',
    status: 'Live',
    tools: 'Pen and paper for every visual. AI coding tools, GitHub and Vercel built it from my drawings and specs. I wrote all the copy.',
    cover: 'otla-pages',
    glance:
      'A home for four poetry books and 35 pieces of writing, from first sketch to live site. Four rooms: a poetry shelf, a story shelf, a writing room and a guestbook, with a link for every book and piece. No stock or AI imagery anywhere.',
    problem: [
      'My poems lived in flipbook links and a newsletter. They were readable, but nothing about them felt like a place someone could come back to.',
      'Blog templates make every piece look the same, and stock or generated images would have made the work look like everyone else’s.',
    ],
    hmw: 'How might a writing archive feel like a quiet room you walk into, not a feed you scroll past?',
    discovery:
      'I started from the otla, the raised doorstep seat of a Maharashtrian house, where people sit between the street and home. A doorstep is where you pause before going in. That became the structure: you sit at the door, then walk into rooms.',
    decisions: [
      {
        title: 'Drawn by hand, not generated',
        options: 'Stock illustration, AI imagery, or drawing every visual myself.',
        chose: 'Every visual drawn by hand and translated into code, so the site looks the way the poems sound: personal and a little uneven.',
        cost: 'Time: every new room needs new drawings.',
      },
      {
        title: 'Rooms, not a feed',
        options: 'A blog list, a grid of cards, or rooms you walk through.',
        chose: 'Four rooms: a poetry shelf, a story shelf, a writing room and a guestbook. Every book and piece has its own shareable link, so a reader can send one poem, not the whole site.',
        cost: 'Discovery: a reader has to wander a little to find things.',
      },
      {
        title: 'A reader that respects the reader',
        options: 'Embed the existing flipbooks, or build a reader.',
        chose: 'A custom reader for the four books with keyboard page turns, a plain-text edition of the whole library and a skip link.',
        cost: 'Two versions of every book to keep in step.',
      },
    ],
    shots: [
      { src: 'otla-pages/01_door.jpg', alt: 'Otla Pages landing: the name in serif capitals, a handwritten greeting and an enter button on paper', caption: 'The doorstep: one handwritten line and one way in.', wide: true },
      { src: 'otla-pages/02_shelf.jpg', alt: 'The poetry shelf, a hand-drawn bookcase where four coloured spines stand out among blank ones', caption: 'The poetry shelf. The four coloured spines are the four books; the blank ones are room to grow.', wide: true },
      { src: 'otla-pages/03_writing_room.jpg', alt: 'The writing room, a pinboard of hand-drawn notes, one per poem or essay', caption: 'The writing room: 35 pieces pinned up, each one a link.', wide: true },
      { src: 'otla-pages/04_text.jpg', alt: 'The plain-text edition listing every shelf and piece as simple links', caption: 'The plain-text edition: the whole library as a list, for screen readers and slow connections.', wide: true },
    ],
    shipped: [
      'Four rooms: poetry shelf, story shelf, writing room and guestbook',
      'A custom reader with keyboard page turns',
      'A plain-text edition of the whole library, and a skip link',
      'A shareable link for every book and piece',
      'Music and page sounds, both off with one tap',
    ],
    scrapped: ['Stories: the shelf is built, the stories are still being written'],
    learned:
      'Drawing every visual by hand slowed me down in the right places. Each room had to earn its drawing, which kept the library small, quiet and mine.',
    next: 'Fill the story shelf, and keep adding to the writing room.',
    live: 'https://otla-pages-lofi.vercel.app',
    caveat: 'A personal project: no research numbers here, only the craft and the decisions behind it.',
  },
  {
    slug: 'settle',
    code: 'RD-04',
    name: 'Settle',
    title: 'Settle: GST credit review for small businesses',
    oneLiner: 'Reads bills, GSTR-2B and the bank statement together, and says in plain words why each credit is blocked.',
    year: '2026',
    role: 'Product designer, UX researcher, AI builder (solo)',
    platform: 'Web, responsive, light and dark themes',
    timeline: 'Oct 2026, 4 weeks, self-initiated',
    status: 'Live prototype',
    tools: 'A design tool for round one. AI assistants wrote most of the code from my specs; I wrote the copy, matching rules and every flag sentence.',
    cover: 'settle',
    glance:
      'Six interviews (3 owners, 2 Chartered Accountants, 1 CA aspirant), then three test rounds with the same six people: a clickable prototype, an early coded build and the live build. Unaided completion went from 14 of 24 tasks to 22 of 24.',
    problem: [
      'Every month an Indian business can claim back the GST it paid on purchases, but only if the supplier’s filing shows up in its GSTR-2B and every detail agrees with its own books. For a small trader that check happens in the accountant’s spreadsheet a few days before the deadline.',
      'The owner hears a final number and rarely the reason. The causes are mundane: a GSTIN typed one character wrong, a supplier who has not filed, a bill in the wrong month, a payment entered twice. Each needs a different person to act.',
    ],
    hmw: 'How might I help a small business owner, and the accountant beside them, see which credit they can claim this month and fix every mismatch without reading a spreadsheet?',
    audience: [
      { name: 'Know the number', line: 'How much credit is safe to claim, and how much is at risk.' },
      { name: 'Know the reason', line: 'Why a bill does not match, in words an owner can repeat.' },
      { name: 'Know who acts', line: 'Whether I can fix it now or have to wait on a vendor.' },
    ],
    discovery: 'My starting assumption was that people wanted faster matching: upload the files, press a button, get the answer.',
    findings: [
      'All three owners learn their credit from their accountant over chat and could not say why last month was lower.',
      'Both CAs estimated two to three hours of spreadsheet matching per client each month.',
      'The same causes repeated: GSTIN typos, unfiled suppliers, wrong periods, duplicates.',
      '“I spend more time explaining the mismatch than finding it.” (a CA, paraphrased)',
    ],
    turn: 'The hard part was the conversation after matching: explaining why a credit is blocked and who has to act. Settle became a tool for explaining and resolving flags, with matching as the step before it.',
    decisions: [
      {
        title: 'Evidence side by side',
        options: 'One reconciliation table with a status column, or a card list with a detail panel.',
        chose: 'Cards with Books, GSTR-2B and Bank side by side, because owners wanted to compare their row with what the supplier filed before trusting a fix.',
        cost: 'Density. A CA sees fewer rows, so J and K move between flags.',
      },
      {
        title: 'Severity and confidence as two labels',
        options: 'One combined “match score”, or two separate labels.',
        chose: 'Separate pills, because in round one 4 of 6 people read a percentage as the chance of getting the credit.',
        cost: 'One more pill on every card.',
      },
      {
        title: 'Approval stays locked',
        options: 'Allow approval with a warning, or block it until blockers are resolved.',
        chose: 'Block, with a button that says why: “Approve September (6 high flags open)”. In round one a CA approved a month with open flags without noticing.',
        cost: 'Less freedom for an accountant who has already accepted a risk.',
      },
    ],
    shots: [
      { src: 'settle/05_review_gstin_evidence.jpg', alt: 'Settle flag explaining a GSTIN one character off, with evidence columns', caption: 'The flag explains itself and highlights the differing field in both columns. The fix sits under the evidence.', wide: true },
      { src: 'settle/06_review_fixed_undo_toast.jpg', alt: 'Fixed flag with undo toast', caption: 'Fixing updates the at-risk total at once, and Undo makes a fix feel safe.' },
      { src: 'settle/07_approve_blocked.jpg', alt: 'Approve button blocked with six high flags open', caption: 'The button says how many blocking flags are still open.' },
      { src: 'settle/04_before_after.jpg', alt: 'Round one table against the shipped flag card', caption: 'Round one’s table with a match score, beside the flag card that names the cause.', wide: true },
      { src: 'settle/04_match_done.jpg', alt: 'Matching result with claimable and at-risk totals', caption: 'Matching leads with the totals: claimable, at risk and matched pairs.' },
      { src: 'settle/12a_mobile_review.jpg', alt: 'Settle review list at 390px', caption: 'At 390px the sidebar becomes a bottom bar, for owners checking between customers.' },
    ],
    shipped: [
      'Five-step month flow from upload to export',
      'Seven flag types with tailored fixes',
      'Vendor follow-up and reasoned ignore',
      'Undo on every routine action',
      'Guarded approval with a confirm that restates totals',
    ],
    scrapped: [
      'Parsing of real uploaded files (not built yet)',
      'Any month other than September',
      'A real XLSX export',
      'Live alerts for screen readers',
    ],
    outcomes: [
      '22 of 24 tasks completed without help in round 3, up from 14 of 24.',
      'Explaining a blocked credit took a median of 15 seconds, down from about 40.',
      'Ease of use averaged 4.3 out of 5, up from 2.8.',
      'All three owners could say their claimable total and biggest risk without asking.',
    ],
    learned:
      'Writing the flag sentence first, then designing around it, shaped the review screen more than any layout choice. Guardrails earn trust when they explain themselves, like a disabled button that says how many flags are left.',
    next: 'Parse real GSTR-2B and bill files and test them with the two CAs on a live month, then work with an engineer on the GST portal APIs.',
    live: 'https://settle-roan.vercel.app',
    full: 'https://alivecoldness301.notion.site/Settle-Case-Study-4013d01bf9e781f68bb0f5e1ba6ffdfd',
    caveat: 'Only six people, the same ones each round, so treat this as direction, not proof.',
  },
  {
    slug: 'plain-paper',
    code: 'RD-05',
    name: 'Plain Paper',
    title: 'Plain Paper: research abstracts for non-experts',
    oneLiner: 'An AI research reader with guardrails that keep the source in view: summary, jargon in place, questions worth asking.',
    year: '2026',
    role: 'Product designer, UX researcher, AI builder (solo)',
    platform: 'Web, responsive',
    timeline: 'Oct 2026, 4 weeks, self-initiated',
    status: 'Live prototype (input flow) and concept build (results)',
    tools: 'Figma Make built the input flow from my prompts; Claude and Grok helped draft code and explanations. I ran the research, designed the results view and wrote the guardrail copy.',
    cover: 'plain-paper',
    glance:
      'A baseline comprehension test with 212 college peers, 18 interviews, a 2-week diary study with 9 people, an audit of 11 tools and a 4-person expert panel, then a rerun with 96 new peers. Correctly explaining the main finding went from 34% to 81%.',
    problem: [
      'Research is public but hard to understand. Abstracts are written for peer reviewers, yet people meet papers through the news, social media or a doctor, then hit a wall of jargon, statistics and hedging.',
      'In my baseline study, 68% stopped reading before the end and 1 in 3 misread the main finding, most often confusing correlation with causation.',
    ],
    hmw: 'How might we help non-experts understand what a study found, and what it did not, without asking them to trust an AI summary they cannot check?',
    audience: [
      { name: 'Patients and caregivers', line: 'Reading under stress, needing questions for a clinician.' },
      { name: 'Students', line: 'Citing papers outside their field.' },
      { name: 'Journalists', line: 'On deadline, needing to report without overstating.' },
    ],
    discovery: 'My starting assumption: jargon was the problem. Decode the words and people would understand.',
    findings: [
      'Readers spent 58% of their time on methods detail they did not need.',
      '14 of 18 interviewees wanted the original words next to any explanation.',
      'Misreadings almost always came from missing a limitation in the final sentence.',
      'None of 11 audited tools paired a plain summary with the original wording and its limits.',
    ],
    turn: 'The barrier was knowing which parts mattered, and people would not trust a summary they could not check. The design had to point to what matters, caveat included, while keeping the source in view.',
    decisions: [
      {
        title: 'Jargon explained inside the original',
        options: 'A glossary, a plain rewrite that replaces the abstract, or highlights inside the original.',
        chose: 'Inline highlights. A rewrite asks readers to trust the AI completely; in place, every claim can be checked against the source. Trust rose from 2.8 to 4.2 out of 5.',
        cost: 'Density: the abstract stays on screen.',
      },
      {
        title: 'Three reading levels',
        options: 'One “plain English” summary, or Simple, Everyday and Informed.',
        chose: 'Three levels, because readers split on numbers. The structure and caveat stay identical at every level, so switching never hides the limitation.',
        cost: 'Three outputs to check, and one more choice up front.',
      },
      {
        title: 'A fixed structure, no chat',
        options: 'An open “chat with the paper”, or a fixed structure plus reviewer-style questions.',
        chose: 'The fixed structure. Chat drifted beyond the abstract in 23% of test sessions: too risky for someone reading about a diagnosis.',
        cost: 'Flexibility: no follow-ups. The questions partly fill the gap.',
      },
    ],
    shots: [
      { src: 'plain-paper/07_summary.jpg', alt: 'Plain Paper summary with Read with care beside the bottom line', caption: 'Concept build: the caveat sits beside the verdict, and the AI says it can be wrong.', wide: true },
      { src: 'plain-paper/06_input.jpg', alt: 'Plain Paper input with reading level chips', caption: 'Live prototype: one labelled field, a reading level chosen up front, a 6,000-character counter.' },
      { src: 'plain-paper/08_jargon_questions.jpg', alt: 'A term explained inside its sentence, and questions worth asking', caption: '“Rate ratio, 0.83” explained inside its own sentence, and questions with one-tap copy.' },
      { src: 'plain-paper/03_directions.jpg', alt: 'Six sketched directions compared', caption: 'Six directions tested with 24 peers. No single one answered every insight.', wide: true },
      { src: 'plain-paper/10_edge_cases.jpg', alt: 'Empty, too short and too long input states', caption: 'Real states, including an honest notice when no model is connected.' },
      { src: 'plain-paper/11_mobile.jpg', alt: 'Plain Paper at 390px', caption: 'At 390px the chips drop their hints and everything stacks.' },
    ],
    shipped: [
      'Abstract-only input',
      'Streaming summary, first sentence in under 2 seconds',
      'A permanent, visible AI-can-be-wrong note',
      'Nothing stored: no accounts, no history',
    ],
    scrapped: [
      'Chat with the paper: drifted beyond the abstract',
      'Full PDF upload: accuracy fell on long papers',
      'A credibility score: experts disagreed 40% of the time',
      'Saved library and accounts: outside the core job',
    ],
    outcomes: [
      'Correctly explained the main finding: 34% to 81% (rerun with 96 new peers).',
      'Spotted the study’s main limitation: 19% to 72%.',
      'Read to the end: 32% to 88%.',
      'Time to understand an abstract: 11.2 to 3.4 minutes.',
    ],
    learned:
      'Trust in AI is a layout problem as much as a model problem. Architecture taught me people trust a structure when they can see how it stands; here, the original text and the caveat beside the verdict do that work.',
    next: 'Connect a model behind these guardrails with an engineer, set an accuracy bar with a PM, then test with a patient-advocacy group and a student newsroom.',
    live: 'https://trade-verify-42377008.figma.site',
    full: 'https://alivecoldness301.notion.site/Plain-Paper-Case-Study-3fd3d01bf9e781668f00c155badbcb21',
    caveat: 'All participants were college peers and the results view is a concept build, so treat this as direction, not proof.',
  },
  {
    slug: 'plainform',
    code: 'RD-06',
    name: 'Plainform',
    title: 'Plainform: official forms in plain language',
    oneLiner: 'Every question shown as written and in plain language side by side, with answer checks that wait until you have finished.',
    year: '2026',
    role: 'Product designer, UX researcher, AI builder (solo)',
    platform: 'Web, responsive',
    timeline: 'Oct 2026, 3 weeks, self-initiated',
    status: 'Live prototype',
    tools: 'Figma Make built the prototype from my prompts, with Claude and Grok helping on code. I wrote the rule list, every hint and all feedback messages.',
    cover: 'plainform',
    glance:
      '12 think-aloud sessions with college peers, drop-off data from form sessions, coded support tickets and a readability audit of one 8-question form. Average reading ease went from 29 to 61 on the prototype’s own scoring.',
    problem: [
      'Official forms are written to be legally exact, and understanding comes second. “Furnish the date of nativity of the Applicant” is a date-of-birth question in disguise.',
      'The people who most need a bank account, a benefit or a loan are often the ones the wording stops. They guess, give up or phone for help, and mistakes only surface after they submit.',
    ],
    hmw: 'How might we make an official form understandable to someone who struggles with its wording, without removing the legal text, and without making them feel tested while they answer?',
    audience: [
      { name: 'Lower literacy', line: 'Reading well below the level these forms assume.' },
      { name: 'Second-language speakers', line: 'Idioms and legal terms do not translate cleanly.' },
      { name: 'Older adults', line: 'Often moving from paper to online forms for the first time.' },
    ],
    discovery: 'My starting assumption: hard words were the problem. Swap them for simple ones and people would get through.',
    findings: [
      'People often knew the answer; they could not tell what was being asked.',
      'Whole constructions hid simple questions. “The Applicant” alone fired 6 of 25 rule hits.',
      'Help hidden behind a tooltip was rarely opened.',
      'Mistakes surfaced late, after the form had been sent.',
    ],
    turn: 'Meaning and timing mattered more than vocabulary. People needed to see what a question asks right where they answer it, with the official wording still in place, and to hear about a mistake once they had finished an answer.',
    decisions: [
      {
        title: 'Original and plain, side by side',
        options: 'A plain rewrite that replaces the form, tooltips and a glossary, or both versions side by side.',
        chose: 'Side by side. The official wording is binding, so a tool that deletes it cannot be adopted. Tooltips need a hover that does not exist on a phone.',
        cost: 'Space: two columns per question. On phones the panes stack, original first.',
      },
      {
        title: 'A reviewed rule list',
        options: 'A model-generated rewrite per question, or reviewed rules tagged wordy, jargon or legal.',
        chose: 'Rules, because every change can be traced: the original phrase struck through, its replacement tinted, a chip naming the rule.',
        cost: 'Nuance: word rules can collide (“you has domiciled”).',
      },
      {
        title: 'Checks when a field is left',
        options: 'Check on every keystroke, at submit, or when a field is left.',
        chose: 'On leaving the field. Keystroke checks call a half-typed answer wrong, which lands hardest on slow typists and second-language speakers.',
        cost: 'A slip in the last answer waits until “Check answers”.',
      },
    ],
    shots: [
      { src: 'plainform/05_question_card.jpg', alt: 'Question card with original and plain versions and reading scores', caption: 'Each row shows the problem and the fix: scores, flagged phrases, the rule behind each change, a hint.', wide: true },
      { src: 'plainform/07_feedback.jpg', alt: 'Answer check messages at three severity levels', caption: 'Three levels carried by an icon and a sentence, never colour alone.' },
      { src: 'plainform/08_check.jpg', alt: 'Check answers summary', caption: 'Check answers says how many questions still need attention.' },
      { src: 'plainform/02_audit.jpg', alt: 'Readability audit chart of the account-opening form', caption: 'The audit: questions average 29 as written and 61 in plain form.', wide: true },
      { src: 'plainform/11_rule_limits.jpg', alt: 'Where word rules collide', caption: 'Where rules break. The one-line hint is often the clearest sentence on the card.' },
      { src: 'plainform/09_mobile.jpg', alt: 'Plainform at 390px', caption: 'At 390px the panes stack, original first, each error under its field.' },
    ],
    shipped: [
      'Side-by-side question cards with reading-ease scores',
      '25 traceable rule changes across wordy, jargon and legal',
      'A one-line hint for every question',
      'Checks when a field is left, at three severity levels',
    ],
    scrapped: [
      'A full rewrite: the legal text has to stay',
      'Tooltips and a glossary: hidden help, no hover on touch',
      'Free-form AI rewrites: not traceable',
      'Checks on every keystroke: they blame half-finished answers',
    ],
    outcomes: [
      'Average reading ease from 29 to 61, from 25 traceable rule changes.',
      'Twelve think-aloud sessions shaped the direction: side by side, with checks that wait.',
      'My own audit found the gaps: fields lack programmatic labels and errors are not announced. First on the fix list.',
    ],
    learned:
      'Inclusive design is mostly timing and honesty. The same message reads as help after you have finished an answer and as blame while you are still typing.',
    next: 'Close the accessibility gaps, then run a moderated comparison with 16 people recruited through a public library and an adult-literacy charity, with NVDA and VoiceOver passes.',
    live: 'https://verse-snail-93452857.figma.site',
    full: 'https://alivecoldness301.notion.site/Plainform-Case-Study-3fd3d01bf9e781b08817f0f31477c35c',
    caveat: 'The think-aloud group was 12 peers and the scores come from the prototype’s own scoring, so treat this as direction, not proof.',
  },
  {
    slug: 'lease-lens',
    code: 'RD-07',
    name: 'Lease Lens',
    title: 'Lease Lens: a lease reader that shows its working',
    oneLiner: 'Reads a pasted lease inside the browser and flags clauses that could cost a renter money, rights or the freedom to leave, each with a polite question for the landlord.',
    year: '2026',
    role: 'Product designer, UX researcher, AI builder (solo)',
    platform: 'Web, responsive down to 390px',
    timeline: 'Oct 2026, 3 weeks, self-initiated',
    status: 'Live prototype',
    tools: 'An AI tool built the prototype from my prompts. I wrote the rules, every flag explanation and every question to ask; the tone of each line was my design.',
    cover: 'lease-lens',
    glance:
      'Interviews with 14 college peers and 3 legal-aid staff, a review of 40 public lease templates, then moderated tests with 22 college peers. 18 of 22 found a clause they had missed on their own read.',
    problem: [
      'Most renters sign a 10 to 30 page lease after a quick skim. Legal help is expensive, and generic checklists never point to the actual sentence that matters.',
      'My starting assumption was that renters miss bad clauses because leases are long, so a short summary would fix it.',
    ],
    hmw: 'How might we help a renter find the clause that could cost them, in the lease\u2019s own words, and make raising it feel normal?',
    discovery: 'I interviewed 14 peers about leases they had signed and 3 legal-aid staff, then reviewed 40 public templates to learn how risky clauses are actually worded.',
    findings: [
      'Confidence, more than length, was the problem.',
      'Renters needed the exact sentence, not a summary of it.',
      'They needed what it could mean for them, said in one hedged line.',
      'They needed a polite question that makes raising it feel normal.',
    ],
    turn: 'Only rules could point to the exact words, give the same answer every time and keep the lease on the device. Their cost, missing unusual wording, became a design problem I could put on screen.',
    decisions: [
      {
        title: 'Transparent rules',
        options: 'An LLM that summarises the lease, a static checklist, or a rule-based highlighter.',
        chose: 'Rules. Every flag points to the words that fired it, the same lease always gives the same result, and the text never leaves the browser. My 518-word test lease returned 18 flags in about 40 ms.',
        cost: 'Coverage: wording no rule expects slips through, so every flag shows its evidence.',
      },
      {
        title: 'Evidence, meaning and a question',
        options: 'Label clauses unfair or illegal, summarise the whole lease, or one fixed card per flag.',
        chose: 'The fixed card: category, plain title, severity word, the exact sentence with trigger words marked, one hedged line on what it may mean, then a question to ask.',
        cost: 'Decisiveness: no yes or no here, so the note points to a tenant union or attorney.',
      },
      {
        title: 'Calm, worded severity',
        options: 'Red warning banners on every risky clause, or soft tints with a dot and the word High, Medium or Low.',
        chose: 'Calm. Early tests with bright warnings made people anxious. Severity never depends on colour alone.',
        cost: 'Urgency: High flags lead and the score keeps the one strong ring.',
      },
    ],
    shots: [
      { src: 'lease-lens/03.jpg', alt: 'A year of rent, read in a skim: lease sentence with trigger words marked', caption: 'Each flag quotes the exact sentence and marks the words that fired it.', wide: true },
      { src: 'lease-lens/13.jpg', alt: 'Each flag ends in a question for the landlord', caption: 'Each flag ends in a question you can bring to the landlord.' },
      { src: 'lease-lens/12.jpg', alt: 'Calm severity styling with High, Medium and Low words', caption: 'Calm by default, clear where it counts.' },
      { src: 'lease-lens/08.jpg', alt: 'From a verdict to evidence', caption: 'From a verdict to evidence: the card shows its working.', wide: true },
      { src: 'lease-lens/10.jpg', alt: 'Trust is set before the first flag', caption: 'Trust is set before the first flag: what happens to the lease is said at the input.' },
      { src: 'lease-lens/15.jpg', alt: 'Not legal advice note beside the result', caption: 'Not legal advice, said right beside the result.' },
    ],
    shipped: [
      'Rule-based flags across 10 categories, each quoting the words that fired it',
      'A plain explanation and a question to ask on every flag',
      'An overall risk score with counts by severity',
      'A built-in lease to try, and a “no flags” message that still urges a careful read',
    ],
    scrapped: [
      'PDF upload: plain text keeps processing local',
      'State-by-state legality claims: the tool cannot know what is enforceable',
      'A letter generator: one step too close to legal advice',
      'Account history: nothing to store means nothing to leak',
    ],
    outcomes: [
      '18 of 22 testers (82%) found a clause they had missed on their own read.',
      '9.4s median from paste to first flag.',
      '4.6 out of 5 clarity rating for the plain explanations.',
      '10 of 10 risky clauses flagged on my 16-clause test lease, and none of the 6 fair ones.',
    ],
    learned: 'Risk was a tone problem first and a detection problem second. The same flag can inform or frighten depending on its colour and its first sentence.',
    next: 'Test with renters on their own leases beyond my college, and grow the rule set with a legal-aid partner.',
    live: 'https://brook-poppy-87653606.figma.site',
    full: 'https://www.behance.net/gallery/257650933/Lease-Lens-Risky-Lease-Clauses-Flagged-for-Renters',
    caveat: 'Testers were college peers and the leases were mine, so I read the results as a first indication only. Not legal advice.',
  },
];

// PLAY: prototypes and experiments. img = screenshot of the live build.
export const experiments = [
  { code: 'PL-01', name: 'Orbital', line: 'A gravity sandbox. Fling bodies, build binaries, watch a figure-8 hold.', href: 'https://orbital-livid-five.vercel.app', img: 'play/orbital.jpg', kind: 'Simulation' },
  { code: 'PL-02', name: 'Warp', line: 'A 3D starfield you steer with the pointer. Shift boosts.', href: 'https://warp-gamma-ashen.vercel.app', img: 'play/warp.jpg', kind: 'WebGL' },
  { code: 'PL-03', name: 'Hold', line: 'Tower defense. Four instruments, twelve waves, gold from what you break.', href: 'https://hold-six.vercel.app', img: 'play/hold.jpg', kind: 'Game' },
  { code: 'PL-04', name: 'Ashline', line: 'An infinite runner across a burning ridge. Jump the stone, slide the wire.', href: 'https://ashline-liard.vercel.app', img: 'play/ashline.jpg', kind: 'Game' },
  { code: 'PL-05', name: 'Resonance', line: 'An audio visualizer and playable synth: bars, radial, rings, or your mic.', href: 'https://resonance-delta-three.vercel.app', img: 'play/resonance.jpg', kind: 'Audio' },
  { code: 'PL-06', name: 'Bench', line: 'Six HCI master’s programs compared for a designer from India on an F-1.', href: 'https://bench-mu-two.vercel.app', img: 'play/bench.jpg', kind: 'Decision tool' },
  { code: 'PL-07', name: 'CodeLingo', line: 'Learn to code by restyling a live app, one class at a time.', href: 'https://codelingo-studio.vercel.app', img: 'play/codelingo.jpg', kind: 'Learning' },
  { code: 'PL-08', name: 'Paper Trail', line: 'A pinboard for my poems, sorted by feeling.', href: 'https://paper-trail-lime-seven.vercel.app', img: 'play/paper-trail.jpg', kind: 'Writing' },
  { code: 'PL-09', name: 'BiteBudget', line: 'A budget recipe engine with pantry matching and an AI sous-chef.', href: 'https://bite-budget-six.vercel.app', img: 'play/bitebudget.jpg', kind: 'Practice' },
  { code: 'PL-10', name: 'PawPal', line: 'A dog walking app: find, book and track a walker.', href: 'https://foyer-drawn-59924504.figma.site', img: 'play/pawpal.jpg', kind: 'Practice' },
  { code: 'PL-11', name: 'Zoo ticketing', line: 'Timed-entry ticketing flow for a wildlife park.', href: 'https://portal-safe-87289165.figma.site', img: 'play/zoo.jpg', kind: 'Practice' },
];

// BUILD: architecture
export const thesis = {
  title: 'Syntax of Behaviour',
  sub: 'B.Arch thesis, School of Environment and Architecture, Mumbai. Aug 2025 to Apr 2026.',
  question:
  'How can everyday human behaviours be translated into minimal architectural forms that, when clustered, turn sterile residential layouts into active public spaces?',
  research:
    'I mapped density, duration, activity and demographics on four street types, more than 50 hours at each site, asking how width, edges, plinths, walls and thresholds shape what people do. Read through Gibson’s affordances, a median becomes a labour hub and parked cars become evening seating, and what a space affords shifts with gender, age, class and time of day.',
  kit:
    'The design is The Kit: precast concrete modules grouped by behaviour, To Sit, Play, Read, Perform, Balance and Refresh, each with core and functional specs and usage diagrams. Two manuals document it, much like a design system.',
  modules: ['To Balance', 'To Sit', 'To Play', 'To Perform', 'To Read', 'To Refresh'],
  link: 'https://drive.google.com/drive/folders/1CIPEjaNldF4-NS2vODsrEsmIPL7d4_1N',
};

export const buildWork = [
  { code: 'BD-02', name: 'ABRIR / OPEN', meta: 'Lisbon, May 2024. Proposal for the Government of Portugal with FabLab Lisbon. With Aaditya Pandit.', line: 'Adaptive reuse of a historic market site. A month of field research across Paris, Barcelona, Madrid and Lisbon, then a proposal at three scales: open space, facade and interiors.', img: 'build/abrir.jpg' },
  { code: 'BD-03', name: 'Micro-climatic fort wall', meta: 'Moti Daman, Gujarat. Semester 3, Environmental Flows. With Chetasvi Patel.', line: 'A shadeless promenade outside the fort. Modules borrow the spatiality of the few trees to make shade, rest and viewing pockets that let the wall breathe.', img: 'build/fortwall.jpg' },
  { code: 'BD-04', name: 'Working drawings', meta: 'Bimbisar Nagar, Goregaon. Semester 6, Building Making.', line: 'A community building from concept to a full construction set: day-care, clinic, library, kitchen, hall and nursery, with specifications and estimates.', img: 'build/drawings.jpg' },
  { code: 'BD-05', name: 'Delta 3D printer', meta: 'Semester 3, Architectural Kitchen. With Gauri Shinde.', line: 'Rebuilt the college’s cartesian printer as a faster delta printer and wrote the code to run it. A question about how tools shape form.', img: 'build/delta.jpg' },
  { code: 'BD-06', name: 'Shiatsu pod massager', meta: 'Semester 7, Product Design. With Anika Pugalia.', line: 'A two-part desk massager: a teak sphere for deep tissue, a cork-and-resin pod we cast ourselves, internals 3D printed in translucent PLA.', img: 'build/shiatsu.jpg' },
];

export const practice = [
  { place: 'Anagram Architects, New Delhi', when: 'Nov 2024 to Apr 2025', what: 'Plans, sections, renders and client presentations for Prakriti School, Greater Noida, through the execution set. For a retail client who felt 7 ft beams made the store low, I proposed mirror-clad beam fascias reflecting the stretch ceiling to add perceived height. It was built.' },
  { place: 'LocalxSociety, Europe', when: 'Apr to May 2024', what: 'Led a two-person team through field research in four cities for the ABRIR / OPEN proposal in Lisbon.' },
];

// PAUSE: writing
export const books = [
  { title: 'The Universe Between Us', note: 'One love in 34 short poems: a glance across a studio, a borrowed stapler, then anger, grief and something lighter.', href: 'https://otla-pages-lofi.vercel.app/poetry/the-universe-between-us', tone: 'read' as Verb },
  { title: 'Window Seat, Facing Backward', note: 'Poems', href: 'https://otla-pages-lofi.vercel.app/poetry/window-seat-facing-backward', tone: 'build' as Verb },
  { title: 'Learning You, by Heart', note: 'Poems', href: 'https://otla-pages-lofi.vercel.app/poetry/learning-you-by-heart', tone: 'play' as Verb },
  { title: 'Two Time Zones From Home', note: 'Poems', href: 'https://otla-pages-lofi.vercel.app/poetry/two-time-zones-from-home', tone: 'pause' as Verb },
];

export const essays = [
  { title: 'Craft is what you delete', line: 'Six days into a new design job, most of my work has been removing things.', href: 'https://substack.com/@shreeraj301' },
  { title: 'The gut feeling, part two', line: 'Why we judge a room, a website or an app in the first few seconds.', href: 'https://substack.com/@shreeraj301' },
  { title: 'The psychology of my gut feeling', line: 'Intuition as an evolved algorithm, and how to tell it from anxiety.', href: 'https://substack.com/@shreeraj301' },
];

export const otla = {
  name: 'Otla Pages',
  href: 'https://otla-pages-lofi.vercel.app',
  line: 'My writing lives in a library I drew by hand and coded, named after the otla, the doorstep seat of a Maharashtrian house.',
};

// SIT: about
export const about = {
  intro: [
    'I trained as an architect. For five years I studied how people actually use space: where they pause, where they get lost, and what makes a place feel safe enough to stay in. Now I design digital products and ask the same questions about screens.',
    'What I bring is patience with mess. Architecture taught me to sit with budgets, codes, clients and the people who have to live with the result, and to find the version that works for all of them. I research before I draw, and every decision comes with a reason a user would understand.',
    'I want to design products that handle money, decisions and everyday life, at a team that cares about details, and make complicated things feel calm.',
  ],
  // Newest first, strictly by date. kind colours the marker: design, architecture or study.
  timeline: [
    { when: 'Oct 2026, now', kind: 'design', what: 'Product designer intern, AcuAI Labs', line: 'Remote. Redesigning the core app of a B2B SaaS platform for AI product feeds and ad creatives.' },
    { when: 'Oct 2026', kind: 'design', what: 'Seven products, designed, built and shipped', line: 'Found It, Ledger, Otla Pages, Settle, Plain Paper, Plainform and Lease Lens, all live.' },
    { when: 'Dec 2025 to May 2026', kind: 'study', what: 'Google UX Design Certificate', line: 'Coursera, alongside the thesis.' },
    { when: 'Aug 2025 to Apr 2026', kind: 'arch', what: 'B.Arch thesis, Syntax of Behaviour', line: 'Street behaviour mapped over 50+ hours a site, turned into a kit of precast modules.' },
    { when: 'Nov 2024 to Apr 2025', kind: 'arch', what: 'Architectural intern, Anagram Architects', line: 'New Delhi. A school and a store, from concept to the execution set.' },
    { when: 'Apr to May 2024', kind: 'arch', what: 'Architectural intern, LocalxSociety', line: 'Led field research in four European cities for ABRIR / OPEN, Lisbon.' },
    { when: '2022', kind: 'study', what: '1st place, Esri StoryMaps contest', line: 'CEPT University.' },
    { when: 'Dec 2021 to Apr 2026', kind: 'study', what: 'Bachelor of Architecture', line: 'School of Environment and Architecture, Mumbai. CGPA 3.5/4.' },
  ],
  tools: [
    { group: 'Research', items: 'Interviews, diary studies, surveys, think-alouds, behavioural mapping, journey maps, information architecture' },
    { group: 'Design', items: 'Figma, Framer, Photoshop, Illustrator, InDesign' },
    { group: 'Build', items: 'HTML, CSS, AI prototyping (Claude, Figma Make, Cursor, Google AI Studio), GitHub, Vercel' },
    { group: 'Space', items: 'Rhino, Grasshopper, SketchUp, Blender, AutoCAD, Revit, Enscape, Lumion, V-Ray' },
    { group: 'Other', items: 'Python (basic), QGIS, Premiere Pro, DaVinci Resolve. English, Hindi, Marathi.' },
  ],
};
