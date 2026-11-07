// What the two Kit scenes share: the renderer setup and the light. The hero plaza (kit3d.ts) and the
// Build cluster (cluster.ts) use the same materials (modules.ts), so they read as one set.
import * as THREE from 'three';

export function makeRenderer(el: HTMLElement, mobile: boolean) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1 : 1.75));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping;
  r.toneMappingExposure = 1.06;
  r.shadowMap.enabled = true;
  r.shadowMap.autoUpdate = false; // updated only when something moved or the sun travelled
  r.shadowMap.type = THREE.VSMShadowMap; // soft, blurred penumbra like the Kit renders
  r.setClearColor(0x000000, 0);
  el.appendChild(r.domElement);
  r.domElement.setAttribute('aria-hidden', 'true');
  return r;
}

/** Hemisphere fill, one warm sun with soft shadows over a square of `extent`, and a cool fill from the front. */
export function addLights(scene: THREE.Scene, target: THREE.Vector3, extent: number, mobile: boolean) {
  scene.add(new THREE.HemisphereLight('#fbfaf7', '#d4cec4', 2.0));
  const s = new THREE.DirectionalLight('#fff3e3', 2.2);
  s.castShadow = true;
  const size = mobile ? 768 : 1024;
  s.shadow.mapSize.set(size, size);
  const cam = s.shadow.camera;
  cam.left = -extent; cam.right = extent; cam.top = extent; cam.bottom = -extent; cam.near = 1; cam.far = 80;
  s.shadow.bias = -0.0002;
  s.shadow.normalBias = 0.025;
  s.shadow.radius = 5;
  s.shadow.blurSamples = 8;
  s.target.position.copy(target);
  scene.add(s, s.target);
  const fill = new THREE.DirectionalLight('#e8eefc', 0.35);
  fill.position.set(-10, 8, 14);
  scene.add(fill);
  return s;
}
