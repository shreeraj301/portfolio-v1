// The six Kit modules, modelled after the thesis renders: bevelled precast parts, an arch, curved steps,
// shelves with books, a planter with a tree. Every module returns its parts (for the exploded view) and
// a set of boxes that approximate its volume. Units: one module sits on a 4 x 4 footprint,
// local origin at the centre of the footprint, on the ground.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Verb = 'read' | 'play' | 'build' | 'pause' | 'sit' | 'gather';
export type ShapeBox = { half: [number, number, number]; pos: [number, number, number] };
export type Built = { group: THREE.Group; parts: THREE.Object3D[]; shapes: ShapeBox[]; mats: THREE.MeshStandardMaterial[]; sway?: THREE.Object3D };

let grain: THREE.CanvasTexture | null = null;
/** A faint precast grain: light speckle and soft blotches, multiplied into every material. */
export function grainTexture() {
  if (grain) return grain;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, r = 10 + Math.random() * 40;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(120,110,100,${0.018 + Math.random() * 0.02})`);
    grad.addColorStop(1, 'rgba(120,110,100,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const img = g.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 8;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  grain = new THREE.CanvasTexture(c);
  grain.userData.shared = true; // cached across scenes: never disposed with one of them
  grain.colorSpace = THREE.SRGBColorSpace;
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.anisotropy = 4;
  return grain;
}

export function concrete(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0, map: grainTexture() });
}

// Seeded, so the shelves look the same on every visit.
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function shade(m: THREE.Mesh) { m.castShadow = true; m.receiveShadow = true; return m; }

/** A bevelled box with its base at y. Returns the mesh and its physics box. */
function block(w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material, r = 0.07): [THREE.Mesh, ShapeBox] {
  const m = shade(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01)), mat));
  m.position.set(x, y + h / 2, z);
  return [m, { half: [w / 2, h / 2, d / 2], pos: [x, y + h / 2, z] }];
}

function part(...objs: THREE.Object3D[]) { const g = new THREE.Group(); objs.forEach((o) => g.add(o)); return g; }

const BEVEL = { bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 40 };

export function buildModule(id: Verb, color: string): Built {
  seed = 11;
  const group = new THREE.Group();
  const parts: THREE.Object3D[] = [];
  const shapes: ShapeBox[] = [];
  const main = concrete(color);
  const mats = [main];
  const add = (p: THREE.Object3D, ...s: ShapeBox[]) => { parts.push(p); group.add(p); shapes.push(...s); };
  let sway: THREE.Object3D | undefined;

  if (id === 'read') {
    // A reading bench against a shelf wall, books on the shelves.
    const [base, sb] = block(4, 0.34, 4, 0, 0, 0, main);
    add(part(base), sb);
    const [wall, sw] = block(4, 2.75, 0.62, 0, 0.34, -1.69, main);
    add(part(wall), sw);
    const shelf = new THREE.Group();
    const books = ['#efe9df', '#e2c463', '#de7a5e', '#151413', '#8dbf7c', '#edb088'].map((c) => concrete(c));
    mats.push(...books);
    for (const [y] of [[1.42], [2.3]]) {
      const [board] = block(3.7, 0.1, 0.5, 0, y, -1.13, main, 0.03);
      shelf.add(board);
      let x = -1.6;
      for (let i = 0; i < 9; i++) {
        const w = 0.12 + rnd() * 0.08, hgt = 0.34 + rnd() * 0.18;
        if (rnd() < 0.22) { x += 0.22; continue; }
        const [b] = block(w, hgt, 0.36, x, y + 0.1, -1.15, books[(i + (y > 2 ? 3 : 0)) % books.length], 0.015);
        if (rnd() < 0.15) b.rotation.z = 0.18;
        shelf.add(b);
        x += w + 0.03;
        if (x > 1.6) break;
      }
    }
    const [div1] = block(0.1, 1.85, 0.5, -0.4, 0.62, -1.13, main, 0.03);
    const [div2] = block(0.1, 1.85, 0.5, 1.0, 0.62, -1.13, main, 0.03);
    shelf.add(div1, div2);
    add(shelf);
    const [seat, ss] = block(3.4, 0.5, 1.05, 0, 0.34, -0.2, main);
    add(part(seat), ss);
  }

  if (id === 'play') {
    // Stepped climbing blocks with planters cut into the treads.
    const grass = concrete('#6f9a5d');
    mats.push(grass);
    const tiers: [number, number, number][] = [[4, 0, 0], [2.7, 0.8, -0.65], [1.4, 1.6, -1.3]];
    tiers.forEach(([d, y, z], i) => {
      const [t, s] = block(4, 0.8, d, 0, y, z, main);
      const p = part(t);
      if (i < 2) {
        const [g1] = block(0.95, 0.06, 0.95, i ? 0.9 : -1.1, y + 0.78, z + d / 2 - 0.7, grass, 0.02);
        p.add(g1);
      }
      add(p, s);
    });
    const [box, sbx] = block(1.1, 0.9, 1.1, 1.2, 2.4, -1.4, main);
    const [top] = block(0.9, 0.06, 0.9, 1.2, 3.28, -1.4, grass, 0.02);
    add(part(box, top), sbx);
  }

  if (id === 'build') {
    // A precast arch: the portal of the Kit cover, with a step block beside it.
    // One contour that runs around the opening, so the arch is open at the ground.
    const s = new THREE.Shape();
    s.moveTo(-1.85, 0); s.lineTo(-0.85, 0); s.lineTo(-0.85, 1.35);
    s.absarc(0, 1.35, 0.85, Math.PI, 0, true);
    s.lineTo(0.85, 0); s.lineTo(1.85, 0); s.lineTo(1.85, 3); s.lineTo(-1.85, 3); s.lineTo(-1.85, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 1.2, ...BEVEL });
    geo.translate(0, 0, -0.6);
    const arch = shade(new THREE.Mesh(geo, main));
    arch.position.set(0, 0.05, -0.9);
    add(part(arch),
      { half: [0.5, 1.5, 0.65], pos: [-1.35, 1.55, -0.9] },
      { half: [0.5, 1.5, 0.65], pos: [1.35, 1.55, -0.9] },
      { half: [1.9, 0.4, 0.65], pos: [0, 2.65, -0.9] });
    const [step, ss] = block(1.6, 0.55, 1.3, 1.1, 0, 1.15, main);
    const [step2, ss2] = block(0.8, 0.55, 1.3, 1.5, 0.55, 1.15, main);
    add(part(step), ss);
    add(part(step2), ss2);
  }

  if (id === 'pause') {
    // A plinth with a raised planter and a tree to sit under.
    const grass = concrete('#6f9a5d');
    const bark = concrete('#7a6552');
    const leafA = new THREE.MeshStandardMaterial({ color: '#7fae68', roughness: 0.9, flatShading: true });
    const leafB = new THREE.MeshStandardMaterial({ color: '#6b9a57', roughness: 0.9, flatShading: true });
    mats.push(grass, bark, leafA, leafB);
    const [plinth, sp] = block(4, 0.48, 4, 0, 0, 0, main);
    add(part(plinth), sp);
    const [bed, sb] = block(2.3, 0.7, 2.3, -0.2, 0.48, -0.2, main);
    const [soil] = block(2.0, 0.06, 2.0, -0.2, 1.15, -0.2, grass, 0.02);
    add(part(bed, soil), sb);
    const tree = new THREE.Group();
    const trunk = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.5, 10), bark));
    trunk.position.set(0, 0.75, 0);
    tree.add(trunk);
    const canopy = new THREE.Group();
    canopy.position.set(0, 1.5, 0);
    const blobs: [number, number, number, number, THREE.Material][] = [[0, 0.55, 0, 0.82, leafA], [0.5, 0.25, 0.2, 0.6, leafB], [-0.45, 0.3, -0.25, 0.62, leafB], [0.1, 0.95, -0.2, 0.55, leafA]];
    for (const [x, y, z, r, m] of blobs) {
      const b = shade(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m));
      b.position.set(x, y, z);
      canopy.add(b);
    }
    tree.add(canopy);
    tree.position.set(-0.2, 1.18, -0.2);
    add(tree, { half: [0.15, 0.75, 0.15], pos: [-0.2, 1.93, -0.2] });
    sway = canopy;
  }

  if (id === 'sit') {
    // The Kit's table seat: two slabs on a stem, with stools.
    const [low, sl] = block(4, 0.38, 4, 0, 0, 0, main);
    add(part(low), sl);
    const [stem, ss] = block(0.8, 1.25, 0.8, -0.2, 0.38, -0.2, main);
    add(part(stem), ss);
    const [top, st] = block(2.9, 0.3, 2.9, -0.2, 1.63, -0.2, main);
    add(part(top), st);
    const stoolGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.62, 28);
    const stools = new THREE.Group();
    for (const [x, z] of [[1.35, 0.6], [0.6, 1.4], [-1.3, 1.35]]) {
      const m = shade(new THREE.Mesh(stoolGeo, main));
      m.position.set(x, 0.38 + 0.31, z);
      stools.add(m);
    }
    add(stools, { half: [0.6, 0.31, 0.6], pos: [1.0, 0.69, 1.0] });
  }

  if (id === 'gather') {
    // Curved steps around a small stage: seating rises toward the back.
    const ring = (r0: number, r1: number, h: number, y: number) => {
      const s = new THREE.Shape();
      s.absarc(0, 0, r1, Math.PI / 2, Math.PI, false);
      s.lineTo(-r0, 0);
      s.absarc(0, 0, r0, Math.PI, Math.PI / 2, true);
      s.lineTo(0, r1);
      const g = new THREE.ExtrudeGeometry(s, { depth: h, ...BEVEL });
      g.rotateX(-Math.PI / 2);
      const m = shade(new THREE.Mesh(g, main));
      m.position.set(1.95, y, 1.95);
      return m;
    };
    const [stage, sst] = block(1.5, 0.16, 1.5, 1.2, 0, 1.2, main, 0.05);
    add(part(stage), sst);
    add(part(ring(1.25, 2.15, 0.45, 0)), { half: [1.5, 0.22, 1.5], pos: [0.3, 0.22, 0.3] });
    add(part(ring(2.15, 3.05, 0.9, 0)), { half: [1.6, 0.45, 1.6], pos: [-0.2, 0.45, -0.2] });
    add(part(ring(3.05, 3.95, 1.35, 0)), { half: [1.9, 0.67, 0.5], pos: [-0.05, 0.67, -1.5] }, { half: [0.5, 0.67, 1.9], pos: [-1.5, 0.67, -0.05] });
  }

  return { group, parts, shapes, mats, sway };
}

/** Plate: the plaza slab, with a faint 1-unit paving grid like the Kit catalogue plate. */
export function buildPlate(w: number, d: number) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#dedad2';
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(80,70,60,0.07)';
  g.lineWidth = 2;
  const step = 512 / 8;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * step, 0); g.lineTo(i * step, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * step); g.lineTo(512, i * step); g.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 8, d / 8);
  tex.anisotropy = 8;
  const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const side = new THREE.MeshStandardMaterial({ color: '#c9c4ba', roughness: 0.95 });
  const geo = new THREE.BoxGeometry(w, 0.36, d);
  const m = new THREE.Mesh(geo, [side, side, top, side, side, side]);
  m.receiveShadow = true;
  m.position.y = -0.18;
  return m;
}

/** A soft round contact shadow, drawn under each module so it always feels grounded. */
export function contactTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(40,30,20,0.55)');
  grad.addColorStop(0.55, 'rgba(40,30,20,0.18)');
  grad.addColorStop(1, 'rgba(40,30,20,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Pieces from the Manual cover, for the Build cluster ----------
export type Piece = 'bridge' | 'terraces' | 'path';

/** Extra precast pieces modelled on the cover of The Kit, Manual 01. Same 4 x 4 footprint and materials. */
export function buildPiece(kind: Piece, color: string): Built {
  seed = 23;
  const group = new THREE.Group();
  const parts: THREE.Object3D[] = [];
  const main = concrete(color);
  const mats = [main];
  const add = (p: THREE.Object3D) => { parts.push(p); group.add(p); };

  if (kind === 'bridge') {
    // A long precast beam on legs: an arch open to the ground, and a round window through the solid half.
    const s = new THREE.Shape();
    s.moveTo(-2, 0); s.lineTo(-1.55, 0); s.lineTo(-1.55, 0.7);
    s.absarc(-0.75, 0.7, 0.8, Math.PI, 0, true);
    s.lineTo(0.05, 0); s.lineTo(2, 0); s.lineTo(2, 2.1); s.lineTo(-2, 2.1); s.lineTo(-2, 0);
    const hole = new THREE.Path();
    hole.absarc(1.05, 1.05, 0.62, 0, Math.PI * 2, false);
    s.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 1.7, ...BEVEL });
    geo.translate(0, 0, -0.85);
    const m = shade(new THREE.Mesh(geo, main));
    m.position.set(0, 0.03, -0.6);
    add(part(m));
    const [ledge] = block(4, 0.42, 1.25, 0, 0, 1.35, main);
    add(part(ledge));
  }

  if (kind === 'terraces') {
    // Stepped terraces with sunken planters, the yellow field of the cover.
    const grass = concrete('#5f8f4f');
    mats.push(grass);
    const rows: [number, number][] = [[1.35, 0], [0, 0.55], [-1.35, 1.1]];
    rows.forEach(([z, y], r) => {
      const tier = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const x = -1.35 + i * 1.35;
        const planter = (i + r) % 2 === 0;
        const [b] = block(1.3, 0.55 + y, 1.3, x, 0, z, main, 0.06);
        tier.add(b);
        if (planter) {
          const [rim] = block(1.0, 0.36, 1.0, x, 0.55 + y, z, main, 0.05);
          const [soil] = block(0.8, 0.06, 0.8, x, 0.88 + y, z, grass, 0.02);
          tier.add(rim, soil);
        }
      }
      add(tier);
    });
  }

  if (kind === 'path') {
    // A low paved run with a step and a curved bench: the red path that ties the cover together.
    const [slab] = block(4, 0.3, 4, 0, 0, 0, main);
    add(part(slab));
    const [step] = block(4, 0.32, 1.1, 0, 0.3, -1.45, main);
    add(part(step));
    const s = new THREE.Shape();
    s.absarc(0, 0, 1.6, Math.PI / 2, Math.PI, false);
    s.lineTo(-1.05, 0);
    s.absarc(0, 0, 1.05, Math.PI, Math.PI / 2, true);
    s.lineTo(0, 1.6);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.5, ...BEVEL });
    g.rotateX(-Math.PI / 2);
    const bench = shade(new THREE.Mesh(g, main));
    bench.position.set(1.9, 0.3, 1.9);
    add(part(bench));
  }

  return { group, parts, shapes: [], mats };
}
