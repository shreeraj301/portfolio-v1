// Isometric geometry for the Kit modules. Used on the server (SVG markup) and the client (shadows).
// World units: x runs down-right, y runs down-left, z is up. One module sits in a 4 x 4 cell.
import type { Verb } from '../data/site';

export type Box = { x: number; y: number; z?: number; w: number; d: number; h: number; top?: string };
export type Pt = [number, number];

const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);

export const iso = (x: number, y: number, z: number, s: number): Pt => [(x - y) * C * s, (x + y) * S * s - z * s];

const pts = (p: Pt[]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

// The three visible faces of a box: top, left (y = max), right (x = max).
export function faces(b: Box, s: number, ox = 0, oy = 0) {
  const z0 = b.z ?? 0;
  const z1 = z0 + b.h;
  const P = (x: number, y: number, z: number): Pt => {
    const [a, c] = iso(x + ox, y + oy, z, s);
    return [a, c];
  };
  const { x, y, w, d } = b;
  return {
    top: pts([P(x, y, z1), P(x + w, y, z1), P(x + w, y + d, z1), P(x, y + d, z1)]),
    left: pts([P(x, y + d, z1), P(x + w, y + d, z1), P(x + w, y + d, z0), P(x, y + d, z0)]),
    right: pts([P(x + w, y, z1), P(x + w, y + d, z1), P(x + w, y + d, z0), P(x + w, y, z0)]),
  };
}

// Convex hull (monotone chain) for shadow outlines.
function hull(p: Pt[]): Pt[] {
  const a = [...p].sort((m, n) => m[0] - n[0] || m[1] - n[1]);
  const cross = (o: Pt, u: Pt, v: Pt) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]);
  const lo: Pt[] = [];
  for (const q of a) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  const up: Pt[] = [];
  for (const q of a.reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

// Shadow of a box on the ground plane for a sun direction (dx, dy) per unit of height.
export function shadow(b: Box, s: number, dx: number, dy: number, ox = 0, oy = 0) {
  const z1 = (b.z ?? 0) + b.h;
  const z0 = b.z ?? 0;
  const foot: [number, number][] = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.d], [b.x, b.y + b.d]];
  const ground: Pt[] = [];
  for (const [x, y] of foot) {
    ground.push(iso(x + ox + dx * z0, y + oy + dy * z0, 0, s));
    ground.push(iso(x + ox + dx * z1, y + oy + dy * z1, 0, s));
  }
  return pts(hull(ground));
}

// Painter's order: far boxes first.
export const order = (boxes: Box[]) =>
  [...boxes].sort((a, b) => a.x + a.y + (a.w + a.d) / 2 + (a.z ?? 0) * 0.5 - (b.x + b.y + (b.w + b.d) / 2 + (b.z ?? 0) * 0.5));

// The six modules, abstracted from the Kit catalogue (To Read, To Play, To Perform, To Sit...).
export const modules: Record<Verb, Box[]> = {
  // Read: a bench with a shelf wall behind it
  read: [
    { x: 0, y: 0, w: 4, d: 4, h: 0.35 },
    { x: 0, y: 0, w: 0.7, d: 4, h: 2.9, z: 0.35 },
    { x: 0.7, y: 0.4, w: 1.5, d: 3.2, h: 0.9, z: 0.35 },
  ],
  // Play: stepped climbing blocks
  play: [
    { x: 0, y: 0, w: 4, d: 1.34, h: 2.6 },
    { x: 0, y: 1.33, w: 4, d: 1.34, h: 1.7 },
    { x: 0, y: 2.66, w: 4, d: 1.34, h: 0.85 },
    { x: 0, y: 0, w: 1.3, d: 1.3, h: 0.5, z: 2.6, top: 'green' },
  ],
  // Build: a portal frame, two piers and a lintel
  build: [
    { x: 0.2, y: 0.4, w: 1, d: 3.2, h: 2.4 },
    { x: 2.8, y: 0.4, w: 1, d: 3.2, h: 2.4 },
    { x: 0.2, y: 0.4, w: 3.6, d: 3.2, h: 0.7, z: 2.4 },
  ],
  // Pause: a low plinth around a planter
  pause: [
    { x: 0, y: 0, w: 4, d: 4, h: 0.55 },
    { x: 1, y: 1, w: 2, d: 2, h: 0.75, z: 0.55, top: 'green' },
  ],
  // Sit: the Kit's table seat, two slabs on a stem
  sit: [
    { x: 0, y: 0, w: 4, d: 4, h: 0.45 },
    { x: 1.5, y: 1.5, w: 1, d: 1, h: 1.25, z: 0.45 },
    { x: 0.6, y: 0.6, w: 2.8, d: 2.8, h: 0.4, z: 1.7 },
  ],
  // Gather: an L of steps facing a small stage
  gather: [
    { x: 0, y: 0, w: 4, d: 1.1, h: 1.5 },
    { x: 0, y: 1.1, w: 1.1, d: 2.9, h: 1.5 },
    { x: 1.1, y: 1.1, w: 2.9, d: 0.9, h: 0.75 },
    { x: 1.1, y: 2, w: 0.9, d: 2, h: 0.75 },
  ],
};

// Cell positions in the hero cluster (world units).
export const cells: Record<Verb, [number, number]> = {
  read: [0, 0],
  play: [5.5, 0],
  build: [11, 0],
  pause: [0, 5.5],
  sit: [5.5, 5.5],
  gather: [11, 5.5],
};
