"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, Repeat2, CalendarDays, TrendingUp } from "lucide-react"

const cases = [
  {
    id: 1,
    icon: Repeat2,
    title: "GSM Team",
    description:
      "WordPress → Shopify migratie met behoud van SEO-waarde en 40% snellere laadtijd.",
    image: "/images/website-gsmteam.png",
    tags: ["Migratie"],
    link: "/cases/migraties",
    year: "2024",
  },
  {
    id: 2,
    icon: CalendarDays,
    title: "ReservaX / ActifAid",
    description:
      "Custom afsprakensysteem dat handmatige planning volledig vervangt.",
    image: "/images/reservaxactifaid.png",
    tags: ["Websites", "Procesautomation"],
    link: "/cases/custom-applicaties",
    year: "2024",
  },
  {
    id: 3,
    icon: TrendingUp,
    title: "Ascendio",
    description:
      "AI-gedreven content clusters die organisch verkeer met 3× verhoogden.",
    image: "/images/ascendio seo automation.jpg",
    tags: ["SEO", "AI Automation"],
    link: "/cases/digital-marketing",
    year: "2023",
  },
]

export function CaseFeatures() {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const listRef = useRef<HTMLDivElement | null>(null)

  // Tick progress forward
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 1))
    }, 100)
    return () => clearInterval(id)
  }, [])

  // Advance on completion
  useEffect(() => {
    if (progress < 100) return
    const t = setTimeout(() => {
      setCurrent((c) => (c + 1) % cases.length)
      setProgress(0)
    }, 200)
    return () => clearTimeout(t)
  }, [progress])

  // Scroll active item into view on mobile
  useEffect(() => {
    const el = itemRefs.current[current]
    const container = listRef.current
    if (!el || !container) return
    container.scrollTo({
      left:
        el.offsetLeft -
        (container.getBoundingClientRect().width -
          el.getBoundingClientRect().width) /
          2,
      behavior: "smooth",
    })
  }, [current])

  const handleClick = (index: number) => {
    setCurrent(index)
    setProgress(0)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
      {/* ── Left: case list ── */}
      <div
        ref={listRef}
        className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden order-2 lg:order-1"
      >
        {cases.map((c, i) => {
          const Icon = c.icon
          const isActive = current === i

          return (
            <div
              key={c.id}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className="flex-shrink-0 cursor-pointer select-none"
              onClick={() => handleClick(i)}
            >
              <div
                className={`flex flex-col lg:flex-row items-start gap-4 p-4 w-[260px] lg:w-auto rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] border border-black/[0.06]"
                    : "border border-transparent"
                }`}
              >
                {/* Icon */}
                <div
                  className={`p-3 rounded-full hidden md:flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isActive
                      ? "bg-[#0A0A0A] text-white"
                      : "bg-black/5 text-[#8A8A8A]"
                  }`}
                >
                  <Icon size={18} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className={`font-semibold text-base leading-tight transition-colors duration-300 ${
                        isActive ? "text-[#0A0A0A]" : "text-[#8A8A8A]"
                      }`}
                    >
                      {c.title}
                    </h3>
                    <span className="text-xs font-mono text-[#8A8A8A]/60 tabular-nums">
                      {c.year}
                    </span>
                  </div>

                  <p
                    className={`text-sm leading-relaxed transition-colors duration-300 ${
                      isActive ? "text-[#0A0A0A]/65" : "text-[#8A8A8A]/70"
                    }`}
                  >
                    {c.description}
                  </p>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {c.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors duration-300 ${
                          isActive
                            ? "border-black/15 text-[#0A0A0A]/60"
                            : "border-black/8 text-[#8A8A8A]"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-px bg-black/8 rounded-full overflow-hidden">
                    {isActive && (
                      <motion.div
                        className="h-full bg-[#0A0A0A] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1, ease: "linear" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Right: image ── */}
      <div className="order-1 lg:order-2">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -28 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="relative rounded-2xl overflow-hidden border border-black/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.10)] bg-[#f0f2f5]">
            <img
              src={cases[current].image}
              alt={cases[current].title}
              className="w-full h-[340px] lg:h-[420px] object-contain object-top"
            />
            {/* Bottom gradient + label */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <a
                href={cases[current].link}
                className="inline-flex items-center gap-1.5 group"
              >
                <span className="font-semibold text-white text-base leading-tight">
                  {cases[current].title}
                </span>
                <ArrowUpRight
                  size={15}
                  className="text-white/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <div className="flex gap-2 mt-1">
                {cases[current].tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-white/50 font-mono uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
