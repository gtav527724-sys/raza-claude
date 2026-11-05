"use client";

/**
 * Thin wrapper around the official YouTube IFrame Player API.
 * The player lives in a hidden-but-rendered container so audio keeps playing
 * (inside the Android WebView too) while the UI stays our own.
 */

interface YTPlayer {
  loadVideoById(opts: { videoId: string; startSeconds?: number }): void;
  cueVideoById(opts: { videoId: string; startSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(v: number): void;
  mute(): void;
  unMute(): void;
  setPlaybackRate(r: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      width: number | string;
      height: number | string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YtHandlers {
  onState: (state: number) => void;
  onError: (code: number) => void;
}

let handlers: YtHandlers | null = null;
let player: YTPlayer | null = null;
let readyPromise: Promise<YTPlayer> | null = null;
let apiPromise: Promise<void> | null = null;

function loadApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve, reject) => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube API failed to load"));
    };
    document.head.appendChild(s);
  });
  return apiPromise;
}

export function ytSetHandlers(h: YtHandlers) {
  handlers = h;
}

export function ytReady(): Promise<YTPlayer> {
  if (readyPromise) return readyPromise;
  readyPromise = loadApi().then(
    () =>
      new Promise<YTPlayer>((resolve) => {
        const host = document.createElement("div");
        host.id = "sonara-yt-host";
        // 200x200 is YouTube's minimum embed size; kept off-screen but rendered.
        host.style.cssText =
          "position:fixed;left:-480px;bottom:0;width:200px;height:200px;opacity:0.01;pointer-events:none;z-index:-1;overflow:hidden";
        const inner = document.createElement("div");
        host.appendChild(inner);
        document.body.appendChild(host);
        const p: YTPlayer = new window.YT!.Player(inner, {
          width: 200,
          height: 200,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
            enablejsapi: 1,
          },
          events: {
            onReady: () => {
              player = p;
              resolve(p);
            },
            onStateChange: (e) => handlers?.onState(e.data),
            onError: (e) => handlers?.onError(e.data),
          },
        });
      }),
    (err) => {
      readyPromise = null;
      throw err;
    },
  );
  return readyPromise;
}

export async function ytLoad(videoId: string, startSec = 0, volume = 1, rate = 1, muted = false) {
  const p = await ytReady();
  p.setVolume(Math.round(volume * 100));
  if (muted) p.mute();
  else p.unMute();
  p.loadVideoById({ videoId, startSeconds: Math.max(0, startSec) });
  try {
    p.setPlaybackRate(rate);
  } catch {
    /* some videos lock the rate */
  }
}

export const yt = {
  isReady: () => player !== null,
  play: () => player?.playVideo(),
  pause: () => player?.pauseVideo(),
  stop: () => {
    try {
      player?.stopVideo();
    } catch {
      /* noop */
    }
  },
  seek: (t: number) => player?.seekTo(Math.max(0, t), true),
  setVolume: (v: number) => player?.setVolume(Math.round(Math.min(1, Math.max(0, v)) * 100)),
  mute: (m: boolean) => (m ? player?.mute() : player?.unMute()),
  rate: (r: number) => {
    try {
      player?.setPlaybackRate(r);
    } catch {
      /* noop */
    }
  },
  time: () => {
    try {
      return player?.getCurrentTime() ?? 0;
    } catch {
      return 0;
    }
  },
  duration: () => {
    try {
      return player?.getDuration() ?? 0;
    } catch {
      return 0;
    }
  },
  state: () => {
    try {
      return player?.getPlayerState() ?? -1;
    } catch {
      return -1;
    }
  },
};
