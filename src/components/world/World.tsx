import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, TiltShift2, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { Sky } from "./Sky";
import { Paths, Road, Terrain } from "./Terrain";
import { Snow } from "./Snow";
import { Trees } from "./Trees";
import { Landmarks } from "./Buildings";
import { Fireflies } from "./Fireflies";
import { Stream } from "./Stream";
import { Leaves } from "./Leaves";
import { Details } from "./Details";
import { TwenteLandmarks } from "./Twente";
import { OudeMarkt } from "./OudeMarkt";
import { StaticBatch } from "./StaticBatch";
import { Atmosphere, CameraRig } from "./Atmosphere";
import { HoverTip } from "./Labels";
import { EV_DUSK, EV_SELECT, EV_VIEW, world } from "./store";

type Quality = {
  mobile: boolean;
  dpr: [number, number];
  shadows: boolean;
  shadowSize: number;
  trees: number;
  segments: number;
  motes: number;
  post: boolean;
};

function detectQuality(): Quality {
  const mobile = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
  const lowMem = ((navigator as any).deviceMemory ?? 8) <= 4;
  if (mobile || lowMem) {
    return { mobile: true, dpr: [1, 1.5], shadows: true, shadowSize: 2048, trees: 900, segments: 130, motes: 600, post: true };
  }
  return { mobile: false, dpr: [1, 1.5], shadows: true, shadowSize: 4096, trees: 2200, segments: 220, motes: 1000, post: true };
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Tell the page the land is drawn, after a few real frames. */
function ReadySignal() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current++;
    if (frames.current === 4) window.dispatchEvent(new CustomEvent("luminx:world-ready"));
  });
  return null;
}

function Effects({ mobile }: { mobile: boolean }) {
  return (
    <EffectComposer multisampling={mobile ? 0 : 2} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.92} luminanceSmoothing={0.25} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {/* diorama focus: the middle band stays sharp, top and bottom soften */}
      <TiltShift2 blur={0.1} taper={0.75} start={[0, 0.5]} end={[1, 0.5]} samples={mobile ? 8 : 14} />
      <Vignette offset={0.28} darkness={0.5} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.05} />
    </EffectComposer>
  );
}

export default function World() {
  const [supported] = useState(webglAvailable);
  const quality = useMemo(detectQuality, []);
  // a fixed, sensible resolution: no mid-session buffer reallocations
  const dpr = Math.min(window.devicePixelRatio || 1, quality.dpr[1]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    world.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = document.querySelector<HTMLElement>("[data-world]");
    const onSelect = (e: Event) => {
      const id = (e as CustomEvent<{ id: string | null }>).detail.id;
      world.focus = id;
      world.panelSide = "right";
      if (id) world.sheet = false;
      world.lastInteraction = performance.now();
    };
    const onView = (e: Event) => {
      const d = (e as CustomEvent<{ id: string | null; sheet: boolean }>).detail;
      world.focus = d.id;
      world.sheet = d.sheet;
      world.panelSide = "left";
      world.lastInteraction = performance.now();
    };
    const onDusk = (e: Event) => {
      world.duskTarget = (e as CustomEvent<{ on: boolean }>).detail.on ? 1 : 0;
    };
    const onResize = () => { world.mobile = window.innerWidth <= 820; };
    let inView = true;
    const sync = () => setRunning(inView && !document.hidden);
    const io = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    if (stage) io.observe(stage);

    onResize();
    window.addEventListener(EV_SELECT, onSelect);
    window.addEventListener(EV_VIEW, onView);
    window.addEventListener(EV_DUSK, onDusk);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      window.removeEventListener(EV_SELECT, onSelect);
      window.removeEventListener(EV_VIEW, onView);
      window.removeEventListener(EV_DUSK, onDusk);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    if (!supported) {
      document.documentElement.classList.add("lx-no3d");
      window.dispatchEvent(new CustomEvent("luminx:world-ready"));
    }
  }, [supported]);

  if (!supported) return null;

  return (
    <Canvas
      className="lx-canvas"
      dpr={dpr}
      shadows={quality.shadows ? { type: THREE.PCFShadowMap } : false}
      frameloop={running ? "always" : "never"}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 42, near: 2, far: 1300, position: [0, 200, 300] }}
      aria-hidden="true"
      onCreated={({ gl }) => { if (import.meta.env.DEV) (window as any).__lxgl = gl; }}
    >
      <Atmosphere shadows={quality.shadows} shadowSize={quality.shadowSize} />
      <Sky />
      <Terrain segments={quality.segments} />
      <Road />
      <Paths />
      <Trees max={quality.trees} />
      <StaticBatch><Stream detail={!quality.mobile} /></StaticBatch>
      <Snow perZone={quality.mobile ? 350 : 650} />
      <StaticBatch><Details mobile={quality.mobile} maxTrees={quality.trees} /></StaticBatch>
      <Leaves count={quality.mobile ? 140 : 280} maxTrees={quality.trees} />
      <Landmarks lights={!quality.mobile} />
      <StaticBatch><TwenteLandmarks /></StaticBatch>
      <StaticBatch><OudeMarkt /></StaticBatch>
      <Fireflies count={quality.motes} />
      <HoverTip />
      <CameraRig />
      <ReadySignal />
      {quality.post && <Effects mobile={quality.mobile} />}
    </Canvas>
  );
}
