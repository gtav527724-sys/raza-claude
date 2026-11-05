"use client";

import { ChevronLeft, Download, HardDrive, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import TrackRow from "@/components/TrackRow";
import { useOffline } from "@/lib/offline";
import { usePlayer } from "@/lib/player";
import { toast } from "@/lib/toast";

export default function OfflinePage() {
  const router = useRouter();
  const items = useOffline((s) => s.items);
  const hydrate = useOffline((s) => s.hydrate);
  const remove = useOffline((s) => s.remove);
  const clear = useOffline((s) => s.clear);
  const playQueue = usePlayer((s) => s.playQueue);

  useEffect(() => hydrate(), [hydrate]);

  return (
    <div className="px-5 pb-44 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/85"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-[21px] font-bold">Offline Music</h1>
            <p className="text-[11.5px] text-white/40">{items.length} downloaded songs</p>
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={async () => {
              await clear();
              toast("All downloads removed");
            }}
            className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <>
          <button
            onClick={() => playQueue(items, 0)}
            className="glow-lime mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--acc)] py-3.5 text-[14px] font-bold text-[color:var(--on-acc)]"
          >
            <Download className="h-4 w-4" /> Play downloaded
          </button>
          <div className="-mx-2 mt-5">
            {items.map((t, i) => (
              <TrackRow
                key={`${t.source}-${t.id}`}
                track={t}
                tracks={items}
                index={i}
                onRemove={async (x) => {
                  await remove(x);
                  toast("Download removed");
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-24 text-center">
          <span className="glass flex h-20 w-20 items-center justify-center rounded-full">
            <HardDrive className="h-8 w-8 text-white/20" />
          </span>
          <p className="mt-5 text-[15px] font-semibold text-white/65">No offline songs yet</p>
          <p className="mt-2 max-w-[260px] text-[12.5px] leading-relaxed text-white/35">
            Kisi song ka menu kholo aur “Download offline” tap karo.
          </p>
        </div>
      )}
    </div>
  );
}
