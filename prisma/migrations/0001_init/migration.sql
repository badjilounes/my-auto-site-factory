-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('NEW', 'ENRICHED', 'SITE_GENERATING', 'SITE_GENERATED', 'SITE_DEPLOYED', 'OUTREACH_SENT', 'INTERESTED', 'CLIENT', 'REJECTED');

-- CreateEnum
CREATE TYPE "DeploymentStatus" AS ENUM ('PENDING', 'BUILDING', 'DEPLOYED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScrapingSource" AS ENUM ('UBEREATS', 'DELIVEROO', 'GOOGLE', 'WEBSITE');

-- CreateEnum
CREATE TYPE "ScrapingJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutreachEmailStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT,
    "website" TEXT,
    "uberEatsUrl" TEXT,
    "deliverooUrl" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "cuisineType" TEXT,
    "openingHours" JSONB,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "priceRange" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedSite" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "customDomain" TEXT,
    "content" JSONB,
    "deploymentStatus" "DeploymentStatus" NOT NULL DEFAULT 'PENDING',
    "deploymentUrl" TEXT,
    "vercelProjectId" TEXT,
    "vercelDeploymentId" TEXT,
    "githubRepoUrl" TEXT,
    "repositoryName" TEXT,
    "generatedCode" TEXT,
    "lastDeployedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAccount" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT,
    "phone" TEXT,
    "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "subscriptionPlan" "SubscriptionPlan",
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "customDomain" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEndsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingJob" (
    "id" TEXT NOT NULL,
    "source" "ScrapingSource" NOT NULL,
    "city" TEXT NOT NULL,
    "cuisineType" TEXT,
    "query" TEXT,
    "maxResults" INTEGER NOT NULL DEFAULT 100,
    "status" "ScrapingJobStatus" NOT NULL DEFAULT 'PENDING',
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingResult" (
    "id" TEXT NOT NULL,
    "scrapingJobId" TEXT NOT NULL,
    "prospectId" TEXT,
    "source" "ScrapingSource" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "cuisineType" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "priceRange" TEXT,
    "imageUrls" TEXT[],
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapingResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEmail" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "textBody" TEXT,
    "status" "OutreachEmailStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "resendEmailId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");

-- CreateIndex
CREATE INDEX "Prospect_city_idx" ON "Prospect"("city");

-- CreateIndex
CREATE INDEX "Prospect_businessName_idx" ON "Prospect"("businessName");

-- CreateIndex
CREATE INDEX "Prospect_cuisineType_idx" ON "Prospect"("cuisineType");

-- CreateIndex
CREATE INDEX "Prospect_email_idx" ON "Prospect"("email");

-- CreateIndex
CREATE INDEX "Prospect_createdAt_idx" ON "Prospect"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedSite_prospectId_key" ON "GeneratedSite"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedSite_subdomain_key" ON "GeneratedSite"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedSite_customDomain_key" ON "GeneratedSite"("customDomain");

-- CreateIndex
CREATE INDEX "GeneratedSite_deploymentStatus_idx" ON "GeneratedSite"("deploymentStatus");

-- CreateIndex
CREATE INDEX "GeneratedSite_subdomain_idx" ON "GeneratedSite"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAccount_prospectId_key" ON "ClientAccount"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAccount_userId_key" ON "ClientAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAccount_stripeCustomerId_key" ON "ClientAccount"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAccount_stripeSubscriptionId_key" ON "ClientAccount"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "ClientAccount_subscriptionStatus_idx" ON "ClientAccount"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "ClientAccount_stripeCustomerId_idx" ON "ClientAccount"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "ClientAccount_email_idx" ON "ClientAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripePaymentIntentId_key" ON "Invoice"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Invoice_clientAccountId_idx" ON "Invoice"("clientAccountId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "ScrapingJob_status_idx" ON "ScrapingJob"("status");

-- CreateIndex
CREATE INDEX "ScrapingJob_source_idx" ON "ScrapingJob"("source");

-- CreateIndex
CREATE INDEX "ScrapingJob_city_idx" ON "ScrapingJob"("city");

-- CreateIndex
CREATE INDEX "ScrapingJob_createdAt_idx" ON "ScrapingJob"("createdAt");

-- CreateIndex
CREATE INDEX "ScrapingResult_scrapingJobId_idx" ON "ScrapingResult"("scrapingJobId");

-- CreateIndex
CREATE INDEX "ScrapingResult_prospectId_idx" ON "ScrapingResult"("prospectId");

-- CreateIndex
CREATE INDEX "ScrapingResult_source_idx" ON "ScrapingResult"("source");

-- CreateIndex
CREATE INDEX "ScrapingResult_name_idx" ON "ScrapingResult"("name");

-- CreateIndex
CREATE INDEX "OutreachEmail_prospectId_idx" ON "OutreachEmail"("prospectId");

-- CreateIndex
CREATE INDEX "OutreachEmail_status_idx" ON "OutreachEmail"("status");

-- CreateIndex
CREATE INDEX "OutreachEmail_sentAt_idx" ON "OutreachEmail"("sentAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedSite" ADD CONSTRAINT "GeneratedSite_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAccount" ADD CONSTRAINT "ClientAccount_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAccount" ADD CONSTRAINT "ClientAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientAccountId_fkey" FOREIGN KEY ("clientAccountId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapingResult" ADD CONSTRAINT "ScrapingResult_scrapingJobId_fkey" FOREIGN KEY ("scrapingJobId") REFERENCES "ScrapingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapingResult" ADD CONSTRAINT "ScrapingResult_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEmail" ADD CONSTRAINT "OutreachEmail_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

