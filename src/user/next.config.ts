import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    /** Mọi giá trị `quality` truyền vào `<Image />` phải có trong danh sách (Next.js 16+) */
    qualities: [75, 95],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
