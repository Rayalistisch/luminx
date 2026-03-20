import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Layers,
  User,
  Mail,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutGrid,
  Layers,
  User,
  Mail,
};

interface DropdownGroup {
  category: string;
  items: { label: string; href: string }[];
}

interface MenuItem {
  icon: string;
  label: string;
  href: string;
  gradient: string;
  iconColor: string;
  dropdown?: DropdownGroup[];
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
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = (label: string, hasDropdown: boolean) => {
    if (!hasDropdown) return;
    clearTimeout(timeoutRef.current);
    setOpenDropdown(label);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  const handleDropdownEnter = () => {
    clearTimeout(timeoutRef.current);
  };

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 100);
  };

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
          const hasDropdown = !!item.dropdown;
          const isOpen = openDropdown === item.label;

          return (
            <motion.li
              key={item.label}
              className="relative"
              onMouseEnter={() => handleEnter(item.label, hasDropdown)}
              onMouseLeave={handleLeave}
            >
              <a
                href={hasDropdown ? undefined : item.href}
                className="block w-full no-underline"
                onClick={hasDropdown ? (e) => e.preventDefault() : undefined}
              >
                <motion.div
                  className="block rounded-xl overflow-visible group relative"
                  style={{ perspective: "600px" }}
                  whileHover="hover"
                  initial="initial"
                >
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none"
                    variants={glowVariants}
                    animate={isActive || isOpen ? "hover" : "initial"}
                    style={{
                      background: item.gradient,
                      opacity: isActive || isOpen ? 1 : 0,
                      borderRadius: "16px",
                    }}
                  />
                  <motion.div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent rounded-xl transition-colors",
                      isActive || isOpen
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
                        isActive || isOpen ? item.iconColor : "text-white"
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                    {hasDropdown && (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                      />
                    )}
                  </motion.div>
                  <motion.div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent rounded-xl transition-colors",
                      isActive || isOpen
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
                        isActive || isOpen ? item.iconColor : "text-white"
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                    {hasDropdown && (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )}
                      />
                    )}
                  </motion.div>
                </motion.div>
              </a>

              <AnimatePresence>
                {hasDropdown && isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50"
                    onMouseEnter={handleDropdownEnter}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <div className="bg-[rgba(16,16,16,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 min-w-[520px]">
                      <div className="grid grid-cols-3 gap-6">
                        {item.dropdown!.map((group) => (
                          <div key={group.category}>
                            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-3">
                              {group.category}
                            </span>
                            <ul className="list-none m-0 p-0 space-y-1">
                              {group.items.map((link) => (
                                <li key={link.href}>
                                  <a
                                    href={link.href}
                                    className="block px-3 py-2 rounded-lg text-sm text-white/60 no-underline hover:text-white hover:bg-white/5 transition-colors duration-150"
                                  >
                                    {link.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
