import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // The Mythos SDK reads its own package.json at runtime, which the server
  // bundler cannot follow; load it from node_modules instead.
  serverExternalPackages: ["@mythos-work/sdk", "express"],
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/mythos-handshake",
        destination: "/api/mythos/handshake",
      },
    ];
  },
};

export default nextConfig;
