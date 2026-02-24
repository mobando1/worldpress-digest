import { NextRequest, NextResponse } from "next/server";
import { ArticleService } from "@/services/ArticleService";
import { SearchService } from "@/services/SearchService";
import { articleFiltersSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/errors";

const articleService = new ArticleService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parse and validate query parameters
    const filters = articleFiltersSchema.parse({
      search: searchParams.get("search") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      sourceId: searchParams.get("sourceId") ?? undefined,
      language: searchParams.get("language") ?? undefined,
      country: searchParams.get("country") ?? undefined,
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    // If a search query is provided, use the search service
    if (filters.search) {
      const result = await SearchService.search(
        filters.search,
        {
          sourceId: filters.sourceId,
          language: filters.language,
          country: filters.country,
          from: filters.fromDate,
          to: filters.toDate,
        },
        filters.page,
        filters.limit,
      );

      return NextResponse.json(result);
    }

    // Otherwise, list articles with filters
    const result = await articleService.list(
      {
        sourceId: filters.sourceId,
        language: filters.language,
        country: filters.country,
        from: filters.fromDate,
        to: filters.toDate,
      },
      filters.page,
      filters.limit
    );

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
