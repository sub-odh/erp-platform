import path from "node:path";

import type { NextConfig } from "next";

/*
 * The standalone bundle is only needed for the Docker image, and emitting it
 * requires symlink privileges that Windows withholds by default, so it stays
 * opt-in rather than breaking local builds.
 */
const standalone = process.env.NEXT_OUTPUT_STANDALONE === "true";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  ...(standalone
    ? {
        output: "standalone",
        /* Shared workspace packages live above the app directory. */
        outputFileTracingRoot: path.join(__dirname, "../.."),
      }
    : {}),
};

export default nextConfig;
