import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import type { Prisma } from "@prisma/client";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const MAX_CHARS = 4500;
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel

function getVoiceId(lang: string): string {
  if (lang === "es") {
    return process.env.ELEVENLABS_VOICE_ID_ES || DEFAULT_VOICE_ID;
  }
  return process.env.ELEVENLABS_VOICE_ID_EN || DEFAULT_VOICE_ID;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTtsText(
  title: string,
  summary: string | null,
  content: string | null
): string {
  const parts = [title];
  if (summary) parts.push(stripHtml(summary));
  if (content && content !== summary) parts.push(stripHtml(content));
  const fullText = parts.join(". ");
  if (fullText.length <= MAX_CHARS) return fullText;
  return fullText.slice(0, MAX_CHARS).trimEnd() + "...";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lang = request.nextUrl.searchParams.get("lang") || "en";

    if (!["en", "es"].includes(lang)) {
      return NextResponse.json(
        { error: "Unsupported language" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "TTS not available", code: "TTS_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const article = await prisma.article.findUnique({ where: { id } });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Check cache
    const metadata = (article.metadata as Record<string, unknown>) || {};
    const ttsCache = (metadata.ttsAudio as Record<string, string>) || {};

    if (ttsCache[lang]) {
      const buffer = Buffer.from(ttsCache[lang], "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // Generate with ElevenLabs
    const text = buildTtsText(article.title, article.summary, article.content);
    const voiceId = getVoiceId(lang);

    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ElevenLabs Error]", response.status, errorText);
      return NextResponse.json(
        { error: "TTS generation failed" },
        { status: 502 }
      );
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    // Cache in metadata
    const updatedTtsCache = { ...ttsCache, [lang]: base64Audio };
    await prisma.article.update({
      where: { id },
      data: {
        metadata: {
          ...metadata,
          ttsAudio: updatedTtsCache,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
