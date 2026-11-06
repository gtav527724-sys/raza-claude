import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the native YouTube extractor out of the webpack bundle —
  // this is what makes the Vercel build reliable.
  serverExternalPackages: ["@distube/ytdl-core"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
