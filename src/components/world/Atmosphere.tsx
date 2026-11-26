import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { glowMats, lampMat, skyUniforms, windowMat } from "./materials";
import { DIST_LIMITS, LAND_C, LAND_HALF_D, LAND_HALF_W, OVERVIEW, PLACE_VIEWS, height, smoothstep, type View } from "./landscape";
import { EV_ZOOM, dusk, world } from "./store";

// The sun sets in the west, just left of the overview's line of sight.
const SUN_X = -0.42;
const SUN_Z = -0.91;

// Three moments of one Twente evening: golden hour → sunset → lights on.
type Key = {
  top: string; mid: string; hor: string; sun: string;
  light: string; li: number; hemiSky: string; hemiGround: string; hi: number;
  elev: number; fogNear: number; fogFar: number;
};
const KEYS: Key[] = [
  { top: "#7E93C4", mid: "#F6A98C", hor: "#FFB877", sun: "#FFD08A", light: "#FFD29C", li: 3.4, hemiSky: "#FFE2C2", hemiGround: "#80583C", hi: 1.0, elev: 6.5, fogNear: 150, fogFar: 680 },
  { top: "#5E5596", mid: "#FF9E86", hor: "#FFB872", sun: "#FF9F55", light: "#FF9D5E", li: 2.6, hemiSky: "#FFBDA4", hemiGround: "#5E3A30", hi: 0.8, elev: 2.5, fogNear: 120, fogFar: 600 },
  { top: "#141029", mid: "#3E2150", hor: "#9A5050", sun: "#FF6E3C", light: "#9C8AD8", li: 0.8, hemiSky: "#7A68B0", hemiGround: "#2A1E30", hi: 0.7, elev: -3.5, fogNear: 150, fogFar: 720 },
];

function makeColors(k: Key) {
  return {
    top: new THREE.Color(k.top), mid: new THREE.Color(k.mid), hor: new THREE.Color(k.hor),
    sun: new THREE.Color(k.sun), light: new THREE.Color(k.light),
    hemiSky: new THREE.Color(k.hemiSky), hemiGround: new THREE.Color(k.hemiGround),
  };
}

export function Atmosphere({ shadows, shadowSize }: { shadows: boolean; shadowSize: number }) {
  const scene = useThree((s) => s.scene);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const cols = useMemo(() => KEYS.map(makeColors), []);
  const fog = useMemo(() => new THREE.Fog("#FFD9A3", 70, 430), []);
  const tmp = useMemo(() => ({ a: new THREE.Color(), dir: new THREE.Vector3(), lightDir: new THREE.Vector3() }), []);

  useEffect(() => {
    scene.fog = fog;
    return () => { scene.fog = null; };
  }, [scene, fog]);

  // the land stands still: draw the shadows once, and again only when the light moves
  const gl = useThree((s) => s.gl);
  const shadowState = useMemo(() => ({ frames: 0, lastT: -1 }), []);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl]);

  useFrame(() => {
    const t = dusk();
    shadowState.frames++;
    if (shadowState.frames < 120 || Math.abs(t - shadowState.lastT) > 0.004) {
      gl.shadowMap.needsUpdate = true;
      shadowState.lastT = t;
    }
    const seg = t < 0.5 ? 0 : 1;
    const f = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
    const A = cols[seg];
    const B = cols[seg + 1];
    const KA = KEYS[seg];
    const KB = KEYS[seg + 1];
    const L = (a: number, b: number) => a + (b - a) * f;
    const C = (out: THREE.Color, a: THREE.Color, b: THREE.Color) => out.copy(a).lerp(b, f);

    C(skyUniforms.uTop.value, A.top, B.top);
    C(skyUniforms.uMid.value, A.mid, B.mid);
    C(skyUniforms.uHorizon.value, A.hor, B.hor);
    C(skyUniforms.uSunColor.value, A.sun, B.sun);
    skyUniforms.uStars.value = smoothstep(0.7, 1, t);

    const elev = THREE.MathUtils.degToRad(L(KA.elev, KB.elev));
    tmp.dir.set(SUN_X * Math.cos(elev), Math.sin(elev), SUN_Z * Math.cos(elev)).normalize();
    skyUniforms.uSunDir.value.copy(tmp.dir);

    fog.color.copy(skyUniforms.uHorizon.value).lerp(skyUniforms.uMid.value, t * 0.5).multiplyScalar(0.82);
    fog.near = L(KA.fogNear, KB.fogNear);
    fog.far = L(KA.fogFar, KB.fogFar);

    // the key light never dips below the land, it just fades and warms
    const lightElev = Math.max(elev, THREE.MathUtils.degToRad(6));
    tmp.lightDir.set(SUN_X * Math.cos(lightElev), Math.sin(lightElev), SUN_Z * Math.cos(lightElev)).normalize();

    if (sun.current) {
      // a fixed shadow frame over the whole land: nothing shimmers while the camera moves
      target.position.set(LAND_C.x, 4, LAND_C.z);
      sun.current.position.set(LAND_C.x, 4, LAND_C.z).addScaledVector(tmp.lightDir, 260);
      C(sun.current.color, A.light, B.light);
      sun.current.intensity = L(KA.li, KB.li);
    }
    if (hemi.current) {
      C(hemi.current.color, A.hemiSky, B.hemiSky);
      C(hemi.current.groundColor, A.hemiGround, B.hemiGround);
      hemi.current.intensity = L(KA.hi, KB.hi);
    }

    windowMat.emissiveIntensity = 0.12 + smoothstep(0.35, 0.85, t) * 2.6;
    for (const g of glowMats) g.emissiveIntensity = windowMat.emissiveIntensity * (g.userData.glowScale ?? 1);
    lampMat.emissiveIntensity = 0.5 + smoothstep(0.3, 0.85, t) * 5;
  });

  return (
    <>
      <primitive object={target} />
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        target={target}
        castShadow={shadows}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.09}
        shadow-camera-left={-165}
        shadow-camera-right={165}
        shadow-camera-top={165}
        shadow-camera-bottom={-165}
        shadow-camera-near={10}
        shadow-camera-far={560}
      />
    </>
  );
}

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Orbit-style camera for exploring the land: drag to turn, wheel / pinch to zoom,
 * click a place to fly there. Everything is damped so it always glides.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera as THREE.PerspectiveCamera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const st = useMemo(() => {
    const cur: View = { ...OVERVIEW, az: OVERVIEW.az - 0.7, el: 0.95, dist: 340 };
    return {
      cur,
      des: { ...OVERVIEW } as View,
      focus: null as string | null,
      overview: { ...OVERVIEW } as View,
      shift: 0,
      sheetShift: 0,
      tmp: new THREE.Vector3(),
      right: new THREE.Vector3(),
    };
  }, []);

  // fit the whole inhabited land to whatever screen this is
  useEffect(() => {
    const aspect = size.width / size.height;
    camera.fov = aspect < 0.8 ? 58 : aspect < 1.2 ? 50 : 40;
    camera.updateProjectionMatrix();
    const halfV = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    const portrait = aspect < 0.8;
    // fit width, and depth seen at the overview's elevation, whichever needs more room
    const fitW = LAND_HALF_W / Math.tan(halfH);
    const fitD = (LAND_HALF_D * Math.sin(OVERVIEW.el + 0.15)) / Math.tan(halfV) * 1.25;
    // on portrait screens show the heart of the land closer; drag to see the rest
    // ×1.15 leaves breathing room so the edge sites (the windmill) sit fully in frame
    const fit = (portrait ? Math.max(fitD * 0.95, 190) : Math.max(fitW, fitD)) * 1.15;
    st.overview = {
      ...OVERVIEW,
      dist: THREE.MathUtils.clamp(fit, 170, portrait ? 290 : 410),
      el: portrait ? 0.58 : aspect > 2 ? 0.34 : 0.4,
    };
    if (!st.focus) {
      st.des.dist = st.overview.dist;
      st.des.el = st.overview.el;
    }
  }, [camera, size, st]);

  // input
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const limits = () => {
      if (!st.focus) return { min: DIST_LIMITS.min, max: st.overview.dist * 1.12 };
      const base = PLACE_VIEWS[st.focus].dist;
      return { min: base * 0.6, max: base * 1.7 };
    };
    const touch = () => { world.lastInteraction = performance.now(); };

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture?.(e.pointerId);
      touch();
    };
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const before = Math.hypot(a.x - b.x, a.y - b.y);
        p.x = e.clientX;
        p.y = e.clientY;
        const [c, d] = [...pointers.values()];
        const after = Math.hypot(c.x - d.x, c.y - d.y);
        if (pinch && before > 0) {
          const l = limits();
          st.des.dist = THREE.MathUtils.clamp(st.des.dist * (before / after), l.min, l.max);
        }
        pinch = after;
        touch();
        return;
      }
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      st.des.az -= dx * 0.0042;
      st.des.el = THREE.MathUtils.clamp(st.des.el + dy * 0.003, 0.1, 1.2);
      touch();
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
    };
    const wheel = (e: WheelEvent) => {
      // only zoom while the world fills the screen; otherwise let the page scroll
      const top = el.getBoundingClientRect().top;
      if (Math.abs(top) > 2) return;
      const l = limits();
      const zoomingOut = e.deltaY > 0;
      if (!st.focus && zoomingOut && st.des.dist >= l.max - 0.5) return; // hand over to page scroll
      e.preventDefault();
      st.des.dist = THREE.MathUtils.clamp(st.des.dist * Math.exp(e.deltaY * 0.0012), l.min, l.max);
      touch();
    };
    const zoom = (e: Event) => {
      const dir = (e as CustomEvent<{ dir: number }>).detail.dir;
      const l = limits();
      st.des.dist = THREE.MathUtils.clamp(st.des.dist * (dir > 0 ? 0.75 : 1.33), l.min, l.max);
      touch();
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener(EV_ZOOM, zoom);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener(EV_ZOOM, zoom);
    };
  }, [gl, st]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);

    // react to a new focus: fly there, or back out to the overview
    if (world.focus !== st.focus) {
      st.focus = world.focus;
      const v = st.focus ? PLACE_VIEWS[st.focus] : null;
      if (v) {
        Object.assign(st.des, v);
      } else {
        const o = st.overview;
        Object.assign(st.des, { x: o.x, y: o.y, z: o.z, el: o.el, dist: o.dist });
      }
      // never spin the long way round
      st.des.az = st.cur.az + wrap(st.des.az - st.cur.az);
    }

    // a slow, living drift when nobody touches anything
    // when left alone, drift home to the composed view and sway gently around it
    const idle = performance.now() - world.lastInteraction > 9000;
    if (idle && !st.focus) {
      const sway = world.reduced ? 0 : Math.sin(clock.elapsedTime * 0.045) * 0.22;
      const goal = st.overview.az + sway;
      st.des.az += wrap(goal - st.des.az) * Math.min(1, dt * 0.35);
      st.des.el += (st.overview.el - st.des.el) * Math.min(1, dt * 0.35);
      st.des.dist += (st.overview.dist - st.des.dist) * Math.min(1, dt * 0.25);
    }

    const k = 1 - Math.exp(-dt * (world.reduced ? 8 : 2.1));
    const c = st.cur;
    const d = st.des;
    c.x += (d.x - c.x) * k;
    c.y += (d.y - c.y) * k;
    c.z += (d.z - c.z) * k;
    c.az += wrap(d.az - c.az) * k;
    c.el += (d.el - c.el) * k;
    c.dist += (d.dist - c.dist) * k;
    st.shift += ((st.focus ? 1 : 0) - st.shift) * k;
    st.sheetShift += ((world.sheet && !st.focus ? 1 : 0) - st.sheetShift) * k;

    world.dusk += (world.duskTarget - world.dusk) * (1 - Math.exp(-dt * 1.1));

    // frame the place beside the info panel (desktop) or above the sheet (mobile)
    st.right.set(Math.cos(c.az), 0, -Math.sin(c.az));
    // focus: frame the place left of the info panel
    // frame the land beside whichever panel is open: places on the right, menu sheets on the left
    const sign = world.panelSide === "left" ? -1 : 1;
    const side = world.mobile ? 0 : c.dist * (0.24 * st.shift * sign - 0.2 * st.sheetShift);
    const tx = c.x + st.right.x * side;
    const ty = c.y - (world.mobile ? c.dist * 0.22 * st.shift : 0);
    const tz = c.z + st.right.z * side;

    const t = clock.elapsedTime;
    const breathe = world.reduced ? 0 : 1;
    st.tmp.set(
      tx + Math.sin(c.az) * Math.cos(c.el) * c.dist,
      ty + Math.sin(c.el) * c.dist + Math.sin(t * 0.21) * 0.25 * breathe,
      tz + Math.cos(c.az) * Math.cos(c.el) * c.dist,
    );
    const floor = height(st.tmp.x, st.tmp.z) + 3;
    if (st.tmp.y < floor) st.tmp.y = floor;

    camera.position.copy(st.tmp);
    camera.lookAt(tx, ty, tz);
    world.target.set(c.x, c.y, c.z);
  });

  return null;
}
