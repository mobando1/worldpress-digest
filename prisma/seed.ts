// @ts-nocheck
import { hash } from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Categories ──────────────────────────────────────
  const categories = [
    { name: "Top Stories", slug: "top-stories", color: "#1A1A1A", icon: "star", sortOrder: 0 },
    { name: "World", slug: "world", color: "#2563EB", icon: "globe", sortOrder: 1 },
    { name: "Business", slug: "business", color: "#059669", icon: "briefcase", sortOrder: 2 },
    { name: "Technology", slug: "technology", color: "#7C3AED", icon: "cpu", sortOrder: 3 },
    { name: "Politics", slug: "politics", color: "#DC2626", icon: "landmark", sortOrder: 4 },
    { name: "Science", slug: "science", color: "#0891B2", icon: "flask-conical", sortOrder: 5 },
    { name: "Culture", slug: "culture", color: "#D97706", icon: "palette", sortOrder: 6 },
    { name: "Sports", slug: "sports", color: "#EA580C", icon: "trophy", sortOrder: 7 },
    { name: "Health", slug: "health", color: "#DB2777", icon: "heart-pulse", sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`  ✓ ${categories.length} categories`);

  // ─── Sources ─────────────────────────────────────────
  const sources = [
    // Global
    {
      name: "BBC News",
      slug: "bbc-news",
      url: "https://www.bbc.com/news",
      rssUrl: "https://feeds.bbci.co.uk/news/rss.xml",
      type: "RSS" as const,
      region: "global",
      language: "en",
      category: "world",
      config: { tier: 1 },
    },
    {
      name: "BBC World",
      slug: "bbc-world",
      url: "https://www.bbc.com/news/world",
      rssUrl: "https://feeds.bbci.co.uk/news/world/rss.xml",
      type: "RSS" as const,
      region: "global",
      language: "en",
      category: "world",
      config: { tier: 1 },
    },
    {
      name: "Al Jazeera",
      slug: "al-jazeera",
      url: "https://www.aljazeera.com",
      rssUrl: "https://www.aljazeera.com/xml/rss/all.xml",
      type: "RSS" as const,
      region: "global",
      language: "en",
      category: "world",
      config: { tier: 1 },
    },
    {
      name: "The Guardian",
      slug: "the-guardian",
      url: "https://www.theguardian.com",
      rssUrl: "https://www.theguardian.com/world/rss",
      type: "RSS" as const,
      region: "global",
      language: "en",
      category: "world",
      config: { tier: 1 },
    },
    {
      name: "DW News",
      slug: "dw-news",
      url: "https://www.dw.com",
      rssUrl: "https://rss.dw.com/rdf/rss-en-all",
      type: "RSS" as const,
      region: "global",
      language: "en",
      category: "world",
      config: { tier: 2 },
    },
    {
      name: "France 24",
      slug: "france-24",
      url: "https://www.france24.com/en",
      rssUrl: "https://www.france24.com/en/rss",
      type: "RSS" as const,
      region: "global",
      language: "en",
      category: "world",
      config: { tier: 2 },
    },
    // Business / Finance
    {
      name: "Financial Times",
      slug: "financial-times",
      url: "https://www.ft.com",
      rssUrl: "https://www.ft.com/rss/home",
      type: "RSS" as const,
      region: "global",
      language: "en",
      category: "business",
      config: { tier: 1 },
    },
    {
      name: "CNBC",
      slug: "cnbc",
      url: "https://www.cnbc.com",
      rssUrl: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
      type: "RSS" as const,
      region: "us",
      language: "en",
      category: "business",
      config: { tier: 2 },
    },
    // Tech
    {
      name: "TechCrunch",
      slug: "techcrunch",
      url: "https://techcrunch.com",
      rssUrl: "https://techcrunch.com/feed",
      type: "RSS" as const,
      region: "us",
      language: "en",
      category: "technology",
      config: { tier: 2 },
    },
    {
      name: "The Verge",
      slug: "the-verge",
      url: "https://www.theverge.com",
      rssUrl: "https://www.theverge.com/rss/index.xml",
      type: "RSS" as const,
      region: "us",
      language: "en",
      category: "technology",
      config: { tier: 2 },
    },
    {
      name: "Wired",
      slug: "wired",
      url: "https://www.wired.com",
      rssUrl: "https://www.wired.com/feed/rss",
      type: "RSS" as const,
      region: "us",
      language: "en",
      category: "technology",
      config: { tier: 2 },
    },
    {
      name: "Ars Technica",
      slug: "ars-technica",
      url: "https://arstechnica.com",
      rssUrl: "https://feeds.arstechnica.com/arstechnica/index",
      type: "RSS" as const,
      region: "us",
      language: "en",
      category: "technology",
      config: { tier: 2 },
    },
    // LatAm
    {
      name: "El Tiempo",
      slug: "el-tiempo",
      url: "https://www.eltiempo.com",
      rssUrl: "https://www.eltiempo.com/rss/el_tiempo.xml",
      type: "RSS" as const,
      region: "latam",
      language: "es",
      category: "world",
      config: { tier: 2 },
    },
    {
      name: "El Espectador",
      slug: "el-espectador",
      url: "https://www.elespectador.com",
      rssUrl: "https://www.elespectador.com/rss",
      type: "RSS" as const,
      region: "latam",
      language: "es",
      category: "world",
      config: { tier: 2 },
    },
    {
      name: "El País",
      slug: "el-pais",
      url: "https://elpais.com",
      rssUrl: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
      type: "RSS" as const,
      region: "latam",
      language: "es",
      category: "world",
      config: { tier: 1 },
    },
    {
      name: "Infobae",
      slug: "infobae",
      url: "https://www.infobae.com",
      rssUrl: "https://www.infobae.com/feeds/rss/",
      type: "RSS" as const,
      region: "latam",
      language: "es",
      category: "world",
      config: { tier: 2 },
    },
    {
      name: "La Nación",
      slug: "la-nacion",
      url: "https://www.lanacion.com.ar",
      rssUrl: "https://www.lanacion.com.ar/arcio/rss/",
      type: "RSS" as const,
      region: "latam",
      language: "es",
      category: "world",
      config: { tier: 2 },
    },
    // Marked as requiring API or not supported
    {
      name: "Reuters",
      slug: "reuters",
      url: "https://www.reuters.com",
      rssUrl: null,
      type: "API" as const,
      region: "global",
      language: "en",
      category: "world",
      enabled: false,
      config: { tier: 1, note: "RSS discontinued June 2020. Requires API or third-party service." },
    },
    {
      name: "AP News",
      slug: "ap-news",
      url: "https://apnews.com",
      rssUrl: null,
      type: "API" as const,
      region: "global",
      language: "en",
      category: "world",
      enabled: false,
      config: { tier: 1, note: "Official RSS feeds discontinued. Requires third-party service." },
    },
    {
      name: "Wall Street Journal",
      slug: "wsj",
      url: "https://www.wsj.com",
      rssUrl: null,
      type: "API" as const,
      region: "us",
      language: "en",
      category: "business",
      enabled: false,
      config: { tier: 1, note: "Paywall-restricted RSS. Requires subscription or API." },
    },
    {
      name: "Bloomberg",
      slug: "bloomberg",
      url: "https://www.bloomberg.com",
      rssUrl: null,
      type: "API" as const,
      region: "global",
      language: "en",
      category: "business",
      enabled: false,
      config: { tier: 1, note: "Professional feeds only. Requires Bloomberg Terminal or API." },
    },
    {
      name: "Semana",
      slug: "semana",
      url: "https://www.semana.com",
      rssUrl: null,
      type: "SCRAPE" as const,
      region: "latam",
      language: "es",
      category: "world",
      enabled: false,
      config: { tier: 3, note: "No RSS feed found. Requires scraping (not implemented in MVP)." },
    },
  ];

  for (const source of sources) {
    await prisma.source.upsert({
      where: { slug: source.slug },
      update: {
        name: source.name,
        url: source.url,
        rssUrl: source.rssUrl,
        type: source.type,
        region: source.region,
        language: source.language,
        category: source.category,
        config: source.config,
        enabled: source.enabled ?? true,
      },
      create: {
        name: source.name,
        slug: source.slug,
        url: source.url,
        rssUrl: source.rssUrl,
        type: source.type,
        region: source.region,
        language: source.language,
        category: source.category,
        config: source.config,
        enabled: source.enabled ?? true,
      },
    });
  }
  console.log(`  ✓ ${sources.length} sources (${sources.filter(s => s.enabled !== false).length} enabled, ${sources.filter(s => s.enabled === false).length} disabled)`);

  // ─── Admin User ──────────────────────────────────────
  const adminPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@worldpressdigest.com" },
    update: {},
    create: {
      email: "admin@worldpressdigest.com",
      passwordHash: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log("  ✓ Admin user (admin@worldpressdigest.com / admin123)");

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
