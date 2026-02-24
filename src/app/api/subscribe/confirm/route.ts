import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/subscribe?error=missing-token`);
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { confirmToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(`${APP_URL}/subscribe?error=invalid-token`);
  }

  if (subscriber.status === "ACTIVE") {
    return NextResponse.redirect(`${APP_URL}/subscribe/confirmed`);
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      status: "ACTIVE",
      confirmToken: null,
      confirmedAt: new Date(),
    },
  });

  return NextResponse.redirect(`${APP_URL}/subscribe/confirmed`);
}
