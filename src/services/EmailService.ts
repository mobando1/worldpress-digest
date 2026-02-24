import { Resend } from "resend";
import { prisma } from "@/lib/db";
import type { DigestEdition, Subscriber } from "@prisma/client";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// EmailService
// ---------------------------------------------------------------------------

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "WorldPress Digest <onboarding@resend.dev>";

export class EmailService {
  /**
   * Send a confirmation email to a new subscriber.
   */
  static async sendConfirmation(subscriber: Subscriber): Promise<void> {
    const confirmUrl = `${APP_URL}/api/subscribe/confirm?token=${subscriber.confirmToken}`;

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: subscriber.email,
      subject: "Confirm your WorldPress Digest subscription",
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #F3F4F6; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #1E1B4B, #312E81); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #FFFFFF;">WorldPress Digest</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center;">
              <h2 style="margin: 0 0 16px; font-size: 20px; color: #111827;">Confirm your subscription</h2>
              <p style="margin: 0 0 24px; font-size: 15px; color: #6B7280; line-height: 1.6;">
                ${subscriber.name ? `Hey ${subscriber.name}! ` : ""}Click below to start receiving your daily AI-powered news digest with educational insights, historical context, and actionable advice.
              </p>
              <a href="${confirmUrl}" style="display: inline-block; background: #4F46E5; color: #FFFFFF; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Confirm Subscription
              </a>
              <p style="margin: 24px 0 0; font-size: 12px; color: #9CA3AF;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  }

  /**
   * Send the digest to all active subscribers.
   * Returns the number of emails sent successfully.
   */
  static async sendDigest(edition: DigestEdition): Promise<number> {
    // Update edition status to SENDING
    await prisma.digestEdition.update({
      where: { id: edition.id },
      data: { status: "SENDING" },
    });

    const subscribers = await prisma.subscriber.findMany({
      where: { status: "ACTIVE" },
    });

    if (subscribers.length === 0) {
      await prisma.digestEdition.update({
        where: { id: edition.id },
        data: { status: "SENT", sentAt: new Date(), sentCount: 0 },
      });
      return 0;
    }

    let sentCount = 0;

    // Send in batches of 10 to avoid rate limits
    for (let i = 0; i < subscribers.length; i += 10) {
      const batch = subscribers.slice(i, i + 10);

      const results = await Promise.allSettled(
        batch.map((subscriber) =>
          this.sendDigestToSubscriber(edition, subscriber)
        )
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          sentCount++;
        } else {
          console.error(
            "[EmailService] Failed to send digest:",
            result.reason
          );
        }
      }

      // Small delay between batches
      if (i + 10 < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Update edition as sent
    await prisma.digestEdition.update({
      where: { id: edition.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentCount,
      },
    });

    return sentCount;
  }

  /**
   * Send the digest email to a single subscriber.
   */
  private static async sendDigestToSubscriber(
    edition: DigestEdition,
    subscriber: Subscriber
  ): Promise<void> {
    // Generate a simple unsubscribe token from email
    const unsubToken = crypto
      .createHash("sha256")
      .update(subscriber.email + (process.env.JWT_SECRET || "salt"))
      .digest("hex")
      .slice(0, 32);

    const unsubscribeUrl = `${APP_URL}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${unsubToken}`;

    // Replace placeholder in HTML
    const html = edition.htmlContent.replace(
      /\{\{unsubscribeUrl\}\}/g,
      unsubscribeUrl
    );

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: subscriber.email,
      subject: edition.subject,
      html,
    });
  }

  /**
   * Verify an unsubscribe token.
   */
  static verifyUnsubscribeToken(email: string, token: string): boolean {
    const expected = crypto
      .createHash("sha256")
      .update(email + (process.env.JWT_SECRET || "salt"))
      .digest("hex")
      .slice(0, 32);

    return token === expected;
  }
}
