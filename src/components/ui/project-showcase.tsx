"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ArrowUpRight } from "lucide-react"

interface Project {
  title: string
  description: string
  year: string
  link: string
  image: string
  tags: string[]
}

const projects: Project[] = [
  {
    title: "GSM Team",
    description: "WordPress → Shopify migratie met behoud van SEO-waarde en 40% snellere laadtijd.",
    year: "2024",
    link: "/cases/migraties",
    image: "/images/website-gsmteam.png",
    tags: ["Migratie"],
  },
  {
    title: "ReservaX / ActifAid",
    description: "Custom afsprakensysteem dat handmatige planning volledig vervangt.",
    year: "2024",
    link: "/cases/custom-applicaties",
    image: "/images/reservaxactifaid.png",
    tags: ["Websites", "Procesautomation"],
  },
  {
    title: "Ascendio",
    description: "AI-gedreven content clusters die organisch verkeer met 3× verhoogden.",
    year: "2023",
    link: "/cases/digital-marketing",
    image: "/images/ascendio seo automation.jpg",
    tags: ["SEO", "AI Automation"],
  },
]

export function ProjectShowcase() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor

    const animate = () => {
      setSmoothPosition((prev) => ({
        x: lerp(prev.x, mousePosition.x, 0.15),
        y: lerp(prev.y, mousePosition.y, 0.15),
      }))
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [mousePosition])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index)
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setIsVisible(false)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full"
    >
      {/* Floating image preview */}
      <div
        className="pointer-events-none fixed z-50 overflow-hidden rounded-xl shadow-2xl"
        style={{
          left: containerRef.current?.getBoundingClientRect().left ?? 0,
          top: containerRef.current?.getBoundingClientRect().top ?? 0,
          transform: `translate3d(${smoothPosition.x + 24}px, ${smoothPosition.y - 110}px, 0)`,
          opacity: isVisible ? 1 : 0,
          scale: isVisible ? "1" : "0.85",
          transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), scale 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="relative w-[280px] h-[180px] rounded-xl overflow-hidden bg-neutral-100">
          {projects.map((project, index) => (
            <img
              key={project.title}
              src={project.image}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out"
              style={{
                opacity: hoveredIndex === index ? 1 : 0,
                scale: hoveredIndex === index ? "1" : "1.08",
                filter: hoveredIndex === index ? "none" : "blur(8px)",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      </div>

      {/* Project list */}
      <div>
        {projects.map((project, index) => (
          <a
            key={project.title}
            href={project.link}
            className="group block"
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative py-6 border-t border-black/10 transition-all duration-300 ease-out">
              {/* Hover background */}
              <div
                style={{
                  opacity: hoveredIndex === index ? 1 : 0,
                  transform: hoveredIndex === index ? "scale(1)" : "scale(0.97)",
                  transition: "opacity 0.3s ease, transform 0.3s ease",
                  position: "absolute",
                  inset: 0,
                  marginLeft: "-1rem",
                  marginRight: "-1rem",
                  borderRadius: "0.5rem",
                  background: "rgba(0,0,0,0.03)",
                }}
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="inline-flex items-center gap-2">
                    <h3 className="font-semibold text-lg tracking-tight text-[#0A0A0A] relative">
                      <span className="relative">
                        {project.title}
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            bottom: "-2px",
                            height: "1px",
                            background: "#0A0A0A",
                            width: hoveredIndex === index ? "100%" : "0%",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </span>
                    </h3>
                    <ArrowUpRight
                      className="w-4 h-4 text-[#8A8A8A]"
                      style={{
                        opacity: hoveredIndex === index ? 1 : 0,
                        transform: hoveredIndex === index
                          ? "translate(0, 0)"
                          : "translate(-6px, 6px)",
                        transition: "opacity 0.3s ease, transform 0.3s ease",
                      }}
                    />
                  </div>

                  <p
                    className="text-sm mt-1 leading-relaxed transition-colors duration-300"
                    style={{
                      color: hoveredIndex === index ? "#0A0A0A" : "#8A8A8A",
                    }}
                  >
                    {project.description}
                  </p>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full border border-black/10 text-[#8A8A8A]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <span
                  className="text-xs font-mono tabular-nums transition-colors duration-300 mt-1"
                  style={{
                    color: hoveredIndex === index ? "#0A0A0A" : "#8A8A8A",
                  }}
                >
                  {project.year}
                </span>
              </div>
            </div>
          </a>
        ))}
        <div className="border-t border-black/10" />
      </div>
    </div>
  )
}
