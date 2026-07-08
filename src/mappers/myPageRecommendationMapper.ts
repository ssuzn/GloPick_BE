import {
  CountryRecommendationItem,
  CountryRecommendationResult,
  UserProfile,
} from "../generated/prisma/client";
import { ProfileMapper } from "./profileMapper";

type RecommendationWithItems = CountryRecommendationResult & {
  profile: UserProfile | null;
  recommendations: CountryRecommendationItem[];
};

export class MyPageRecommendationMapper {
  static toResponse(rec: RecommendationWithItems) {
    return {
      id: rec.id,
      profile: rec.profile ? ProfileMapper.toResponse(rec.profile) : null,
      recommendations: rec.recommendations.map((country) => ({
        country: country.country,
        score: country.score,
        rank: country.rank,
        details: {
          languageScore: country.languageScore,
          jobScore: country.jobScore,
          qualityOfLifeScore: country.qualityOfLifeScore,
        },
        qualityOfLifeData: {
          income: country.income,
          jobs: country.jobs,
          health: country.health,
          lifeSatisfaction: country.lifeSatisfaction,
          safety: country.safety,
        },
        countryInfo: {
          region: country.region,
          languages: country.languages,
          population: country.population,
          employmentRate: country.employmentRate,
        },
      })),
      weights: {
        language: rec.languageWeight,
        job: rec.jobWeight,
        qualityOfLife: rec.qualityOfLifeWeight,
      },
      createdAt: rec.createdAt,
    };
  }
}