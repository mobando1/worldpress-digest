import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  AlertRule,
  Article,
  Notification,
  NotificationStatus,
} from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// NotificationService
// ---------------------------------------------------------------------------

export class NotificationService {
  /**
   * Evaluate recently fetched articles against all enabled alert rules.
   *
   * Looks at articles created in the last 15 minutes and checks each one
   * against every enabled AlertRule. When a match is found, an IN_APP
   * notification is created (avoiding duplicates).
   */
  static async evaluateNewArticles(): Promise<number> {
    const since = new Date(Date.now() - 15 * 60 * 1000);

    // Get recent articles with their categories
    const recentArticles = await prisma.article.findMany({
      where: {
        createdAt: { gte: since },
      },
      include: {
        category: { select: { id: true, slug: true } },
      },
    });

    if (recentArticles.length === 0) {
      return 0;
    }

    // Get all enabled alert rules with their categories
    const alertRules = await prisma.alertRule.findMany({
      where: { enabled: true },
      include: {
        categories: { select: { id: true, slug: true } },
      },
    });

    if (alertRules.length === 0) {
      return 0;
    }

    let notificationsCreated = 0;

    for (const article of recentArticles) {
      for (const rule of alertRules) {
        if (this.articleMatchesRule(article, rule)) {
          // Check if a notification already exists for this article + rule combo
          const existing = await prisma.notification.findFirst({
            where: {
              articleId: article.id,
              alertRuleId: rule.id,
              userId: rule.userId,
            },
            select: { id: true },
          });

          if (!existing) {
            await prisma.notification.create({
              data: {
                channel: "IN_APP",
                status: "PENDING",
                userId: rule.userId,
                articleId: article.id,
                alertRuleId: rule.id,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    return notificationsCreated;
  }

  /**
   * Determine whether an article matches an alert rule.
   *
   * A match requires ALL of the following conditions that are configured:
   * 1. Breaking score is >= the rule's minBreakingScore (if > 0).
   * 2. Article's category is in the rule's category list (if categories set).
   * 3. At least one of the rule's keywords appears in the article title or
   *    summary (if keywords are set).
   */
  static articleMatchesRule(
    article: Article & { category?: { id: string; slug: string } | null },
    rule: AlertRule & { categories: { id: string; slug: string }[] }
  ): boolean {
    // 1. Breaking score threshold
    if (rule.minBreakingScore > 0) {
      if (article.breakingScore < rule.minBreakingScore) {
        return false;
      }
    }

    // 2. Category match
    if (rule.categories.length > 0) {
      if (!article.categoryId) {
        return false;
      }
      const ruleCategoryIds = rule.categories.map((c) => c.id);
      if (!ruleCategoryIds.includes(article.categoryId)) {
        return false;
      }
    }

    // 3. Keyword match
    if (rule.keywords.length > 0) {
      const searchText =
        `${article.title} ${article.summary ?? ""}`.toLowerCase();

      const hasKeywordMatch = rule.keywords.some((keyword) =>
        searchText.includes(keyword.toLowerCase())
      );

      if (!hasKeywordMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get paginated notifications for a user.
   * Includes the related article and alert rule for context.
   */
  static async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedNotifications> {
    const skip = (page - 1) * limit;

    const where = { userId };

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          article: {
            include: {
              source: { select: { id: true, name: true, slug: true } },
              category: true,
            },
          },
          alertRule: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mark a notification as read.
   *
   * Verifies that the notification belongs to the specified user before
   * updating, to prevent unauthorized access.
   */
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<Notification> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    if (notification.userId !== userId) {
      throw new AppError("Not authorized to update this notification", 403);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "READ" as NotificationStatus,
      },
    });
  }
}
