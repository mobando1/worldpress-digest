// ---------------------------------------------------------------------------
// Client-friendly interfaces that mirror (but simplify) the Prisma models.
// Dates are serialised as ISO strings when sent over the wire.
// ---------------------------------------------------------------------------

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  author: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  sourceUrl: string;
  imageUrl: string | null;
  language: string;
  country: string | null;
  tags: string[];
  breakingScore: number;
  metadata: Record<string, unknown>;
  sourceId: string;
  categoryId: string | null;
  createdAt: string;
  source?: Source;
  category?: Category | null;
}

export interface Source {
  id: string;
  name: string;
  slug: string;
  url: string;
  rssUrl: string | null;
  type: "RSS" | "API" | "SCRAPE";
  region: string | null;
  language: string;
  category: string | null;
  enabled: boolean;
  status: "ACTIVE" | "PAUSED" | "ERROR" | "DISABLED";
  lastFetchedAt: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  sortOrder: number;
}

export interface AlertRule {
  id: string;
  name: string;
  keywords: string[];
  minBreakingScore: number;
  channels: string[];
  enabled: boolean;
  userId: string;
  categories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  channel: "EMAIL" | "PUSH" | "IN_APP";
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  sentAt: string | null;
  userId: string;
  articleId: string;
  alertRuleId: string;
  article?: Article;
  alertRule?: AlertRule;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------------

export type ArticleCardSize = "lg" | "md" | "sm";

// ---------------------------------------------------------------------------
// Search / filtering
// ---------------------------------------------------------------------------

export interface SearchFilters {
  search?: string;
  categoryId?: string;
  sourceId?: string;
  language?: string;
  country?: string;
  fromDate?: string;
  toDate?: string;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// ---------------------------------------------------------------------------
// Fetch / scrape pipeline
// ---------------------------------------------------------------------------

export interface FetchResult {
  sourceId: string;
  sourceName: string;
  articlesFound: number;
  articlesNew: number;
  errors: string[];
  durationMs: number;
}
