import { NextRequest, NextResponse } from "next/server";
import { DigestService } from "@/services/DigestService";
import { errorResponse } from "@/lib/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const edition = await DigestService.getById(id);

    if (!edition) {
      return NextResponse.json(
        { error: "Digest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: edition });
  } catch (error) {
    return errorResponse(error);
  }
}
