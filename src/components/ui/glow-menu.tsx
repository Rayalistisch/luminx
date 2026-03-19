import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Layers,
  User,
  Mail,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutGrid,
  Layers,
  User,
  Mail,
};

interface MenuItem {
  icon: string;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
}

interface GlowMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuItem[];
  activeItem?: string;
}

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
      scale: { duration: 0.5, type: "spring" as const, stiffness: 300, damping: 25 },
    },
  },
};

const sharedTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

export default function GlowMenu({
  className,
  items,
  activeItem,
}: GlowMenuProps) {
  return (
    <motion.nav
      className={cn(
        "px-2 py-1 rounded-lg bg-[rgba(20,20,20,0.85)] backdrop-blur-xl border border-[rgba(255,255,255,0.06)] shadow-[0_4px_24px_rgba(0,0,0,0.25)] relative overflow-visible",
        className
      )}
      initial="initial"
      whileHover="hover"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <ul className="flex items-center gap-2 relative z-10 list-none m-0 p-0">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = item.label === activeItem;

          return (
            <motion.li key={item.label} className="relative">
              <a href={item.href} className="block w-full no-underline">
                <motion.div
                  className="block rounded-xl overflow-visible group relative"
                  style={{ perspective: "600px" }}
                  whileHover="hover"
                  initial="initial"
                >
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none"
                    variants={glowVariants}
                    animate={isActive ? "hover" : "initial"}
                    style={{
                      background: item.gradient,
                      opacity: isActive ? 1 : 0,
                      borderRadius: "16px",
                    }}
                  />
                  <motion.div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent rounded-xl transition-colors",
                      isActive
                        ? "text-white"
                        : "text-[rgba(255,255,255,0.5)] group-hover:text-white"
                    )}
                    variants={itemVariants}
                    transition={sharedTransition}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center bottom",
                    }}
                  >
                    <span
                      className={cn(
                        "transition-colors duration-300",
                        isActive ? item.iconColor : "text-white"
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.div>
                  <motion.div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent rounded-xl transition-colors",
                      isActive
                        ? "text-white"
                        : "text-[rgba(255,255,255,0.5)] group-hover:text-white"
                    )}
                    variants={backVariants}
                    transition={sharedTransition}
                    style={{
                      transformStyle: "preserve-3d",
                      transformOrigin: "center top",
                      rotateX: 90,
                    }}
                  >
                    <span
                      className={cn(
                        "transition-colors duration-300",
                        isActive ? item.iconColor : "text-white"
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </motion.div>
                </motion.div>
              </a>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
