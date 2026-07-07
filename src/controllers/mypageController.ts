import { Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { AuthRequest } from "../middlewares/authMiddleware";

const toJobCode = (desiredJob: string) => desiredJob.replace("JOB_", "");

const formatProfile = (profile: any) => ({
  profileId: profile.id,
  language: profile.language,
  desiredJob: toJobCode(profile.desiredJob),
  qualityOfLifeWeights: {
    income: profile.incomeWeight,
    jobs: profile.jobsWeight,
    health: profile.healthWeight,
    lifeSatisfaction: profile.lifeSatisfactionWeight,
    safety: profile.safetyWeight,
  },
  weights: {
    languageWeight: profile.languageWeight,
    jobWeight: profile.jobWeight,
    qualityOfLifeWeight: profile.qualityOfLifeWeight,
  },
  createdAt: profile.createdAt,
});

const formatSimulationResult = (sim: any) => ({
  id: sim.id,
  input: sim.input
    ? {
        inputId: sim.input.id,
        selectedCountry: sim.input.selectedCountry,
        selectedCity: sim.input.selectedCity,
        initialBudget: sim.input.initialBudget,
        requiredFacilities: sim.input.requiredFacilities,
        departureAirport: sim.input.departureAirport,
        recommendedCities: sim.input.recommendedCities,
      }
    : null,
  country: sim.country,
  result: {
    recommendedCity: sim.recommendedCity,
    localInfo: {
      essentialFacilities: sim.essentialFacilities,
      publicTransport: sim.publicTransport,
      safetyLevel: sim.safetyLevel,
      climateSummary: sim.climateSummary,
      koreanCommunity: sim.koreanCommunity,
      culturalTips: sim.culturalTips,
      warnings: sim.warnings,
    },
    estimatedMonthlyCost: {
      housing: sim.housing,
      food: sim.food,
      transportation: sim.transportation,
      etc: sim.etc,
      total: sim.total,
      oneYearCost: sim.oneYearCost,
      costCuttingTips: sim.costCuttingTips,
      cpi: sim.cpi,
    },
    initialSetup: {
      shortTermHousingOptions: sim.shortTermHousingOptions,
      longTermHousingPlatforms: sim.longTermHousingPlatforms,
      mobilePlan: sim.mobilePlan,
      bankAccount: sim.bankAccount,
    },
    jobReality: {
      jobSearchPlatforms: sim.jobSearchPlatforms,
      languageRequirement: sim.languageRequirement,
      visaLimitationTips: sim.visaLimitationTips,
    },
    culturalIntegration: {
      koreanPopulationRate: sim.koreanPopulationRate,
      foreignResidentRatio: sim.foreignResidentRatio,
      koreanResourcesLinks: sim.koreanResourcesLinks,
    },
    facilityLocations: sim.facilityLocations,
  },
  createdAt: sim.createdAt,
});

const formatRecommendationResult = (rec: any) => ({
  id: rec.id,
  profile: rec.profile ? formatProfile(rec.profile) : null,
  recommendations: rec.recommendations.map((country: any) => ({
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
});

export const getUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        code: 404,
        message: "사용자를 찾을 수 없음",
        data: null,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        birth: true,
        phone: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "사용자를 찾을 수 없음",
        data: null,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "사용자 정보 조회 성공",
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        birth: user.birth,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: "서버 오류", data: null });
  }
};

export const updateUserInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, birth, phone } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "사용자를 찾을 수 없음",
        data: null,
      });
    }

    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({
          code: 409,
          message: "이미 사용 중인 이메일입니다.",
          data: null,
        });
      }
    }

    const hashedPassword =
      typeof password === "string" && password.trim() !== ""
        ? await bcrypt.hash(password.trim(), 10)
        : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(birth && { birth }),
        ...(phone && { phone }),
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    return res.status(200).json({
      code: 200,
      message: "사용자 정보 수정 성공",
      data: {
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        birth: updatedUser.birth,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: "서버 오류", data: null });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "사용자를 찾을 수 없음",
        data: null,
      });
    }

    await prisma.user.delete({
      where: { id: req.user!.id },
    });

    return res.status(200).json({
      code: 200,
      message: "회원 탈퇴 완료!",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({ code: 500, message: "서버 오류", data: null });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  const profiles = await prisma.userProfile.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });

  if (profiles.length === 0) {
    return res.status(404).json({
      code: 404,
      message: "이력 정보가 없습니다.",
      data: null,
    });
  }

  return res.status(200).json({
    code: 200,
    message: "이력 정보 조회 성공",
    data: profiles.map(formatProfile),
  });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const profileId = Number(req.params.id);

  const profile = await prisma.userProfile.findFirst({
    where: {
      id: profileId,
      userId: req.user!.id,
    },
  });

  if (!profile) {
    return res.status(404).json({
      code: 404,
      message: "이력을 찾을 수 없습니다.",
      data: null,
    });
  }

  const { language, desiredJob, qualityOfLifeWeights, weights } = req.body;

  const updatedProfile = await prisma.userProfile.update({
    where: { id: profileId },
    data: {
      ...(language && { language }),
      ...(desiredJob && { desiredJob: `JOB_${desiredJob}` }),
      ...(qualityOfLifeWeights && {
        incomeWeight: qualityOfLifeWeights.income,
        jobsWeight: qualityOfLifeWeights.jobs,
        healthWeight: qualityOfLifeWeights.health,
        lifeSatisfactionWeight: qualityOfLifeWeights.lifeSatisfaction,
        safetyWeight: qualityOfLifeWeights.safety,
      }),
      ...(weights && {
        languageWeight: weights.languageWeight,
        jobWeight: weights.jobWeight,
        qualityOfLifeWeight: weights.qualityOfLifeWeight,
      }),
    },
  });

  return res.status(200).json({
    code: 200,
    message: "이력 정보 수정 성공",
    data: formatProfile(updatedProfile),
  });
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  const profileId = Number(req.params.id);

  const profile = await prisma.userProfile.findFirst({
    where: {
      id: profileId,
      userId: req.user!.id,
    },
  });

  if (!profile) {
    return res.status(404).json({
      code: 404,
      message: "이력을 찾을 수 없습니다.",
      data: null,
    });
  }

  await prisma.userProfile.delete({
    where: { id: profileId },
  });

  return res.status(200).json({
    code: 200,
    message: "이력 삭제 완료",
    data: null,
  });
};

export const getUserSimulations = async (req: AuthRequest, res: Response) => {
  try {
    const simulations = await prisma.simulationResult.findMany({
      where: { userId: req.user!.id },
      include: { input: true },
      orderBy: { createdAt: "desc" },
    });

    if (simulations.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "시뮬레이션 결과가 없습니다.",
        data: null,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "시뮬레이션 결과 조회 성공",
      data: simulations.map(formatSimulationResult),
    });
  } catch (error) {
    console.error("시뮬레이션 결과 조회 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "서버 오류",
      data: null,
    });
  }
};

export const getUserRecommendations = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const recommendations = await prisma.countryRecommendationResult.findMany({
      where: { userId: req.user!.id },
      include: {
        profile: true,
        recommendations: {
          orderBy: { rank: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recommendations.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "저장된 추천 결과가 없습니다.",
        data: null,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "추천 결과 조회 성공",
      data: recommendations.map(formatRecommendationResult),
    });
  } catch (error) {
    console.error("추천 결과 조회 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "서버 오류",
      data: null,
    });
  }
};

export const getRecommendationsByProfileId = async (
  req: AuthRequest,
  res: Response
) => {
  const { profileId } = req.params;

  try {
    const recommendations = await prisma.countryRecommendationResult.findMany({
      where: {
        userId: req.user!.id,
        profileId: Number(profileId),
      },
      include: {
        profile: true,
        recommendations: {
          orderBy: { rank: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recommendations.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "해당 이력에 대한 추천 결과가 없습니다.",
        data: null,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "추천 결과 조회 성공",
      data: recommendations.map(formatRecommendationResult),
    });
  } catch (error) {
    console.error("특정 이력 추천 결과 조회 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "서버 오류",
      data: null,
    });
  }
};

export const getSimulationsByProfileId = async (
  req: AuthRequest,
  res: Response
) => {
  const { profileId } = req.params;

  try {
    const simulations = await prisma.simulationResult.findMany({
      where: {
        userId: req.user!.id,
        input: {
          profileId: Number(profileId),
        },
      },
      include: { input: true },
      orderBy: { createdAt: "desc" },
    });

    if (simulations.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "해당 이력에 대한 시뮬레이션 결과가 없습니다.",
        data: null,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "시뮬레이션 결과 조회 성공",
      data: simulations.map(formatSimulationResult),
    });
  } catch (error) {
    console.error("시뮬레이션 결과 조회 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "서버 오류",
      data: null,
    });
  }
};