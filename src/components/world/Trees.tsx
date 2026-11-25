import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildTrees, snowAmount } from "./landscape";
import { hash2 } from "./noise";

// Late-autumn Twente: mostly green oaks and beeches, a third already turned.
const GREENS = ["#6F8F45", "#7F9A4A", "#5E7F3F", "#8DA352", "#6A8A3E"];
const AUTUMN = ["#D68D3A", "#C76B33", "#E3AB48", "#B9552F", "#D9993F"];
const PINES = ["#3F5E3A", "#4A6A40", "#35533A", "#44613C"];
const SNOWY = new THREE.Color("#F2F0EC");

/** Bake a top-light / bottom-shade gradient into vertex colours: crisp, readable volume. */
function shadeByHeight(g: THREE.BufferGeometry, lo: number, hi: number, dark = 0.62) {
  const p = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i += 3) {
    // per face, so facets stay sharp
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const t = THREE.MathUtils.clamp((y - lo) / (hi - lo), 0, 1);
    const v = dark + (1 - dark) * Math.pow(t, 0.8);
    for (let k = 0; k < 3; k++) col.set([v, v, v], (i + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function lobe(r: number, x: number, y: number, z: number, seed: number) {
  const g = new THREE.IcosahedronGeometry(r, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i);
    const vy = p.getY(i);
    const vz = p.getZ(i);
    const k = hash2(Math.round(vx * 100) + seed * 7, Math.round(vy * 100) * 31 + Math.round(vz * 100));
    const s = 0.88 + k * 0.24;
    p.setXYZ(i, vx * s + x, vy * s * 0.9 + y, vz * s + z);
  }
  g.deleteAttribute("uv");
  return g;
}

function crownGeometry() {
  // a main mass with three smaller lobes: a clear, faceted silhouette
  const g = mergeGeometries([
    lobe(1.0, 0, 0, 0, 1),
    lobe(0.62, 0.62, 0.32, 0.18, 2),
    lobe(0.58, -0.5, 0.22, -0.38, 3),
    lobe(0.5, 0.05, 0.7, -0.1, 4),
  ])!;
  g.computeVertexNormals();
  return shadeByHeight(g, -0.9, 1.1);
}

function pineGeometry() {
  const tiers = [[1.05, 1.5, 0.75], [0.86, 1.35, 1.45], [0.66, 1.2, 2.1], [0.44, 1.05, 2.7]] as const;
  const parts = tiers.map(([r, h, y]) => new THREE.ConeGeometry(r, h, 8).translate(0, y, 0).toNonIndexed());
  parts.forEach((p) => p.deleteAttribute("uv"));
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  return shadeByHeight(merged, 0, 3.3, 0.55);
}

export function Trees({ max }: { max: number }) {
  const data = useMemo(() => buildTrees(max), [max]);
  const geos = useMemo(
    () => ({
      crown: crownGeometry(),
      pine: pineGeometry(),
      trunk: new THREE.CylinderGeometry(0.13, 0.22, 1, 5).translate(0, 0.5, 0),
    }),
    [],
  );
  const mats = useMemo(
    () => ({
      crown: new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9, vertexColors: true }),
      pine: new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9, vertexColors: true }),
      trunk: new THREE.MeshStandardMaterial({ color: "#5A3F30", flatShading: true, roughness: 1 }),
    }),
    [],
  );

  const crownRef = useRef<THREE.InstancedMesh>(null);
  const pineRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    const col = new THREE.Color();
    let ti = 0;

    data.round.forEach((t, i) => {
      const trunkH = 1.6 + t.s * 1.4;
      const r = 1.5 + t.s * 1.3;
      q.setFromEuler(e.set(0, t.rot, 0));
      m.compose(pos.set(t.x, t.y - 0.2, t.z), q, scl.set(t.s, trunkH, t.s));
      trunkRef.current!.setMatrixAt(ti++, m);
      q.setFromEuler(e.set((t.seed - 0.5) * 0.3, t.rot, (t.seed - 0.5) * 0.2));
      m.compose(pos.set(t.x, t.y + trunkH + r * 0.55, t.z), q, scl.set(r, r * (1.05 + t.seed * 0.3), r));
      crownRef.current!.setMatrixAt(i, m);
      const autumn = hash2(Math.round(t.x * 3), Math.round(t.z * 3)) < 0.52;
      const list = autumn ? AUTUMN : GREENS;
      col.set(list[Math.floor(t.seed * list.length) % list.length]).offsetHSL(0, 0, (t.seed - 0.5) * 0.06);
      col.lerp(SNOWY, snowAmount(t.x, t.z) * 0.75);
      crownRef.current!.setColorAt(i, col);
    });

    data.pine.forEach((t, i) => {
      const s = 1.3 + t.s * 1.5;
      q.setFromEuler(e.set(0, t.rot, 0));
      m.compose(pos.set(t.x, t.y - 0.2, t.z), q, scl.set(t.s * 0.8, 1.4, t.s * 0.8));
      trunkRef.current!.setMatrixAt(ti++, m);
      m.compose(pos.set(t.x, t.y + 0.9, t.z), q, scl.set(s * 0.75, s * 1.35, s * 0.75));
      pineRef.current!.setMatrixAt(i, m);
      col.set(PINES[Math.floor(t.seed * PINES.length) % PINES.length]).offsetHSL(0, 0, (t.seed - 0.5) * 0.05);
      col.lerp(SNOWY, snowAmount(t.x, t.z) * 0.7);
      pineRef.current!.setColorAt(i, col);
    });

    for (const r of [crownRef, pineRef, trunkRef]) {
      r.current!.instanceMatrix.needsUpdate = true;
      if (r.current!.instanceColor) r.current!.instanceColor.needsUpdate = true;
      r.current!.computeBoundingSphere();
    }
  }, [data]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[geos.trunk, mats.trunk, data.round.length + data.pine.length]} castShadow receiveShadow />
      <instancedMesh ref={crownRef} args={[geos.crown, mats.crown, data.round.length]} castShadow receiveShadow />
      <instancedMesh ref={pineRef} args={[geos.pine, mats.pine, data.pine.length]} castShadow receiveShadow />
    </group>
  );
}
