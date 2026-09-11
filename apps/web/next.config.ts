import path from "node:path";

import type { NextConfig } from "next";

/*
 * The standalone bundle is only needed for the Docker image, and emitting it
 * requires symlink privileges that Windows withholds by default, so it stays
 * opt-in rather than breaking local builds.
 */
const standalone = process.env.NEXT_OUTPUT_STANDALONE === "true";

const nextConfig: NextConfig = {
  ...(standalone
    ? {
        output: "standalone",
        /* Shared workspace packages live above the app directory. */
        outputFileTracingRoot: path.join(__dirname, "../.."),
      }
    : {}),
};

export default nextConfig;
