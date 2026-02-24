import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EmailService } from "@/services/EmailService";
import { errorResponse } from "@/lib/errors";
import crypto from "crypto";

async function trySendConfirmation(subscriber: { id: string; email: string; name: string | null; confirmToken: string | null }) {
  try {
    await EmailService.sendConfirmation(subscriber as Parameters<typeof EmailService.sendConfirmation>[0]);
  } catch (err) {
    console.error(
      `[Subscribe] Failed to send confirmation email to ${subscriber.email}:`,
      err instanceof Error ? err.message : err
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json({
          message: "You're already subscribed!",
        });
      }

      if (existing.status === "PENDING") {
        // Resend confirmation (non-blocking)
        trySendConfirmation(existing);
        return NextResponse.json({
          message: "Check your email to confirm your subscription.",
        });
      }

      // Re-subscribe (was UNSUBSCRIBED)
      const confirmToken = crypto.randomUUID();
      const updated = await prisma.subscriber.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          confirmToken,
          name: name || existing.name,
        },
      });

      trySendConfirmation(updated);
      return NextResponse.json({
        message: "Check your email to confirm your subscription.",
      });
    }

    // Create new subscriber
    const confirmToken = crypto.randomUUID();
    const subscriber = await prisma.subscriber.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name || null,
        status: "PENDING",
        confirmToken,
      },
    });

    trySendConfirmation(subscriber);

    return NextResponse.json({
      message: "Check your email to confirm your subscription.",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
