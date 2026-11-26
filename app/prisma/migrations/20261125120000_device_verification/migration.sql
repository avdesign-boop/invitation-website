-- CreateEnum
CREATE TYPE "business"."LoginResult" AS ENUM ('SUCCESS', 'CODE_SENT', 'CODE_VERIFIED', 'WRONG_PASSWORD', 'WRONG_CODE');

-- CreateTable
CREATE TABLE "business"."TrustedDevice" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."LoginChallenge" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business"."LoginEvent" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "result" "business"."LoginResult" NOT NULL,
    "ip" TEXT,
    "description" TEXT,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_deviceHash_key" ON "business"."TrustedDevice"("deviceHash");

-- CreateIndex
CREATE INDEX "TrustedDevice_businessId_idx" ON "business"."TrustedDevice"("businessId");

-- CreateIndex
CREATE INDEX "LoginEvent_businessId_createdAt_idx" ON "business"."LoginEvent"("businessId", "createdAt");

-- AddForeignKey
ALTER TABLE "business"."TrustedDevice" ADD CONSTRAINT "TrustedDevice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."LoginChallenge" ADD CONSTRAINT "LoginChallenge_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."LoginEvent" ADD CONSTRAINT "LoginEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"."Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

