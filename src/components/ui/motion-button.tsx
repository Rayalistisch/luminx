"use client";

import type React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "primary" | "secondary";
  classes?: string;
  animate?: boolean;
  delay?: number;
}

export default function MotionButton({
  label,
  variant = "primary",
  classes,
  className,
  animate = true,
  delay = 0,
  type,
  ...props
}: MotionButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type={type ?? "button"}
      className={cn(
        "group relative inline-flex h-[52px] min-w-[220px] shrink-0 cursor-pointer select-none items-center justify-center overflow-hidden rounded-full p-1 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] outline-none transition-colors duration-500",
        isPrimary ? "bg-white text-black" : "bg-transparent text-white",
        className,
        classes
      )}
      style={animate ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
            "absolute left-1 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full transition-all duration-500",
            isPrimary ? "bg-black" : "bg-white",
            "group-hover:w-[calc(100%-8px)]"
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 transition-transform duration-500 group-hover:translate-x-1",
          isPrimary ? "text-white" : "text-black"
        )}
      >
        <ArrowRight size={18} />
      </span>
      <span
        className={cn(
          "relative z-10 whitespace-nowrap translate-x-6 transition-colors duration-500",
          isPrimary ? "group-hover:text-white" : "group-hover:text-black"
        )}
      >
        {label}
      </span>
    </button>
  );
}
