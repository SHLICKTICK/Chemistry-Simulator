import type { Material } from 'three';
import type { Molecule } from '../models';
import { atomColor } from '../utils/chemistry';

/**
 * SVG ball-and-stick fallback, used when WebGL is unavailable.
 * Both viewers consume only the Molecule model; no chemistry logic lives here.
 */
export function renderMoleculeSvg(m: Molecule | null | undefined): string {
  if (!m) return '<div class="mol-empty">No 3D structure data for this compound yet.</div>';
  const ay = 0.5, ax = -0.25, S = 62;
  const pts = m.atoms.map((a) => {
    const { x, y, z } = a.position;
    const x1 = x * Math.cos(ay) + z * Math.sin(ay), z1 = -x * Math.sin(ay) + z * Math.cos(ay);
    const y2 = y * Math.cos(ax) - z1 * Math.sin(ax), z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
    return { el: a.element, sx: 160 + x1 * S, sy: 120 - y2 * S, z: z2 };
  });
  const r = (el: string) => (el === 'H' ? 20 : 28);
  const bonds = m.bonds.map((b) => {
    const p = pts[b.from], q = pts[b.to], n = Math.ceil(b.order);
    const dx = q.sy - p.sy, dy = p.sx - q.sx, len = Math.hypot(dx, dy) || 1;
    return Array.from({ length: n }, (_, i) => {
      const o = (i - (n - 1) / 2) * 7;
      return `<line x1="${p.sx + (dx / len) * o}" y1="${p.sy + (dy / len) * o}" x2="${q.sx + (dx / len) * o}" y2="${q.sy + (dy / len) * o}" class="bond"/>`;
    }).join('');
  }).join('');
  const atoms = [...pts].sort((a, b) => a.z - b.z).map((p) =>
    `<g class="atom"><circle cx="${p.sx}" cy="${p.sy}" r="${r(p.el)}" fill="${atomColor(p.el)}"/><circle cx="${p.sx}" cy="${p.sy}" r="${r(p.el)}" fill="url(#shine)"/>
     <text x="${p.sx}" y="${p.sy + 5}" text-anchor="middle" class="atom-label" fill="${p.el === 'H' ? '#1b2540' : '#fff'}">${p.el}</text></g>`).join('');
  return `<svg class="molecule" viewBox="0 0 320 240" role="img" aria-label="Ball-and-stick model of ${m.formula}">
    <defs><radialGradient id="shine" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>
    ${bonds}${atoms}</svg>`;
}

/** Placeholder markup; the WebGL scene is attached afterwards by mountMolecule(). */
export function renderMoleculeSlot(m: Molecule | null | undefined): string {
  if (!m) return '<div class="mol-empty">No 3D structure data for this compound yet.</div>';
  return `<div class="mol-3d" id="mol3d" tabindex="0" role="img"
      aria-label="Interactive 3D model of ${m.formula}. Drag to rotate, scroll or pinch to zoom, right-drag or arrow keys to pan."></div>
    <button class="ghost mol-reset" data-action="reset-view">Reset view</button>`;
}

interface Viewer { reset(): void; dispose(): void }
let active: Viewer | null = null;
let mountId = 0;

export const resetView = (): void => active?.reset();

export function unmountMolecule(): void {
  mountId++;
  active?.dispose();
  active = null;
}

/**
 * Render a Molecule with Three.js. Three is imported lazily, so it only loads when a molecule is shown.
 * Renders on demand (on interaction/resize) — there is no continuous animation loop.
 */
export async function mountMolecule(host: HTMLElement, m: Molecule): Promise<void> {
  const token = ++mountId;
  try {
    const [THREE, { OrbitControls }] = await Promise.all([import('three'), import('three/examples/jsm/controls/OrbitControls.js')]);
    if (token !== mountId) return; // a newer render superseded this one
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 6.5);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key);

    const group = new THREE.Group();
    group.rotation.set(-0.25, 0.5, 0); // slight tilt so depth reads at first glance
    scene.add(group);

    const pos = m.atoms.map((a) => new THREE.Vector3(a.position.x, a.position.y, a.position.z));
    m.atoms.forEach((a, i) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(a.element === 'H' ? 0.38 : 0.55, 32, 24),
        new THREE.MeshStandardMaterial({ color: atomColor(a.element), roughness: 0.35, metalness: 0.05 }));
      mesh.position.copy(pos[i]);
      group.add(mesh);
    });

    const bondMat = new THREE.MeshStandardMaterial({ color: 0xcfd6e6, roughness: 0.4 });
    for (const b of m.bonds) {
      const p = pos[b.from], q = pos[b.to];
      const dir = q.clone().sub(p), len = dir.length();
      dir.normalize();
      const side = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 0, 1));
      if (side.lengthSq() < 1e-4) side.set(0, 1, 0);
      side.normalize();
      const n = Math.ceil(b.order); // double/triple bonds drawn as parallel cylinders
      for (let i = 0; i < n; i++) {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, len, 16), bondMat);
        cyl.position.copy(p).add(q).multiplyScalar(0.5).addScaledVector(side, (i - (n - 1) / 2) * 0.2);
        cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        group.add(cyl);
      }
    }

    const draw = () => renderer.render(scene, camera);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 3;
    controls.maxDistance = 14;
    controls.listenToKeyEvents(host); // arrow keys pan when the viewer has focus
    controls.saveState();
    controls.addEventListener('change', draw);

    const ro = new ResizeObserver(() => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return; // hidden (e.g. another view is open)
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      draw();
    });
    ro.observe(host);

    active = {
      reset: () => { controls.reset(); draw(); },
      dispose: () => {
        ro.disconnect();
        controls.dispose();
        scene.traverse((o) => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); (o.material as Material).dispose(); } });
        renderer.dispose();
        renderer.domElement.remove();
      },
    };
  } catch {
    if (token === mountId) host.innerHTML = renderMoleculeSvg(m); // WebGL unavailable
  }
}
