import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: [
    "@prisma/client",
    "nodemailer",
    "@supabase/supabase-js",
    "@supabase/ssr",
    "qrcode",
  ],
};

export default nextConfig;
