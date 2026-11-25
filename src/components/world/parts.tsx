import { useMemo } from "react";
import * as THREE from "three";
import { mat } from "./materials";
import { worldBox } from "./textures";

export type V3 = [number, number, number];

/**
 * A box. Plain colours stay flat-shaded; textured materials get world-scaled
 * UVs so bricks and tiles keep their size on every wall, unless the material
 * is a "fit" texture (windows, doors, shutters) that maps once per face.
 */
export function Box({ p, s, c, rot, shadow = true }: { p: V3; s: V3; c: string | THREE.Material; rot?: V3; shadow?: boolean }) {
  const material = typeof c === "string" ? mat(c) : c;
  const textured = typeof c !== "string" && !!(c as THREE.MeshStandardMaterial).map && !c.userData.fit;
  const geo = textured ? worldBox(s[0], s[1], s[2]) : undefined;
  return (
    <mesh position={p} rotation={rot} material={material} geometry={geo} castShadow={shadow} receiveShadow>
      {!geo && <boxGeometry args={s} />}
    </mesh>
  );
}

/** A beam between two points. */
export function Beam({ a, b, t = 0.2, c }: { a: V3; b: V3; t?: number; c: string | THREE.Material }) {
  const { mid, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    return {
      len: d.length(),
      mid: A.clone().add(B).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()),
    };
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  return (
    <mesh position={mid} quaternion={quat} material={typeof c === "string" ? mat(c) : c} castShadow>
      <boxGeometry args={[t, len, t]} />
    </mesh>
  );
}

/** Extruded triangle (gable end), UVs in world units. */
export function triangleGeo(w: number, h: number, depth: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return g;
}

/**
 * A window as Twentse farms have them: glazed sash with bars, a cream frame,
 * a sill and optionally a pair of hourglass shutters.
 */
export function Window({
  p, w = 0.9, h = 1.05, side = "z", shutters = false, shutterMat, glass, frame = "#F1E7D6",
}: {
  p: V3; w?: number; h?: number; side?: "z" | "x" | "-x" | "-z"; shutters?: boolean;
  shutterMat?: THREE.Material; glass: THREE.Material; frame?: string;
}) {
  const rotY = side === "z" ? 0 : side === "-z" ? Math.PI : side === "x" ? Math.PI / 2 : -Math.PI / 2;
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Box p={[0, 0, 0.03]} s={[w + 0.16, h + 0.16, 0.06]} c={frame} shadow={false} />
      <Box p={[0, 0, 0.09]} s={[w, h, 0.04]} c={glass} shadow={false} />
      <Box p={[0, -h / 2 - 0.1, 0.1]} s={[w + 0.3, 0.08, 0.2]} c={frame} />
      {shutters && shutterMat && (
        <>
          <Box p={[-w / 2 - 0.32, 0, 0.06]} s={[0.44, h + 0.1, 0.06]} c={shutterMat} />
          <Box p={[w / 2 + 0.32, 0, 0.06]} s={[0.44, h + 0.1, 0.06]} c={shutterMat} />
        </>
      )}
    </group>
  );
}
