import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stub Node.js built-ins used by Emscripten-compiled WASM libraries (audio-file-decoder)
  turbopack: {
    resolveAlias: {
      fs: { browser: './src/lib/empty-module.ts' },
      path: { browser: './src/lib/empty-module.ts' },
      crypto: { browser: './src/lib/empty-module.ts' },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    return config
  },
  async headers() {
    return [
      {
        source: "/analyze/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
