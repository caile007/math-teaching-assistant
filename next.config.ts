import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      { hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
