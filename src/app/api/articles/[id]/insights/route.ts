import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import type { Prisma } from "@prisma/client";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `You are an expert news analyst and educator. Given a news article, generate educational insights to help the reader understand the full context.

Respond with ONLY valid JSON:
{
  "educationalSummary": "2-3 sentences explaining WHY this matters in simple terms",
  "historicalContext": "2-3 sentences connecting this to historical events or ongoing trends",
  "actionableInsight": "1 concrete action the reader can take based on this news",
  "keyTerms": [
    { "term": "Term Name", "definition": "Brief 1-sentence definition" }
  ]
}

Keep keyTerms to 3-5 important terms that help understand the article. Write in the same language as the article.`;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        source: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check cache in metadata
    const metadata = (article.metadata as Record<string, unknown>) || {};
    if (metadata.insights) {
      return NextResponse.json({ data: metadata.insights, cached: true });
    }

    // Generate with Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI insights not available" },
        { status: 503 }
      );
    }

    const userPrompt = `Article Title: ${article.title}
Source: ${article.source.name}
Category: ${article.category?.name || "General"}
Summary: ${article.summary || "N/A"}
Content: ${(article.content || article.summary || "").slice(0, 3000)}`;

    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const insights = JSON.parse(textBlock.text.trim());

    // Cache in metadata
    await prisma.article.update({
      where: { id },
      data: {
        metadata: { ...metadata, insights } as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ data: insights, cached: false });
  } catch (error) {
    return errorResponse(error);
  }
}
