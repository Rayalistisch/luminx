import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildTrees, fieldType, height, isOpenGround, ROAD_H, ROAD_PTS, SITES } from "./landscape";
import { mat } from "./materials";
import { mulberry32 } from "./noise";
import { Board } from "./Signs";
import { world } from "./store";

// The small things that make a place feel lived in.

type V3 = [number, number, number];

/* ─── vertex-coloured models, so a whole herd is one draw call ───────── */
function part(geo: THREE.BufferGeometry, pos: V3, color: string, rot?: V3) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (rot) g.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
  g.translate(...pos);
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(arr, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  g.deleteAttribute("uv");
  return g;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const merge = (parts: THREE.BufferGeometry[]) => {
  const g = mergeGeometries(parts)!;
  g.computeVertexNormals();
  return g;
};

function cowGeometry() {
  const W = "#F2ECE2";
  const B = "#2B2524";
  return merge([
    part(box(1.7, 0.85, 0.8), [0, 1.0, 0], W),
    part(box(0.62, 0.62, 0.82), [0.15, 1.05, 0], B),
    part(box(0.45, 0.5, 0.82), [-0.55, 1.12, 0.02], B),
    part(box(0.52, 0.5, 0.46), [1.02, 1.22, 0], W),
    part(box(0.24, 0.28, 0.4), [1.32, 1.1, 0], "#E3A79C"),
    part(box(0.12, 0.1, 0.22), [0.95, 1.5, 0.28], B),
    part(box(0.12, 0.1, 0.22), [0.95, 1.5, -0.28], B),
    part(box(0.08, 0.6, 0.08), [-0.88, 0.92, 0], W),
    ...[[0.6, 0.25], [0.6, -0.25], [-0.6, 0.25], [-0.6, -0.25]].map(([x, z]) => part(box(0.18, 0.62, 0.18), [x, 0.31, z], B)),
  ]);
}

function sheepGeometry() {
  const wool = new THREE.IcosahedronGeometry(0.55, 0);
  return merge([
    part(wool, [0, 0.82, 0], "#EFE7D8"),
    part(new THREE.IcosahedronGeometry(0.42, 0), [-0.35, 0.86, 0], "#EAE1D0"),
    part(box(0.32, 0.36, 0.3), [0.62, 0.95, 0], "#3A302C"),
    ...[[0.3, 0.18], [0.3, -0.18], [-0.35, 0.18], [-0.35, -0.18]].map(([x, z]) => part(box(0.12, 0.5, 0.12), [x, 0.25, z], "#3A302C")),
  ]);
}

function baleGeometry() {
  return merge([part(new THREE.CylinderGeometry(0.75, 0.75, 1.15, 12), [0, 0.75, 0], "#FFFFFF", [0, 0, Math.PI / 2])]);
}

type Inst = { x: number; y: number; z: number; r: number; s: number; tint: string };

function Instances({ geometry, items, roughness = 0.9 }: { geometry: THREE.BufferGeometry; items: Inst[]; roughness?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness }), [roughness]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.r);
      m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(it.s, it.s, it.s));
      ref.current!.setMatrixAt(i, m);
      ref.current!.setColorAt(i, c.set(it.tint));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow receiveShadow />;
}

/* ─── koeien, schapen en ronde balen in de juiste akkers ──────────────── */
function useFarmLife(maxTrees: number) {
  return useMemo(() => {
    const rng = mulberry32(2611);
    const trees = buildTrees(maxTrees);
    const all = [...trees.round, ...trees.pine];
    const clearOfTrees = (x: number, z: number, r: number) => !all.some((t) => Math.abs(t.x - x) < r && Math.abs(t.z - z) < r);

    const cows: Inst[] = [];
    const sheep: Inst[] = [];
    const bales: Inst[] = [];
    for (let gx = -190; gx <= 200; gx += 17) {
      for (let gz = -250; gz <= 140; gz += 17) {
        const x = gx + (rng() - 0.5) * 8;
        const z = gz + (rng() - 0.5) * 8;
        if (Math.hypot(x - 6, z + 52) > 200) continue;
        if (!isOpenGround(x, z, 5) || !clearOfTrees(x, z, 6)) continue;
        const type = fieldType(x, z);
        const roll = rng();
        if (type >= 3 && type <= 5 && roll < 0.42) {
          // a small herd, mostly facing the same way, as they do
          const dir = rng() * Math.PI * 2;
          const isSheep = roll < 0.13;
          const n = isSheep ? 5 + Math.floor(rng() * 5) : 3 + Math.floor(rng() * 4);
          for (let k = 0; k < n; k++) {
            const px = x + (rng() - 0.5) * 9;
            const pz = z + (rng() - 0.5) * 9;
            if (!isOpenGround(px, pz, 2) || !clearOfTrees(px, pz, 2.5)) continue;
            const it = { x: px, y: height(px, pz), z: pz, r: dir + (rng() - 0.5) * 1.6, s: 0.9 + rng() * 0.2, tint: "#FFFFFF" };
            if (isSheep) sheep.push(it);
            else cows.push({ ...it, tint: rng() < 0.35 ? "#D49A6A" : "#FFFFFF" }); // some brown-white MRIJ
          }
        } else if (type <= 2 && roll < 0.5) {
          // a row of round bales left after the harvest
          const dir = rng() * Math.PI;
          const n = 3 + Math.floor(rng() * 4);
          const wrapped = rng() < 0.3;
          for (let k = 0; k < n; k++) {
            const px = x + Math.cos(dir) * (k - n / 2) * 3.2 + (rng() - 0.5);
            const pz = z + Math.sin(dir) * (k - n / 2) * 3.2 + (rng() - 0.5);
            if (!isOpenGround(px, pz, 1) || !clearOfTrees(px, pz, 2)) continue;
            bales.push({ x: px, y: height(px, pz) - 0.05, z: pz, r: dir + (rng() - 0.5) * 0.4, s: 0.95 + rng() * 0.15, tint: wrapped ? "#EEEDE6" : "#D8B259" });
          }
        }
      }
    }
    return { cows, sheep, bales };
  }, [maxTrees]);
}

function FarmLife({ maxTrees }: { maxTrees: number }) {
  const { cows, sheep, bales } = useFarmLife(maxTrees);
  const geos = useMemo(() => ({ cow: cowGeometry(), sheep: sheepGeometry(), bale: baleGeometry() }), []);
  return (
    <>
      <Instances geometry={geos.cow} items={cows} />
      <Instances geometry={geos.sheep} items={sheep} />
      <Instances geometry={geos.bale} items={bales} roughness={0.75} />
    </>
  );
}

/* ─── ganzen in V-formatie, op weg naar het zuiden ─────────────────────── */
function Geese({ count = 11 }: { count?: number }) {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const wings = useRef<THREE.InstancedMesh>(null);
  const geos = useMemo(() => ({
    body: merge([
      part(box(1.1, 0.28, 0.32), [0, 0, 0], "#5A514B"),
      part(box(0.5, 0.14, 0.14), [0.75, 0.08, 0], "#2B2524"),
      part(box(0.18, 0.14, 0.14), [1.05, 0.08, 0], "#2B2524"),
    ]),
    wing: merge([part(box(0.55, 0.05, 1.3), [0, 0, 0.65], "#6B625A")]),
  }), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }), []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), qw: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3(1.4, 1.4, 1.4), off: new THREE.Vector3() }), []);

  useFrame(({ clock }) => {
    if (!bodies.current || !wings.current) return;
    const t = clock.elapsedTime * (world.reduced ? 0.3 : 1);
    // a wide, slow loop over the land
    const a = t * 0.028;
    const cx = 6 + Math.cos(a) * 200;
    const cz = -52 + Math.sin(a) * 140;
    const heading = Math.atan2(Math.cos(a) * 120, -Math.sin(a) * 170); // tangent
    const yaw = -heading + Math.PI / 2;
    for (let i = 0; i < count; i++) {
      const row = Math.ceil(i / 2);
      const side = i === 0 ? 0 : i % 2 ? 1 : -1;
      tmp.off.set(-row * 2.4, Math.sin(t * 0.7 + i) * 0.3, side * row * 2.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      tmp.p.set(cx + tmp.off.x, 62 + tmp.off.y, cz + tmp.off.z);
      tmp.q.setFromEuler(tmp.e.set(0, yaw, 0));
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      bodies.current.setMatrixAt(i, tmp.m);
      const flap = Math.sin(t * 6 + i * 0.7) * 0.55;
      for (const [k, sgn] of [[0, 1], [1, -1]] as const) {
        tmp.qw.setFromEuler(tmp.e.set(sgn * flap, sgn === 1 ? 0 : Math.PI, 0));
        tmp.m.compose(tmp.p, tmp.q.clone().multiply(tmp.qw), tmp.s);
        wings.current.setMatrixAt(i * 2 + k, tmp.m);
      }
    }
    bodies.current.instanceMatrix.needsUpdate = true;
    wings.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={bodies} args={[geos.body, material, count]} frustumCulled={false} />
      <instancedMesh ref={wings} args={[geos.wing, material, count * 2]} frustumCulled={false} />
    </>
  );
}

/* ─── wolken: zacht, laag-poly, warm aangelicht ────────────────────────── */
function Clouds({ count = 14 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const material = useMemo(() => {
    // clouds glow with the sky they sit in, instead of going grey in backlight
    const m = new THREE.MeshStandardMaterial({ color: "#FFF6EA", emissive: new THREE.Color("#FFD6B0"), emissiveIntensity: 0.85, flatShading: true, roughness: 1, transparent: true, opacity: 0.95 });
    m.fog = false;
    return m;
  }, []);
  const clouds = useMemo(() => {
    const rng = mulberry32(77);
    return Array.from({ length: count }, () => {
      const ang = -Math.PI * 0.95 + rng() * Math.PI * 0.9; // mostly over the far side, in view
      const r = 280 + rng() * 140;
      return {
        x: Math.cos(ang) * r,
        z: -52 + Math.sin(ang) * r,
        y: 85 + rng() * 60,
        s: 6 + rng() * 7,
        puffs: Array.from({ length: 6 + Math.floor(rng() * 4) }, (_, i) => ({
          x: (i - 3) * 1.0 + (rng() - 0.5),
          y: rng() * 0.5,
          z: (rng() - 0.5) * 1.2,
          s: 0.8 + rng() * 0.7,
        })),
      };
    });
  }, [count]);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  useFrame((_, dt) => {
    if (!group.current || world.reduced) return;
    group.current.children.forEach((c) => {
      c.position.x += dt * 1.2;
      if (c.position.x > 400) c.position.x = -400;
    });
    material.opacity = 0.95 - world.dusk * 0.35;
    material.emissiveIntensity = 0.85 - world.dusk * 0.55;
  });
  return (
    <group ref={group} userData={{ dynamic: true }}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {c.puffs.map((p, k) => (
            <mesh key={k} geometry={geo} material={material} position={[p.x, p.y, p.z]} scale={[p.s, p.s * 0.6, p.s]} />
          ))}
        </group>
      ))}
    </group>
  );
}

/* ─── handwijzer: a proper wooden signpost at the lane ────────────────── */
function Signpost() {
  const spot = useMemo(() => {
    const i = Math.floor(ROAD_PTS.length * 0.33);
    const p = ROAD_PTS[i];
    const q = ROAD_PTS[i + 2];
    const side = new THREE.Vector3(q.z - p.z, 0, -(q.x - p.x)).normalize();
    const x = p.x + side.x * 3.6;
    const z = p.z + side.z * 3.6;
    return { x, z, y: ROAD_H[i] };
  }, []);
  const arms = useMemo(() => {
    const targets: [string, number, number][] = [
      ["De molen", SITES.windmill.x, SITES.windmill.z],
      ["De fabriek", SITES.mill.x, SITES.mill.z],
      ["LuminX", SITES.home.x, SITES.home.z],
    ];
    return targets.map(([text, tx, tz], k) => {
      const a = Math.atan2(tx - spot.x, tz - spot.z);
      const w = 2.6;
      return {
        text,
        y: 3.3 - k * 0.62,
        pos: [Math.sin(a) * (w / 2 + 0.1), 0, Math.cos(a) * (w / 2 + 0.1)] as V3,
        rot: a - Math.PI / 2,
        w,
      };
    });
  }, [spot]);
  return (
    <group position={[spot.x, spot.y, spot.z]}>
      <mesh position={[0, 1.9, 0]} material={mat("#F1ECE2")} castShadow>
        <boxGeometry args={[0.2, 3.8, 0.2]} />
      </mesh>
      <mesh position={[0, 3.9, 0]} material={mat("#EA3D5B")} castShadow>
        <coneGeometry args={[0.2, 0.3, 4]} />
      </mesh>
      {arms.map((a) => (
        <group key={a.text} position={[a.pos[0], a.y, a.pos[2]]} rotation={[0, a.rot, 0]}>
          <Board text={a.text} w={a.w} h={0.48} position={[0, 0, 0]} bg="#F7F2E8" fg="#3A001D" accent="#EA3D5B" />
        </group>
      ))}
    </group>
  );
}

/* ─── a wooden fence along the last stretch of the lane ───────────────── */
function Fence() {
  const posts = useRef<THREE.InstancedMesh>(null);
  const rails = useRef<THREE.InstancedMesh>(null);
  const { postList, railList } = useMemo(() => {
    const postList: { x: number; y: number; z: number }[] = [];
    const railList: { x: number; y: number; z: number; len: number; ang: number }[] = [];
    const n = ROAD_PTS.length;
    for (const sgn of [1, -1]) {
      let prev: { x: number; y: number; z: number } | null = null;
      for (let i = Math.floor(n * 0.72); i < n - 6; i += 5) {
        const p = ROAD_PTS[i];
        const q = ROAD_PTS[Math.min(n - 1, i + 1)];
        const side = new THREE.Vector3(q.z - p.z, 0, -(q.x - p.x)).normalize();
        const x = p.x + side.x * 4.3 * sgn;
        const z = p.z + side.z * 4.3 * sgn;
        const cur = { x, z, y: height(x, z) };
        // leave gaps at the farm entrances
        const nearFarm = SITES.projects.some((s) => Math.hypot(s.x - x, s.z - z) < s.r + 8);
        if (nearFarm) { prev = null; continue; }
        postList.push(cur);
        if (prev) {
          const len = Math.hypot(cur.x - prev.x, cur.z - prev.z);
          railList.push({ x: (cur.x + prev.x) / 2, y: (cur.y + prev.y) / 2, z: (cur.z + prev.z) / 2, len, ang: Math.atan2(cur.x - prev.x, cur.z - prev.z) });
        }
        prev = cur;
      }
    }
    return { postList, railList };
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    postList.forEach((p, i) => {
      m.compose(new THREE.Vector3(p.x, p.y + 0.6, p.z), q.identity(), new THREE.Vector3(1, 1, 1));
      posts.current!.setMatrixAt(i, m);
    });
    railList.forEach((r, i) => {
      for (const [k, h] of [[0, 0.95], [1, 0.5]] as const) {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r.ang);
        m.compose(new THREE.Vector3(r.x, r.y + h, r.z), q, new THREE.Vector3(1, 1, r.len));
        rails.current!.setMatrixAt(i * 2 + k, m);
      }
    });
    posts.current!.instanceMatrix.needsUpdate = true;
    rails.current!.instanceMatrix.needsUpdate = true;
    posts.current!.computeBoundingSphere();
    rails.current!.computeBoundingSphere();
  }, [postList, railList]);
  return (
    <>
      <instancedMesh ref={posts} args={[new THREE.BoxGeometry(0.16, 1.2, 0.16), mat("#6E5240"), postList.length]} castShadow />
      <instancedMesh ref={rails} args={[new THREE.BoxGeometry(0.08, 0.1, 1), mat("#8A6A50"), railList.length * 2]} castShadow />
    </>
  );
}

/* ─── on the home yard: a woodpile and a bench under the oak ─────────── */
function Yard() {
  const { home } = SITES;
  const log = useMemo(() => new THREE.CylinderGeometry(0.22, 0.22, 2.2, 7).rotateZ(Math.PI / 2), []);
  const logs: V3[] = [];
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 5 - row; k++) logs.push([0, 0.22 + row * 0.38, (k - (4 - row) / 2) * 0.44]);
  }
  return (
    <group>
      <group position={[home.x - 6.8, home.h, home.z - 3]}>
        {logs.map((p, i) => (
          <mesh key={i} geometry={log} position={p} material={mat(i % 3 ? "#8C6446" : "#A27654")} castShadow />
        ))}
        <mesh position={[0, 1.55, 0]} material={mat("#5B4030")} castShadow>
          <boxGeometry args={[2.6, 0.12, 2.6]} />
        </mesh>
      </group>
      <group position={[home.x - 9, home.h, home.z + 12]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.5, 0]} material={mat("#7A573D")} castShadow>
          <boxGeometry args={[2.2, 0.1, 0.55]} />
        </mesh>
        <mesh position={[0, 0.85, -0.25]} material={mat("#7A573D")} castShadow>
          <boxGeometry args={[2.2, 0.5, 0.08]} />
        </mesh>
        {[-0.95, 0.95].map((x) => (
          <mesh key={x} position={[x, 0.25, 0]} material={mat("#4A3528")}>
            <boxGeometry args={[0.1, 0.5, 0.5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Details({ mobile, maxTrees }: { mobile: boolean; maxTrees: number }) {
  return (
    <group>
      <FarmLife maxTrees={maxTrees} />
      <Clouds count={mobile ? 8 : 14} />
      <Geese />
      <Signpost />
      <Fence />
      <Yard />
    </group>
  );
}
