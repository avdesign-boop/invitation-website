-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "business";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "invite";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "template";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "wedding";

-- CreateEnum
CREATE TYPE "business"."MagicLinkPurpose" AS ENUM ('SIGNUP', 'RESET');

-- CreateEnum
CREATE TYPE "billing"."SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "template"."DesignKind" AS ENUM ('EVENT', 'SUMMARY');

-- CreateEnum
CREATE TYPE "wedding"."EventSide" AS ENUM ('BRIDE', 'GROOM', 'BOTH');

-- CreateEnum
CREATE TYPE "invite"."LinkType" AS ENUM ('SUMMARY', 'SINGLE_EVENT');

-- CreateEnum
CREATE TYPE "invite"."InvitedBy" AS ENUM ('BRIDE', 'GROOM', 'BOTH');

-- CreateTable
CREATE TABLE "business"."Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."MagicLink" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "business"."MagicLinkPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."Session" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceMonthly" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "weddingLimit" INTEGER NOT NULL,
    "stripePriceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."Subscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "planId" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "status" "billing"."SubscriptionStatus" NOT NULL DEFAULT 'NONE',
    "currentPeriodEnd" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."StripeEvent" (
    "id" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template"."Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "previewImageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template"."Design" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "template"."DesignKind" NOT NULL,
    "eventType" TEXT,
    "guestType" TEXT,
    "previewImageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding"."Wedding" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "showDefaultPageWhenOff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding"."Event" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "side" "wedding"."EventSide" NOT NULL DEFAULT 'BOTH',
    "venue" TEXT NOT NULL,
    "address" TEXT,
    "mapUrl" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "dressCode" TEXT,
    "note" TEXT,
    "designId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite"."InviteLink" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "invite"."LinkType" NOT NULL,
    "side" "invite"."InvitedBy" NOT NULL DEFAULT 'BOTH',
    "audienceLabel" TEXT,
    "designId" TEXT,
    "customText" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite"."InviteLinkEvent" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "invitedBy" "invite"."InvitedBy",
    "startsAt" TIMESTAMP(3),

    CONSTRAINT "InviteLinkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_email_key" ON "business"."Business"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_tokenHash_key" ON "business"."MagicLink"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionHash_key" ON "business"."Session"("sessionHash");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_businessId_key" ON "billing"."Subscription"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "Design_key_key" ON "template"."Design"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Wedding_slug_key" ON "wedding"."Wedding"("slug");

-- CreateIndex
CREATE INDEX "Wedding_businessId_idx" ON "wedding"."Wedding"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteLink_token_key" ON "invite"."InviteLink"("token");

-- CreateIndex
CREATE INDEX "InviteLink_weddingId_idx" ON "invite"."InviteLink"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteLinkEvent_linkId_eventId_key" ON "invite"."InviteLinkEvent"("linkId", "eventId");

-- AddForeignKey
ALTER TABLE "business"."MagicLink" ADD CONSTRAINT "MagicLink_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."Session" ADD CONSTRAINT "Session_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "billing"."Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template"."Design" ADD CONSTRAINT "Design_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "template"."Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding"."Event" ADD CONSTRAINT "Event_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "wedding"."Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite"."InviteLinkEvent" ADD CONSTRAINT "InviteLinkEvent_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "invite"."InviteLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
