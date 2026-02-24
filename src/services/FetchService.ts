import { prisma } from "@/lib/db";
import type { Source, SourceType } from "@prisma/client";
import { RSSAdapter } from "./adapters/RSSAdapter";
import { APIAdapter } from "./adapters/APIAdapter";
import { ScrapeAdapter } from "./adapters/ScrapeAdapter";
import type { RawArticle } from "./adapters/RSSAdapter";
import { ArticleService } from "./ArticleService";
import { SourceService } from "./SourceService";
import { NotificationService } from "./NotificationService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FetchResult {
  sourceId: string;
  sourceName: string;
  status: "success" | "partial" | "failed";
  articlesFound: number;
  articlesNew: number;
  errors: string[];
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

interface Adapter {
  fetch(source: Source): Promise<RawArticle[]>;
}

// ---------------------------------------------------------------------------
// FetchService
// ---------------------------------------------------------------------------

const CONCURRENCY_LIMIT = 5;

export class FetchService {
  private rssAdapter: RSSAdapter;
  private apiAdapter: APIAdapter;
  private scrapeAdapter: ScrapeAdapter;
  private articleService: ArticleService;

  constructor() {
    this.rssAdapter = new RSSAdapter();
    this.apiAdapter = new APIAdapter();
    this.scrapeAdapter = new ScrapeAdapter();
    this.articleService = new ArticleService();
  }

  /**
   * Fetch articles from all enabled sources.
   * Processes sources in batches to respect the concurrency limit.
   */
  async fetchAll(): Promise<FetchResult[]> {
    const sources = await SourceService.listEnabled();
    const results: FetchResult[] = [];

    // Process in batches of CONCURRENCY_LIMIT
    for (let i = 0; i < sources.length; i += CONCURRENCY_LIMIT) {
      const batch = sources.slice(i, i + CONCURRENCY_LIMIT);
      const batchResults = await Promise.allSettled(
        batch.map((source) => this.fetchSource(source.id))
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        }
        // Rejected promises should not happen because fetchSource catches
        // its own errors, but handle gracefully just in case.
      }
    }

    // After all fetches complete, evaluate new articles for notifications
    try {
      await NotificationService.evaluateNewArticles();
    } catch (error) {
      console.error(
        "[FetchService] Failed to evaluate notifications:",
        error instanceof Error ? error.message : error
      );
    }

    return results;
  }

  /**
   * Fetch articles from a single source by ID.
   *
   * Creates a FetchLog record, runs the appropriate adapter, processes each
   * raw article through ArticleService, and updates the FetchLog and Source
   * status when done.
   */
  async fetchSource(sourceId: string): Promise<FetchResult> {
    const start = Date.now();
    const errors: string[] = [];

    // Load the source
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Create a FetchLog entry
    const fetchLog = await prisma.fetchLog.create({
      data: {
        sourceId: source.id,
        status: "RUNNING",
      },
    });

    let articlesFound = 0;
    let articlesNew = 0;

    try {
      // Get the right adapter
      const adapter = this.getAdapter(source.type);

      // Fetch raw articles
      const rawArticles = await adapter.fetch(source);
      articlesFound = rawArticles.length;

      // Process each article
      for (const raw of rawArticles) {
        try {
          const isNew = await this.articleService.processRawArticle(raw, source);
          if (isNew) {
            articlesNew++;
          }
        } catch (articleError) {
          const message =
            articleError instanceof Error
              ? articleError.message
              : String(articleError);
          errors.push(`Article "${raw.title}": ${message}`);
        }
      }

      // Determine final status
      const status =
        errors.length === 0
          ? "SUCCESS"
          : errors.length < articlesFound
            ? "PARTIAL"
            : "FAILED";

      // Update FetchLog
      await prisma.fetchLog.update({
        where: { id: fetchLog.id },
        data: {
          completedAt: new Date(),
          articlesFound,
          articlesNew,
          errors: errors.length > 0 ? errors : [],
          status: status as "SUCCESS" | "PARTIAL" | "FAILED",
        },
      });

      // Update source status
      if (status === "FAILED") {
        await SourceService.markError(source.id);
      } else {
        await SourceService.markFetched(source.id);
      }

      return {
        sourceId: source.id,
        sourceName: source.name,
        status: status.toLowerCase() as FetchResult["status"],
        articlesFound,
        articlesNew,
        errors,
        durationMs: Date.now() - start,
      };
    } catch (fetchError) {
      // Complete failure -- the adapter itself threw
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : String(fetchError);
      errors.push(message);

      // Update FetchLog as FAILED
      await prisma.fetchLog.update({
        where: { id: fetchLog.id },
        data: {
          completedAt: new Date(),
          articlesFound: 0,
          articlesNew: 0,
          errors,
          status: "FAILED",
        },
      });

      // Mark source as errored
      await SourceService.markError(source.id);

      return {
        sourceId: source.id,
        sourceName: source.name,
        status: "failed",
        articlesFound: 0,
        articlesNew: 0,
        errors,
        durationMs: Date.now() - start,
      };
    }
  }

  /**
   * Return the appropriate adapter for a given source type.
   */
  private getAdapter(type: SourceType): Adapter {
    switch (type) {
      case "RSS":
        return this.rssAdapter;
      case "API":
        return this.apiAdapter;
      case "SCRAPE":
        return this.scrapeAdapter;
      default:
        throw new Error(`Unknown source type: ${type}`);
    }
  }
}
