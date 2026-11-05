"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useToasts } from "@/lib/toast";

const subscribe = () => () => {};
const getRoot = () => document.getElementById("sheet-root");
const getServerRoot = () => null;

export default function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  const root = useSyncExternalStore(subscribe, getRoot, getServerRoot);
  if (!root) return null;

  return createPortal(
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-[90] flex flex-col items-center gap-2 px-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 400 }}
            className="flex items-center gap-2 rounded-full bg-[color:var(--acc)] px-4 py-2 text-[13px] font-semibold text-[color:var(--on-acc)] shadow-[0_8px_30px_color-mix(in_srgb,var(--acc)_25%,transparent)]"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    root,
  );
}
