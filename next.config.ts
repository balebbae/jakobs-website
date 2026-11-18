import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Board snapshots embed photos as data URLs; larger ones upload straight to Vercel Blob
    // (see src/lib/board-saves.functions.ts) to stay under Vercel's 4.5 MB request limit.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
