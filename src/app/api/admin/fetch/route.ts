import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import { FetchService } from "@/services/FetchService";
import { errorResponse } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    // Optional body with sourceId for single-source fetch
    let sourceId: string | undefined;

    try {
      const body = await request.json();
      sourceId = body?.sourceId;
    } catch {
      // Empty body is fine -- fetch all sources
    }

    const fetchService = new FetchService();

    if (sourceId) {
      const result = await fetchService.fetchSource(sourceId);
      return NextResponse.json({ results: [result] });
    }

    const results = await fetchService.fetchAll();
    return NextResponse.json({ results });
  } catch (error) {
    return errorResponse(error);
  }
}
