import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['drive.usercontent.google.com', 'eco-harvest-backend.vercel.app', 'drive.google.com', 'lh3.googleusercontent.com', 'localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://eco-harvest-backend.vercel.app/:path*',
      },
      {
        source: '/api/proxy',
        destination: 'https://eco-harvest-backend.vercel.app',
      },
    ];
  },
};

export default nextConfig;