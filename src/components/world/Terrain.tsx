import { useMemo } from "react";
import * as THREE from "three";
import { fieldColor, height, LAND_C, PATHS, ROAD_H, ROAD_PTS } from "./landscape";
import { hash2 as hash } from "./noise";

export function Terrain({ segments = 190 }: { segments?: number }) {
  const geometry = useMemo(() => {
    const size = 660;
    const plane = new THREE.PlaneGeometry(size, size, segments, segments);
    plane.rotateX(-Math.PI / 2);
    plane.translate(LAND_C.x, 0, LAND_C.z);
    const pos = plane.attributes.position as THREE.BufferAttribute;
    const cell = size / segments;
    for (let i = 0; i < pos.count; i++) {
      // small jitter keeps the low-poly grid from looking like graph paper
      const x = pos.getX(i) + (hash(i, 1) - 0.5) * cell * 0.55;
      const z = pos.getZ(i) + (hash(i, 2) - 0.5) * cell * 0.55;
      pos.setXYZ(i, x, height(x, z), z);
    }
    const geo = plane.toNonIndexed();
    plane.dispose();

    const p = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i += 3) {
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
      const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      fieldColor(cx, cz, c);
      // per-facet variation: the hand-cut, low-poly feel
      c.offsetHSL((hash(i, 7) - 0.5) * 0.012, (hash(i, 8) - 0.5) * 0.05, (hash(i, 9) - 0.5) * 0.045);
      for (let k = 0; k < 3; k++) c.toArray(colors, (i + k) * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [segments]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} />
    </mesh>
  );
}

/** The sandy lane (zandweg) that leads home. */
export function Road() {
  const geometry = useMemo(() => {
    const half = 2.1;
    const n = ROAD_PTS.length;
    const verts: number[] = [];
    const cols: number[] = [];
    const sand = new THREE.Color("#DDBB8C");
    const rut = new THREE.Color("#C9A178");
    const c = new THREE.Color();
    const side = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const p = ROAD_PTS[i];
      const q = ROAD_PTS[Math.min(n - 1, i + 1)];
      const o = ROAD_PTS[Math.max(0, i - 1)];
      side.set(q.z - o.z, 0, -(q.x - o.x)).normalize();
      const y = ROAD_H[i] + 0.07;
      // 4 lanes across: verge-rut-crown-rut-verge, like a real two-track sand road
      for (const [f, col] of [[-1, sand], [-0.45, rut], [0.45, rut], [1, sand]] as const) {
        verts.push(p.x + side.x * half * f, y + (Math.abs(f) < 0.5 ? -0.02 : 0), p.z + side.z * half * f);
        c.copy(col).offsetHSL(0, 0, (hash(i, f * 10 + 3) - 0.5) * 0.03);
        cols.push(c.r, c.g, c.b);
      }
    }
    const idx: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      for (let k = 0; k < 3; k++) {
        const a = i * 4 + k;
        const b = a + 1;
        const d = a + 4;
        const e = d + 1;
        idx.push(a, d, b, b, d, e);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}

/** The sandy side tracks from every yard to the lane. */
export function Paths() {
  const geometry = useMemo(() => {
    const verts: number[] = [];
    const cols: number[] = [];
    const idx: number[] = [];
    const sand = new THREE.Color("#D6B387");
    const c = new THREE.Color();
    const side = new THREE.Vector3();
    let base = 0;
    for (const path of PATHS) {
      const n = path.pts.length;
      for (let i = 0; i < n; i++) {
        const p = path.pts[i];
        const q = path.pts[Math.min(n - 1, i + 1)];
        const o = path.pts[Math.max(0, i - 1)];
        side.set(q.z - o.z, 0, -(q.x - o.x)).normalize();
        const half = 0.95 + Math.sin(i * 0.7) * 0.08;
        for (const f of [-1, 1]) {
          const x = p.x + side.x * half * f;
          const z = p.z + side.z * half * f;
          verts.push(x, Math.max(path.h[i], height(x, z)) + 0.06, z);
          c.copy(sand).offsetHSL(0, 0, (hash(i, f + 7) - 0.5) * 0.05);
          cols.push(c.r, c.g, c.b);
        }
        if (i < n - 1) {
          const a = base + i * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      base += n * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}
