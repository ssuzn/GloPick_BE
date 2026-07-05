-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('local', 'kakao');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('Korean', 'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Polish', 'Czech', 'Hungarian', 'Greek', 'Turkish', 'Japanese', 'Chinese', 'Hebrew', 'Slovak', 'Slovene', 'Icelandic', 'Estonian', 'Latvian', 'Lithuanian', 'Other');

-- CreateEnum
CREATE TYPE "DesiredJob" AS ENUM ('JOB_0', 'JOB_1', 'JOB_2', 'JOB_3', 'JOB_4', 'JOB_5', 'JOB_6', 'JOB_7', 'JOB_8', 'JOB_9');

-- CreateEnum
CREATE TYPE "InitialBudget" AS ENUM ('BUDGET_300_500', 'BUDGET_500_800', 'BUDGET_800_1200', 'BUDGET_1200_1500', 'BUDGET_1500_PLUS');

-- CreateEnum
CREATE TYPE "DepartureAirport" AS ENUM ('ICN', 'GMP', 'PUS', 'CJU', 'CJJ', 'TAE', 'MWX');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "birth" TEXT,
    "phone" TEXT,
    "kakaoId" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'local',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "desiredJob" "DesiredJob" NOT NULL,
    "incomeWeight" INTEGER NOT NULL DEFAULT 20,
    "jobsWeight" INTEGER NOT NULL DEFAULT 20,
    "healthWeight" INTEGER NOT NULL DEFAULT 20,
    "lifeSatisfactionWeight" INTEGER NOT NULL DEFAULT 20,
    "safetyWeight" INTEGER NOT NULL DEFAULT 20,
    "languageWeight" INTEGER NOT NULL DEFAULT 30,
    "jobWeight" INTEGER NOT NULL DEFAULT 30,
    "qualityOfLifeWeight" INTEGER NOT NULL DEFAULT 40,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryRecommendationResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "languageWeight" DOUBLE PRECISION NOT NULL,
    "jobWeight" DOUBLE PRECISION NOT NULL,
    "qualityOfLifeWeight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryRecommendationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryRecommendationItem" (
    "id" SERIAL NOT NULL,
    "resultId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "languageScore" DOUBLE PRECISION NOT NULL,
    "jobScore" DOUBLE PRECISION NOT NULL,
    "qualityOfLifeScore" DOUBLE PRECISION NOT NULL,
    "income" DOUBLE PRECISION,
    "jobs" DOUBLE PRECISION,
    "health" DOUBLE PRECISION,
    "lifeSatisfaction" DOUBLE PRECISION,
    "safety" DOUBLE PRECISION,
    "region" TEXT,
    "languages" TEXT[],
    "population" DOUBLE PRECISION,
    "employmentRate" DOUBLE PRECISION,

    CONSTRAINT "CountryRecommendationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationInput" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "selectedCountry" TEXT NOT NULL,
    "selectedCity" TEXT,
    "initialBudget" "InitialBudget",
    "requiredFacilities" TEXT[],
    "departureAirport" "DepartureAirport",
    "recommendedCities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationList" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "job" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimulationList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "inputId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "recommendedCity" TEXT,
    "essentialFacilities" TEXT[],
    "publicTransport" TEXT,
    "safetyLevel" TEXT,
    "climateSummary" TEXT,
    "koreanCommunity" TEXT,
    "culturalTips" TEXT,
    "warnings" TEXT,
    "facilityLocations" JSONB,
    "housing" TEXT,
    "food" TEXT,
    "transportation" TEXT,
    "etc" TEXT,
    "total" TEXT,
    "oneYearCost" TEXT,
    "costCuttingTips" TEXT,
    "cpi" TEXT,
    "shortTermHousingOptions" TEXT[],
    "longTermHousingPlatforms" TEXT[],
    "mobilePlan" TEXT,
    "bankAccount" TEXT,
    "jobSearchPlatforms" TEXT[],
    "languageRequirement" TEXT,
    "visaLimitationTips" TEXT,
    "koreanPopulationRate" TEXT,
    "foreignResidentRatio" TEXT,
    "koreanResourcesLinks" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoId_key" ON "User"("kakaoId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SimulationResult_inputId_key" ON "SimulationResult"("inputId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryRecommendationResult" ADD CONSTRAINT "CountryRecommendationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryRecommendationResult" ADD CONSTRAINT "CountryRecommendationResult_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryRecommendationItem" ADD CONSTRAINT "CountryRecommendationItem_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "CountryRecommendationResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationInput" ADD CONSTRAINT "SimulationInput_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationInput" ADD CONSTRAINT "SimulationInput_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationList" ADD CONSTRAINT "SimulationList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResult" ADD CONSTRAINT "SimulationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationResult" ADD CONSTRAINT "SimulationResult_inputId_fkey" FOREIGN KEY ("inputId") REFERENCES "SimulationInput"("id") ON DELETE CASCADE ON UPDATE CASCADE;
