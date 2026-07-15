import crypto from "crypto";
import { CountryRecommendationProfile } from "../types/countryRecommendation";
import { RecommendationWeights } from "../types/countryRecommendation";

export const createRecommendationFingerprint = (
  profile: CountryRecommendationProfile,
  weights: RecommendationWeights,
) => {
  const payload = {
    language: profile.language,
    jobCode: profile.jobField.code,
    qualityOfLifeWeights: profile.qualityOfLifeWeights,
    recommendationWeights: weights,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
};