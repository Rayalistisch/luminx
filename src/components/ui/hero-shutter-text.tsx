import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroShutterTextProps {
  lines?: { text: string; gradient?: boolean }[];
  className?: string;
}

export default function HeroShutterText({
  lines = [
    { text: "Meetbare" },
    { text: "Groei.", gradient: true },
  ],
  className = "",
}: HeroShutterTextProps) {
  const [count] = useState(0);

  return (
    <div
      className={cn("relative w-full flex flex-col items-center", className)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          className="flex flex-col items-center w-full"
        >
          {lines.map((line, lineIndex) => {
            const characters = line.text.split("");
            const charOffset = lines
              .slice(0, lineIndex)
              .reduce((sum, l) => sum + l.text.length, 0);

            return (
              <div
                key={lineIndex}
                className="flex flex-wrap justify-center items-center w-full"
              >
                {characters.map((char, i) => {
                  const globalIndex = charOffset + i;

                  return (
                    <div
                      key={i}
                      className="relative overflow-hidden"
                      style={{ padding: "0 0.1vw" }}
                    >
                      {/* Main Character */}
                      <motion.span
                        initial={{ opacity: 0, filter: "blur(10px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        transition={{
                          delay: globalIndex * 0.04 + 0.3,
                          duration: 0.8,
                        }}
                        className={cn(
                          "leading-none font-black tracking-tighter inline-block",
                          line.gradient
                            ? "bg-gradient-to-br from-[#FFD6E8] to-[#C8E7F5] bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
                            : "text-white"
                        )}
                        style={{
                          fontSize: "clamp(2.7rem, 8vw, 8rem)",
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>

                      {/* Top Slice Layer */}
                      <motion.span
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: "100%", opacity: [0, 1, 0] }}
                        transition={{
                          duration: 0.7,
                          delay: globalIndex * 0.04,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 leading-none font-black text-[#FFD6E8] z-10 pointer-events-none"
                        style={{
                          fontSize: "clamp(2.7rem, 8vw, 8rem)",
                          fontFamily: "'Syne', sans-serif",
                          clipPath: "polygon(0 0, 100% 0, 100% 35%, 0 35%)",
                        }}
                      >
                        {char}
                      </motion.span>

                      {/* Middle Slice Layer */}
                      <motion.span
                        initial={{ x: "100%", opacity: 0 }}
                        animate={{ x: "-100%", opacity: [0, 1, 0] }}
                        transition={{
                          duration: 0.7,
                          delay: globalIndex * 0.04 + 0.1,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 leading-none font-black text-zinc-200 z-10 pointer-events-none"
                        style={{
                          fontSize: "clamp(2.7rem, 8vw, 8rem)",
                          fontFamily: "'Syne', sans-serif",
                          clipPath:
                            "polygon(0 35%, 100% 35%, 100% 65%, 0 65%)",
                        }}
                      >
                        {char}
                      </motion.span>

                      {/* Bottom Slice Layer */}
                      <motion.span
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: "100%", opacity: [0, 1, 0] }}
                        transition={{
                          duration: 0.7,
                          delay: globalIndex * 0.04 + 0.2,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 leading-none font-black text-[#C8E7F5] z-10 pointer-events-none"
                        style={{
                          fontSize: "clamp(2.7rem, 8vw, 8rem)",
                          fontFamily: "'Syne', sans-serif",
                          clipPath:
                            "polygon(0 65%, 100% 65%, 100% 100%, 0 100%)",
                        }}
                      >
                        {char}
                      </motion.span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
