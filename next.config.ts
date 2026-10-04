import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
};

// Analisis bundle hanya saat ANALYZE=1 (nol dampak ke build normal).
const analyze = withBundleAnalyzer({ enabled: process.env.ANALYZE === "1" });

export default analyze(nextConfig);
