import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware";
import { DigestService } from "@/services/DigestService";
import { EmailService } from "@/services/EmailService";
import { errorResponse } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const edition = await DigestService.generateDailyDigest();

    // Optionally send emails immediately
    let sendEmails = false;
    try {
      const body = await request.json();
      sendEmails = body?.sendEmails === true;
    } catch {
      // No body is fine
    }

    let sentCount = 0;
    if (sendEmails) {
      sentCount = await EmailService.sendDigest(edition);
    }

    return NextResponse.json({
      message: "Digest generated successfully",
      edition: {
        id: edition.id,
        date: edition.date,
        subject: edition.subject,
        status: edition.status,
        articleCount: edition.articleIds.length,
      },
      sentCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
