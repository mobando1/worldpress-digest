-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('RSS', 'API', 'SCRAPE');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR', 'DISABLED');

-- CreateEnum
CREATE TYPE "FetchLogStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "rssUrl" TEXT,
    "type" "SourceType" NOT NULL DEFAULT 'RSS',
    "region" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "category" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "SourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastFetchedAt" TIMESTAMP(3),
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "icon" TEXT NOT NULL DEFAULT 'newspaper',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "country" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "breakingScore" INTEGER NOT NULL DEFAULT 0,
    "dedupHash" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sourceId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minBreakingScore" INTEGER NOT NULL DEFAULT 0,
    "channels" JSONB NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "alertRuleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fetch_logs" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "articlesFound" INTEGER NOT NULL DEFAULT 0,
    "articlesNew" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "status" "FetchLogStatus" NOT NULL DEFAULT 'RUNNING',
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "fetch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AlertRuleToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AlertRuleToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sources_slug_key" ON "sources"("slug");

-- CreateIndex
CREATE INDEX "sources_enabled_status_idx" ON "sources"("enabled", "status");

-- CreateIndex
CREATE INDEX "sources_type_idx" ON "sources"("type");

-- CreateIndex
CREATE INDEX "sources_region_idx" ON "sources"("region");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_sortOrder_idx" ON "categories"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "articles_sourceUrl_key" ON "articles"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "articles_dedupHash_key" ON "articles"("dedupHash");

-- CreateIndex
CREATE INDEX "articles_publishedAt_idx" ON "articles"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "articles_sourceId_publishedAt_idx" ON "articles"("sourceId", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "articles_categoryId_publishedAt_idx" ON "articles"("categoryId", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "articles_breakingScore_publishedAt_idx" ON "articles"("breakingScore" DESC, "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "articles_language_idx" ON "articles"("language");

-- CreateIndex
CREATE INDEX "articles_country_idx" ON "articles"("country");

-- CreateIndex
CREATE INDEX "articles_fetchedAt_idx" ON "articles"("fetchedAt" DESC);

-- CreateIndex
CREATE INDEX "alert_rules_userId_enabled_idx" ON "alert_rules"("userId", "enabled");

-- CreateIndex
CREATE INDEX "notifications_userId_status_idx" ON "notifications"("userId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_alertRuleId_idx" ON "notifications"("alertRuleId");

-- CreateIndex
CREATE INDEX "fetch_logs_sourceId_startedAt_idx" ON "fetch_logs"("sourceId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "fetch_logs_status_idx" ON "fetch_logs"("status");

-- CreateIndex
CREATE INDEX "_AlertRuleToCategory_B_index" ON "_AlertRuleToCategory"("B");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_alertRuleId_fkey" FOREIGN KEY ("alertRuleId") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fetch_logs" ADD CONSTRAINT "fetch_logs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertRuleToCategory" ADD CONSTRAINT "_AlertRuleToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertRuleToCategory" ADD CONSTRAINT "_AlertRuleToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
