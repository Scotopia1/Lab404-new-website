import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Allow images from Cloudinary and other sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Set the correct monorepo root for Turbopack
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
