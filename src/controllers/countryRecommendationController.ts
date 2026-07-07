import { Request, Response } from "express";
import {
  CountryRecommendationProfile,
  CountryRecommendation,
} from "../types/countryRecommendation";
import {
  CountryRecommendationService,
  saveWeights,
} from "../services/countryRecommendationService";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middlewares/authMiddleware";
import { JOB_FIELDS } from "../constants/dropdownOptions";
import { oecdService } from "../services/oecdService";
import { prisma } from "../db";

function normalizeLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    Korean: "korean",
    English: "english",
    Spanish: "spanish",
    French: "french",
    German: "german",
    Portuguese: "portuguese",
    Italian: "italian",
    Dutch: "dutch",
    Swedish: "swedish",
    Norwegian: "norwegian",
    Danish: "danish",
    Finnish: "finnish",
    Polish: "polish",
    Czech: "czech",
    Hungarian: "hungarian",
    Greek: "greek",
    Turkish: "turkish",
    Japanese: "japanese",
    Chinese: "chinese",
    Hebrew: "hebrew",
    Slovak: "slovak",
    Slovene: "slovene",
    Icelandic: "icelandic",
    Estonian: "estonian",
    Latvian: "latvian",
    Lithuanian: "lithuanian",
    Other: "english",
  };

  return languageMap[language] || "english";
}

function toJobCode(desiredJob: string): string {
  return desiredJob.replace("JOB_", "");
}

async function validateUserAndProfile(req: AuthRequest, profileId: string) {
  if (!req.user) {
    throw { status: 401, message: "인증이 필요합니다." };
  }

  if (!profileId) {
    throw { status: 400, message: "프로필 ID가 필요합니다." };
  }

  const dbProfile = await prisma.userProfile.findFirst({
    where: {
      id: Number(profileId),
      userId: req.user.id,
    },
  });

  if (!dbProfile) {
    throw { status: 404, message: "프로필을 찾을 수 없습니다." };
  }

  return dbProfile;
}

async function saveRecommendation(
  userId: number,
  profileId: number,
  recommendations: CountryRecommendation[],
  weights: { language: number; job: number; qualityOfLife: number }
) {
  const savedResult = await prisma.countryRecommendationResult.create({
    data: {
      userId,
      profileId,
      languageWeight: weights.language,
      jobWeight: weights.job,
      qualityOfLifeWeight: weights.qualityOfLife,
      recommendations: {
        create: await Promise.all(
          recommendations.map(async (rec, index) => {
            const oecdData = await oecdService.getCountryBetterLifeData(
              rec.country.name
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
          })
        ),
      },
    },
  });

  return savedResult.id;
}

export const getCountryRecommendations = asyncHandler(
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const profileId = req.params.profileId;

    try {
      if (!profileId) {
        return res.status(400).json({
          success: false,
          message:
            "프로필 ID가 필요합니다. 게스트 사용자는 /api/guest/recommend를 사용하세요.",
        });
      }

      const dbProfile = await validateUserAndProfile(authReq, profileId);

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
      const jobField =
        JOB_FIELDS.find((field) => field.code === jobCode) || JOB_FIELDS[1];

      const userProfile: CountryRecommendationProfile = {
        language: normalizeLanguage(dbProfile.language),
        jobField: {
          code: jobField.code,
          nameKo: jobField.nameKo,
          nameEn: jobField.nameEn,
        },
        qualityOfLifeWeights,
      };

      const existingRecommendation =
        await prisma.countryRecommendationResult.findFirst({
          where: {
            userId: authReq.user!.id,
            profileId: Number(profileId),
            languageWeight: weights.language,
            jobWeight: weights.job,
            qualityOfLifeWeight: weights.qualityOfLife,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            recommendations: {
              orderBy: {
                rank: "asc",
              },
            },
          },
        });

      if (existingRecommendation) {
        return res.status(409).json({
          success: false,
          message: "이미 동일한 이력으로 추천을 받았습니다.",
          data: {
            isExisting: true,
            recommendationId: existingRecommendation.id,
            profileId,
            createdAt: existingRecommendation.createdAt,
            recommendations: existingRecommendation.recommendations,
          },
        });
      }

      saveWeights(weights);

      const recommendations =
        await CountryRecommendationService.getTopCountryRecommendations(
          userProfile
        );

      const savedRecommendationId = await saveRecommendation(
        authReq.user!.id,
        Number(profileId),
        recommendations,
        weights
      );

      return res.status(200).json({
        success: true,
        message: "국가 추천이 완료되고 저장되었습니다.",
        data: {
          isExisting: false,
          recommendationId: savedRecommendationId,
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
        },
      });
    } catch (error) {
      if ((error as any).status) {
        return res.status((error as any).status).json({
          success: false,
          message: (error as any).message,
        });
      }

      console.error("국가 추천 처리 오류:", error);

      return res.status(500).json({
        success: false,
        message: "국가 추천 처리 중 서버 오류가 발생했습니다.",
        error:
          process.env.NODE_ENV === "development"
            ? (error as any).message
            : undefined,
      });
    }
  }
);