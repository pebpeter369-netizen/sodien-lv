import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/aktualitates/-1774120790106",
        destination:
          "/aktualitates/latvijas-partikas-drosiba-markejums-un-kvalitate",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
