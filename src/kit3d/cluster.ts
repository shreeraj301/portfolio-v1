// The Build section scene: the Kit locked together into one piece, like the cover of Manual 01.
// It opens as an exploded axonometric: every piece already in view, pulled back from its bay along a
// grid axis (up, the two long sides, front or back). Scrolling assembles it one piece at a time
// (scrubbed, so scrolling back takes it apart again) while the frame closes in on the finished Kit.
// Pieces move only along the plan's own axes, never toward the camera, so the isometric reads true,
// and nothing ever enters through the edge of the frame. Each lands with a hard stop, a small give
// and a puff of dust. Hover lifts a piece on the crane spring and greys out the rest. The sun follows
// the pointer. No dragging: this one is finished.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { buildModule, buildPiece, contactTexture, type Verb, type Piece, type Built } from './modules';
import { makeRenderer, addLights } from './stage';

/** Where a piece waits before it is set into its bay: straight up, or out along a plan axis.
 *  Edge pieces leave through their own edge, so no path crosses another piece. */
export type From = 'up' | 'left' | 'right' | 'front' | 'back';
export type Item = { kind: Verb | Piece; label: string; color: string; x: number; z: number; rot: number; from: From; far: number };

// Laid out on 4-unit cells so the pieces touch, the way they do on the cover. `from` and `far` set where
// each piece waits in the exploded state: chosen so the parts spread evenly over the square frame (the
// closest two centres sit about 6.5 units apart) while the frame pulls back only to ~0.73x of the
// finished Kit, so the pieces stay large. Every path leaves through its own edge or from above.
export const CLUSTER: Item[] = [
  { kind: 'pause', label: 'To Refresh', color: '#e2c463', x: 12, z: 0, rot: 0, from: 'right', far: 3.5 },
  { kind: 'terraces', label: 'To Play', color: '#e2c463', x: 8, z: 0, rot: 0, from: 'back', far: 9.5 },
  { kind: 'play', label: 'To Play', color: '#8dbf7c', x: 4, z: 0, rot: 0, from: 'back', far: 4.5 },
  { kind: 'read', label: 'To Read', color: '#7fa4da', x: 0, z: 0, rot: 0, from: 'up', far: 11 },
  { kind: 'bridge', label: 'To Balance', color: '#eaa766', x: 12, z: 4, rot: 0, from: 'front', far: 3.5 },
  { kind: 'sit', label: 'To Sit', color: '#edb088', x: 8, z: 4, rot: Math.PI / 2, from: 'front', far: 8.5 },
  { kind: 'gather', label: 'To Perform', color: '#aaa49a', x: 4, z: 4, rot: 0, from: 'up', far: 8 },
  { kind: 'path', label: 'To Sit', color: '#de7a5e', x: 0, z: 4, rot: Math.PI / 2, from: 'left', far: 3.5 },
];
export const CLUSTER_CENTER = new THREE.Vector3(6, 0, 2.5);
const VERBS = ['read', 'play', 'build', 'pause', 'sit', 'gather'];

/** Build every piece of the cluster at rest. Shared with the offline render of the fallback still. */
export function buildCluster(scene: THREE.Scene) {
  return CLUSTER.map((it) => {
    const b: Built = VERBS.includes(it.kind) ? buildModule(it.kind as Verb, it.color) : buildPiece(it.kind as Piece, it.color);
    b.group.position.set(it.x, 0, it.z);
    b.group.rotation.y = it.rot;
    b.group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    scene.add(b.group);
    return b;
  });
}

/** A floor that only receives shadows, so the cluster stands on the page itself. */
export function shadowFloor(scene: THREE.Scene, opacity = 0.2) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity }));
  p.rotation.x = -Math.PI / 2;
  p.receiveShadow = true;
  scene.add(p);
  return p;
}

/** Frame the cluster: the title sits in the top TITLE of the frame, the cluster is centred in the rest
 *  with even margins. Shared with the offline still so the two line up exactly. */
const TITLE = 0.2, MARGIN = 0.06;
export function frameCluster(cam: THREE.OrthographicCamera, box: THREE.Box3, aspect: number) {
  cam.position.copy(CLUSTER_CENTER).add(new THREE.Vector3(20, 20, 20));
  cam.lookAt(CLUSTER_CENTER);
  cam.updateMatrixWorld();
  const v = cam.matrixWorldInverse;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const q = new THREE.Vector3(x, y, z).applyMatrix4(v);
    x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
  }
  const w = x1 - x0, h = y1 - y0;
  // The usable area is the frame minus the title band and the margins.
  const useW = 1 - 2 * MARGIN, useH = 1 - TITLE - 2 * MARGIN;
  let fw = w / useW, fh = h / useH;
  if (fw / fh < aspect) fw = fh * aspect; else fh = fw / aspect;
  const cx = (x0 + x1) / 2;
  const midFromTop = TITLE + MARGIN + useH / 2; // centre of the usable area, as a fraction from the top
  const top = (y0 + y1) / 2 + midFromTop * fh;
  cam.left = cx - fw / 2; cam.right = cx + fw / 2; cam.top = top; cam.bottom = top - fh;
  cam.updateProjectionMatrix();
}

const GREY = new THREE.Color('#d2cdc3');
// The exploded state. Plan axes only: +x runs to the lower right on screen, +z to the lower left.
const DIR: Record<From, THREE.Vector3> = {
  up: new THREE.Vector3(0, 1, 0),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
  back: new THREE.Vector3(0, 0, -1),
  front: new THREE.Vector3(0, 0, 1),
};
const CARRY = 0.55; // side pieces travel this high, then are lowered the last bit, like off a crane
// Piece i owns progress [i/n * SPREAD, ... + SLICE]; the frame closes in over [0, FRAME_END].
const SPREAD = 0.62, SLICE = 0.3, FRAME_END = 0.9;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
const inOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
const spring = (p: number, v: number, target: number, w: number, dt: number) => v + (w * w * (target - p) - 2 * w * v) * dt;

type Opts = { reduced: boolean; touch: boolean; mobile: boolean };
type Part = Built & { item: Item; y: number; lift: number; liftV: number; landed: boolean; give: number; focus: number; base: THREE.Color[]; blob: THREE.Mesh; wait: THREE.Vector3 };

export class KitCluster {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  private sun: THREE.DirectionalLight;
  private parts: Part[] = [];
  private byMesh = new Map<THREE.Object3D, Part>();
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private hovered: Part | null = null;
  private progress = 0;
  private visible = true;
  private dirty = true;
  private px = 0; private pxLag = 0;
  private shake = 0;
  private dust: { pts: THREE.Points; vel: Float32Array; t: number }[] = [];
  private rings: { mesh: THREE.Mesh; t: number; s: number }[] = [];
  private ro: ResizeObserver;
  private tickFn = (t: number, dt: number) => this.tick(t, dt);
  private on: { move: (e: PointerEvent) => void; leave: () => void; win: (e: PointerEvent) => void };
  private base = { left: -1, right: 1, top: 1, bottom: -1 };      // the finished Kit, framed
  private open = { left: -1, right: 1, top: 1, bottom: -1 };      // the exploded Kit, framed
  private openBox = new THREE.Box3();
  private lastSun = -1;
  private blobTex = contactTexture();
  private restBox = new THREE.Box3();
  onHover: (label: string | null) => void = () => {};

  constructor(private el: HTMLElement, private o: Opts) {
    this.renderer = makeRenderer(el, o.mobile);
    this.sun = addLights(this.scene, CLUSTER_CENTER, 14, o.mobile);
    shadowFloor(this.scene);
    buildCluster(this.scene).forEach((b, i) => {
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 6.2), new THREE.MeshBasicMaterial({ map: this.blobTex, transparent: true, depthWrite: false, opacity: 0.55 }));
      blob.rotation.x = -Math.PI / 2;
      blob.position.set(CLUSTER[i].x, 0.012, CLUSTER[i].z);
      this.scene.add(blob);
      const it = CLUSTER[i];
      const wait = DIR[it.from].clone().multiplyScalar(it.far); // each piece waits at its own distance, so the parts read as scattered, not as a ring
      if (it.from !== 'up') wait.y = CARRY;
      const p: Part = { ...b, item: it, y: 0, lift: 0, liftV: 0, landed: true, give: 0, focus: 0, base: b.mats.map((m) => m.color.clone()), blob, wait };
      b.group.traverse((ob) => this.byMesh.set(ob, p));
      this.parts.push(p);
    });
    this.restBox = new THREE.Box3();
    this.parts.forEach((p) => {
      const b = new THREE.Box3().setFromObject(p.group);
      this.restBox.union(b);
      this.openBox.union(b.clone().translate(p.wait)); // where it waits in the exploded state
    });
    this.openBox.union(this.restBox);
    this.fit();
    // Resizing a canvas clears it, so draw straight away even if the ticker is idle (a pin releasing
    // can nudge the box by a fraction of a pixel while it is off the ticker's watch).
    this.ro = new ResizeObserver(() => { this.fit(); this.dirty = true; this.draw(); });
    this.ro.observe(el);
    this.on = {
      move: (e) => this.pointer(e),
      leave: () => this.hover(null),
      win: (e) => { const r = el.getBoundingClientRect(); this.px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))); },
    };
    const c = this.renderer.domElement;
    if (!o.touch) { c.addEventListener('pointermove', this.on.move); c.addEventListener('pointerleave', this.on.leave); addEventListener('pointermove', this.on.win, { passive: true }); }
    this.setProgress(o.reduced ? 1 : 0);
    gsap.ticker.add(this.tickFn);
  }

  /** Two frames, both measured from fixed boxes rather than live positions: the finished Kit, and the
   *  exploded Kit with every piece where it waits. Scroll moves between them, so every waiting piece is
   *  always inside the frame at any size or aspect, and a resize mid-assembly never jumps the shot. */
  private fit() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    const cam = this.camera;
    frameCluster(cam, this.openBox, r.width / r.height);
    this.open = { left: cam.left, right: cam.right, top: cam.top, bottom: cam.bottom };
    frameCluster(cam, this.restBox, r.width / r.height);
    this.base = { left: cam.left, right: cam.right, top: cam.top, bottom: cam.bottom };
  }

  private draw() {
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  /** 0: nothing placed yet; 1: the whole Kit set down. Scrubbed by scroll. */
  setProgress(p: number) { this.progress = p; this.dirty = true; }
  setVisible(v: boolean) { this.visible = v; if (v) this.dirty = true; }

  private pointer(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const hit = this.ray.intersectObjects(this.parts.filter((p) => p.landed).map((p) => p.group), true)[0];
    this.hover(hit ? this.byMesh.get(hit.object) ?? null : null);
  }

  private hover(p: Part | null) {
    if (p === this.hovered) return;
    this.hovered = p;
    this.renderer.domElement.style.cursor = p ? 'default' : '';
    this.onHover(p ? p.item.label : null);
    this.dirty = true;
  }

  private land(p: Part) {
    p.landed = true;
    if (this.o.reduced) return;
    gsap.timeline().to(p, { give: 0.045, duration: 0.06, ease: 'power2.out' }).to(p, { give: 0, duration: 0.4, ease: 'power3.out' });
    this.shake = Math.max(this.shake, 0.05);
    const x = p.item.x, z = p.item.z;
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.15, 2.2, 64), new THREE.MeshBasicMaterial({ color: '#a39885', transparent: true, opacity: 0.25, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.02, z);
    this.scene.add(ring); this.rings.push({ mesh: ring, t: 0, s: 0.8 });
    const n = 20, pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, rr = 2 + Math.random() * 0.3;
      pos[i * 3] = x + Math.cos(a) * rr; pos[i * 3 + 1] = 0.1; pos[i * 3 + 2] = z + Math.sin(a) * rr;
      vel[i * 3] = Math.cos(a) * (1 + Math.random() * 2); vel[i * 3 + 1] = 0.5 + Math.random() * 1.2; vel[i * 3 + 2] = Math.sin(a) * (1 + Math.random() * 2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#b9ae9c', size: 0.09, transparent: true, opacity: 0.65, depthWrite: false }));
    this.scene.add(pts); this.dust.push({ pts, vel, t: 0 });
  }

  private tick(time: number, dtMs: number) {
    if (!this.visible || document.hidden) return;
    const dt = Math.min(dtMs / 1000, 1 / 20);
    const reduced = this.o.reduced;
    let moving = this.dirty || this.dust.length > 0 || this.rings.length > 0;
    const n = this.parts.length;
    this.parts.forEach((p, i) => {
      // Each piece gets its own slice of the scroll. 'up' pieces drop like a weight (gravity, hard stop).
      // Side pieces glide in along their axis at carry height, easing out as they reach the bay, then
      // are lowered the last bit, so every piece is set down the same way.
      const t = reduced ? 1 : clamp01((this.progress - (i / n) * SPREAD) / SLICE);
      let away = 0, y = 0;
      if (p.item.from === 'up') {
        y = p.wait.y * (1 - t * t);
      } else {
        const g = clamp01(t / 0.78), d = clamp01((t - 0.78) / 0.22);
        away = 1 - inOut(g);
        y = CARRY * (1 - d * d);
      }
      if (t >= 1 && !p.landed) this.land(p);
      if (t < 1) p.landed = false;
      p.y = y;
      p.group.position.x = p.item.x + p.wait.x * away;
      p.group.position.z = p.item.z + p.wait.z * away;
      // Crane lift on hover: critically damped, so it rises and stops without wobble.
      const want = this.hovered === p && p.landed ? 0.9 : 0;
      if (!reduced) { p.liftV = spring(p.lift, p.liftV, want, 11, dt); p.lift += p.liftV * dt; } else p.lift = want;
      if (Math.abs(p.liftV) > 1e-3 || Math.abs(p.lift - want) > 1e-3) moving = true;
      // The soft contact shadow follows the piece across the floor and darkens as it comes down.
      p.blob.position.x = p.group.position.x;
      p.blob.position.z = p.group.position.z;
      const near = 1 - clamp01(y / 3);
      (p.blob.material as THREE.MeshBasicMaterial).opacity = 0.55 * near * near;
      p.group.position.y = y + p.lift - p.give;
      if (p.give) moving = true;
      // Focus: the others go back to bare concrete.
      const f = this.hovered && this.hovered !== p ? 1 : 0;
      p.focus += (f - p.focus) * (reduced ? 1 : 1 - Math.pow(0.86, dt * 60));
      if (Math.abs(f - p.focus) > 1e-3) moving = true;
      p.mats.forEach((m, k) => m.color.copy(p.base[k]).lerp(GREY, p.focus * 0.85));
      if (p.sway && !reduced) { p.sway.rotation.z = Math.sin(time * 1.1 + 1) * 0.035; p.sway.rotation.x = Math.sin(time * 0.8) * 0.025; moving = true; }
      if (t > 0 && t < 1) moving = true;
    });

    // The sun follows the pointer across the section, slowly.
    this.pxLag += (this.px - this.pxLag) * (1 - Math.pow(0.94, dt * 60));
    const a = 2.0 + (reduced ? 0 : this.pxLag * 0.9 + Math.sin(time * 0.06) * 0.25);
    this.sun.position.set(CLUSTER_CENTER.x - Math.cos(a) * 14, 18, CLUSTER_CENTER.z - Math.sin(a) * 14);
    if (Math.abs(a - this.lastSun) > 0.003) { moving = true; this.lastSun = a; }

    this.shake *= Math.pow(0.82, dt * 60);
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    // The frame closes in from the exploded Kit to the finished one as it assembles.
    const k = reduced ? 1 : smooth(clamp01(this.progress / FRAME_END));
    const o = this.open, b = this.base, cam = this.camera;
    const lerp = (a: number, c: number) => a + (c - a) * k;
    cam.left = lerp(o.left, b.left) + sx; cam.right = lerp(o.right, b.right) + sx;
    cam.top = lerp(o.top, b.top) + sy; cam.bottom = lerp(o.bottom, b.bottom) + sy;
    cam.updateProjectionMatrix();

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i]; r.t += dt / 0.9;
      const e = 1 - Math.pow(1 - Math.min(1, r.t), 3);
      r.mesh.scale.setScalar(1 + e * 0.35);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 * (1 - e);
      if (r.t >= 1) { this.scene.remove(r.mesh); r.mesh.geometry.dispose(); (r.mesh.material as THREE.Material).dispose(); this.rings.splice(i, 1); }
    }
    for (let i = this.dust.length - 1; i >= 0; i--) {
      const d = this.dust[i]; d.t += dt / 1.1;
      const pos = d.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let k = 0; k < pos.count; k++) {
        d.vel[k * 3] *= 0.94; d.vel[k * 3 + 2] *= 0.94; d.vel[k * 3 + 1] -= 3 * dt;
        pos.array[k * 3] += d.vel[k * 3] * dt; pos.array[k * 3 + 1] = Math.max(0.03, pos.array[k * 3 + 1] + d.vel[k * 3 + 1] * dt); pos.array[k * 3 + 2] += d.vel[k * 3 + 2] * dt;
      }
      pos.needsUpdate = true;
      (d.pts.material as THREE.PointsMaterial).opacity = 0.65 * (1 - d.t);
      if (d.t >= 1) { this.scene.remove(d.pts); d.pts.geometry.dispose(); (d.pts.material as THREE.Material).dispose(); this.dust.splice(i, 1); }
    }

    if (moving) {
      this.renderer.shadowMap.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
    }
    this.dirty = false;
  }

  dispose() {
    gsap.ticker.remove(this.tickFn);
    this.ro.disconnect();
    const c = this.renderer.domElement;
    c.removeEventListener('pointermove', this.on.move); c.removeEventListener('pointerleave', this.on.leave);
    removeEventListener('pointermove', this.on.win);
    this.parts.forEach((p) => gsap.killTweensOf(p));
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
        const map = (x as THREE.MeshStandardMaterial).map;
        if (map && !map.userData.shared) map.dispose();
        x.dispose();
      });
    });
    this.blobTex.dispose();
    this.renderer.forceContextLoss(); // hand the WebGL context back now, not whenever GC runs
    this.renderer.dispose();
    c.remove();
  }
}
