import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default é 1MB — abaixo do limite de 8MB do bucket de upload
    // (lib/upload-actions.ts), causava "Body exceeds..." 500 ao editar
    // produto/categoria/banner com foto real (não pego em teste local
    // porque as imagens de teste eram minúsculas).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xeacjdraobpzlkvrtpok.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
