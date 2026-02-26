import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // taglib-wasm + Emscripten WASM-Loader referenzieren Node.js-Module
  // die im Browser nie ausgefuehrt werden — Stubs reichen
  turbopack: {
    resolveAlias: {
      fs: { browser: './src/lib/empty-module.ts' },
      path: { browser: './src/lib/empty-module.ts' },
      crypto: { browser: './src/lib/empty-module.ts' },
      module: { browser: './src/lib/empty-module.ts' },
      'fs/promises': { browser: './src/lib/empty-module.ts' },
      '@wasmer/sdk': './src/lib/empty-module.ts',
      'onnxruntime-node': './src/lib/empty-module.ts',
    },
  },
  serverExternalPackages: ['taglib-wasm'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        module: false,
        'fs/promises': false,
      }
    }
    // taglib-wasm importiert @wasmer/sdk fuer optionalen WASI-Pfad
    // Im Browser wird Emscripten genutzt — Stub reicht
    config.resolve.alias = {
      ...config.resolve.alias,
      '@wasmer/sdk': false,
      'onnxruntime-node': false,
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
