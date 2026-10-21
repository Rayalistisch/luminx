import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Search,
  Megaphone,
  Share2,
  Mail,
  Globe,
  ShoppingBag,
  Compass,
  Sparkles,
  Tag,
  BarChart3,
  ShieldCheck,
  Workflow,
} from "lucide-react";

interface DropdownGroup {
  category: string;
  items: { label: string; href: string }[];
}

interface MenuItem {
  label: string;
  href: string;
  dropdown?: DropdownGroup[];
  mega?: boolean;
}

interface GlowMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuItem[];
  activeItem?: string;
}

// Mega-menu content for "Diensten" (defined here because icons are React nodes
// and can't be passed as serialisable props from the Astro island host).
const MEGA = {
  main: [
    { icon: <Search size={21} strokeWidth={1.75} />, title: "SEO", desc: "Gevonden worden in Google", href: "/diensten/seo" },
    { icon: <Megaphone size={21} strokeWidth={1.75} />, title: "SEA — Google Ads", desc: "Direct bovenaan adverteren", href: "/diensten/sea" },
    { icon: <Share2 size={21} strokeWidth={1.75} />, title: "Social Advertising", desc: "Adverteren op Meta & LinkedIn", href: "/diensten/social-advertising" },
    { icon: <Mail size={21} strokeWidth={1.75} />, title: "E-mailmarketing", desc: "Terugkerende omzet uit je lijst", href: "/diensten/emailmarketing" },
    { icon: <Globe size={21} strokeWidth={1.75} />, title: "Websites", desc: "Sites die converteren", href: "/diensten/websites" },
    { icon: <ShoppingBag size={21} strokeWidth={1.75} />, title: "Webshops", desc: "Online verkopen", href: "/diensten/webshops" },
  ],
  side: {
    title: "Strategie & data",
    items: [
      { icon: <Compass size={16} strokeWidth={1.9} />, label: "Strategie", href: "/diensten/strategy" },
      { icon: <Sparkles size={16} strokeWidth={1.9} />, label: "GEO — AI-zichtbaarheid", href: "/diensten/geo" },
      { icon: <Tag size={16} strokeWidth={1.9} />, label: "Google Tag Manager", href: "/diensten/google-tag-manager" },
      { icon: <BarChart3 size={16} strokeWidth={1.9} />, label: "GA4 Implementatie", href: "/diensten/ga4-implementatie" },
      { icon: <ShieldCheck size={16} strokeWidth={1.9} />, label: "Consent Mode v2", href: "/diensten/consent-mode-v2" },
      { icon: <Workflow size={16} strokeWidth={1.9} />, label: "Procesautomation", href: "/diensten/procesautomation" },
    ],
  },
};

export default function GlowMenu({ className, items, activeItem }: GlowMenuProps) {
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const megaItem = items.find((i) => i.mega);

  const handleEnter = (label: string, hasPanel: boolean) => {
    if (!hasPanel) return;
    clearTimeout(timeoutRef.current);
    setOpenDropdown(label);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 150);
  };
  const handlePanelEnter = () => clearTimeout(timeoutRef.current);
  const handlePanelLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 100);
  };

  return (
    <nav
      className={cn(
        "px-1.5 py-1.5 rounded-full bg-[rgba(20,20,20,0.85)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_4px_24px_rgba(0,0,0,0.25)] relative overflow-visible",
        className
      )}
      style={{ fontFamily: "'Matter Sans', sans-serif" }}
    >
      <ul className="flex items-center gap-1 relative z-10 list-none m-0 p-0">
        {items.map((item) => {
          const isActive = item.label === activeItem;
          const hasPanel = !!item.dropdown || !!item.mega;
          const isOpen = openDropdown === item.label;

          return (
            <li
              key={item.label}
              className="relative"
              onMouseEnter={() => handleEnter(item.label, hasPanel)}
              onMouseLeave={handleLeave}
            >
              <a
                href={hasPanel ? undefined : item.href}
                onClick={hasPanel ? (e) => e.preventDefault() : undefined}
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
                {hasPanel && (
                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isOpen && "rotate-180")} />
                )}
              </a>

              {/* Simple grouped dropdown (for any non-mega item that has one) */}
              <AnimatePresence>
                {item.dropdown && !item.mega && isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50"
                    onMouseEnter={handlePanelEnter}
                    onMouseLeave={handlePanelLeave}
                  >
                    <div className="glow-dd bg-[rgba(16,16,16,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 min-w-[520px]">
                      <div className="grid grid-cols-3 gap-6">
                        {item.dropdown.map((group) => (
                          <div key={group.category}>
                            <span className="glow-dd__cat block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3">
                              {group.category}
                            </span>
                            <ul className="list-none m-0 p-0 space-y-1">
                              {group.items.map((link) => (
                                <li key={link.href}>
                                  <a
                                    href={link.href}
                                    className="glow-dd__link block px-3 py-2 rounded-lg text-sm text-white/60 no-underline hover:text-white hover:bg-white/5 transition-colors duration-150"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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

      {/* Mega menu — centred under the pill */}
      <AnimatePresence>
        {megaItem && openDropdown === megaItem.label && (
          <div
            className="glow-mega-anchor"
            onMouseEnter={handlePanelEnter}
            onMouseLeave={handlePanelLeave}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="glow-mega"
            >
              <div className="glow-mega__main">
                <span className="glow-mega__label">Diensten</span>
                <div className="glow-mega__grid">
                  {MEGA.main.map((m) => (
                    <a key={m.href} href={m.href} className="glow-mega__item">
                      <span className="glow-mega__icon">{m.icon}</span>
                      <span className="glow-mega__text">
                        <span className="glow-mega__title">{m.title}</span>
                        <span className="glow-mega__desc">{m.desc}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="glow-mega__side">
                <span className="glow-mega__side-label">{MEGA.side.title}</span>
                <ul>
                  {MEGA.side.items.map((s) => (
                    <li key={s.href}>
                      <a href={s.href} className="glow-mega__side-link">
                        <span className="glow-mega__side-icon">{s.icon}</span>
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
