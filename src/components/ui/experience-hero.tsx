"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { ArrowUpRight, MessageCircle, SquarePen, X } from "lucide-react";
import * as THREE from "three";
import gsap from "gsap";

const LiquidBackground = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useFrame((state) => {
    const material = meshRef.current?.material as THREE.ShaderMaterial | undefined;
    if (!material?.uniforms) return;

    material.uniforms.uTime.value = state.clock.getElapsedTime();
    material.uniforms.uMouse.value.lerp(state.mouse, 0.05);
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent
        uniforms={uniforms}
        vertexShader={
          "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
        }
        fragmentShader={`
          uniform float uTime; uniform vec2 uMouse; varying vec2 vUv;
          void main() {
            vec2 uv = vUv; float t = uTime * 0.15;
            vec2 m = uMouse * 0.1;
            float color = smoothstep(0.0, 1.0, (sin(uv.x * 8.0 + t + m.x * 12.0) + sin(uv.y * 6.0 - t + m.y * 12.0)) * 0.5 + 0.5);
            gl_FragColor = vec4(mix(vec3(0.005), vec3(0.05), color), 1.0);
          }
        `}
      />
    </mesh>
  );
};

const Monolith = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.25;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[13, 1]} />
        <MeshDistortMaterial
          color="#0a0a0a"
          speed={4}
          distort={0.4}
          roughness={0.05}
          metalness={1}
        />
      </mesh>
    </Float>
  );
};

export default function ExperienceHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const [showContactChoice, setShowContactChoice] = React.useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        revealRef.current,
        { filter: "blur(30px)", opacity: 0, scale: 1.02 },
        { filter: "blur(0px)", opacity: 1, scale: 1, duration: 2.2, ease: "expo.out" }
      );

      gsap.from(".command-cell", {
        x: 60,
        opacity: 0,
        stagger: 0.1,
        duration: 1.5,
        ease: "power4.out",
        delay: 1,
        clearProps: "all",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!showContactChoice) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowContactChoice(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showContactChoice]);

  const openContactOverlay = () => {
    setShowContactChoice(false);
    const overlay = document.getElementById("contact-overlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  };

  const openWhatsApp = () => {
    setShowContactChoice(false);
    const text = encodeURIComponent("Hi Luminx, ik wil graag een afspraak inplannen.");
    window.open(`https://wa.me/31613698596?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      data-bg-color="#020202"
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#020202] selection:bg-white selection:text-black"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 60], fov: 35 }}>
          <ambientLight intensity={0.4} />
          <spotLight position={[50, 50, 50]} intensity={3} />
          <LiquidBackground />
          <Monolith />
        </Canvas>
      </div>

      <div
        ref={containerRef}
        className="relative z-10 min-h-screen w-full p-[clamp(2rem,4vw,5rem)]"
      >
        <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-between pb-12 md:min-h-[calc(100vh-7rem)] md:pb-8">
          <div className="flex items-center gap-3">
            <div className="relative h-2.5 w-2.5 rounded-full bg-white">
              <div className="absolute inset-0 animate-ping rounded-full bg-white opacity-30" />
            </div>
          </div>
        </div>

        <div
          ref={revealRef}
          className="absolute left-1/2 top-1/2 z-10 flex w-[min(92vw,64rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-y-[clamp(2rem,3vw,3rem)] text-center lg:w-[min(72vw,62rem)] lg:pr-[clamp(14rem,20vw,20rem)] xl:w-[min(70vw,64rem)] 2xl:w-[min(68vw,64rem)] 2xl:pr-0"
        >
          <h1 className="text-[clamp(3.5rem,9.5vw,11.5rem)] font-black leading-[0.87] tracking-tighter text-white uppercase">
            CREATIVE <br /> <span className="text-outline">AGENCY</span>
          </h1>
          <p className="mt-[clamp(1.5rem,2vw,2rem)] mb-[clamp(2rem,3vw,3.5rem)] max-w-md font-mono text-[clamp(9px,0.75vw,11px)] uppercase leading-relaxed tracking-[0.35em] text-white/40">
            WE ENGINEER AUTOMATIONS AND CAMPAIGNS THAT DELIVER ON BUSINESS NEEDS
          </p>
          <div className="pointer-events-auto flex flex-col items-center gap-3 md:flex-row md:justify-center">
            <button
              type="button"
              data-seoscan-open
              className="group relative inline-flex h-[clamp(44px,3.5vw,52px)] min-w-[clamp(200px,16vw,240px)] shrink-0 select-none items-center justify-start overflow-hidden rounded-xl bg-white pl-10 pr-24 text-sm font-medium text-black transition-all duration-500 hover:pl-14 hover:pr-12"
            >
              <span className="relative z-10 inline-block whitespace-nowrap translate-x-4 font-sans text-[12px] font-semibold uppercase tracking-[0.12em] transition-all duration-500 group-hover:translate-x-4">
                Gratis SEO Check
              </span>
              <div className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-black text-white transition-all duration-500 group-hover:right-[calc(100%-48px)] group-hover:rotate-0">
                <ArrowUpRight size={16} />
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowContactChoice(true)}
              className="inline-flex h-[clamp(44px,3.5vw,52px)] min-w-[clamp(180px,15vw,220px)] shrink-0 select-none items-center justify-center rounded-xl border border-white bg-transparent px-6 font-sans text-[clamp(10px,0.8vw,12px)] font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10"
            >
              Maak een afspraak
            </button>
          </div>
        </div>

        <div className="z-20 mt-10 hidden w-full flex-col justify-center gap-[clamp(0.75rem,1vw,1rem)] md:ml-auto md:mt-8 md:flex md:w-80 lg:absolute lg:right-[clamp(1.5rem,3vw,5rem)] lg:top-1/2 lg:mt-0 lg:w-[clamp(16rem,18vw,24rem)] lg:-translate-y-1/2">
          {[
            { id: "001", title: "AVAILABILITY", val: "Open", type: "progress" },
            { id: "002", title: "STUDIO STATS", val: "20+ Wins", type: "data" },
            { id: "003", title: "EXPERTISE", val: "Creative Dev", type: "text" },
          ].map((item) => (
            <div
              key={item.id}
              className="command-cell glass-panel block p-6 sm:p-7"
              style={{ backgroundColor: "rgba(20, 20, 20, 0.18)" }}
            >
              <span className="mb-3 block font-mono text-[9px] uppercase tracking-widest text-white/25">
                {item.id} // {item.title}
              </span>

              {item.type === "progress" ? (
                <div className="mt-2 flex items-end justify-between">
                  <h4 className="text-2xl font-bold tracking-tighter text-white sm:text-3xl">
                    {item.val}
                  </h4>
                  <div className="h-[2px] w-20 overflow-hidden rounded-full bg-white/5">
                    <div className="animate-loading h-full w-[60%] bg-white" />
                  </div>
                </div>
              ) : item.type === "data" ? (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex justify-between font-mono text-[10px] text-white/50">
                    <span>Drum Awards</span>
                    <span>2024-25</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between font-mono text-[10px] text-white/50">
                    <span>Retention Rate</span>
                    <span>98.2%</span>
                  </div>
                </div>
              ) : (
                <h3 className="mt-3 text-sm leading-snug text-white/70">
                  Transforming campaigns into <span className="italic text-white">Business campaigns</span>.
                </h3>
              )}
            </div>
          ))}
        </div>
      </div>

      {showContactChoice && (
        <div
          className="fixed inset-0 z-[1000001] flex items-center justify-center bg-black/75 p-8 backdrop-blur-sm md:p-10"
          onClick={() => setShowContactChoice(false)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-[#0b0b0b]/95 p-9 text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)] md:p-10"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Kies contactmethode"
          >
            <button
              type="button"
              aria-label="Popup sluiten"
              onClick={() => setShowContactChoice(false)}
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-white/35 hover:text-white"
            >
              <X size={16} />
            </button>

            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">Afspraak</p>
            <h3 className="pr-14 text-3xl font-black tracking-tight text-white">Kies je kanaal</h3>
            <p className="mt-4 text-base leading-relaxed text-white/60">Snel via WhatsApp of liever via het contactformulier.</p>

            <div className="mt-9 grid gap-5">
              <button
                type="button"
                onClick={openWhatsApp}
                className="group inline-flex h-16 items-center justify-between rounded-xl border border-white/20 bg-white px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-black transition hover:bg-white/90"
              >
                <span>WhatsApp</span>
                <MessageCircle size={16} />
              </button>

              <button
                type="button"
                onClick={openContactOverlay}
                className="group inline-flex h-16 items-center justify-between rounded-xl border border-white/20 bg-transparent px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition hover:border-white/35 hover:bg-white/5"
              >
                <span>Contactformulier</span>
                <SquarePen size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
