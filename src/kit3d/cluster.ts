// The Build section scene: the Kit locked together into one piece, like the cover of Manual 01.
// Scrolling into the section lowers the pieces in one by one (scrubbed, so scrolling back lifts them
// out again); each lands with a hard stop, a small give and a puff of dust. Hover lifts a piece on the
// crane spring and greys out the rest. The sun follows the pointer. No dragging: this one is finished.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { buildModule, buildPiece, contactTexture, type Verb, type Piece, type Built } from './modules';
import { makeRenderer, addLights } from './stage';

export type Item = { kind: Verb | Piece; label: string; color: string; x: number; z: number; rot: number };

// Laid out on 4-unit cells so the pieces touch, the way they do on the cover.
export const CLUSTER: Item[] = [
  { kind: 'pause', label: 'To Refresh', color: '#e2c463', x: 12, z: 0, rot: 0 },
  { kind: 'terraces', label: 'To Play', color: '#e2c463', x: 8, z: 0, rot: 0 },
  { kind: 'play', label: 'To Play', color: '#8dbf7c', x: 4, z: 0, rot: 0 },
  { kind: 'read', label: 'To Read', color: '#7fa4da', x: 0, z: 0, rot: 0 },
  { kind: 'bridge', label: 'To Balance', color: '#eaa766', x: 12, z: 4, rot: 0 },
  { kind: 'sit', label: 'To Sit', color: '#edb088', x: 8, z: 4, rot: Math.PI / 2 },
  { kind: 'gather', label: 'To Perform', color: '#aaa49a', x: 4, z: 4, rot: 0 },
  { kind: 'path', label: 'To Sit', color: '#de7a5e', x: 0, z: 4, rot: Math.PI / 2 },
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

const GREY = new THREE.Color('#d2cdc3');
const H = 10; // pieces fall from this high
const spring = (p: number, v: number, target: number, w: number, dt: number) => v + (w * w * (target - p) - 2 * w * v) * dt;

type Opts = { reduced: boolean; touch: boolean; mobile: boolean };
type Part = Built & { item: Item; y: number; lift: number; liftV: number; landed: boolean; give: number; focus: number; base: THREE.Color[]; blob: THREE.Mesh };

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
  private base = { left: -1, right: 1, top: 1, bottom: -1 };
  private lastSun = -1;
  private blobTex = contactTexture();
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
      const p: Part = { ...b, item: CLUSTER[i], y: 0, lift: 0, liftV: 0, landed: true, give: 0, focus: 0, base: b.mats.map((m) => m.color.clone()), blob };
      b.group.traverse((ob) => this.byMesh.set(ob, p));
      this.parts.push(p);
    });
    this.fit();
    this.ro = new ResizeObserver(() => { this.fit(); this.dirty = true; });
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

  /** Fit the cluster at rest into the frame: width-led, centred, a little room above for the drops. */
  private fit() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    const cam = this.camera;
    cam.position.copy(CLUSTER_CENTER).add(new THREE.Vector3(20, 20, 20));
    cam.lookAt(CLUSTER_CENTER);
    cam.updateMatrixWorld();
    const box = new THREE.Box3();
    this.parts.forEach((p) => box.expandByObject(p.group));
    const v = cam.matrixWorldInverse;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const q = new THREE.Vector3(x, y, z).applyMatrix4(v);
      x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
    }
    const aspect = r.width / r.height;
    let hw = (x1 - x0) / 2 * 1.06, hh = (y1 - y0) / 2 * 1.1;
    if (hw / hh < aspect) hw = hh * aspect; else hh = hw / aspect;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - hh * 0.04;
    cam.left = cx - hw; cam.right = cx + hw; cam.bottom = cy - hh; cam.top = cy + hh;
    cam.updateProjectionMatrix();
    this.base = { left: cam.left, right: cam.right, top: cam.top, bottom: cam.bottom };
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
      // Each piece gets its own slice of the scroll; inside it, it falls like a dropped weight.
      const t = reduced ? 1 : Math.max(0, Math.min(1, (this.progress - (i / n) * 0.62) / 0.3));
      const y = H * (1 - t * t);
      if (t >= 1 && !p.landed) this.land(p);
      if (t < 1) p.landed = false;
      p.y = y;
      // Crane lift on hover: critically damped, so it rises and stops without wobble.
      const want = this.hovered === p && p.landed ? 0.9 : 0;
      if (!reduced) { p.liftV = spring(p.lift, p.liftV, want, 11, dt); p.lift += p.liftV * dt; } else p.lift = want;
      if (Math.abs(p.liftV) > 1e-3 || Math.abs(p.lift - want) > 1e-3) moving = true;
      p.group.visible = t > 0;
      p.blob.visible = t > 0;
      (p.blob.material as THREE.MeshBasicMaterial).opacity = 0.55 * t * t;
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
    const cam = this.camera;
    cam.left = this.base.left + sx; cam.right = this.base.right + sx; cam.top = this.base.top + sy; cam.bottom = this.base.bottom + sy;
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
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    this.renderer.dispose();
    c.remove();
  }
}
