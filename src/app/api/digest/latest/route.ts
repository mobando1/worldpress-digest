import { NextResponse } from "next/server";
import { DigestService } from "@/services/DigestService";
import { errorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const edition = await DigestService.getLatest();

    if (!edition) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data: edition });
  } catch (error) {
    return errorResponse(error);
  }
}
