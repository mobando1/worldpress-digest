import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { updateAlertRuleSchema } from "@/lib/validators";
import { AppError, errorResponse } from "@/lib/errors";

/**
 * Verify that the alert rule exists and belongs to the authenticated user.
 */
async function getOwnedRule(ruleId: string, userId: string) {
  const rule = await prisma.alertRule.findUnique({
    where: { id: ruleId },
    include: { categories: true },
  });

  if (!rule) {
    throw new AppError("Alert rule not found", 404);
  }

  if (rule.userId !== userId) {
    throw new AppError("Alert rule not found", 404);
  }

  return rule;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const rule = await getOwnedRule(id, user.id);

    return NextResponse.json(rule);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify ownership
    await getOwnedRule(id, user.id);

    const body = await request.json();
    const data = updateAlertRuleSchema.parse(body);

    const { categoryIds, ...ruleData } = data;

    const updateData: Record<string, unknown> = { ...ruleData };

    // If channels are provided, store them as JSON
    if (ruleData.channels) {
      updateData.channels = ruleData.channels;
    }

    // If categoryIds are provided, replace the category connections
    if (categoryIds) {
      updateData.categories = {
        set: categoryIds.map((catId) => ({ id: catId })),
      };
    }

    const updated = await prisma.alertRule.update({
      where: { id },
      data: updateData,
      include: { categories: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Verify ownership
    await getOwnedRule(id, user.id);

    await prisma.alertRule.delete({ where: { id } });

    return NextResponse.json({ message: "Alert rule deleted" });
  } catch (error) {
    return errorResponse(error);
  }
}
