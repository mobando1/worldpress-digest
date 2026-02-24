import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import { SourceService } from "@/services/SourceService";
import { createSourceSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/errors";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;

    const params = {
      type: searchParams.get("type") ?? undefined,
      region: searchParams.get("region") ?? undefined,
      enabled:
        searchParams.get("enabled") !== null
          ? searchParams.get("enabled") === "true"
          : undefined,
      status: searchParams.get("status") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1", 10) || 1,
      limit: Math.min(
        parseInt(searchParams.get("limit") ?? "50", 10) || 50,
        100
      ),
    };

    const result = await SourceService.listAll(params);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const data = createSourceSchema.parse(body);

    // Transform rssUrl empty string to null for DB storage
    const { config, ...rest } = data;
    const sourceData = {
      ...rest,
      rssUrl: data.rssUrl || null,
      config: (config ?? {}) as Prisma.InputJsonValue,
    };

    const source = await SourceService.create(sourceData);

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
