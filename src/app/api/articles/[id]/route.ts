import { NextRequest, NextResponse } from "next/server";
import { ArticleService } from "@/services/ArticleService";
import { errorResponse } from "@/lib/errors";

const articleService = new ArticleService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // getById throws AppError(404) if not found
    const article = await articleService.getById(id);

    return NextResponse.json({ data: article });
  } catch (error) {
    return errorResponse(error);
  }
}
