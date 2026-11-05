"use client";

import { motion } from "framer-motion";
import { House, LibraryBig, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/",
    label: "Home",
    icon: House,
    match: (p: string) => p === "/" || p.startsWith("/album"),
  },
  { href: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") },
  {
    href: "/library",
    label: "Library",
    icon: LibraryBig,
    match: (p: string) =>
      p.startsWith("/library") || p.startsWith("/playlist") || p.startsWith("/liked"),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="absolute inset-x-3 bottom-[max(0.85rem,env(safe-area-inset-bottom))] z-30">
      <div className="glass rounded-[26px] p-1.5">
        <div className="flex">
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-1 flex-col items-center gap-[3px] rounded-[20px] py-2 outline-none"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", damping: 26, stiffness: 380 }}
                    className="absolute inset-0 rounded-[20px] border border-white/[0.14] bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_24px_-8px_rgba(0,0,0,0.6)]"
                  />
                )}
                <motion.span
                  animate={active ? { scale: 1.12, y: -1 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 400 }}
                  className="relative z-10"
                >
                  <Icon
                    className={cn(
                      "h-[21px] w-[21px] transition-colors duration-200",
                      active ? "text-[color:var(--acc)]" : "text-white/45",
                    )}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                </motion.span>
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-semibold tracking-wide transition-colors duration-200",
                    active ? "text-white" : "text-white/40",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
