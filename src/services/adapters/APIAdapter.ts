import type { Source } from "@/generated/prisma/client";
import type { RawArticle } from "./RSSAdapter";

// ---------------------------------------------------------------------------
// APIAdapter – placeholder for sources that require direct API integration
// ---------------------------------------------------------------------------

export class APIAdapter {
  /**
   * Fetch articles from an API-based source.
   *
   * This is a placeholder implementation. Each API source will require its
   * own configuration (API keys, endpoints, response mapping, etc.) before
   * it can be used.
   *
   * @throws Always throws with a descriptive message indicating the source
   *         needs manual API configuration.
   */
  async fetch(source: Source): Promise<RawArticle[]> {
    throw new Error(
      `API adapter not configured for source ${source.name} (${source.slug}). ` +
        `Please add the required API credentials and endpoint mapping in the source config.`
    );
  }
}
