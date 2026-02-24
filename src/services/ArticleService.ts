import crypto from "crypto";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { Article, Source } from "@prisma/client";
import type { RawArticle } from "./adapters/RSSAdapter";
import { BreakingDetector } from "./BreakingDetector";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArticleFilters {
  sourceId?: string;
  categorySlug?: string;
  language?: string;
  country?: string;
  from?: Date;
  to?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Keyword-based category classification
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  technology: [
    "tech", "software", "hardware", "ai", "artificial intelligence",
    "machine learning", "startup", "app", "cyber", "digital", "silicon valley",
    "programming", "algorithm", "cloud computing", "blockchain", "crypto",
    "robot", "automation", "gadget", "smartphone",
  ],
  business: [
    "stock", "market", "economy", "gdp", "trade", "investment", "finance",
    "bank", "revenue", "profit", "merger", "acquisition", "ipo", "startup",
    "entrepreneur", "corporation", "inflation", "recession",
  ],
  politics: [
    "election", "president", "congress", "senate", "parliament", "democrat",
    "republican", "vote", "legislation", "policy", "governor", "mayor",
    "diplomat", "sanction", "government", "political", "campaign",
  ],
  science: [
    "research", "study", "scientist", "nasa", "space", "discovery",
    "experiment", "physics", "biology", "chemistry", "genome", "climate",
    "fossil", "evolution", "quantum", "laboratory",
  ],
  sports: [
    "football", "soccer", "basketball", "tennis", "olympics", "championship",
    "tournament", "league", "nba", "nfl", "fifa", "goal", "match", "coach",
    "athlete", "medal", "cricket", "rugby",
  ],
  health: [
    "health", "medical", "hospital", "vaccine", "disease", "pandemic",
    "doctor", "treatment", "surgery", "mental health", "cancer", "drug",
    "pharmaceutical", "clinical trial", "who", "cdc",
  ],
  culture: [
    "movie", "film", "music", "art", "book", "museum", "festival",
    "theater", "celebrity", "fashion", "entertainment", "oscar", "grammy",
    "exhibition", "concert", "streaming",
  ],
};

// ---------------------------------------------------------------------------
// ArticleService
// ---------------------------------------------------------------------------

export class ArticleService {
  /**
   * Process a single raw article from a feed.
   *
   * - Generates a dedup hash from the normalised source URL.
   * - Skips duplicates (returns false).
   * - Auto-classifies into a category.
   * - Calculates breaking-news score.
   * - Persists the article and returns true.
   */
  async processRawArticle(raw: RawArticle, source: Source): Promise<boolean> {
    // --- Dedup hash ---
    const normalizedUrl = this.normalizeUrl(raw.sourceUrl);
    const dedupHash = crypto
      .createHash("sha256")
      .update(normalizedUrl)
      .digest("hex");

    // Check for existing article with same hash
    const existing = await prisma.article.findUnique({
      where: { dedupHash },
      select: { id: true },
    });

    if (existing) {
      return false;
    }

    // --- Category classification ---
    const categoryId = await this.classifyArticle(raw, source);

    // --- Breaking score ---
    const breakingScore = BreakingDetector.calculateScore(raw, source);

    // --- Persist ---
    await prisma.article.create({
      data: {
        title: raw.title,
        summary: raw.summary ?? null,
        content: raw.content ?? null,
        author: raw.author ?? null,
        publishedAt: raw.publishedAt ?? null,
        sourceUrl: raw.sourceUrl,
        imageUrl: raw.imageUrl ?? null,
        language: source.language,
        country: source.region ?? null,
        tags: raw.tags ?? [],
        breakingScore,
        dedupHash,
        sourceId: source.id,
        categoryId,
      },
    });

    return true;
  }

  /**
   * List articles with optional filters, pagination, and related data.
   */
  async list(
    filters: ArticleFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Article>> {
    const where = this.buildWhereClause(filters);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { source: true, category: true },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single article by ID with source and category.
   */
  async getById(id: string): Promise<Article> {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { source: true, category: true },
    });

    if (!article) {
      throw new AppError("Article not found", 404);
    }

    return article;
  }

  /**
   * Get breaking-news articles (score >= 70) from the last 24 hours.
   */
  async getBreaking(limit: number = 10): Promise<Article[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.article.findMany({
      where: {
        breakingScore: { gte: 70 },
        publishedAt: { gte: since },
      },
      include: { source: true, category: true },
      orderBy: [
        { breakingScore: "desc" },
        { publishedAt: "desc" },
      ],
      take: limit,
    });
  }

  /**
   * Get articles by category slug with pagination.
   */
  async getByCategory(
    categorySlug: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Article>> {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });

    if (!category) {
      throw new AppError(`Category "${categorySlug}" not found`, 404);
    }

    const where = { categoryId: category.id };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { source: true, category: true },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get trending articles: recent articles ordered by breaking score.
   */
  async getTrending(limit: number = 10): Promise<Article[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.article.findMany({
      where: {
        publishedAt: { gte: since },
      },
      include: { source: true, category: true },
      orderBy: [
        { breakingScore: "desc" },
        { publishedAt: "desc" },
      ],
      take: limit,
    });
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Normalize a URL for dedup hashing:
   * - Lowercase the whole URL
   * - Strip query string and hash fragment
   * - Strip trailing slashes
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Rebuild without search params and hash
      let normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      // Remove trailing slashes
      normalized = normalized.replace(/\/+$/, "");
      return normalized.toLowerCase();
    } catch {
      // If URL parsing fails, do basic normalisation
      return url.toLowerCase().split("?")[0].split("#")[0].replace(/\/+$/, "");
    }
  }

  /**
   * Classify an article into a category.
   *
   * Priority:
   * 1. Use the source's default category (if set and matching a DB category).
   * 2. Fall back to keyword-based classification from title + summary.
   * 3. Return null if no match is found.
   */
  private async classifyArticle(
    raw: RawArticle,
    source: Source
  ): Promise<string | null> {
    // 1. Check source-level category
    if (source.category) {
      const category = await prisma.category.findUnique({
        where: { slug: source.category },
        select: { id: true },
      });
      if (category) {
        return category.id;
      }
    }

    // 2. Keyword-based classification
    const text = `${raw.title} ${raw.summary ?? ""}`.toLowerCase();
    let bestSlug: string | null = null;
    let bestCount = 0;

    for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let count = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          count++;
        }
      }
      if (count > bestCount) {
        bestCount = count;
        bestSlug = slug;
      }
    }

    if (bestSlug && bestCount >= 2) {
      const category = await prisma.category.findUnique({
        where: { slug: bestSlug },
        select: { id: true },
      });
      if (category) {
        return category.id;
      }
    }

    return null;
  }

  /**
   * Build a Prisma `where` clause from article filters.
   */
  private buildWhereClause(filters: ArticleFilters) {
    const where: Record<string, unknown> = {};

    if (filters.sourceId) {
      where.sourceId = filters.sourceId;
    }

    if (filters.categorySlug) {
      where.category = { slug: filters.categorySlug };
    }

    if (filters.language) {
      where.language = filters.language;
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.from || filters.to) {
      const publishedAt: Record<string, Date> = {};
      if (filters.from) publishedAt.gte = filters.from;
      if (filters.to) publishedAt.lte = filters.to;
      where.publishedAt = publishedAt;
    }

    return where;
  }
}
