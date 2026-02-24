# WorldPress Digest

A newspaper-style news aggregation platform that collects articles from major global news sources via RSS feeds, normalizes and classifies them, detects breaking news, and presents everything in an editorial layout inspired by the Financial Times and The Economist.

## Features

- **RSS Aggregation** — Fetches from 17+ global news sources (BBC, Al Jazeera, Guardian, FT, TechCrunch, El Tiempo, etc.)
- **Newspaper UI** — Serif headlines, editorial grid layout, warm cream/dark mode themes
- **Breaking Detection** — Scores articles 0-100 based on keywords, recency, and source tier
- **Full-Text Search** — PostgreSQL FTS with tsvector, GIN indexes, and relevance ranking
- **Alert Rules** — Configurable notifications when articles match keywords/score thresholds
- **Admin Panel** — Manage sources, trigger manual fetches, view fetch logs
- **Dark Mode** — CSS-variable theming with smooth transitions
- **Responsive** — Mobile-first with hamburger menu, stacked layouts on small screens

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL + Prisma 7 |
| Search | PostgreSQL FTS (tsvector + GIN) |
| RSS | rss-parser |
| Jobs | node-cron (separate worker process) |
| Auth | JWT + bcrypt |
| Validation | Zod |

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (with `pg_trgm` extension)
- npm or yarn

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd Scrapper-newspaper
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/worldpress_digest?schema=public"
JWT_SECRET="generate-a-strong-random-secret"
```

### 3. Set up the database

```bash
# Create the database
createdb worldpress_digest

# Run migrations
npm run db:migrate

# Seed categories, sources, and admin user
npm run db:seed
```

The seed creates:
- 9 categories (Top Stories, World, Business, Technology, Politics, Science, Culture, Sports, Health)
- 22 news sources (17 enabled RSS + 5 disabled/API-only)
- Admin user: `admin@worldpressdigest.com` / `admin123`

### 4. Start the application

```bash
# Run both Next.js and the worker process
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Background worker (RSS fetching + notifications)
npm run worker:watch
```

The app will be available at `http://localhost:3000`.

### 5. Trigger initial fetch

Either wait for the worker's 10-minute cron cycle, or trigger manually:

1. Log in at `/login` with the admin credentials
2. Go to `/admin` and click **Trigger Manual Fetch**

Or via API:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@worldpressdigest.com","password":"admin123"}' \
  | jq -r '.data.token')

curl -X POST http://localhost:3000/api/admin/fetch \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `SMTP_HOST` | No | SMTP server for email notifications |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `SMTP_FROM` | No | From address for notification emails |
| `VAPID_PUBLIC_KEY` | No | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | No | VAPID private key for web push |
| `VAPID_EMAIL` | No | Contact email for VAPID |
| `NEWS_API_KEY` | No | NewsAPI key (for future API adapter) |
| `GUARDIAN_API_KEY` | No | Guardian Open Platform key |
| `NYT_API_KEY` | No | NYT Article Search API key |
| `NEXT_PUBLIC_APP_URL` | No | Public URL (default: http://localhost:3000) |

## Adding New Sources

### Via Admin Panel

1. Log in as admin
2. Navigate to `/admin/sources`
3. Click **Add Source** and fill in the RSS feed URL

### Via Seed File

Add an entry to `prisma/seed.ts`:

```typescript
{
  name: "My Source",
  slug: "my-source",           // URL-safe, unique
  url: "https://example.com",  // Homepage
  rssUrl: "https://example.com/feed.xml",  // RSS feed URL
  type: "RSS" as const,
  region: "global",            // global, us, eu, latam, asia, africa
  language: "en",              // ISO 639-1
  category: "technology",      // matches a category slug
  config: { tier: 2 },        // 1=major wire, 2=established, 3=niche
}
```

Then re-run `npm run db:seed`.

### Source Tiers

| Tier | Description | Breaking Score Bonus |
|------|-------------|---------------------|
| 1 | Major wires (Reuters, AP, BBC) | +10 |
| 2 | Established outlets (TechCrunch, CNBC) | +5 |
| 3 | Niche/regional sources | +0 |

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database models (7 tables)
│   └── seed.ts                # Categories + sources + admin user
├── scripts/
│   └── worker.ts              # Standalone cron worker
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (Navbar, Footer, ThemeProvider)
│   │   ├── page.tsx           # Home page (newspaper grid)
│   │   ├── search/            # Full-text search + filters
│   │   ├── article/[id]/      # Article detail
│   │   ├── category/[slug]/   # Category listing
│   │   ├── (auth)/            # Login, Register
│   │   ├── admin/             # Dashboard, Sources, Alerts
│   │   └── api/               # 15 API routes
│   ├── components/
│   │   ├── layout/            # Navbar, Footer, ThemeToggle
│   │   ├── home/              # Hero, Headlines, Categories, Trending, Breaking
│   │   ├── article/           # ArticleCard, ArticleDetail, ArticleMeta
│   │   ├── shared/            # Pagination, EmptyState, Skeletons, CategoryBadge
│   │   └── ui/                # shadcn/ui primitives
│   ├── services/              # Business logic
│   │   ├── adapters/          # RSSAdapter, APIAdapter, ScrapeAdapter
│   │   ├── ArticleService.ts  # Normalize, dedup, classify, CRUD
│   │   ├── FetchService.ts    # Orchestrate fetching (batch of 5)
│   │   ├── SearchService.ts   # PostgreSQL FTS queries
│   │   ├── BreakingDetector.ts # Score calculation (0-100)
│   │   └── NotificationService.ts # Alert rule matching + dispatch
│   └── lib/                   # Shared utilities
│       ├── db.ts              # Prisma singleton
│       ├── auth.ts            # JWT + bcrypt
│       ├── middleware.ts      # requireAuth, requireAdmin
│       ├── validators.ts      # Zod schemas
│       └── hooks/             # useDebounce, useSearch
└── package.json
```

## API Routes

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/articles` | List articles (paginated, filterable) |
| GET | `/api/articles/[id]` | Single article with source and category |
| GET | `/api/articles/breaking` | Breaking news (score >= 50, last 24h) |
| GET | `/api/sources` | List enabled sources |
| GET | `/api/categories` | List all categories |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/session` | Validate current session |
| DELETE | `/api/auth/session` | Logout (client-side) |

### User (requires auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/alerts` | List user's alert rules |
| POST | `/api/alerts` | Create alert rule |
| GET | `/api/alerts/[id]` | Get alert rule |
| PUT | `/api/alerts/[id]` | Update alert rule |
| DELETE | `/api/alerts/[id]` | Delete alert rule |
| GET | `/api/notifications` | List user's notifications |

### Admin (requires admin role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/sources` | List all sources (including disabled) |
| POST | `/api/admin/sources` | Add new source |
| PUT | `/api/admin/sources/[id]` | Update source |
| DELETE | `/api/admin/sources/[id]` | Delete source |
| POST | `/api/admin/fetch` | Trigger manual fetch |
| GET | `/api/admin/logs` | View recent fetch logs |

### Query Parameters (GET /api/articles)

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Full-text search query |
| `category` | string | Filter by category slug |
| `source` | string | Filter by source ID |
| `language` | string | Filter by language code |
| `breakingOnly` | boolean | Only articles with score > 0 |
| `from` / `to` | ISO date | Date range filter |
| `sort` | string | `recent`, `relevant`, `trending` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 50) |

## Worker Process

The worker (`scripts/worker.ts`) runs three scheduled jobs:

| Schedule | Job | Description |
|----------|-----|-------------|
| Every 10 min | `FetchService.fetchAll()` | Fetch all enabled RSS sources in batches of 5 |
| Every 5 min | Notification dispatch | Send pending EMAIL/PUSH notifications |
| Daily 3:00 AM | Cleanup | Remove fetch logs and read notifications older than 30 days |

The worker handles graceful shutdown on SIGINT/SIGTERM.

## Deployment

### Next.js (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set environment variables in Vercel dashboard
4. Vercel auto-detects Next.js and deploys

Note: The worker process cannot run on Vercel's serverless functions. Deploy it separately.

### Worker (Render / Fly.io / Railway)

The worker runs as a long-lived Node.js process:

**Render:**
```yaml
# render.yaml
services:
  - type: worker
    name: worldpress-worker
    runtime: node
    buildCommand: npm install && npx prisma generate
    startCommand: npx tsx scripts/worker.ts
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: worldpress-db
          property: connectionString
```

**Fly.io:**
```bash
fly launch --no-deploy
# Edit fly.toml: set [processes] command to "npx tsx scripts/worker.ts"
fly secrets set DATABASE_URL="..."
fly deploy
```

**Railway:**
1. Create a new service from the same repo
2. Set start command to `npx tsx scripts/worker.ts`
3. Add DATABASE_URL environment variable

### Database (Supabase / Neon / Railway)

Any PostgreSQL 14+ provider works. Make sure to:
1. Enable the `pg_trgm` extension: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
2. Run migrations: `npx prisma migrate deploy`
3. Run seed: `npx tsx prisma/seed.ts`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run worker` | Run worker process |
| `npm run worker:watch` | Run worker with auto-reload |
| `npm run dev:all` | Start Next.js + worker concurrently |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run lint` | Run ESLint |

## Legal Compliance

- Only stores article metadata and summaries (not full copyrighted content)
- Always links back to the original source
- Respects `robots.txt` and feed terms of service
- No redistribution of paywalled content
- Sources marked as API-only or scrape-only are disabled by default

## License

MIT
