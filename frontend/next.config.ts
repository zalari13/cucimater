import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Batasi root Turbopack ke folder frontend agar tidak menganggap
  // lockfile di direktori induk sebagai root workspace.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
