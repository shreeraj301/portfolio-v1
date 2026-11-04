// The hero scene: six precast modules on a plaza, lit by the simulated sun, with real physics.
// Modules are lowered one by one and land with weight; hover lifts one like a crane; on desktop
// a visitor can pick one up, swing it and drop it; scroll opens an exploded axonometric.
// Runs on the site's one clock (gsap.ticker) and only while the hero is on screen.
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { gsap } from 'gsap';
import { buildModule, buildPlate, contactTexture, type Verb, type Built } from './modules';

type Opts = { reduced: boolean; touch: boolean; mobile: boolean; sunAngle: () => number; pointerX: () => number };
type Mod = Built & {
  id: Verb; body: CANNON.Body; home: CANNON.Vec3; blob: THREE.Mesh; baseColors: THREE.Color[];
  focus: number; partBase: number[]; released: boolean;
};

const ORDER: Verb[] = ['read', 'play', 'build', 'pause', 'sit', 'gather'];
const CELLS: Record<Verb, [number, number]> = { read: [0, 0], play: [5.5, 0], build: [11, 0], pause: [0, 5.5], sit: [5.5, 5.5], gather: [11, 5.5] };
const CENTER = new THREE.Vector3(7.5, 0, 4.9);
const PLATE = { w: 17.6, d: 13.6, cx: 7.5, cz: 5.25 };
const GREY = new THREE.Color('#d2cdc3');
const G = 38;

export class Kit3D {
  readonly el: HTMLElement;
  private o: Opts;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  private sun = new THREE.DirectionalLight('#fff3e3', 2.2);
  private world = new CANNON.World({ gravity: new CANNON.Vec3(0, -G, 0) });
  private mods: Mod[] = [];
  private byMesh = new Map<THREE.Object3D, Mod>();
  private ray = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private hovered: Mod | null = null;
  private focusId: Verb | null = null;
  private dragging: { mod: Mod; joint: CANNON.PointToPointConstraint; anchor: CANNON.Body; plane: THREE.Plane; downX: number; downY: number; t: number; moved: boolean } | null = null;
  private explode = 0;
  private shake = 0;
  private rings: { mesh: THREE.Mesh; t: number; s: number }[] = [];
  private dust: { pts: THREE.Points; vel: Float32Array; t: number }[] = [];
  private acc = 0;
  private running = false;
  private visible = true;
  private dirty = true;
  private tickFn = (time: number, dt: number) => this.tick(time, dt);
  private ro: ResizeObserver;
  private camLag = { x: 0, y: 0, px: 0, py: 0 };
  private onPointer: { move: (e: PointerEvent) => void; down: (e: PointerEvent) => void; up: (e: PointerEvent) => void; leave: () => void };
  private blobTex = contactTexture();
  onHover: (id: Verb | null) => void = () => {};
  onPick: (id: Verb) => void = () => {};
  onDisplaced: (displaced: boolean) => void = () => {};
  private wasDisplaced = false;
  private lastSun = 0;
  private perf = { samples: [] as number[], level: 0, since: 0 };
  private lastExplode = -1;

  constructor(el: HTMLElement, o: Opts) {
    this.el = el;
    this.o = o;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, o.mobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.06;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.autoUpdate = false; // updated only when something moved or the sun travelled
    this.renderer.shadowMap.type = THREE.VSMShadowMap; // soft, blurred penumbra like the Kit renders
    this.renderer.setClearColor(0x000000, 0);
    el.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    this.lights();
    this.scene.add(buildPlate(PLATE.w, PLATE.d).translateX(PLATE.cx).translateZ(PLATE.cz));
    this.physicsWorld();
    this.buildMods();
    this.fit();
    this.ro = new ResizeObserver(() => { this.fit(); this.dirty = true; });
    this.ro.observe(el);

    this.onPointer = { move: (e) => this.pointerMove(e), down: (e) => this.pointerDown(e), up: (e) => this.pointerUp(e), leave: () => this.setHover(null) };
    const c = this.renderer.domElement;
    c.addEventListener('pointermove', this.onPointer.move);
    c.addEventListener('pointerdown', this.onPointer.down);
    addEventListener('pointerup', this.onPointer.up);
    c.addEventListener('pointerleave', this.onPointer.leave);
    gsap.ticker.add(this.tickFn);
  }

  // ---------- setup ----------
  private lights() {
    this.scene.add(new THREE.HemisphereLight('#fbfaf7', '#d4cec4', 2.0));
    const s = this.sun;
    s.castShadow = true;
    const size = this.o.mobile ? 768 : 1024;
    s.shadow.mapSize.set(size, size);
    const cam = s.shadow.camera;
    cam.left = -13; cam.right = 13; cam.top = 13; cam.bottom = -13; cam.near = 1; cam.far = 70;
    s.shadow.bias = -0.0002;
    s.shadow.normalBias = 0.025;
    s.shadow.radius = 5;
    s.shadow.blurSamples = 8;
    s.target.position.copy(CENTER);
    this.scene.add(s, s.target);
    const fill = new THREE.DirectionalLight('#e8eefc', 0.35);
    fill.position.set(-10, 8, 14);
    this.scene.add(fill);
  }

  private physicsWorld() {
    const w = this.world;
    w.broadphase = new CANNON.SAPBroadphase(w);
    w.allowSleep = true;
    (w.solver as CANNON.GSSolver).iterations = 14;
    w.defaultContactMaterial.friction = 0.5;
    w.defaultContactMaterial.restitution = 0.14;
    const ground = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(PLATE.w / 2, 0.5, PLATE.d / 2)) });
    ground.position.set(PLATE.cx, -0.5, PLATE.cz);
    w.addBody(ground);
    // Invisible kerbs keep the modules on the plaza.
    const kerb = (x: number, z: number, hx: number, hz: number) => {
      const b = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Box(new CANNON.Vec3(hx, 4, hz)) });
      b.position.set(x, 4, z);
      w.addBody(b);
    };
    kerb(PLATE.cx, PLATE.cz - PLATE.d / 2 - 0.5, PLATE.w / 2 + 1, 0.5);
    kerb(PLATE.cx, PLATE.cz + PLATE.d / 2 + 0.5, PLATE.w / 2 + 1, 0.5);
    kerb(PLATE.cx - PLATE.w / 2 - 0.5, PLATE.cz, 0.5, PLATE.d / 2 + 1);
    kerb(PLATE.cx + PLATE.w / 2 + 0.5, PLATE.cz, 0.5, PLATE.d / 2 + 1);
  }

  private buildMods() {
    const css = getComputedStyle(document.documentElement);
    for (const id of ORDER) {
      const color = css.getPropertyValue(`--v-${id}`).trim() || '#999';
      const built = buildModule(id, color);
      const body = new CANNON.Body({ mass: 1, linearDamping: 0.06, angularDamping: 0.45, allowSleep: true, sleepSpeedLimit: 0.15, sleepTimeLimit: 0.6 });
      let vol = 0;
      for (const s of built.shapes) {
        body.addShape(new CANNON.Box(new CANNON.Vec3(...s.half)), new CANNON.Vec3(...s.pos));
        vol += s.half[0] * s.half[1] * s.half[2] * 8;
      }
      body.mass = Math.max(4, vol * 0.8);
      body.updateMassProperties();
      body.angularFactor.set(0.55, 0.35, 0.55);
      const [cx, cz] = CELLS[id];
      const home = new CANNON.Vec3(cx + 2, 0.001, cz + 2);
      body.position.copy(home);
      this.world.addBody(body);
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), new THREE.MeshBasicMaterial({ map: this.blobTex, transparent: true, depthWrite: false, opacity: 0.8 }));
      blob.rotation.x = -Math.PI / 2;
      blob.renderOrder = 1;
      this.scene.add(blob, built.group);
      const mod: Mod = {
        ...built, id, body, home, blob, focus: 0, released: false,
        baseColors: built.mats.map((m) => m.color.clone()),
        partBase: built.parts.map((p) => p.position.y),
      };
      body.addEventListener('collide', (e: { contact: CANNON.ContactEquation }) => this.impact(mod, e.contact));
      built.group.traverse((o) => this.byMesh.set(o, mod));
      this.mods.push(mod);
      this.sync(mod);
    }
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
  private base = { left: -1, right: 1, top: 1, bottom: -1 };

  // ---------- choreography ----------
  /** Lower every module into place, one after another, from above the frame. */
  drop(stagger = 0.17) {
    if (this.o.reduced) { this.settleAll(); return; }
    this.mods.forEach((m, i) => {
      const b = m.body;
      b.type = CANNON.Body.KINEMATIC;
      b.position.set(m.home.x, 13, m.home.z);
      b.velocity.setZero(); b.angularVelocity.setZero();
      b.quaternion.setFromEuler(0, 0, 0);
      m.group.visible = false; m.blob.visible = false; m.released = false;
      this.sync(m);
      gsap.delayedCall(i * stagger, () => {
        m.group.visible = true; m.blob.visible = true; m.released = true;
        b.type = CANNON.Body.DYNAMIC;
        b.quaternion.setFromEuler((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.06);
        b.velocity.set(0, -9, 0);
        b.wakeUp();
      });
    });
    this.start();
  }

  /** Put every module home, at rest (reduced motion, or the first frame before the drop). */
  settleAll() {
    for (const m of this.mods) {
      m.body.type = CANNON.Body.DYNAMIC;
      m.body.position.copy(m.home);
      m.body.quaternion.setFromEuler(0, 0, 0);
      m.body.velocity.setZero(); m.body.angularVelocity.setZero();
      m.group.visible = true; m.blob.visible = true; m.released = true;
      m.body.sleep();
      this.sync(m);
    }
    this.dirty = true;
    this.start();
  }

  /** Lift everything off and lower it back into the plan. */
  recast() {
    const tl = gsap.timeline({ onComplete: () => this.drop(0.1) });
    this.mods.forEach((m, i) => {
      const b = m.body;
      b.type = CANNON.Body.KINEMATIC;
      b.velocity.setZero(); b.angularVelocity.setZero();
      const p = { y: b.position.y };
      tl.to(p, { y: 16, duration: 0.55, ease: 'power2.in', onUpdate: () => { b.position.y = p.y; } }, i * 0.04);
    });
  }

  focus(id: Verb | null) { this.focusId = id; this.wake(); }
  private explodeTarget = 0;
  setExplode(p: number) { this.explodeTarget = p; }
  setVisible(v: boolean) { this.visible = v; if (v) this.dirty = true; }

  // ---------- interaction ----------
  private pick(e: PointerEvent): { mod: Mod; point: THREE.Vector3 } | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const hits = this.ray.intersectObjects(this.mods.map((m) => m.group), true);
    const h = hits.find((x) => this.byMesh.get(x.object)?.released);
    return h ? { mod: this.byMesh.get(h.object)!, point: h.point } : null;
  }

  private setHover(m: Mod | null) {
    if (m === this.hovered) return;
    this.hovered = m;
    this.renderer.domElement.style.cursor = m ? (this.o.touch ? 'pointer' : 'grab') : '';
    this.onHover(m ? m.id : null);
  }

  private pointerMove(e: PointerEvent) {
    if (this.dragging) { this.dragTo(e); return; }
    if (this.explode > 0.05) { this.setHover(null); return; }
    const h = this.pick(e);
    this.setHover(h ? h.mod : null);
  }

  private pointerDown(e: PointerEvent) {
    if (this.explode > 0.05 || e.button !== 0) return;
    const h = this.pick(e);
    if (!h) return;
    const m = h.mod;
    if (this.o.touch || this.o.reduced) { this.tap = { id: m.id, x: e.clientX, y: e.clientY, t: performance.now() }; return; }
    e.preventDefault();
    this.renderer.domElement.setPointerCapture?.(e.pointerId);
    const b = m.body;
    b.type = CANNON.Body.DYNAMIC; b.wakeUp();
    const local = b.pointToLocalFrame(new CANNON.Vec3(h.point.x, h.point.y, h.point.z));
    const anchor = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
    anchor.position.set(h.point.x, h.point.y, h.point.z);
    anchor.collisionFilterGroup = 0; anchor.collisionFilterMask = 0;
    this.world.addBody(anchor);
    const joint = new CANNON.PointToPointConstraint(b, local, anchor, new CANNON.Vec3(0, 0, 0), b.mass * 60);
    this.world.addConstraint(joint);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(h.point.y + 1.6));
    this.dragging = { mod: m, joint, anchor, plane, downX: e.clientX, downY: e.clientY, t: performance.now(), moved: false };
    this.renderer.domElement.style.cursor = 'grabbing';
    this.start();
  }

  private dragTo(e: PointerEvent) {
    const d = this.dragging!;
    if (Math.hypot(e.clientX - d.downX, e.clientY - d.downY) > 6) d.moved = true;
    if (!d.moved) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(this.ndc, this.camera);
    const p = new THREE.Vector3();
    if (this.ray.ray.intersectPlane(d.plane, p)) {
      p.x = THREE.MathUtils.clamp(p.x, PLATE.cx - PLATE.w / 2 + 1.5, PLATE.cx + PLATE.w / 2 - 1.5);
      p.z = THREE.MathUtils.clamp(p.z, PLATE.cz - PLATE.d / 2 + 1.5, PLATE.cz + PLATE.d / 2 - 1.5);
      d.anchor.position.set(p.x, p.y, p.z);
    }
  }

  private tap: { id: Verb; x: number; y: number; t: number } | null = null;
  private pointerUp(e: PointerEvent) {
    if (this.tap) {
      const t = this.tap; this.tap = null;
      if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < 8 && performance.now() - t.t < 400) this.onPick(t.id);
      return;
    }
    const d = this.dragging;
    if (!d) return;
    this.world.removeConstraint(d.joint);
    this.world.removeBody(d.anchor);
    this.dragging = null;
    this.renderer.domElement.style.cursor = this.hovered ? 'grab' : '';
    if (!d.moved && performance.now() - d.t < 350) this.onPick(d.mod.id);
    void e;
  }

  // ---------- physics feedback ----------
  private impact(m: Mod, c: CANNON.ContactEquation) {
    const v = Math.abs(c.getImpactVelocityAlongNormal());
    if (v < 4 || this.o.reduced) return;
    const s = Math.min(1, v / 16);
    const p = m.body.position;
    this.shake = Math.max(this.shake, s * 0.09);
    this.ring(p.x, p.z, s);
    this.puff(p.x, p.z, s);
  }

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
  private wake() { this.dirty = true; }

  private sync(m: Mod) {
    const b = m.body;
    m.group.position.set(b.position.x, b.position.y, b.position.z);
    m.group.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
    const h = Math.max(0, b.position.y);
    m.blob.position.set(b.position.x, 0.015, b.position.z);
    const k = Math.min(1, h / 8);
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

    // Crane lift for the focused or hovered module: a damped spring to a hover height, kept upright.
    const lift = this.dragging ? null : this.mods.find((m) => m.id === (this.hovered?.id ?? this.focusId)) ?? null;
    if (!reduced && this.explode < 0.05) {
      for (const m of this.mods) {
        const b = m.body;
        if (m !== lift || !m.released || b.type !== CANNON.Body.DYNAMIC) continue;
        b.wakeUp();
        const target = 1.25;
        const fy = b.mass * (G + 70 * (target - b.position.y) - 11 * b.velocity.y);
        b.applyForce(new CANNON.Vec3(0, fy, 0), b.position);
        b.velocity.x *= 0.96; b.velocity.z *= 0.96;
        const q = new CANNON.Quaternion(); q.setFromEuler(0, 0, 0);
        b.quaternion.slerp(q, 0.08, b.quaternion);
        b.angularVelocity.scale(0.9, b.angularVelocity);
      }
    }

    // Fixed-step physics.
    if (!reduced) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= 1 / 60 && steps < 4) { this.world.step(1 / 60); this.acc -= 1 / 60; steps++; }
    }

    let moving = false;
    for (const m of this.mods) {
      this.sync(m);
      if (m.body.sleepState !== CANNON.Body.SLEEPING && m.body.type === CANNON.Body.DYNAMIC) moving = true;
      // Focus colour: the others go back to bare concrete.
      const want = this.focusOrHover() && this.focusOrHover() !== m.id ? 1 : 0;
      m.focus += (want - m.focus) * (reduced ? 1 : 1 - Math.pow(0.86, dt * 60));
      m.mats.forEach((mat, i) => mat.color.copy(m.baseColors[i]).lerp(GREY, m.focus * 0.85));
      // Exploded axonometric: parts lift by their place in the stack.
      m.parts.forEach((p, i) => { p.position.y = m.partBase[i] + this.explode * (i + 1) * 0.95; });
      if (m.sway && !reduced) { m.sway.rotation.z = Math.sin(time * 1.1 + 1) * 0.035; m.sway.rotation.x = Math.sin(time * 0.8) * 0.025; }
    }

    // Displacement check for the re-cast button.
    const displaced = this.mods.some((m) => m.released && Math.hypot(m.body.position.x - m.home.x, m.body.position.z - m.home.z) > 0.6);
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
    const yaw = this.camLag.x * 0.06;
    const off = new THREE.Vector3(20, 20, 20).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
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

  private focusOrHover(): Verb | null { return this.dragging ? this.dragging.mod.id : this.hovered?.id ?? this.focusId; }

  dispose() {
    gsap.ticker.remove(this.tickFn);
    this.ro.disconnect();
    const c = this.renderer.domElement;
    c.removeEventListener('pointermove', this.onPointer.move);
    c.removeEventListener('pointerdown', this.onPointer.down);
    removeEventListener('pointerup', this.onPointer.up);
    c.removeEventListener('pointerleave', this.onPointer.leave);
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
