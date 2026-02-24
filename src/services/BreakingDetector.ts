import type { Source } from "@prisma/client";
import type { RawArticle } from "./adapters/RSSAdapter";

// ---------------------------------------------------------------------------
// Keyword weights used for breaking-news scoring
// ---------------------------------------------------------------------------

const KEYWORD_SCORES: Record<string, number> = {
  breaking: 30,
  urgent: 25,
  "just in": 25,
  developing: 20,
  exclusive: 15,
  alert: 20,
  emergency: 25,
  crisis: 15,
  killed: 15,
  attack: 15,
  explosion: 20,
  earthquake: 20,
  tsunami: 25,
  war: 15,
  invasion: 20,
};

const MAX_SCORE = 100;

// ---------------------------------------------------------------------------
// BreakingDetector
// ---------------------------------------------------------------------------

export class BreakingDetector {
  /**
   * Calculate a breaking-news score (0-100) for a raw article.
   *
   * Scoring factors:
   * 1. **Keyword matching** -- keywords found in the title earn full points;
   *    keywords found only in the summary earn half points.
   * 2. **Recency bonus** -- articles published recently get extra points.
   * 3. **Source tier bonus** -- higher-tier sources contribute extra points.
   */
  static calculateScore(raw: RawArticle, source: Source): number {
    let score = 0;

    // ----- 1. Keyword scoring -----
    score += this.keywordScore(raw);

    // ----- 2. Recency bonus -----
    score += this.recencyBonus(raw);

    // ----- 3. Source tier bonus -----
    score += this.sourceTierBonus(source);

    // Cap the score at MAX_SCORE
    return Math.min(score, MAX_SCORE);
  }

  /**
   * Score keywords found in title (full points) and summary (half points).
   * Each keyword is counted at most once: if it appears in both the title
   * and the summary, only the title match (full points) is counted.
   */
  private static keywordScore(raw: RawArticle): number {
    const titleLower = raw.title.toLowerCase();
    const summaryLower = (raw.summary ?? "").toLowerCase();
    let score = 0;

    for (const [keyword, points] of Object.entries(KEYWORD_SCORES)) {
      if (titleLower.includes(keyword)) {
        score += points;
      } else if (summaryLower.includes(keyword)) {
        score += Math.floor(points / 2);
      }
    }

    return score;
  }

  /**
   * Award bonus points based on how recently the article was published.
   * - Published less than 30 minutes ago: +15
   * - Published less than 60 minutes ago: +10
   * - Published less than 180 minutes ago: +5
   * - Older or no publishedAt: +0
   */
  private static recencyBonus(raw: RawArticle): number {
    if (!raw.publishedAt) {
      return 0;
    }

    const ageMs = Date.now() - raw.publishedAt.getTime();
    const ageMinutes = ageMs / (1000 * 60);

    if (ageMinutes < 0) {
      // Future date -- treat as very recent
      return 15;
    }

    if (ageMinutes < 30) return 15;
    if (ageMinutes < 60) return 10;
    if (ageMinutes < 180) return 5;

    return 0;
  }

  /**
   * Award bonus points based on the source's tier (stored in source.config).
   * - Tier 1: +10
   * - Tier 2: +5
   * - Other/missing: +0
   */
  private static sourceTierBonus(source: Source): number {
    const config = source.config as Record<string, unknown> | null;
    if (!config || typeof config !== "object") {
      return 0;
    }

    const tier = config.tier;

    if (tier === 1) return 10;
    if (tier === 2) return 5;

    return 0;
  }
}
