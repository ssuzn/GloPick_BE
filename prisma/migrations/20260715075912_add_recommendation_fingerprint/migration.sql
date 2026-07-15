/*
  Warnings:

  - A unique constraint covering the columns `[userId,profileFingerprint,algorithmVersion]` on the table `CountryRecommendationResult` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileFingerprint` to the `CountryRecommendationResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CountryRecommendationResult" ADD COLUMN     "algorithmVersion" TEXT NOT NULL DEFAULT 'v1',
ADD COLUMN     "profileFingerprint" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CountryRecommendationResult_userId_profileFingerprint_algor_key" ON "CountryRecommendationResult"("userId", "profileFingerprint", "algorithmVersion");
