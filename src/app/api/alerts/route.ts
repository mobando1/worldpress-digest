import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/middleware";
import { createAlertRuleSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const rules = await prisma.alertRule.findMany({
      where: { userId: user.id },
      include: { categories: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: rules });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = createAlertRuleSchema.parse(body);

    const { categoryIds, ...ruleData } = data;

    const rule = await prisma.alertRule.create({
      data: {
        ...ruleData,
        channels: ruleData.channels,
        userId: user.id,
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
      },
      include: { categories: true },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
