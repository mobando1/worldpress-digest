-- CreateEnum
CREATE TYPE "DigestStatus" AS ENUM ('GENERATING', 'READY', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED');

-- CreateTable
CREATE TABLE "digest_editions" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "jsonContent" JSONB NOT NULL DEFAULT '{}',
    "status" "DigestStatus" NOT NULL DEFAULT 'GENERATING',
    "articleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digest_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'PENDING',
    "confirmToken" TEXT,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "digest_editions_date_key" ON "digest_editions"("date");

-- CreateIndex
CREATE INDEX "digest_editions_date_idx" ON "digest_editions"("date" DESC);

-- CreateIndex
CREATE INDEX "digest_editions_status_idx" ON "digest_editions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_confirmToken_key" ON "subscribers"("confirmToken");

-- CreateIndex
CREATE INDEX "subscribers_status_idx" ON "subscribers"("status");

-- CreateIndex
CREATE INDEX "subscribers_confirmToken_idx" ON "subscribers"("confirmToken");
