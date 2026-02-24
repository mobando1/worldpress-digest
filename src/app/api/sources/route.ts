import { NextResponse } from "next/server";
import { SourceService } from "@/services/SourceService";
import { errorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const sources = await SourceService.listEnabled();

    return NextResponse.json({ data: sources });
  } catch (error) {
    return errorResponse(error);
  }
}
