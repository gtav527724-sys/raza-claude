"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};
const getRoot = () => document.getElementById("sheet-root");
const getServerRoot = () => null;

export default function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const root = useSyncExternalStore(subscribe, getRoot, getServerRoot);
  if (!root) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            className="pointer-events-auto absolute inset-0 z-[70] bg-black/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="panel"
            className="pointer-events-auto absolute inset-x-0 bottom-0 z-[71] max-h-[78%] overflow-hidden rounded-t-[32px] border-t border-white/[0.14] bg-[#13131c]/80 shadow-[0_-30px_90px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl backdrop-saturate-150 will-change-transform"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose();
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.07] to-transparent" />
            <div className="mx-auto mt-3.5 h-1 w-10 rounded-full bg-white/25 shadow-[0_1px_0_rgba(0,0,0,0.4)]" />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    root,
  );
}
