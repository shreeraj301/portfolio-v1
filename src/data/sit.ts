// Sit: the line under the heading, and the behaviours marked in the intro.
export const otlaNote = 'The otla: the raised doorstep seat of a Maharashtrian house, between the street and home.';

// The three behaviours the paragraph names, each in the colour of a Kit module.
const behaviours: [string, 'pause' | 'read' | 'sit'][] = [
  ['where they pause', 'pause'],
  ['where they get lost', 'read'],
  ['feel safe enough to stay in', 'sit'],
];

/** Split a sentence into plain runs and marked behaviours. */
export function marked(text: string) {
  const out: { t: string; k?: string }[] = [];
  let rest = text;
  for (const [phrase, k] of behaviours) {
    const i = rest.indexOf(phrase);
    if (i < 0) continue;
    if (i) out.push({ t: rest.slice(0, i) });
    out.push({ t: phrase, k });
    rest = rest.slice(i + phrase.length);
  }
  if (rest) out.push({ t: rest });
  return out;
}
