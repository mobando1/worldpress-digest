import Parser from "rss-parser";
import type { Source } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Shared interface for raw articles coming from any adapter
// ---------------------------------------------------------------------------

export interface RawArticle {
  title: string;
  summary?: string;
  content?: string;
  author?: string;
  publishedAt?: Date;
  sourceUrl: string;
  imageUrl?: string;
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Custom RSS item fields we want the parser to extract
// ---------------------------------------------------------------------------

interface CustomFeed {
  // no extra feed-level fields needed
}

interface CustomItem {
  "media:content"?: { $: { url?: string } };
  "media:thumbnail"?: { $: { url?: string } };
  enclosure?: { url?: string };
  contentSnippet?: string;
  content?: string;
  "content:encoded"?: string;
  categories?: string[];
  creator?: string;
}

// ---------------------------------------------------------------------------
// RSSAdapter
// ---------------------------------------------------------------------------

const MAX_CONTENT_LENGTH = 1000;

export class RSSAdapter {
  private parser: Parser<CustomFeed, CustomItem>;

  constructor() {
    this.parser = new Parser<CustomFeed, CustomItem>({
      timeout: 15_000,
      headers: {
        "User-Agent": "WorldPressDigest/1.0",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      customFields: {
        item: [
          ["media:content", "media:content"],
          ["media:thumbnail", "media:thumbnail"],
          ["content:encoded", "content:encoded"],
        ],
      },
    });
  }

  /**
   * Fetch and parse an RSS feed for a given source.
   * Returns an array of RawArticle objects ready for processing.
   */
  async fetch(source: Source): Promise<RawArticle[]> {
    const feedUrl = source.rssUrl ?? source.url;

    const feed = await this.parser.parseURL(feedUrl);
    const articles: RawArticle[] = [];

    for (const item of feed.items) {
      // Skip items that lack the minimum required fields
      if (!item.link || !item.title) {
        continue;
      }

      const title = item.title.trim();
      if (title.length === 0) {
        continue;
      }

      // Determine image URL: prefer media:content > media:thumbnail > enclosure
      const imageUrl = this.extractImage(item);

      // Summary from contentSnippet (plain-text version of description)
      const summary = item.contentSnippet?.trim() || undefined;

      // Content: prefer content:encoded, fall back to content field
      let content =
        (item["content:encoded"] as string | undefined)?.trim() ||
        item.content?.trim() ||
        undefined;

      if (content && content.length > MAX_CONTENT_LENGTH) {
        content = content.slice(0, MAX_CONTENT_LENGTH);
      }

      // Author
      const author =
        (item.creator as string | undefined)?.trim() ||
        item.creator ||
        undefined;

      // Published date
      let publishedAt: Date | undefined;
      if (item.pubDate || item.isoDate) {
        const parsed = new Date(item.isoDate ?? item.pubDate!);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed;
        }
      }

      // Tags from categories
      const tags: string[] = [];
      if (item.categories && Array.isArray(item.categories)) {
        for (const cat of item.categories) {
          const tag = typeof cat === "string" ? cat.trim() : String(cat).trim();
          if (tag.length > 0) {
            tags.push(tag);
          }
        }
      }

      articles.push({
        title,
        summary,
        content,
        author,
        publishedAt,
        sourceUrl: item.link,
        imageUrl,
        tags: tags.length > 0 ? tags : undefined,
      });
    }

    return articles;
  }

  /**
   * Extract the best available image URL from the RSS item.
   * Checks media:content, media:thumbnail, and enclosure in that order.
   */
  private extractImage(item: CustomItem): string | undefined {
    // media:content
    const mediaContent = item["media:content"];
    if (mediaContent?.$?.url) {
      return mediaContent.$.url;
    }

    // media:thumbnail
    const mediaThumbnail = item["media:thumbnail"];
    if (mediaThumbnail?.$?.url) {
      return mediaThumbnail.$.url;
    }

    // enclosure (commonly used for podcast/media attachments)
    if (item.enclosure?.url) {
      return item.enclosure.url;
    }

    return undefined;
  }
}
