import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Chat is not available" },
        { status: 503 }
      );
    }

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

    const systemPrompt = `You are a helpful news analyst assistant for WorldPress Digest. The user is reading an article and wants to understand it better.

ARTICLE CONTEXT:
Title: ${article.title}
Source: ${article.source.name}
Category: ${article.category?.name || "General"}
Published: ${article.publishedAt?.toISOString() || "Unknown"}
Summary: ${article.summary || "N/A"}
Content: ${(article.content || article.summary || "").slice(0, 4000)}

RULES:
- Answer questions about THIS article specifically
- Be educational and helpful — explain context, implications, and connections
- Keep answers concise (2-4 paragraphs max)
- If asked something unrelated to the article, gently redirect
- Write in the same language the user uses`;

    // Build conversation history
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    const response = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response" }, { status: 500 });
    }

    return NextResponse.json({ reply: textBlock.text });
  } catch (error) {
    return errorResponse(error);
  }
}
