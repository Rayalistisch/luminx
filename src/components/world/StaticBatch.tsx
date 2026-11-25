import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Static batching: after its children mount, merge every still mesh that shares
 * a material into a single mesh, and hide the originals. Thousands of little
 * boxes (window frames, shutters, beams) become a handful of draw calls.
 *
 * Anything that moves or changes must opt out with userData={{ dynamic: true }}
 * on itself or an ancestor; instanced meshes and multi-material meshes are
 * left alone automatically. Pointer events still bubble to the parents.
 */
export function StaticBatch({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const toLocal = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const tmp = new THREE.Matrix4();

    type Bucket = { material: THREE.Material; cast: boolean; receive: boolean; meshes: THREE.Mesh[]; geos: THREE.BufferGeometry[] };
    const buckets = new Map<string, Bucket>();

    const visit = (o: THREE.Object3D) => {
      if (o.userData.dynamic) return;
      const m = o as THREE.Mesh;
      if (m.isMesh && !(m as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(m.material) && m.visible && m.geometry?.attributes.position) {
        const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        for (const name of Object.keys(g.attributes)) {
          if (name !== "position" && name !== "normal" && name !== "uv" && name !== "color") g.deleteAttribute(name);
        }
        g.morphAttributes = {};
        g.clearGroups();
        g.applyMatrix4(tmp.multiplyMatrices(toLocal, m.matrixWorld));
        const sig = Object.keys(g.attributes).sort().join(",");
        const key = `${m.material.uuid}|${sig}|${m.castShadow ? 1 : 0}${m.receiveShadow ? 1 : 0}`;
        let b = buckets.get(key);
        if (!b) {
          b = { material: m.material, cast: m.castShadow, receive: m.receiveShadow, meshes: [], geos: [] };
          buckets.set(key, b);
        }
        b.meshes.push(m);
        b.geos.push(g);
      }
      for (const c of o.children) visit(c);
    };
    for (const c of root.children) visit(c);

    const merged: THREE.Mesh[] = [];
    const hidden: THREE.Mesh[] = [];
    const noRaycast = () => {};
    buckets.forEach((b) => {
      if (b.meshes.length < 2) {
        b.geos.forEach((g) => g.dispose());
        return;
      }
      const geo = mergeGeometries(b.geos);
      b.geos.forEach((g) => g.dispose());
      if (!geo) return;
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, b.material);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.receive;
      mesh.userData.batched = true;
      root.add(mesh);
      merged.push(mesh);
      for (const m of b.meshes) {
        m.visible = false;
        m.raycast = noRaycast;
        hidden.push(m);
      }
    });

    return () => {
      for (const m of merged) {
        root.remove(m);
        m.geometry.dispose();
      }
      for (const m of hidden) {
        m.visible = true;
        m.raycast = THREE.Mesh.prototype.raycast;
      }
    };
  }, []);

  return <group ref={ref}>{children}</group>;
}
