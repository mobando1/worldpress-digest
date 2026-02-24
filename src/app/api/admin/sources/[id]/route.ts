import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import { SourceService } from "@/services/SourceService";
import { updateSourceSchema } from "@/lib/validators";
import { AppError, errorResponse } from "@/lib/errors";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    // Verify source exists
    const existing = await prisma.source.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Source not found", 404);
    }

    const body = await request.json();
    const data = updateSourceSchema.parse(body);

    // Transform rssUrl empty string to null if present
    const updateData = {
      ...data,
      ...(data.rssUrl !== undefined && { rssUrl: data.rssUrl || null }),
    };

    const source = await SourceService.update(id, updateData);

    return NextResponse.json(source);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    // Verify source exists
    const existing = await prisma.source.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Source not found", 404);
    }

    await SourceService.delete(id);

    return NextResponse.json({ message: "Source deleted" });
  } catch (error) {
    return errorResponse(error);
  }
}
