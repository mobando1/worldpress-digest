import type { Source } from "@prisma/client";
import type { RawArticle } from "./RSSAdapter";

// ---------------------------------------------------------------------------
// ScrapeAdapter – placeholder for sources that require web scraping
// ---------------------------------------------------------------------------

export class ScrapeAdapter {
  /**
   * Fetch articles by scraping a web source.
   *
   * This is a placeholder implementation. Web scraping requires per-source
   * configuration (selectors, pagination rules, rate limits, etc.) and is
   * not included in the MVP.
   *
   * @throws Always throws with a descriptive message indicating the source
   *         needs manual scraping configuration.
   */
  async fetch(source: Source): Promise<RawArticle[]> {
    throw new Error(
      `Scrape adapter not implemented. Source ${source.name} (${source.slug}) requires manual configuration.`
    );
  }
}
