import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildTrees, type TreeData } from "./landscape";
import { mulberry32 } from "./noise";
import { world } from "./store";

const COLORS = ["#E0A33E", "#D2772F", "#C2522B", "#E8BE55", "#B8642E", "#D98E3A"];

type Leaf = {
  x: number; y: number; z: number; floor: number;
  vy: number; phase: number; spin: THREE.Vector3; rot: THREE.Euler; sway: number;
};

/** Autumn leaves letting go of the trees around wherever you are looking. */
export function Leaves({ count = 260, maxTrees }: { count?: number; maxTrees: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const trees = useMemo(() => buildTrees(maxTrees).round, [maxTrees]);
  const rng = useMemo(() => mulberry32(1125), []);

  const geo = useMemo(() => {
    // a little pointed leaf, folded along its spine
    const g = new THREE.BufferGeometry();
    const v = new Float32Array([
      0, 0, -0.5, 0.32, 0.05, 0, 0, 0, 0.5,
      0, 0, -0.5, 0, 0, 0.5, -0.32, 0.05, 0,
    ]);
    g.setAttribute("position", new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8, flatShading: true }), []);

  const leaves = useMemo<Leaf[]>(
    () => Array.from({ length: count }, () => ({
      x: 0, y: -999, z: 0, floor: 0, vy: 0, phase: 0, sway: 0,
      spin: new THREE.Vector3(), rot: new THREE.Euler(),
    })),
    [count],
  );

  const spawn = (l: Leaf, radius: number, anywhere: boolean) => {
    // pick a tree near the point of interest
    let t: TreeData | undefined;
    for (let k = 0; k < 12; k++) {
      const c = trees[Math.floor(rng() * trees.length)];
      if (Math.hypot(c.x - world.target.x, c.z - world.target.z) < radius) { t = c; break; }
    }
    t ??= trees[Math.floor(rng() * trees.length)];
    const crown = 1.6 + t.s * 1.4 + (1.5 + t.s * 1.3) * 0.55;
    l.x = t.x + (rng() - 0.5) * 3;
    l.z = t.z + (rng() - 0.5) * 3;
    l.floor = t.y;
    l.y = t.y + crown * (anywhere ? rng() : 0.8 + rng() * 0.3);
    l.vy = 0.55 + rng() * 0.7;
    l.phase = rng() * Math.PI * 2;
    l.sway = 0.6 + rng() * 0.9;
    l.spin.set((rng() - 0.5) * 4, (rng() - 0.5) * 3, (rng() - 0.5) * 4);
    l.rot.set(rng() * 6, rng() * 6, rng() * 6);
  };

  useLayoutEffect(() => {
    const c = new THREE.Color();
    leaves.forEach((_, i) => ref.current!.setColorAt(i, c.set(COLORS[i % COLORS.length]).offsetHSL(0, 0, (rng() - 0.5) * 0.08)));
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [leaves, rng]);

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  const started = useRef(false);

  useFrame(({ camera, clock }, delta) => {
    const mesh = ref.current;
    if (!mesh || !trees.length) return;
    const dt = Math.min(delta, 0.05);
    const dist = camera.position.distanceTo(world.target);
    const radius = Math.max(40, dist * 0.6);
    // stylised: leaves read at any zoom level
    const size = THREE.MathUtils.clamp(0.6 + dist * 0.008, 0.7, 2.3);
    const t = clock.elapsedTime;
    const gust = 0.7 + Math.sin(t * 0.23) * 0.5 + Math.sin(t * 0.61) * 0.2;
    const calm = world.reduced ? 0.3 : 1;

    leaves.forEach((l, i) => {
      if (!started.current || l.y < l.floor - 0.2) spawn(l, radius, !started.current);
      l.y -= l.vy * dt * calm;
      l.x += (0.9 * gust + Math.sin(t * l.sway + l.phase) * 0.8) * dt * calm;
      l.z += Math.cos(t * l.sway * 0.8 + l.phase) * 0.5 * dt * calm;
      l.rot.x += l.spin.x * dt * calm;
      l.rot.y += l.spin.y * dt * calm;
      l.rot.z += l.spin.z * dt * calm;
      tmp.q.setFromEuler(l.rot);
      tmp.m.compose(tmp.p.set(l.x, l.y, l.z), tmp.q, tmp.s.setScalar(size));
      mesh.setMatrixAt(i, tmp.m);
    });
    started.current = true;
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo, material, count]} frustumCulled={false} castShadow={false} />;
}
