import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Parent folder has another package-lock.json; without this, dev can hang on Windows.
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
