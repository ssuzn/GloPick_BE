import { prisma } from "../db";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { UserProfile } from "../generated/prisma/client";
import { MyPageRecommendationMapper } from "../mappers/myPageRecommendationMapper";
import { RecommendationMapper } from "../mappers/recommendationMapper";
import {
  CountryData,
  ScoredCountry,
  CountryRecommendation,
  CountryRecommendationProfile,
  ISCOJobField,
  RecommendationWeights,
} from "../types/countryRecommendation";
import { createRecommendationFingerprint } from "../utils/recommendationFingerprint";
import { ExternalAPIService } from "./externalAPIService";
import { findJobFieldByCode, toJobCode } from "./jobFieldService";
import { normalizeLanguage } from "./languageService";
import { oecdService } from "./oecdService";
import { RedisService } from "./redisService";

export class CountryRecommendationService {
  static async createRecommendation(userId: number, profileId: number) {
    if (Number.isNaN(profileId)) {
      throw new BadRequestError("프로필 ID가 올바르지 않습니다.");
    }

    const dbProfile = await this.findUserProfile(userId, profileId);

    const { weights, qualityOfLifeWeights, userProfile } =
      this.buildRecommendationContext(dbProfile);

    const fingerprint = createRecommendationFingerprint(userProfile, weights);

    const cacheKey = this.createCacheKey(userId, fingerprint);
    const cachedRecommendation =
      await RedisService.get<
        ReturnType<typeof RecommendationMapper.toResponse>
      >(cacheKey);
    if (cachedRecommendation) {
      return {
        ...cachedRecommendation,
        isExisting: true,
        cacheSource: "redis" as const,
      };
    }

    const existingRecommendation = await this.findExistingRecommendation(
      userId,
      fingerprint,
    );

    if (existingRecommendation) {
      const response = MyPageRecommendationMapper.toResponse(
        existingRecommendation,
      );

      await RedisService.set(cacheKey, response, this.CACHE_TTL_SECONDS);

      return {
        ...response,
        isExisting: true,
        cacheSource: "database" as const,
      };
    }

    const recommendations = await this.getTopCountryRecommendations(
      userProfile,
      weights,
    );

    const recommendationId = await this.saveRecommendation(
      userId,
      profileId,
      recommendations,
      weights,
      fingerprint,
    );

    const response = RecommendationMapper.toResponse(
      recommendationId,
      profileId,
      userProfile,
      recommendations,
      weights,
      qualityOfLifeWeights,
    );

    await RedisService.set(cacheKey, response, this.CACHE_TTL_SECONDS);

    return {
      ...response,
      isExisting: false,
      cacheSource: "calculated" as const,
    };
  }

  private static buildRecommendationContext(dbProfile: UserProfile) {
    const weights = {
      language: dbProfile.languageWeight,
      job: dbProfile.jobWeight,
      qualityOfLife: dbProfile.qualityOfLifeWeight,
    };

    const qualityOfLifeWeights = {
      income: dbProfile.incomeWeight,
      jobs: dbProfile.jobsWeight,
      health: dbProfile.healthWeight,
      lifeSatisfaction: dbProfile.lifeSatisfactionWeight,
      safety: dbProfile.safetyWeight,
    };

    const jobCode = toJobCode(dbProfile.desiredJob);
    const jobField = findJobFieldByCode(jobCode);

    const userProfile: CountryRecommendationProfile = {
      language: normalizeLanguage(dbProfile.language),
      jobField: {
        code: jobField.code,
        nameKo: jobField.nameKo,
        nameEn: jobField.nameEn,
      },
      qualityOfLifeWeights,
    };

    return {
      weights,
      qualityOfLifeWeights,
      userProfile,
    };
  }

  private static async findExistingRecommendation(
    userId: number,
    fingerprint: string,
  ) {
    return prisma.countryRecommendationResult.findFirst({
      where: {
        userId,
        profileFingerprint: fingerprint,
        algorithmVersion: this.ALGORITHM_VERSION,
      },
      include: {
        profile: true,
        recommendations: {
          orderBy: {
            rank: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // 메인 추천 로직
  static async getTopCountryRecommendations(
    userProfile: CountryRecommendationProfile,
    weights: RecommendationWeights,
  ): Promise<CountryRecommendation[]> {
    // 외부 API에서 모든 국가 데이터 수집
    const allCountries = await ExternalAPIService.getAllCountryData();

    // 각 국가별 점수 계산
    const scoredCountries = await this.calculateCountryScores(
      allCountries,
      userProfile,
    );

    const finalWeights = {
      language: weights.language || 30,
      job: weights.job || 30,
      qualityOfLife: weights.qualityOfLife || 40,
    };

    // 사용자 입력 가중치 적용
    const weightedCountries = this.applyDynamicWeights(
      scoredCountries,
      finalWeights,
    );

    // 상위 5개 국가 선별
    const topCountries = this.selectTopCountries(weightedCountries, 5);

    // 추천 결과 포맷팅
    return this.formatRecommendations(topCountries, userProfile, finalWeights);
  }

  // 사용자 입력 가중치 적용 로직 수정
  private static applyDynamicWeights(
    scoredCountries: ScoredCountry[],
    weights: RecommendationWeights,
  ): ScoredCountry[] {
    return scoredCountries.map((country) => {
      const totalScore =
        country.scores.languageScore * (weights.language / 100) +
        country.scores.jobScore * (weights.job / 100) +
        country.scores.qualityOfLifeScore * (weights.qualityOfLife / 100);

      return { ...country, weightedScore: totalScore };
    });
  }

  // 각 국가별 개별 점수 계산
  private static async calculateCountryScores(
    countries: CountryData[],
    userProfile: CountryRecommendationProfile,
  ): Promise<ScoredCountry[]> {
    return Promise.all(
      countries.map((country) =>
        this.calculateCountryScore(country, userProfile),
      ),
    );
  }

  private static async calculateCountryScore(
    country: CountryData,
    userProfile: CountryRecommendationProfile,
  ): Promise<ScoredCountry> {
    const languageScore = this.calculateLanguageScore(
      country,
      userProfile.language,
    );

    const jobScore = this.calculateJobScore(country, userProfile.jobField);

    let qualityOfLifeScore = 50;

    try {
      qualityOfLifeScore = await oecdService.calculateQualityOfLifeScore(
        country.name,
        userProfile.qualityOfLifeWeights,
      );
    } catch (error) {
      console.warn(`${country.name}의 OECD 점수 계산 실패:`, error);
    }

    return {
      country,
      scores: {
        languageScore,
        jobScore,
        qualityOfLifeScore,
      },
      weightedScore: 0,
    };
  }

  // 언어 적합도 점수 계산 (0-100)
  // 100점: 사용자 언어가 국가 공식 언어에 포함
  // 50점: 사용자가 주요 국제 언어 선택 + 국가가 다른 주요 국제 언어 사용
  // 20점: 그 외 언어 (매칭 안됨)
  private static calculateLanguageScore(
    country: CountryData,
    userLanguage: string,
  ): number {
    if (!country.languages || country.languages.length === 0) {
      return 20; // 언어 정보가 없는 경우 기본 점수
    }

    const userLangLower = userLanguage.toLowerCase();

    // 1. 사용자 언어가 국가 공식 언어에 포함되는지 확인
    const hasMatchingLanguage = country.languages.some(
      (countryLang) =>
        countryLang.toLowerCase().includes(userLangLower) ||
        userLangLower.includes(countryLang.toLowerCase()),
    );

    if (hasMatchingLanguage) {
      return 100; // 완전 매칭
    }

    // 2. 주요 국제 언어 (영어, 스페인어, 프랑스어, 독일어) 체크
    const majorInternationalLanguages = [
      "english",
      "spanish",
      "french",
      "german",
    ];

    const userIsUsingMajorLanguage =
      majorInternationalLanguages.includes(userLangLower);
    const countryHasMajorLanguage = country.languages.some((countryLang) =>
      majorInternationalLanguages.some((majorLang) =>
        countryLang.toLowerCase().includes(majorLang),
      ),
    );

    // 사용자가 주요 국제 언어를 사용하고, 국가도 주요 국제 언어를 사용하는 경우
    if (userIsUsingMajorLanguage && countryHasMajorLanguage) {
      return 50; // 국제 언어로 소통 가능
    }

    // 3. 매칭되지 않는 경우 - 언어 장벽이 높음
    return 20; // 낮은 점수
  }

  // 직무 기회 점수 계산 (0-100) - 전체 고용률 50% + ISCO 직무 고용률 50%
  private static calculateJobScore(
    country: CountryData,
    jobField: ISCOJobField,
  ): number {
    let totalScore = 0;

    // 1. 전체 고용률 점수 (50%) - 국가의 전반적인 고용 환경
    let employmentScore = 50; // 기본값
    if (country.employmentRate !== undefined) {
      // 40-80% 범위를 0-100점으로 정규화
      employmentScore = Math.min(
        100,
        Math.max(0, (country.employmentRate - 40) * 2.5),
      );
    }
    totalScore += employmentScore * 0.5;

    // 2. ISCO 직무별 고용률 점수 (50%) - 특정 직무의 수요와 기회
    let iscoScore = 50; // 기본값
    const iscoData = country.iscoEmploymentData?.get(jobField.code);

    if (iscoData && iscoData > 0) {
      // 로그 스케일로 0-100점 변환 (고용 인구수 기반)
      iscoScore = Math.min(100, Math.log10(iscoData / 1000000 + 1) * 50);
    }
    totalScore += iscoScore * 0.5;

    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  // 상위 N개 국가 선별
  private static selectTopCountries(
    weightedCountries: ScoredCountry[],
    count: number,
  ): ScoredCountry[] {
    return weightedCountries
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, count);
  }

  // 최종 추천 결과 포맷팅
  private static formatRecommendations(
    topCountries: ScoredCountry[],
    userProfile: CountryRecommendationProfile,
    appliedWeights: RecommendationWeights,
  ): CountryRecommendation[] {
    return topCountries.map((scored, index) => {
      const normalizedWeights = {
        language: appliedWeights.language / 100,
        job: appliedWeights.job / 100,
        qualityOfLife: appliedWeights.qualityOfLife / 100,
      };

      return {
        rank: index + 1,
        country: scored.country,
        totalScore: Math.round(scored.weightedScore * 100) / 100,
        breakdown: {
          languageScore: Math.round(scored.scores.languageScore * 100) / 100,
          jobScore: Math.round(scored.scores.jobScore * 100) / 100,
          qualityOfLifeScore:
            Math.round(scored.scores.qualityOfLifeScore * 100) / 100,
          appliedWeights: normalizedWeights,
        },
        reasons: this.generateReasons(scored, userProfile),
      };
    });
  }

  // 추천 이유 생성
  private static generateReasons(
    scored: ScoredCountry,
    userProfile: CountryRecommendationProfile,
  ): string[] {
    const reasons: string[] = [];
    const { country, scores } = scored;

    // 언어 관련 이유
    if (scores.languageScore > 70) {
      reasons.push(
        `사용 가능한 언어와 높은 호환성 (${Math.round(scores.languageScore)}점)`,
      );
    } else if (scores.languageScore > 30) {
      reasons.push("영어 사용 가능 국가로 의사소통 가능");
    }

    // 삶의 질 관련 이유
    if (scores.qualityOfLifeScore > 80) {
      reasons.push(
        `우수한 삶의 질 (${Math.round(scores.qualityOfLifeScore)}점)`,
      );
    } else if (scores.qualityOfLifeScore > 60) {
      reasons.push("양호한 생활 환경");
    }

    // 직무 관련 이유
    if (scores.jobScore > 75) {
      reasons.push(`${userProfile.jobField.nameKo} 분야 취업 기회 풍부`);
    } else if (scores.jobScore > 60) {
      reasons.push("안정적인 고용 시장");
    }

    // 추가 정보
    if (country.gdpPerCapita && country.gdpPerCapita > 40000) {
      reasons.push("높은 경제 수준");
    }

    if (country.employmentRate && country.employmentRate > 65) {
      reasons.push("높은 고용률");
    }

    return reasons.length > 0 ? reasons : ["종합적인 생활 환경 고려"];
  }

  private static async findUserProfile(userId: number, profileId: number) {
    const dbProfile = await prisma.userProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!dbProfile) {
      throw new NotFoundError("사용자 프로필을 찾을 수 없습니다.");
    }

    return dbProfile;
  }

  private static async buildRecommendationItems(
    recommendations: CountryRecommendation[],
  ) {
    return Promise.all(
      recommendations.map(async (rec, index) => {
        const oecdData = await oecdService.getCountryBetterLifeData(
          rec.country.name,
        );

        return {
          country: rec.country.name,
          score: rec.totalScore,
          rank: index + 1,

          languageScore: rec.breakdown.languageScore,
          jobScore: rec.breakdown.jobScore,
          qualityOfLifeScore: rec.breakdown.qualityOfLifeScore,

          income: oecdData?.income ?? 0,
          jobs: oecdData?.jobs ?? 0,
          health: oecdData?.health ?? 0,
          lifeSatisfaction: oecdData?.lifeSatisfaction ?? 0,
          safety: oecdData?.safety ?? 0,

          region: rec.country.region,
          languages: rec.country.languages,
          population: rec.country.population ?? 0,
          employmentRate: rec.country.employmentRate ?? null,
        };
      }),
    );
  }

  private static async saveRecommendation(
    userId: number,
    profileId: number,
    recommendations: CountryRecommendation[],
    weights: RecommendationWeights,
    fingerprint: string,
  ) {
    const recommendationItems =
      await this.buildRecommendationItems(recommendations);

    const savedResult = await prisma.countryRecommendationResult.create({
      data: {
        userId,
        profileId,

        languageWeight: weights.language,
        jobWeight: weights.job,
        qualityOfLifeWeight: weights.qualityOfLife,

        recommendations: {
          create: recommendationItems,
        },

        profileFingerprint: fingerprint,
        algorithmVersion: this.ALGORITHM_VERSION,
      },
    });

    return savedResult.id;
  }

  private static readonly ALGORITHM_VERSION = "v1";
  private static readonly CACHE_TTL_SECONDS = 60 * 60;

  private static createCacheKey(userId: number, fingerprint: string): string {
    return `recommendation:${this.ALGORITHM_VERSION}:${userId}:${fingerprint}`;
  }
}
