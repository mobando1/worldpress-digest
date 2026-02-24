import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", ".prisma/client", "@prisma/adapter-pg", "pg"],
  images: {
    remotePatterns: [
      // BBC
      { protocol: "https", hostname: "ichef.bbci.co.uk" },
      { protocol: "https", hostname: "*.bbci.co.uk" },
      // Al Jazeera
      { protocol: "https", hostname: "www.aljazeera.com" },
      { protocol: "https", hostname: "*.aljazeera.com" },
      // The Guardian
      { protocol: "https", hostname: "i.guim.co.uk" },
      { protocol: "https", hostname: "media.guim.co.uk" },
      // DW
      { protocol: "https", hostname: "static.dw.com" },
      // France 24
      { protocol: "https", hostname: "s.france24.com" },
      { protocol: "https", hostname: "*.france24.com" },
      // Financial Times
      { protocol: "https", hostname: "www.ft.com" },
      { protocol: "https", hostname: "d1e00ek4ebabms.cloudfront.net" },
      // CNBC
      { protocol: "https", hostname: "image.cnbcfm.com" },
      // TechCrunch
      { protocol: "https", hostname: "techcrunch.com" },
      // The Verge
      { protocol: "https", hostname: "*.theverge.com" },
      { protocol: "https", hostname: "cdn.vox-cdn.com" },
      // Wired
      { protocol: "https", hostname: "media.wired.com" },
      // Ars Technica
      { protocol: "https", hostname: "cdn.arstechnica.net" },
      // LatAm sources
      { protocol: "https", hostname: "*.eltiempo.com" },
      { protocol: "https", hostname: "*.elespectador.com" },
      { protocol: "https", hostname: "*.elpais.com" },
      { protocol: "https", hostname: "*.infobae.com" },
      { protocol: "https", hostname: "*.lanacion.com.ar" },
    ],
  },
};

export default nextConfig;
