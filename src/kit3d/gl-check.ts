// Tiny WebGL check, kept apart from the 3D module so the home page can decide before loading three.js.
let ok: boolean | null = null;
export function webglOK() {
  if (ok !== null) return ok;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch { ok = false; }
  return ok;
}
