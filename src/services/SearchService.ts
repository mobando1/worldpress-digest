import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchFilters {
  categorySlug?: string;
  sourceId?: string;
  language?: string;
  country?: string;
  from?: Date;
  to?: Date;
}

export interface SearchResultItem {
  id: string;
  title: string;
  summary: string | null;
  author: string | null;
  publishedAt: Date | null;
  sourceUrl: string;
  imageUrl: string | null;
  breakingScore: number;
  relevance: number;
  sourceName: string;
  categoryName: string | null;
  categoryColor: string | null;
}

export interface SearchResult {
  data: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
}

// ---------------------------------------------------------------------------
// SearchService
// ---------------------------------------------------------------------------

export class SearchService {
  /**
   * Full-text search across articles using PostgreSQL FTS with ts_rank.
   *
   * Builds a dynamic WHERE clause based on the supplied filters and uses
   * `to_tsquery` with `ts_rank` for relevance-based ordering.
   */
  static async search(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<SearchResult> {
    if (!query || query.trim().length === 0) {
      throw new AppError("Search query cannot be empty", 400);
    }

    const sanitizedQuery = this.sanitizeQuery(query);
    const offset = (page - 1) * limit;

    // Build WHERE conditions dynamically
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Full-text search condition
    conditions.push(
      `(to_tsvector('english', coalesce(a."title", '') || ' ' || coalesce(a."summary", '') || ' ' || coalesce(a."content", '')) @@ to_tsquery('english', $${paramIndex}))`
    );
    params.push(sanitizedQuery);
    paramIndex++;

    // Optional filters
    if (filters.sourceId) {
      conditions.push(`a."sourceId" = $${paramIndex}`);
      params.push(filters.sourceId);
      paramIndex++;
    }

    if (filters.categorySlug) {
      conditions.push(`c."slug" = $${paramIndex}`);
      params.push(filters.categorySlug);
      paramIndex++;
    }

    if (filters.language) {
      conditions.push(`a."language" = $${paramIndex}`);
      params.push(filters.language);
      paramIndex++;
    }

    if (filters.country) {
      conditions.push(`a."country" = $${paramIndex}`);
      params.push(filters.country);
      paramIndex++;
    }

    if (filters.from) {
      conditions.push(`a."publishedAt" >= $${paramIndex}`);
      params.push(filters.from);
      paramIndex++;
    }

    if (filters.to) {
      conditions.push(`a."publishedAt" <= $${paramIndex}`);
      params.push(filters.to);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // Count query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM articles a
      LEFT JOIN categories c ON a."categoryId" = c."id"
      LEFT JOIN sources s ON a."sourceId" = s."id"
      WHERE ${whereClause}
    `;

    // Data query with relevance ranking
    const dataSql = `
      SELECT
        a."id",
        a."title",
        a."summary",
        a."author",
        a."publishedAt",
        a."sourceUrl",
        a."imageUrl",
        a."breakingScore",
        ts_rank(
          to_tsvector('english', coalesce(a."title", '') || ' ' || coalesce(a."summary", '') || ' ' || coalesce(a."content", '')),
          to_tsquery('english', $1)
        ) AS relevance,
        s."name" AS "sourceName",
        c."name" AS "categoryName",
        c."color" AS "categoryColor"
      FROM articles a
      LEFT JOIN categories c ON a."categoryId" = c."id"
      LEFT JOIN sources s ON a."sourceId" = s."id"
      WHERE ${whereClause}
      ORDER BY relevance DESC, a."publishedAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Execute both queries
    const [countResult, dataResult] = await Promise.all([
      prisma.$queryRawUnsafe<[{ total: number }]>(countSql, ...params.slice(0, -2)),
      prisma.$queryRawUnsafe<SearchResultItem[]>(dataSql, ...params),
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      data: dataResult,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query,
    };
  }

  /**
   * Sanitize a user query for use with PostgreSQL `to_tsquery`.
   *
   * - Strips special tsquery characters
   * - Joins words with `&` (AND) for a strict match
   * - Falls back to a plain prefix match for single words
   */
  private static sanitizeQuery(query: string): string {
    // Remove characters that have special meaning in tsquery
    const cleaned = query
      .replace(/[!&|():*<>'"\\]/g, " ")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (cleaned.length === 0) {
      return "''";
    }

    // Join with AND operator; append :* for prefix matching on last word
    return cleaned
      .map((word, i) => (i === cleaned.length - 1 ? `${word}:*` : word))
      .join(" & ");
  }
}
