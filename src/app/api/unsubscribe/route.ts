import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EmailService } from "@/services/EmailService";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const token = request.nextUrl.searchParams.get("token");

  if (!email || !token) {
    return NextResponse.redirect(`${APP_URL}/?error=invalid-unsubscribe`);
  }

  // Verify token
  if (!EmailService.verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(`${APP_URL}/?error=invalid-unsubscribe`);
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (subscriber && subscriber.status !== "UNSUBSCRIBED") {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED" },
    });
  }

  return NextResponse.redirect(`${APP_URL}/unsubscribe/done`);
}
