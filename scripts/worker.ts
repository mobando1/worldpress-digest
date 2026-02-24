import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// We import dynamically to allow the services to use the @/ alias
// In the worker context, we use direct relative imports
async function loadServices() {
  // For the worker, we need to use the services directly
  // Since tsx handles TypeScript, we can import from source
  const { FetchService } = await import("../src/services/FetchService");
  const { NotificationService } = await import("../src/services/NotificationService");
  return { FetchService, NotificationService };
}

async function startWorker() {
  console.log("[Worker] Starting WorldPress Digest worker process...");
  console.log(`[Worker] Time: ${new Date().toISOString()}`);

  const { FetchService } = await loadServices();

  // ─── Primary Fetch Job ─────────────────────────────────
  // Runs every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    const jobId = `fetch-${Date.now()}`;
    console.log(`[Worker][${jobId}] Starting scheduled fetch...`);

    try {
      const results = await FetchService.fetchAll();

      const totalNew = results.reduce((sum, r) => sum + r.articlesNew, 0);
      const totalFound = results.reduce((sum, r) => sum + r.articlesFound, 0);
      const failures = results.filter((r) => r.status === "FAILED").length;

      console.log(
        `[Worker][${jobId}] Fetch complete: ${results.length} sources, ` +
          `${totalFound} found, ${totalNew} new, ${failures} failures`
      );
    } catch (error) {
      console.error(`[Worker][${jobId}] Fetch failed:`, error);
    }
  });

  // ─── Notification Dispatch Job ──────────────────────────
  // Runs every 5 minutes to send pending email/push notifications
  cron.schedule("*/5 * * * *", async () => {
    try {
      const pending = await prisma.notification.findMany({
        where: { status: "PENDING" },
        include: {
          user: { select: { email: true, name: true, preferences: true } },
          article: { select: { title: true, sourceUrl: true, summary: true } },
        },
        take: 100,
      });

      if (pending.length === 0) return;

      console.log(`[Worker] Processing ${pending.length} pending notifications...`);

      for (const notification of pending) {
        try {
          switch (notification.channel) {
            case "EMAIL":
              // TODO: Implement email sending via SMTP
              console.log(`[Worker] Email notification for: ${notification.article.title}`);
              break;
            case "PUSH":
              // TODO: Implement web push via VAPID
              console.log(`[Worker] Push notification for: ${notification.article.title}`);
              break;
          }

          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: "SENT", sentAt: new Date() },
          });
        } catch (err) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: "FAILED" },
          });
          console.error(`[Worker] Notification ${notification.id} failed:`, err);
        }
      }
    } catch (error) {
      console.error("[Worker] Notification dispatch error:", error);
    }
  });

  // ─── Cleanup Job ────────────────────────────────────────
  // Runs daily at 3 AM: prune old fetch logs and read notifications
  cron.schedule("0 3 * * *", async () => {
    console.log("[Worker] Running daily cleanup...");

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deletedLogs = await prisma.fetchLog.deleteMany({
      where: { startedAt: { lt: thirtyDaysAgo } },
    });

    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        status: "READ",
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    console.log(
      `[Worker] Cleanup: ${deletedLogs.count} logs, ` +
        `${deletedNotifications.count} notifications removed`
    );
  });

  console.log("[Worker] Cron jobs scheduled:");
  console.log("  - Fetch: every 10 minutes");
  console.log("  - Notifications: every 5 minutes");
  console.log("  - Cleanup: daily at 3 AM");
}

// ─── Graceful Shutdown ──────────────────────────────────
process.on("SIGINT", async () => {
  console.log("[Worker] Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("[Worker] Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

startWorker().catch((err) => {
  console.error("[Worker] Failed to start:", err);
  process.exit(1);
});
