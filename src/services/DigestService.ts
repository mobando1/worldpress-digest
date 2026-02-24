import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import type { Article, DigestEdition, Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DigestStory {
  articleId: string;
  headline: string;
  educationalSummary: string;
  historicalContext: string;
  actionableInsight: string;
  connectedTo: string[];
  category?: string;
}

export interface DigestContent {
  subject: string;
  bigPicture: string;
  stories: DigestStory[];
}

// ---------------------------------------------------------------------------
// DigestService
// ---------------------------------------------------------------------------

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `You are an expert news analyst and educator for WorldPress Digest, an AI-powered educational newsletter.

Your mission: Help readers not just know WHAT happened, but understand WHY it matters, HOW it connects to other events, and WHAT they can do about it.

For each story you must provide:
1. **Educational Summary**: A concise 2-3 sentence summary that explains the news in accessible language, adding context that helps the reader truly understand the situation.
2. **Historical Context**: 1-2 sentences connecting this event to historical precedents or ongoing trends. Help the reader see the bigger timeline.
3. **Actionable Insight**: 1 concrete, practical piece of advice the reader can act on. For economic news this might be financial advice; for political news, civic actions; for tech news, tools to try; for health news, lifestyle changes.
4. **Connected To**: List the headlines of other stories in this digest that relate to this one (by theme, region, cause-effect, etc).

You must also provide:
- **Subject**: An engaging email subject line (under 60 chars) that captures the day's most important theme.
- **Big Picture**: A 3-4 sentence paragraph that weaves together the day's stories into a coherent narrative, helping readers see patterns and connections across topics.

IMPORTANT: Respond ONLY with valid JSON matching this exact structure:
{
  "subject": "string",
  "bigPicture": "string",
  "stories": [
    {
      "articleId": "string (the ID provided)",
      "headline": "string (rewritten for clarity)",
      "educationalSummary": "string",
      "historicalContext": "string",
      "actionableInsight": "string",
      "connectedTo": ["headline of related story"],
      "category": "string"
    }
  ]
}`;

export class DigestService {
  /**
   * Generate the daily digest edition.
   * Selects top articles, calls Claude for analysis, stores result.
   */
  static async generateDailyDigest(): Promise<DigestEdition> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if we already generated today's digest
    const existing = await prisma.digestEdition.findUnique({
      where: { date: today },
    });

    if (existing && existing.status !== "FAILED") {
      return existing;
    }

    // Create or update the edition record
    const edition = existing
      ? await prisma.digestEdition.update({
          where: { id: existing.id },
          data: { status: "GENERATING" },
        })
      : await prisma.digestEdition.create({
          data: {
            date: today,
            subject: "Generating...",
            htmlContent: "",
            status: "GENERATING",
          },
        });

    try {
      // Select top articles
      const articles = await this.selectArticles();

      if (articles.length === 0) {
        await prisma.digestEdition.update({
          where: { id: edition.id },
          data: {
            status: "FAILED",
            subject: "No articles available",
          },
        });
        throw new Error("No articles available for digest generation");
      }

      // Call Claude for educational analysis
      const digestContent = await this.callClaude(articles);

      // Build HTML from the structured content
      const htmlContent = this.buildHtml(digestContent);

      // Update edition with generated content
      const updated = await prisma.digestEdition.update({
        where: { id: edition.id },
        data: {
          subject: digestContent.subject,
          htmlContent,
          jsonContent: digestContent as unknown as Prisma.InputJsonValue,
          articleIds: articles.map((a) => a.id),
          status: "READY",
          generatedAt: new Date(),
        },
      });

      return updated;
    } catch (error) {
      // Mark as failed if not already
      await prisma.digestEdition.update({
        where: { id: edition.id },
        data: {
          status: "FAILED",
          subject:
            error instanceof Error
              ? error.message.slice(0, 200)
              : "Generation failed",
        },
      });
      throw error;
    }
  }

  /**
   * Get the most recent READY or SENT digest.
   */
  static async getLatest(): Promise<DigestEdition | null> {
    return prisma.digestEdition.findFirst({
      where: { status: { in: ["READY", "SENT"] } },
      orderBy: { date: "desc" },
    });
  }

  /**
   * Get a specific digest by ID.
   */
  static async getById(id: string): Promise<DigestEdition | null> {
    return prisma.digestEdition.findUnique({
      where: { id },
    });
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Select the top 6-8 articles from the last 24 hours,
   * prioritizing by breaking score and ensuring category diversity.
   */
  private static async selectArticles(): Promise<
    (Article & { source: { name: string }; category: { name: string; slug: string } | null })[]
  > {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const articles = await prisma.article.findMany({
      where: {
        publishedAt: { gte: since },
      },
      include: {
        source: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: [{ breakingScore: "desc" }, { publishedAt: "desc" }],
      take: 20, // fetch more than needed for diversity
    });

    // Ensure category diversity: max 2 per category
    const selected: typeof articles = [];
    const categoryCount: Record<string, number> = {};

    for (const article of articles) {
      if (selected.length >= 8) break;

      const cat = article.category?.slug || "uncategorized";
      const count = categoryCount[cat] || 0;

      if (count < 2) {
        selected.push(article);
        categoryCount[cat] = count + 1;
      }
    }

    // If we don't have enough, fill from remaining
    if (selected.length < 6) {
      for (const article of articles) {
        if (selected.length >= 6) break;
        if (!selected.find((s) => s.id === article.id)) {
          selected.push(article);
        }
      }
    }

    return selected;
  }

  /**
   * Call Claude API to generate educational analysis of articles.
   */
  private static async callClaude(
    articles: (Article & { source: { name: string }; category: { name: string; slug: string } | null })[]
  ): Promise<DigestContent> {
    const articleInput = articles.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary || "No summary available",
      source: a.source.name,
      category: a.category?.name || "General",
      publishedAt: a.publishedAt?.toISOString() || "Unknown",
    }));

    const userPrompt = `Here are today's top news stories. Analyze them and generate the educational digest.

ARTICLES:
${JSON.stringify(articleInput, null, 2)}

Remember: Respond with ONLY valid JSON matching the required structure.`;

    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude API");
    }

    // Parse JSON response
    const jsonText = textBlock.text.trim();
    const parsed = JSON.parse(jsonText) as DigestContent;

    // Validate structure
    if (!parsed.subject || !parsed.bigPicture || !Array.isArray(parsed.stories)) {
      throw new Error("Invalid digest content structure from Claude API");
    }

    return parsed;
  }

  /**
   * Build an HTML email from the structured digest content.
   */
  private static buildHtml(content: DigestContent): string {
    const storiesHtml = content.stories
      .map(
        (story) => `
      <tr>
        <td style="padding: 24px 0; border-bottom: 1px solid #e5e7eb;">
          ${story.category ? `<span style="display: inline-block; background: #EEF2FF; color: #4338CA; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">${story.category}</span>` : ""}
          <h2 style="margin: 8px 0; font-size: 20px; font-weight: 700; color: #111827; line-height: 1.3;">${story.headline}</h2>
          <p style="margin: 8px 0; font-size: 15px; color: #374151; line-height: 1.6;">${story.educationalSummary}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0;">
            <tr>
              <td style="background: #F9FAFB; border-left: 3px solid #6366F1; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #6366F1; text-transform: uppercase; letter-spacing: 0.5px;">Historical Context</p>
                <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.5;">${story.historicalContext}</p>
              </td>
            </tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0;">
            <tr>
              <td style="background: #ECFDF5; border-left: 3px solid #059669; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">What You Can Do</p>
                <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.5;">${story.actionableInsight}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
      )
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F3F4F6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1E1B4B, #312E81); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">WorldPress Digest</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #C7D2FE;">Your AI-Powered Daily News Education</p>
              <p style="margin: 4px 0 0; font-size: 12px; color: #A5B4FC;">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </td>
          </tr>
          <!-- Big Picture -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: #FEF3C7; border: 1px solid #FCD34D; padding: 20px; border-radius: 8px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px;">The Big Picture</p>
                    <p style="margin: 0; font-size: 15px; color: #78350F; line-height: 1.6;">${content.bigPicture}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Stories -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${storiesHtml}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 32px; text-align: center; border-top: 1px solid #e5e7eb; margin-top: 24px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280;">Generated with AI by WorldPress Digest</p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                <a href="{{unsubscribeUrl}}" style="color: #9CA3AF; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
