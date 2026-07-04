-- CreateEnum
CREATE TYPE "ContentGenre" AS ENUM ('GYM', 'MORNING_ROUTINE', 'COFFEE', 'TENNIS', 'BEACH', 'MIRROR_SELFIE', 'HEALTHY_FOOD', 'TRAVEL', 'CASUAL_DATE', 'BEHIND_THE_SCENES', 'ROOM_SELFIE', 'LIBRARY_STUDY', 'MOTIVATION');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('IMAGE', 'VIDEO_REEL', 'STORY');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('PLANNED', 'PROMPT_GENERATED', 'ASSET_GENERATED', 'REVIEWED', 'SCHEDULED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FanvuePostStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "MessageTemplateCategory" AS ENUM ('WELCOME', 'PROMO', 'RENEWAL_REMINDER', 'THANK_YOU', 'PPV_OFFER');

-- CreateEnum
CREATE TYPE "UGCCategory" AS ENUM ('SKINCARE', 'SUPPLEMENT', 'SPORTS_EQUIPMENT', 'TENNIS_EQUIPMENT', 'BEAUTY', 'GADGET', 'OTHER');

-- CreateEnum
CREATE TYPE "UGCStatus" AS ENUM ('LEAD', 'PITCHED', 'NEGOTIATING', 'CONTRACTED', 'IN_PRODUCTION', 'DELIVERED', 'PAID', 'DECLINED');

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAI" BOOLEAN NOT NULL DEFAULT true,
    "age" INTEGER NOT NULL,
    "heightCm" INTEGER NOT NULL,
    "weightKg" INTEGER NOT NULL,
    "personality" TEXT NOT NULL,
    "hobbies" TEXT NOT NULL,
    "speechStyle" TEXT NOT NULL,
    "favoriteFoods" TEXT NOT NULL,
    "dislikedFoods" TEXT NOT NULL,
    "trainingRoutine" TEXT NOT NULL,
    "tennisHistory" TEXT NOT NULL,
    "brandColor" TEXT NOT NULL,
    "fashionStyle" TEXT NOT NULL,
    "hairStyle" TEXT NOT NULL,
    "faceFeatures" TEXT NOT NULL,
    "eyeDescription" TEXT NOT NULL,
    "skinDescription" TEXT NOT NULL,
    "accessories" TEXT NOT NULL,
    "worldview" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_assets" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "genre" "ContentGenre" NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "videoStructure" TEXT,
    "filePath" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PLANNED',
    "aiDisclosureText" TEXT NOT NULL DEFAULT 'This content features an AI-generated persona.',
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "captions" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "contentAssetId" TEXT,
    "text" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "captions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_entries" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "postTime" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "genre" "ContentGenre",
    "cta" TEXT,
    "productTieIn" TEXT,
    "fanvuePromo" BOOLEAN NOT NULL DEFAULT false,
    "ugcPostId" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "holidayName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fanvue_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "status" "FanvuePostStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "aiDisclosureText" TEXT NOT NULL DEFAULT 'This profile features an AI-generated persona. All content is synthetic.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fanvue_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fanvue_messages" (
    "id" TEXT NOT NULL,
    "category" "MessageTemplateCategory" NOT NULL,
    "template" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fanvue_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ugc_deals" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "category" "UGCCategory" NOT NULL,
    "status" "UGCStatus" NOT NULL DEFAULT 'LEAD',
    "contactEmail" TEXT,
    "fee" DOUBLE PRECISION,
    "script" TEXT,
    "deliverablePath" TEXT,
    "disclosureConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ugc_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "igReach" INTEGER,
    "igSaveRate" DOUBLE PRECISION,
    "igRetentionRate" DOUBLE PRECISION,
    "igFollowerGrowth" INTEGER,
    "fanvueRevenue" DOUBLE PRECISION,
    "fanvueCvr" DOUBLE PRECISION,
    "ugcDealCloseRate" DOUBLE PRECISION,
    "reportSummary" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "calendar_entries_characterId_date_key" ON "calendar_entries"("characterId", "date");

-- AddForeignKey
ALTER TABLE "content_assets" ADD CONSTRAINT "content_assets_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "captions" ADD CONSTRAINT "captions_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "captions" ADD CONSTRAINT "captions_contentAssetId_fkey" FOREIGN KEY ("contentAssetId") REFERENCES "content_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_entries" ADD CONSTRAINT "calendar_entries_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
