"use client";

import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useLibrary } from "@/lib/library";
import { toast } from "@/lib/toast";

interface Me {
  configured: boolean;
  user: { id: number; name: string; email: string; picture: string } | null;
}

const MESSAGES: Record<string, string> = {
  "not-configured":
    "Google login abhi set nahi hai — server par GOOGLE_CLIENT_ID aur GOOGLE_CLIENT_SECRET add karein",
  cancelled: "Google login cancel ho gaya",
  "invalid-state": "Login session expire ho gaya — dobara try karein",
  "token-failed": "Google se token nahi mila — dobara try karein",
  "profile-failed": "Google profile load nahi hui",
  error: "Login mein error aaya — dobara try karein",
};

export default function AccountCard() {
  const [me, setMe] = useState<Me | null>(null);
  const reload = useLibrary((s) => s.reload);
  const bump = useLibrary((s) => s.bump);

  useEffect(() => {
    apiGet<Me>("/api/auth/me")
      .then(setMe)
      .catch(() => setMe({ configured: false, user: null }));
    const code = new URLSearchParams(window.location.search).get("login");
    if (code) {
      toast(code === "ok" ? "Google login successful ✓" : (MESSAGES[code] ?? "Login fail ho gaya"));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const login = () => {
    const android = /SonaraAndroid/i.test(navigator.userAgent);
    window.location.href = `/api/auth/google/start${android ? "?platform=android" : ""}`;
  };

  const logout = async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch {
      /* cookie cleared locally by reload anyway */
    }
    setMe((m) => (m ? { ...m, user: null } : m));
    await reload();
    bump();
    toast("Logout ho gaya");
  };

  if (!me) return <div className="h-[84px] animate-pulse rounded-2xl bg-white/[0.04]" />;

  if (me.user) {
    return (
      <div className="flex items-center gap-3 p-4">
        {me.user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={me.user.picture}
            alt=""
            referrerPolicy="no-referrer"
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-white/15"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold">
            {me.user.name.slice(0, 1) || "G"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-bold">{me.user.name || "Google user"}</p>
          <p className="truncate text-[11.5px] text-white/45">{me.user.email}</p>
          <p className="mt-0.5 text-[10.5px] text-[color:var(--acc)]">
            Likes, playlists &amp; YouTube synced
          </p>
        </div>
        <button
          onClick={logout}
          className="glass-soft flex h-10 w-10 items-center justify-center rounded-full text-white/75"
          aria-label="Logout"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button
        onClick={login}
        className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-[14px] font-bold text-black active:scale-[0.98]"
      >
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
          <path
            fill="#EA4335"
            d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"
          />
          <path
            fill="#FBBC05"
            d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.2A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.2z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.9 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z"
          />
        </svg>
        Google se login karein
      </button>
      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-white/40">
        Login ke baad apni YouTube playlists &amp; liked songs yahin play karein. Likes aur
        playlists har device par sync rahengi.
      </p>
    </div>
  );
}
