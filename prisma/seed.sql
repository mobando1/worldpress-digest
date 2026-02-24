-- WorldPress Digest — Seed SQL
-- Run this in Supabase SQL Editor or via: psql $DATABASE_URL -f prisma/seed.sql

-- ─── Categories ──────────────────────────────────────
INSERT INTO categories (id, name, slug, color, icon, "sortOrder")
VALUES
  (gen_random_uuid(), 'Top Stories', 'top-stories', '#1A1A1A', 'star', 0),
  (gen_random_uuid(), 'World', 'world', '#2563EB', 'globe', 1),
  (gen_random_uuid(), 'Business', 'business', '#059669', 'briefcase', 2),
  (gen_random_uuid(), 'Technology', 'technology', '#7C3AED', 'cpu', 3),
  (gen_random_uuid(), 'Politics', 'politics', '#DC2626', 'landmark', 4),
  (gen_random_uuid(), 'Science', 'science', '#0891B2', 'flask-conical', 5),
  (gen_random_uuid(), 'Culture', 'culture', '#D97706', 'palette', 6),
  (gen_random_uuid(), 'Sports', 'sports', '#EA580C', 'trophy', 7),
  (gen_random_uuid(), 'Health', 'health', '#DB2777', 'heart-pulse', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  "sortOrder" = EXCLUDED."sortOrder";

-- ─── Sources ─────────────────────────────────────────
INSERT INTO sources (id, name, slug, url, "rssUrl", type, region, language, category, enabled, config, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'BBC News', 'bbc-news', 'https://www.bbc.com/news', 'https://feeds.bbci.co.uk/news/rss.xml', 'RSS', 'global', 'en', 'world', true, '{"tier":1}', now(), now()),
  (gen_random_uuid(), 'BBC World', 'bbc-world', 'https://www.bbc.com/news/world', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'RSS', 'global', 'en', 'world', true, '{"tier":1}', now(), now()),
  (gen_random_uuid(), 'Al Jazeera', 'al-jazeera', 'https://www.aljazeera.com', 'https://www.aljazeera.com/xml/rss/all.xml', 'RSS', 'global', 'en', 'world', true, '{"tier":1}', now(), now()),
  (gen_random_uuid(), 'The Guardian', 'the-guardian', 'https://www.theguardian.com', 'https://www.theguardian.com/world/rss', 'RSS', 'global', 'en', 'world', true, '{"tier":1}', now(), now()),
  (gen_random_uuid(), 'DW News', 'dw-news', 'https://www.dw.com', 'https://rss.dw.com/rdf/rss-en-all', 'RSS', 'global', 'en', 'world', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'France 24', 'france-24', 'https://www.france24.com/en', 'https://www.france24.com/en/rss', 'RSS', 'global', 'en', 'world', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'Financial Times', 'financial-times', 'https://www.ft.com', 'https://www.ft.com/rss/home', 'RSS', 'global', 'en', 'business', true, '{"tier":1}', now(), now()),
  (gen_random_uuid(), 'CNBC', 'cnbc', 'https://www.cnbc.com', 'https://www.cnbc.com/id/100003114/device/rss/rss.html', 'RSS', 'us', 'en', 'business', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'TechCrunch', 'techcrunch', 'https://techcrunch.com', 'https://techcrunch.com/feed', 'RSS', 'us', 'en', 'technology', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'The Verge', 'the-verge', 'https://www.theverge.com', 'https://www.theverge.com/rss/index.xml', 'RSS', 'us', 'en', 'technology', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'Wired', 'wired', 'https://www.wired.com', 'https://www.wired.com/feed/rss', 'RSS', 'us', 'en', 'technology', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'Ars Technica', 'ars-technica', 'https://arstechnica.com', 'https://feeds.arstechnica.com/arstechnica/index', 'RSS', 'us', 'en', 'technology', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'El Tiempo', 'el-tiempo', 'https://www.eltiempo.com', 'https://www.eltiempo.com/rss/el_tiempo.xml', 'RSS', 'latam', 'es', 'world', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'El Espectador', 'el-espectador', 'https://www.elespectador.com', 'https://www.elespectador.com/rss', 'RSS', 'latam', 'es', 'world', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'El País', 'el-pais', 'https://elpais.com', 'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada', 'RSS', 'latam', 'es', 'world', true, '{"tier":1}', now(), now()),
  (gen_random_uuid(), 'Infobae', 'infobae', 'https://www.infobae.com', 'https://www.infobae.com/feeds/rss/', 'RSS', 'latam', 'es', 'world', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'La Nación', 'la-nacion', 'https://www.lanacion.com.ar', 'https://www.lanacion.com.ar/arcio/rss/', 'RSS', 'latam', 'es', 'world', true, '{"tier":2}', now(), now()),
  (gen_random_uuid(), 'Reuters', 'reuters', 'https://www.reuters.com', NULL, 'API', 'global', 'en', 'world', false, '{"tier":1,"note":"RSS discontinued June 2020."}', now(), now()),
  (gen_random_uuid(), 'AP News', 'ap-news', 'https://apnews.com', NULL, 'API', 'global', 'en', 'world', false, '{"tier":1,"note":"Official RSS feeds discontinued."}', now(), now()),
  (gen_random_uuid(), 'Wall Street Journal', 'wsj', 'https://www.wsj.com', NULL, 'API', 'us', 'en', 'business', false, '{"tier":1,"note":"Paywall-restricted RSS."}', now(), now()),
  (gen_random_uuid(), 'Bloomberg', 'bloomberg', 'https://www.bloomberg.com', NULL, 'API', 'global', 'en', 'business', false, '{"tier":1,"note":"Requires Bloomberg Terminal or API."}', now(), now()),
  (gen_random_uuid(), 'Semana', 'semana', 'https://www.semana.com', NULL, 'SCRAPE', 'latam', 'es', 'world', false, '{"tier":3,"note":"No RSS feed found."}', now(), now())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  "rssUrl" = EXCLUDED."rssUrl",
  type = EXCLUDED.type,
  region = EXCLUDED.region,
  language = EXCLUDED.language,
  category = EXCLUDED.category,
  enabled = EXCLUDED.enabled,
  config = EXCLUDED.config,
  "updatedAt" = now();

-- ─── Admin User ──────────────────────────────────────
-- Password: admin123 (bcrypt hash with 12 rounds)
INSERT INTO users (id, email, "passwordHash", name, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@worldpressdigest.com',
  '$2b$12$hWNBdfr9chnLMz6xSXA2R.thLpM.HuQWLD98iDMR5QvRbKddtnMIG',
  'Admin',
  'ADMIN',
  now(),
  now()
)
ON CONFLICT (email) DO NOTHING;
