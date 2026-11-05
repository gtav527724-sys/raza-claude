"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import FadeImg from "@/components/FadeImg";
import type { Album } from "@/lib/types";

export default function AlbumCard({ album, width = 160 }: { album: Album; width?: number }) {
  return (
    <motion.div whileTap={{ scale: 0.96 }} className="shrink-0" style={{ width }}>
      <Link href={`/album/${album.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07]">
          <FadeImg
            src={album.coverUrl}
            alt={album.title}
            width={width}
            height={width}
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
        <p className="mt-2 truncate text-[13px] font-semibold text-white/90">{album.title}</p>
        <p className="truncate text-[11px] text-white/45">
          {album.artist}
          {album.trackCount ? ` · ${album.trackCount} tracks` : ""}
        </p>
      </Link>
    </motion.div>
  );
}
