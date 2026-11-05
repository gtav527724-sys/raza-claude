import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Unbounded } from "next/font/google";
import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import "./globals.css";

const display = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  weight: ["400", "600", "700", "800"],
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SONARA — Your Music, Everywhere",
  description:
    "SONARA is your personal music streaming app. Stream your catalog, build playlists, like songs and take your sound everywhere.",
  manifest: "/manifest.webmanifest",
  applicationName: "SONARA",
  icons: [{ rel: "icon", url: "/icons/icon.png", type: "image/png" }],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SONARA",
  },
};

export const viewport: Viewport = {
  themeColor: "#050508",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('sonara:settings')||'{}');var T={
  midnight:['#c6ff3f','#07070b','255,255,255'],
  sunset:['#ff9f43','#120a0a','255,228,196'],
  ocean:['#22d3ee','#040a12','190,230,255'],
  sakura:['#f472b6','#0f0710','255,214,238'],
  matrix:['#22c55e','#000000','180,255,200'],
  royal:['#facc15','#0a0812','255,240,200'],
  arctic:['#e2e8f0','#0b0f14','226,232,240'],
  amethyst:['#a78bfa','#0b0714','226,214,255'],
  ember:['#ff6a3d','#130205','255,215,190'],
  lapis:['#60a5fa','#040812','210,230,255']
};var t=T[s.themeId]||T.midnight;var r=document.documentElement;r.style.setProperty('--acc',s.accent||t[0]);r.style.setProperty('--bg',s.amoled?'#000':t[1]);r.style.setProperty('--surface',t[2]);if(s.amoled)r.classList.add('amoled');var ua=navigator.userAgent;var pm=s.perfMode===undefined?(/SonaraAndroid/i.test(ua)||(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=3):s.perfMode;if(pm)r.classList.add('perf');if(s.reduceMotion)r.classList.add('rm');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-body">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
