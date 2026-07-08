import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
  JOB_FIELDS,
  SUPPORTED_LANGUAGES,
  QUALITY_OF_LIFE_INDICATORS,
} from "../constants/dropdownOptions";
import { DesiredJob, Language } from "../generated/prisma/client";
import { BadRequestError } from "../errors/BadRequestError";
import { ProfileService } from "../services/profileService";

const toDesiredJobEnum = (desiredJob: string): DesiredJob => {
  return `JOB_${desiredJob}` as DesiredJob;
};

const toLanguageEnum = (language: string): Language => {
  return language as Language;
};

// 사용자 이력 등록 (POST /api/profile)
export const createProfile = async (req: AuthRequest, res: Response) => {
  const {
    language,
    desiredJob,
    qualityOfLifeWeights,
    languageWeight,
    jobWeight,
    qualityOfLifeWeight,
  } = req.body;

  if (!qualityOfLifeWeights) {
    throw new BadRequestError("삶의 질 지표별 가중치가 필요합니다.");
  }

  const finalQualityWeights = {
    income: qualityOfLifeWeights.income ?? 0,
    jobs: qualityOfLifeWeights.jobs ?? 0,
    health: qualityOfLifeWeights.health ?? 0,
    lifeSatisfaction: qualityOfLifeWeights.lifeSatisfaction ?? 0,
    safety: qualityOfLifeWeights.safety ?? 0,
  };

  const qualityTotal = Object.values(finalQualityWeights).reduce(
    (sum, val) => sum + val,
    0,
  );

  if (qualityTotal !== 100) {
    throw new BadRequestError("삶의 질 지표별 가중치의 합이 100이어야 합니다.");
  }

  if (
    typeof languageWeight !== "number" ||
    typeof jobWeight !== "number" ||
    typeof qualityOfLifeWeight !== "number"
  ) {
    throw new BadRequestError("직무, 언어, QOL 가중치가 모두 숫자여야 합니다.");
  }

  const finalWeights = {
    languageWeight,
    jobWeight,
    qualityOfLifeWeight,
  };

  const totalWeight = languageWeight + jobWeight + qualityOfLifeWeight;

  if (totalWeight !== 100) {
    throw new BadRequestError(
      "직무, 언어, QOL 가중치의 합이 100이어야 합니다.",
    );
  }

  const prismaDesiredJob = toDesiredJobEnum(desiredJob);
  const prismaLanguage = toLanguageEnum(language);

  const existingProfiles = await ProfileService.findByUserId(req.user!.id);

  const isDuplicate = existingProfiles.find((profile) => {
    return (
      profile.language === prismaLanguage &&
      profile.desiredJob === prismaDesiredJob &&
      profile.incomeWeight === finalQualityWeights.income &&
      profile.jobsWeight === finalQualityWeights.jobs &&
      profile.healthWeight === finalQualityWeights.health &&
      profile.lifeSatisfactionWeight === finalQualityWeights.lifeSatisfaction &&
      profile.safetyWeight === finalQualityWeights.safety &&
      profile.languageWeight === finalWeights.languageWeight &&
      profile.jobWeight === finalWeights.jobWeight &&
      profile.qualityOfLifeWeight === finalWeights.qualityOfLifeWeight
    );
  });

  if (isDuplicate) {
    throw new BadRequestError(
      "이전 이력과 내용이 동일합니다. 등록이 불가합니다.",
    );
  }

  const profile = await ProfileService.create({
    userId: req.user!.id,
    language: prismaLanguage,
    desiredJob: prismaDesiredJob,

    incomeWeight: finalQualityWeights.income,
    jobsWeight: finalQualityWeights.jobs,
    healthWeight: finalQualityWeights.health,
    lifeSatisfactionWeight: finalQualityWeights.lifeSatisfaction,
    safetyWeight: finalQualityWeights.safety,

    languageWeight: finalWeights.languageWeight,
    jobWeight: finalWeights.jobWeight,
    qualityOfLifeWeight: finalWeights.qualityOfLifeWeight,
  });

  res.status(201).json({
    code: 201,
    message: "이력과 가중치가 정상적으로 등록되었습니다.",
    data: {
      profileId: profile.id,
    },
  });
};

// 드롭다운 옵션 조회 (GET /api/profile/options)
export const getProfileOptions = async (req: Request, res: Response) => {
  const options = {
    languages: SUPPORTED_LANGUAGES,
    jobFields: JOB_FIELDS,
    qualityOfLifeIndicators: QUALITY_OF_LIFE_INDICATORS,
  };

  res.status(200).json({
    code: 200,
    message: "드롭다운 옵션 조회 성공",
    data: options,
  });
};
