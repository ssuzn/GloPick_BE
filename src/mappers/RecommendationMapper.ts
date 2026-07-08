import {
  CountryRecommendation,
  CountryRecommendationProfile,
  QualityOfLifeWeights,
  RecommendationWeights,
} from "../types/countryRecommendation";

export class RecommendationMapper {
  static toResponse(
    recommendationId: number,
    profileId: number,
    userProfile: CountryRecommendationProfile,
    recommendations: CountryRecommendation[],
    weights: RecommendationWeights,
    qualityOfLifeWeights: QualityOfLifeWeights,
  ) {
    return {
      isExisting: false,
      recommendationId,
      profileId,
      userProfile,
      recommendations,
      appliedWeights: {
        language: weights.language / 100,
        job: weights.job / 100,
        qualityOfLife: weights.qualityOfLife / 100,
      },
      qualityOfLifeWeights,
      timestamp: new Date().toISOString(),
    };
  }
}
