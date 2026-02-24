import { NextRequest, NextResponse } from "next/server";
import { ArticleService } from "@/services/ArticleService";
import { errorResponse } from "@/lib/errors";

const articleService = new ArticleService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const limitParam = searchParams.get("limit");
    let limit = 10;

    if (limitParam) {
      limit = Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 50);
    }

    const articles = await articleService.getBreaking(limit);

    return NextResponse.json({ data: articles });
  } catch (error) {
    return errorResponse(error);
  }
}
