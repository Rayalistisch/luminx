import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface DropdownGroup {
  category: string;
  items: { label: string; href: string }[];
}

interface MenuItem {
  label: string;
  href: string;
  dropdown?: DropdownGroup[];
}

interface GlowMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuItem[];
  activeItem?: string;
}

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
    <nav
      className={cn(
        "px-1.5 py-1.5 rounded-full bg-[rgba(20,20,20,0.85)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_4px_24px_rgba(0,0,0,0.25)] relative overflow-visible",
        className
      )}
      style={{ fontFamily: "'Syne', sans-serif" }}
    >
      <ul className="flex items-center gap-1 relative z-10 list-none m-0 p-0">
        {items.map((item) => {
          const isActive = item.label === activeItem;
          const hasDropdown = !!item.dropdown;
          const isOpen = openDropdown === item.label;

          return (
            <li
              key={item.label}
              className="relative"
              onMouseEnter={() => handleEnter(item.label, hasDropdown)}
              onMouseLeave={handleLeave}
            >
              <a
                href={hasDropdown ? undefined : item.href}
                onClick={hasDropdown ? (e) => e.preventDefault() : undefined}
                className={cn(
                  "group flex items-center gap-1.5 px-4 py-2 rounded-full no-underline transition-colors duration-200",
                  isActive || isOpen ? "text-white" : "text-[rgba(255,255,255,0.55)] hover:text-white"
                )}
              >
                <span className="relative text-[0.72rem] font-bold uppercase tracking-[0.14em]">
                  {item.label}
                  <span
                    className={cn(
                      "absolute left-0 -bottom-1 h-px bg-[#C4972A] transition-all duration-300 ease-out",
                      isActive || isOpen ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </span>
                {hasDropdown && (
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                )}
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
                            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">
                              {group.category}
                            </span>
                            <ul className="list-none m-0 p-0 space-y-1">
                              {group.items.map((link) => (
                                <li key={link.href}>
                                  <a
                                    href={link.href}
                                    className="block px-3 py-2 rounded-lg text-sm text-white/60 no-underline hover:text-white hover:bg-white/5 transition-colors duration-150"
                                    style={{ fontFamily: "'Inter', sans-serif" }}
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
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
