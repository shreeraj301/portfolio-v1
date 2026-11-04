// The hero scene: six precast modules on a plaza, lit by the simulated sun.
// Motion is designed, not left to a physics engine, so it reads as weight and never goes wrong:
//   - modules fall under gravity, land with a hard stop and a tiny give, never a bounce;
//   - hover lifts one like a crane, on a critically damped spring (no wobble);
//   - on desktop a module can be picked up, carried over the others and set down in any bay of the
//     plan; the module already there slides out of the way into the bay you emptied;
//   - scroll opens an exploded axonometric.
// Runs on the site's one clock (gsap.ticker) and only while the hero is on screen.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { buildModule, buildPlate, contactTexture, type Verb, type Built } from './modules';
import { makeRenderer, addLights } from './stage';

type Opts = { reduced: boolean; touch: boolean; mobile: boolean; sunAngle: () => number; pointerX: () => number };
type Mode = 'hidden' | 'fall' | 'rest' | 'carry';
type Mod = Built & {
  id: Verb; blob: THREE.Mesh; baseColors: THREE.Color[]; focus: number; partBase: number[]; top: number;
  mode: Mode; released: boolean;
  cell: number;              // the bay it belongs to
  pos: THREE.Vector3;        // where it is
  vel: THREE.Vector3;        // how fast it is moving
  give: number;              // landing give, sinks the module a hair
  tilt: THREE.Vector2;       // landing tilt (x, z)
  lean: THREE.Vector2;       // lean from motion (x, z)
};

const ORDER: Verb[] = ['read', 'play', 'build', 'pause', 'sit', 'gather'];
// The plan: six bays of 5.5, two rows of three. Module footprints are 4 x 4.
const BAYS = [[2, 2], [7.5, 2], [13, 2], [2, 7.5], [7.5, 7.5], [13, 7.5]].map(([x, z]) => new THREE.Vector3(x, 0, z));
const CENTER = new THREE.Vector3(7.5, 0, 4.9);
const PLATE = { w: 17.6, d: 13.6, cx: 7.5, cz: 5.25 };
const GREY = new THREE.Color('#d2cdc3');
const G = 34;            // gravity, in plan units per second squared
const LIFT_Y = 1.05;     // crane hover height
const CLEAR = 0.45;      // how far a carried module clears whatever it passes over
// Critically damped spring: reaches its target with no overshoot.
const spring = (p: number, v: number, target: number, w: number, dt: number) => v + (w * w * (target - p) - 2 * w * v) * dt;
const clamp = THREE.MathUtils.clamp;

export class Kit3D {
  readonly el: HTMLElement;
  private o: Opts;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  private sun: THREE.DirectionalLight;
  private mods: Mod[] = [];
  private byMesh = new Map<THREE.Object3D, Mod>();
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private hovered: Mod | null = null;
  private focusId: Verb | null = null;
  private noLift: Mod | null = null;
  private dragging: { mod: Mod; offset: THREE.Vector2; target: THREE.Vector2; from: number; bay: number; downX: number; downY: number; t: number; moved: boolean } | null = null;
  private bays = new Map<Mod, number>(); // the bay each module holds when nothing is being carried
  private marker: THREE.LineSegments;
  private markerAlpha = 0;
  private explode = 0;
  private explodeTarget = 0;
  private shake = 0;
  private rings: { mesh: THREE.Mesh; t: number; s: number }[] = [];
  private dust: { pts: THREE.Points; vel: Float32Array; t: number }[] = [];
  private running = false;
  private visible = true;
  private dirty = true;
  private tickFn = (time: number, dt: number) => this.tick(time, dt);
  private ro: ResizeObserver;
  private camLag = { x: 0 };
  private onPointer: { move: (e: PointerEvent) => void; down: (e: PointerEvent) => void; up: (e: PointerEvent) => void; leave: () => void };
  private blobTex = contactTexture();
  onHover: (id: Verb | null) => void = () => {};
  onPick: (id: Verb) => void = () => {};
  onDisplaced: (displaced: boolean) => void = () => {};
  private wasDisplaced = false;
  private lastSun = 0;
  private perf = { samples: [] as number[], level: 0 };
  private lastExplode = -1;
  private base = { left: -1, right: 1, top: 1, bottom: -1 };
  private tap: { id: Verb; x: number; y: number; t: number } | null = null;

  constructor(el: HTMLElement, o: Opts) {
    this.el = el;
    this.o = o;
    this.renderer = makeRenderer(el, o.mobile);
    this.sun = addLights(this.scene, CENTER, 13, o.mobile);
    this.scene.add(buildPlate(PLATE.w, PLATE.d).translateX(PLATE.cx).translateZ(PLATE.cz));
    this.buildMods();
    this.marker = this.bayMarker();
    this.fit();
    this.ro = new ResizeObserver(() => { this.fit(); this.dirty = true; });
    this.ro.observe(el);

    this.onPointer = { move: (e) => this.pointerMove(e), down: (e) => this.pointerDown(e), up: (e) => this.pointerUp(e), leave: () => { if (!this.dragging) this.setHover(null); } };
    const c = this.renderer.domElement;
    c.addEventListener('pointermove', this.onPointer.move);
    c.addEventListener('pointerdown', this.onPointer.down);
    addEventListener('pointerup', this.onPointer.up);
    c.addEventListener('pointerleave', this.onPointer.leave);
    gsap.ticker.add(this.tickFn);
    // QA hook: open the page with #kitdebug to measure the motion from the console.
    if (location.hash === '#kitdebug') (window as unknown as { __kit: unknown }).__kit = this;
  }

  // ---------- setup ----------
  private buildMods() {
    const css = getComputedStyle(document.documentElement);
    ORDER.forEach((id, i) => {
      const color = css.getPropertyValue(`--v-${id}`).trim() || '#999';
      const built = buildModule(id, color);
      const top = new THREE.Box3().setFromObject(built.group).max.y;
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), new THREE.MeshBasicMaterial({ map: this.blobTex, transparent: true, depthWrite: false, opacity: 0.8 }));
      blob.rotation.x = -Math.PI / 2;
      blob.renderOrder = 1;
      this.scene.add(blob, built.group);
      const mod: Mod = {
        ...built, id, blob, top, focus: 0, mode: 'rest', released: true, cell: i,
        pos: BAYS[i].clone(), vel: new THREE.Vector3(), give: 0, tilt: new THREE.Vector2(), lean: new THREE.Vector2(),
        baseColors: built.mats.map((m) => m.color.clone()),
        partBase: built.parts.map((p) => p.position.y),
      };
      built.group.traverse((o) => this.byMesh.set(o, mod));
      this.mods.push(mod);
      this.sync(mod);
    });
  }

  /** A thin outline of the bay a carried module will be set down in, drawn on the paving. */
  private bayMarker() {
    const h = 2.35;
    const g = new THREE.EdgesGeometry(new THREE.PlaneGeometry(h * 2, h * 2));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#151413', transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    m.visible = false;
    this.scene.add(m);
    return m;
  }

  /** Fit the plaza to the element: width-led, plaza toward the bottom so lifted modules have room above. */
  private fit() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    const cam = this.camera;
    cam.position.copy(CENTER).add(new THREE.Vector3(20, 20, 20));
    cam.lookAt(CENTER);
    cam.updateMatrixWorld();
    const view = cam.matrixWorldInverse;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity;
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = new THREE.Vector3(PLATE.cx + (x * PLATE.w) / 2, -0.36, PLATE.cz + (z * PLATE.d) / 2).applyMatrix4(view);
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y);
    }
    const pad = (x1 - x0) * 0.02;
    const halfW = (x1 - x0) / 2 + pad;
    const halfH = halfW * (r.height / r.width);
    const cx = (x0 + x1) / 2;
    cam.left = cx - halfW; cam.right = cx + halfW;
    cam.bottom = y0 - pad; cam.top = y0 - pad + halfH * 2;
    cam.updateProjectionMatrix();
    this.base = { left: cam.left, right: cam.right, top: cam.top, bottom: cam.bottom };
  }

  // ---------- choreography ----------
  /** Lower every module into its bay, one after another, from above the frame. */
  drop(stagger = 0.16) {
    if (this.o.reduced) { this.settleAll(); return; }
    this.mods.forEach((m, i) => {
      m.cell = i; this.bays.set(m, i);
      m.pos.set(BAYS[i].x, 13, BAYS[i].z);
      m.vel.set(0, -4, 0);
      m.mode = 'hidden'; m.released = false;
      m.group.visible = false; m.blob.visible = false;
      this.sync(m);
      gsap.delayedCall(i * stagger, () => { m.mode = 'fall'; m.group.visible = true; m.blob.visible = true; });
    });
    this.start();
  }

  /** Every module home, at rest (reduced motion, or the first frame before the drop). */
  settleAll() {
    this.mods.forEach((m, i) => {
      m.cell = i; this.bays.set(m, i);
      m.pos.copy(BAYS[i]); m.vel.set(0, 0, 0); m.give = 0; m.tilt.set(0, 0); m.lean.set(0, 0);
      m.mode = 'rest'; m.released = true; m.group.visible = true; m.blob.visible = true;
      this.sync(m);
    });
    this.dirty = true;
    this.start();
  }

  /** Lift everything off and lower it back into the plan, each module in its own bay. */
  recast() {
    const tl = gsap.timeline({ onComplete: () => this.drop(0.1) });
    this.mods.forEach((m, i) => {
      m.mode = 'hidden'; m.released = false;
      tl.to(m.pos, { y: 16, duration: 0.55, ease: 'power2.in' }, i * 0.04);
    });
    this.start();
  }

  focus(id: Verb | null) { this.focusId = id; this.dirty = true; }
  setExplode(p: number) { this.explodeTarget = p; }
  setVisible(v: boolean) { this.visible = v; if (v) this.dirty = true; }

  /** Hard stop on the paving: a small give, a ring, dust, a short shake. */
  private land(m: Mod, speed: number) {
    const s = clamp(speed / 16, 0.25, 1);
    m.pos.y = 0; m.vel.set(0, 0, 0);
    m.mode = 'rest'; m.released = true;
    const tx = (Math.random() - 0.5) * 0.05, tz = (Math.random() - 0.5) * 0.05;
    gsap.timeline()
      .to(m, { give: 0.05 * s, duration: 0.06, ease: 'power2.out' }, 0)
      .to(m.tilt, { x: tx * s, y: tz * s, duration: 0.06, ease: 'power2.out' }, 0)
      .to(m, { give: 0, duration: 0.4, ease: 'power3.out' }, 0.06)
      .to(m.tilt, { x: 0, y: 0, duration: 0.4, ease: 'power3.out' }, 0.06);
    if (this.o.reduced) return;
    this.shake = Math.max(this.shake, s * 0.07);
    this.ring(m.pos.x, m.pos.z, s);
    this.puff(m.pos.x, m.pos.z, s);
  }

  // ---------- interaction ----------
  private toNdc(e: PointerEvent) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
  }

  private pick(e: PointerEvent): Mod | null {
    this.toNdc(e);
    const hits = this.ray.intersectObjects(this.mods.map((m) => m.group), true);
    const h = hits.find((x) => this.byMesh.get(x.object)?.released);
    return h ? this.byMesh.get(h.object)! : null;
  }

  private floorPoint(e: PointerEvent, y: number, out: THREE.Vector3) {
    this.toNdc(e);
    this.floor.constant = -y;
    return this.ray.ray.intersectPlane(this.floor, out);
  }

  private setHover(m: Mod | null) {
    if (m === this.hovered) return;
    if (m !== this.noLift) this.noLift = null;
    this.hovered = m;
    this.renderer.domElement.style.cursor = m ? (this.o.touch ? 'pointer' : 'grab') : '';
    this.onHover(m ? m.id : null);
    this.dirty = true;
  }

  private pointerMove(e: PointerEvent) {
    if (this.dragging) { this.dragTo(e); return; }
    if (this.explode > 0.05) { this.setHover(null); return; }
    this.setHover(this.pick(e));
  }

  private pointerDown(e: PointerEvent) {
    if (this.explode > 0.05 || e.button !== 0) return;
    const m = this.pick(e);
    if (!m || m.mode !== 'rest') return;
    if (this.o.touch || this.o.reduced) { this.tap = { id: m.id, x: e.clientX, y: e.clientY, t: performance.now() }; return; }
    e.preventDefault();
    this.renderer.domElement.setPointerCapture?.(e.pointerId);
    // Hold it where you grabbed it relative to the cursor, so it never jumps to the pointer.
    const p = new THREE.Vector3();
    this.floorPoint(e, m.pos.y, p);
    const from = this.bays.get(m) ?? m.cell;
    this.dragging = {
      mod: m, offset: new THREE.Vector2(m.pos.x - p.x, m.pos.z - p.z), target: new THREE.Vector2(m.pos.x, m.pos.z),
      from, bay: from, downX: e.clientX, downY: e.clientY, t: performance.now(), moved: false,
    };
    this.renderer.domElement.style.cursor = 'grabbing';
    this.start();
  }

  private dragTo(e: PointerEvent) {
    const d = this.dragging!;
    if (!d.moved && Math.hypot(e.clientX - d.downX, e.clientY - d.downY) > 6) { d.moved = true; d.mod.mode = 'carry'; }
    if (!d.moved) return;
    const p = new THREE.Vector3();
    if (this.floorPoint(e, d.mod.pos.y, p)) {
      d.target.set(
        clamp(p.x + d.offset.x, PLATE.cx - PLATE.w / 2 + 2, PLATE.cx + PLATE.w / 2 - 2),
        clamp(p.z + d.offset.y, PLATE.cz - PLATE.d / 2 + 2, PLATE.cz + PLATE.d / 2 - 2),
      );
    }
  }

  private pointerUp(e: PointerEvent) {
    if (this.tap) {
      const t = this.tap; this.tap = null;
      if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < 8 && performance.now() - t.t < 400) this.onPick(t.id);
      return;
    }
    const d = this.dragging;
    if (!d) return;
    this.dragging = null;
    this.renderer.domElement.style.cursor = this.hovered ? 'grab' : '';
    if (!d.moved) { if (performance.now() - d.t < 350) this.onPick(d.mod.id); return; }
    // Let go: it is set down in the bay under it; whoever held that bay has already made room.
    const m = d.mod;
    for (const o of this.mods) if (o !== m && o.cell === d.bay) o.cell = d.from;
    m.cell = d.bay;
    m.mode = 'fall';
    m.vel.y = Math.min(m.vel.y, 0);
    this.noLift = m;
  }

  /** The bay nearest a point on the plan. */
  private bayAt(x: number, z: number) {
    let best = 0, bd = Infinity;
    BAYS.forEach((b, i) => { const dd = (b.x - x) ** 2 + (b.z - z) ** 2; if (dd < bd) { bd = dd; best = i; } });
    return best;
  }

  /** Height of whatever stands under a footprint at (x, z), other than m. */
  private heightUnder(m: Mod, x: number, z: number) {
    let h = 0;
    for (const o of this.mods) {
      if (o === m || !o.group.visible) continue;
      if (Math.abs(o.pos.x - x) < 4.1 && Math.abs(o.pos.z - z) < 4.1) h = Math.max(h, o.pos.y + o.top);
    }
    return h;
  }

  // ---------- motion ----------
  private step(m: Mod, dt: number, lift: Mod | null) {
    const p = m.pos, v = m.vel;
    if (m.mode === 'carry' && this.dragging) {
      // Carried by the crane: follows the cursor with a short, weighty lag, and rises over anything in its way.
      const t = this.dragging.target;
      v.x = spring(p.x, v.x, t.x, 16, dt);
      v.z = spring(p.z, v.z, t.y, 16, dt);
      const clearY = Math.max(1.4, this.heightUnder(m, p.x, p.z) + CLEAR);
      v.y = spring(p.y, v.y, clearY, 13, dt);
      p.addScaledVector(v, dt);
      this.dragging.bay = this.bayAt(p.x, p.z);
    } else if (m.mode === 'fall') {
      // Set down: gravity on the way down, sliding into its bay as it falls.
      const bay = BAYS[m.cell];
      v.x = spring(p.x, v.x, bay.x, 14, dt);
      v.z = spring(p.z, v.z, bay.z, 14, dt);
      v.y -= G * dt;
      p.addScaledVector(v, dt);
      if (p.y <= 0) this.land(m, -v.y);
    } else if (m.mode === 'rest') {
      // In its bay; slides over if its bay changed (making room), rises on hover.
      const bay = BAYS[m.cell];
      v.x = spring(p.x, v.x, bay.x, 9, dt);
      v.z = spring(p.z, v.z, bay.z, 9, dt);
      v.y = spring(p.y, v.y, m === lift ? LIFT_Y : 0, 10, dt);
      p.addScaledVector(v, dt);
      if (p.y < 0) { p.y = 0; v.y = 0; }
    }
    // Lean: into the direction of travel when carried; a heavy block being slid tips back slightly.
    const k = m.mode === 'carry' ? 0.016 : m.mode === 'rest' ? -0.008 : 0;
    const lx = clamp(v.z * k, -0.08, 0.08), lz = clamp(-v.x * k, -0.08, 0.08);
    const f = 1 - Math.pow(0.0005, dt);
    m.lean.x += (lx - m.lean.x) * f; m.lean.y += (lz - m.lean.y) * f;
    return v.lengthSq() > 1e-5 || m.mode !== 'rest' || Math.abs(m.lean.x) + Math.abs(m.lean.y) > 1e-4;
  }

  /** While a module is carried: mark its bay on the paving, and the module in that bay makes room. */
  private plan(dt: number) {
    const d = this.dragging?.moved ? this.dragging : null;
    if (d) {
      for (const o of this.mods) {
        if (o === d.mod || o.mode !== 'rest') continue;
        const home = this.bays.get(o) ?? o.cell;
        o.cell = home === d.bay && d.bay !== d.from ? d.from : home;
      }
      this.marker.position.x = BAYS[d.bay].x; this.marker.position.z = BAYS[d.bay].z;
    }
    const want = d ? 0.35 : 0;
    this.markerAlpha += (want - this.markerAlpha) * (1 - Math.pow(0.0001, dt));
    (this.marker.material as THREE.LineBasicMaterial).opacity = this.markerAlpha;
    this.marker.visible = this.markerAlpha > 0.01;
  }

  // ---------- feedback ----------
  private ring(x: number, z: number, s: number) {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(2.25, 2.3, 72), new THREE.MeshBasicMaterial({ color: '#a39885', transparent: true, opacity: 0.32 * s, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.02, z);
    this.scene.add(mesh);
    this.rings.push({ mesh, t: 0, s });
  }

  private puff(x: number, z: number, s: number) {
    const n = 26;
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 0.4;
      pos[i * 3] = x + Math.cos(a) * r; pos[i * 3 + 1] = 0.1; pos[i * 3 + 2] = z + Math.sin(a) * r;
      const sp = (1.5 + Math.random() * 2.5) * s;
      vel[i * 3] = Math.cos(a) * sp; vel[i * 3 + 1] = 0.6 + Math.random() * 1.6 * s; vel[i * 3 + 2] = Math.sin(a) * sp;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#b9ae9c', size: 0.09, transparent: true, opacity: 0.7, depthWrite: false }));
    this.scene.add(pts);
    this.dust.push({ pts, vel, t: 0 });
  }

  // ---------- loop ----------
  private start() { this.running = true; this.dirty = true; }

  private sync(m: Mod) {
    const p = m.pos;
    m.group.position.set(p.x, p.y - m.give, p.z);
    m.group.rotation.set(m.lean.x + m.tilt.x, 0, m.lean.y + m.tilt.y);
    const k = Math.min(1, Math.max(0, p.y) / 8);
    m.blob.position.set(p.x, 0.015, p.z);
    m.blob.scale.setScalar(1 + k * 0.6);
    (m.blob.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - k);
  }

  private tick(time: number, dtMs: number) {
    if (!this.running || !this.visible || document.hidden) return;
    const dt = Math.min(dtMs / 1000, 1 / 20);
    this.adapt(dtMs);
    const reduced = this.o.reduced;
    // The exploded view follows scroll with a soft lag, like the rest of the page.
    this.explode += (this.explodeTarget - this.explode) * (1 - Math.pow(0.88, dt * 60));
    if (Math.abs(this.explodeTarget - this.explode) < 0.0005) this.explode = this.explodeTarget;

    // Settled bays are remembered whenever nothing is being carried.
    if (!this.dragging?.moved) for (const m of this.mods) if (m.mode === 'rest') this.bays.set(m, m.cell);
    this.plan(dt);

    const lift = reduced || this.explode > 0.05 || this.dragging?.moved ? null
      : this.mods.find((m) => m.id === (this.hovered?.id ?? this.focusId) && m !== this.noLift) ?? null;
    let moving = this.markerAlpha > 0.01;
    // Small fixed steps keep fast motion smooth at any frame rate.
    const n = Math.max(1, Math.ceil(dt * 120));
    for (const m of this.mods) {
      if (m.mode !== 'hidden' && !reduced) for (let i = 0; i < n; i++) if (this.step(m, dt / n, lift)) moving = true;
      if (m.mode === 'hidden' || m.give || m.tilt.x || m.tilt.y) moving = true;
      this.sync(m);
    }
    const fid = this.dragging?.mod.id ?? this.hovered?.id ?? this.focusId;
    for (const m of this.mods) {
      // Focus colour: the others go back to bare concrete.
      const want = fid && fid !== m.id ? 1 : 0;
      m.focus += (want - m.focus) * (reduced ? 1 : 1 - Math.pow(0.86, dt * 60));
      m.mats.forEach((mat, i) => mat.color.copy(m.baseColors[i]).lerp(GREY, m.focus * 0.85));
      // Exploded axonometric: parts lift by their place in the stack.
      m.parts.forEach((p, i) => { p.position.y = m.partBase[i] + this.explode * (i + 1) * 0.95; });
      if (m.sway && !reduced) { m.sway.rotation.z = Math.sin(time * 1.1 + 1) * 0.035; m.sway.rotation.x = Math.sin(time * 0.8) * 0.025; }
    }

    // Re-cast button: shown when the plan is out of order.
    const displaced = this.mods.some((m, i) => m.released && m.cell !== i);
    if (displaced !== this.wasDisplaced) { this.wasDisplaced = displaced; this.onDisplaced(displaced); }

    // Sun: the light moves with the site's sun; shadows fall away from it.
    const a = this.o.sunAngle();
    this.sun.position.set(CENTER.x - Math.cos(a) * 13, 17, CENTER.z - Math.sin(a) * 13);
    const sunMoved = Math.abs(a - this.lastSun) > 0.004;
    if (moving || sunMoved || this.explode !== this.lastExplode || this.dirty) { this.renderer.shadowMap.needsUpdate = true; this.lastSun = a; this.lastExplode = this.explode; }

    // Camera: a slight lean toward the pointer, and a small shake on heavy landings.
    const px = reduced ? 0 : this.o.pointerX();
    this.camLag.x += (px - this.camLag.x) * 0.06;
    this.shake *= Math.pow(0.82, dt * 60);
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    const cam = this.camera;
    const off = new THREE.Vector3(20, 20, 20).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camLag.x * 0.06);
    cam.position.copy(CENTER).add(off);
    cam.lookAt(CENTER);
    cam.left = this.base.left + sx; cam.right = this.base.right + sx; cam.top = this.base.top + sy; cam.bottom = this.base.bottom + sy;
    cam.updateProjectionMatrix();

    // Landing rings and dust.
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.t += dt / 0.9;
      const e = 1 - Math.pow(1 - Math.min(1, r.t), 3);
      r.mesh.scale.setScalar(1 + e * 0.35);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.32 * r.s * (1 - e);
      if (r.t >= 1) { this.scene.remove(r.mesh); r.mesh.geometry.dispose(); (r.mesh.material as THREE.Material).dispose(); this.rings.splice(i, 1); }
    }
    for (let i = this.dust.length - 1; i >= 0; i--) {
      const d = this.dust[i];
      d.t += dt / 1.1;
      const pos = d.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let k = 0; k < pos.count; k++) {
        d.vel[k * 3] *= 0.94; d.vel[k * 3 + 2] *= 0.94; d.vel[k * 3 + 1] -= 3 * dt;
        pos.array[k * 3] += d.vel[k * 3] * dt; pos.array[k * 3 + 1] = Math.max(0.03, pos.array[k * 3 + 1] + d.vel[k * 3 + 1] * dt); pos.array[k * 3 + 2] += d.vel[k * 3 + 2] * dt;
      }
      pos.needsUpdate = true;
      (d.pts.material as THREE.PointsMaterial).opacity = 0.7 * (1 - d.t);
      if (d.t >= 1) { this.scene.remove(d.pts); d.pts.geometry.dispose(); (d.pts.material as THREE.Material).dispose(); this.dust.splice(i, 1); }
    }

    // Render while anything moves; the sun and the tree keep a slow life going at rest.
    if (!reduced || this.dirty || moving) this.renderer.render(this.scene, this.camera);
    this.dirty = false;
  }

  /** Quality that adapts to the machine: if frames run long, drop to 1x pixels and crisp shadows, then no shadow map. */
  private adapt(dtMs: number) {
    const p = this.perf;
    if (p.level >= 2 || this.o.reduced) return;
    p.samples.push(dtMs);
    if (p.samples.length < 14) return;
    const sorted = [...p.samples].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    p.samples.length = 0;
    if (median < 24) return;
    p.level++;
    if (p.level === 1) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.sun.shadow.map?.dispose();
      (this.sun.shadow as unknown as { map: null }).map = null;
      this.sun.shadow.mapSize.set(1024, 1024);
    } else {
      this.renderer.shadowMap.enabled = false;
      this.sun.castShadow = false;
    }
    this.scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.needsUpdate = true; }); });
    this.fit();
    this.dirty = true;
  }

  /** QA only: where a module sits on screen, and its state. */
  debugState(id: Verb) {
    const m = this.mods.find((x) => x.id === id)!;
    const p = new THREE.Vector3(m.pos.x, m.pos.y + 0.5, m.pos.z).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height, pos: m.pos.toArray(), mode: m.mode, cell: m.cell };
  }

  dispose() {
    gsap.ticker.remove(this.tickFn);
    this.ro.disconnect();
    const c = this.renderer.domElement;
    c.removeEventListener('pointermove', this.onPointer.move);
    c.removeEventListener('pointerdown', this.onPointer.down);
    removeEventListener('pointerup', this.onPointer.up);
    c.removeEventListener('pointerleave', this.onPointer.leave);
    this.mods.forEach((m) => { gsap.killTweensOf(m); gsap.killTweensOf(m.tilt); gsap.killTweensOf(m.pos); });
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
