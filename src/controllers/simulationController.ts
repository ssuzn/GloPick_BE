import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { prisma } from "../db";
import {
  generateSimulationResponse,
  getSimpleCityRecommendations,
} from "../services/gptsimulationService";
import { createFlightLinks } from "../utils/flightLinkGenerator";
import { JOB_FIELDS, REQUIRED_FACILITIES } from "../constants/dropdownOptions";
import { searchFacilities, getCityCenter } from "../services/googleMapsService";
import { DepartureAirport, InitialBudget } from "../generated/prisma/client";

const toJobCode = (desiredJob: string) => desiredJob.replace("JOB_", "");

const toInitialBudgetEnum = (budget: string): InitialBudget => {
  const map: Record<string, InitialBudget> = {
    "300만~500만원": "BUDGET_300_500",
    "500만~800만원": "BUDGET_500_800",
    "800만~1200만원": "BUDGET_800_1200",
    "1200만~1500만원": "BUDGET_1200_1500",
    "1500만원 이상": "BUDGET_1500_PLUS",
  };

  return map[budget];
};

const toDepartureAirportEnum = (airport: string): DepartureAirport => {
  const map: Record<string, DepartureAirport> = {
    인천국제공항: "ICN",
    김포국제공항: "GMP",
    김해국제공항: "PUS",
    제주국제공항: "CJU",
    청주국제공항: "CJJ",
    대구국제공항: "TAE",
    무안국제공항: "MWX",
  };

  return map[airport];
};

const validateSimulationInput = (
  input: any,
  cityIndex: number,
  initialBudget: string,
  requiredFacilities: string[],
  departureAirport: string
): { isValid: boolean; error?: { code: number; message: string } } => {
  if (
    isNaN(cityIndex) ||
    cityIndex < 0 ||
    cityIndex >= (input.recommendedCities?.length || 0)
  ) {
    return {
      isValid: false,
      error: { code: 400, message: "유효하지 않은 도시 인덱스입니다. (0-2 범위)" },
    };
  }

  if (!initialBudget) {
    return {
      isValid: false,
      error: { code: 400, message: "초기 정착 예산을 입력해주세요." },
    };
  }

  if (!Array.isArray(requiredFacilities) || requiredFacilities.length === 0) {
    return {
      isValid: false,
      error: { code: 400, message: "필요한 시설을 최소 1개 이상 선택해주세요." },
    };
  }

  if (requiredFacilities.length > 5) {
    return {
      isValid: false,
      error: { code: 400, message: "필수 편의시설은 최대 5개까지 선택할 수 있습니다." },
    };
  }

  const validFacilities: string[] = REQUIRED_FACILITIES.map(
    (f) => f.value
  );
  const invalidFacilities = requiredFacilities.filter(
    (f) => !validFacilities.includes(f)
  );

  if (invalidFacilities.length > 0) {
    return {
      isValid: false,
      error: {
        code: 400,
        message: `유효하지 않은 시설: ${invalidFacilities.join(", ")}`,
      },
    };
  }

  if (!departureAirport) {
    return {
      isValid: false,
      error: { code: 400, message: "출발 공항을 선택해주세요." },
    };
  }

  if (!toInitialBudgetEnum(initialBudget)) {
    return {
      isValid: false,
      error: { code: 400, message: "유효하지 않은 예산 범위입니다." },
    };
  }

  if (!toDepartureAirportEnum(departureAirport)) {
    return {
      isValid: false,
      error: { code: 400, message: "유효하지 않은 출발 공항입니다." },
    };
  }

  return { isValid: true };
};

const createSimulationResultData = (
  gptResult: any,
  facilityLocations: any
) => {
  return {
    recommendedCity: gptResult.recommendedCity ?? null,

    essentialFacilities: gptResult.localInfo?.essentialFacilities ?? [],
    publicTransport: gptResult.localInfo?.publicTransport ?? null,
    safetyLevel: gptResult.localInfo?.safetyLevel ?? null,
    climateSummary: gptResult.localInfo?.climateSummary ?? null,
    koreanCommunity: gptResult.localInfo?.koreanCommunity ?? null,
    culturalTips: gptResult.localInfo?.culturalTips ?? null,
    warnings: gptResult.localInfo?.warnings ?? null,

    facilityLocations,

    housing: gptResult.estimatedMonthlyCost?.housing ?? null,
    food: gptResult.estimatedMonthlyCost?.food ?? null,
    transportation: gptResult.estimatedMonthlyCost?.transportation ?? null,
    etc: gptResult.estimatedMonthlyCost?.etc ?? null,
    total: gptResult.estimatedMonthlyCost?.total ?? null,
    oneYearCost: gptResult.estimatedMonthlyCost?.oneYearCost ?? null,
    costCuttingTips: gptResult.estimatedMonthlyCost?.costCuttingTips ?? null,
    cpi: gptResult.estimatedMonthlyCost?.cpi ?? null,

    shortTermHousingOptions:
      gptResult.initialSetup?.shortTermHousingOptions ?? [],
    longTermHousingPlatforms:
      gptResult.initialSetup?.longTermHousingPlatforms ?? [],
    mobilePlan: gptResult.initialSetup?.mobilePlan ?? null,
    bankAccount: gptResult.initialSetup?.bankAccount ?? null,

    jobSearchPlatforms: gptResult.jobReality?.jobSearchPlatforms ?? [],
    languageRequirement: gptResult.jobReality?.languageRequirement ?? null,
    visaLimitationTips: gptResult.jobReality?.visaLimitationTips ?? null,

    koreanPopulationRate:
      gptResult.culturalIntegration?.koreanPopulationRate ?? null,
    foreignResidentRatio:
      gptResult.culturalIntegration?.foreignResidentRatio ?? null,
    koreanResourcesLinks:
      gptResult.culturalIntegration?.koreanResourcesLinks ?? [],
  };
};

const formatSimulationResult = (simulation: any) => {
  return {
    country: simulation.country,
    recommendedCity: simulation.recommendedCity,
    localInfo: {
      essentialFacilities: simulation.essentialFacilities,
      publicTransport: simulation.publicTransport,
      safetyLevel: simulation.safetyLevel,
      climateSummary: simulation.climateSummary,
      koreanCommunity: simulation.koreanCommunity,
      culturalTips: simulation.culturalTips,
      warnings: simulation.warnings,
    },
    facilityLocations: simulation.facilityLocations,
    estimatedMonthlyCost: {
      housing: simulation.housing,
      food: simulation.food,
      transportation: simulation.transportation,
      etc: simulation.etc,
      total: simulation.total,
      oneYearCost: simulation.oneYearCost,
      costCuttingTips: simulation.costCuttingTips,
      cpi: simulation.cpi,
    },
    initialSetup: {
      shortTermHousingOptions: simulation.shortTermHousingOptions,
      longTermHousingPlatforms: simulation.longTermHousingPlatforms,
      mobilePlan: simulation.mobilePlan,
      bankAccount: simulation.bankAccount,
    },
    jobReality: {
      jobSearchPlatforms: simulation.jobSearchPlatforms,
      languageRequirement: simulation.languageRequirement,
      visaLimitationTips: simulation.visaLimitationTips,
    },
    culturalIntegration: {
      koreanPopulationRate: simulation.koreanPopulationRate,
      foreignResidentRatio: simulation.foreignResidentRatio,
      koreanResourcesLinks: simulation.koreanResourcesLinks,
    },
  };
};

export const saveSimulationInput = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      selectedCityIndex,
      initialBudget,
      requiredFacilities,
      departureAirport,
    } = req.body;

    const input = await prisma.simulationInput.findFirst({
      where: {
        id: Number(id),
        userId: req.user!.id,
      },
    });

    if (!input) {
      return res.status(404).json({
        code: 404,
        message: "입력 정보를 찾을 수 없습니다.",
        data: null,
      });
    }

    if (selectedCityIndex === undefined || selectedCityIndex === null) {
      return res.status(400).json({
        code: 400,
        message: "도시 인덱스를 입력해주세요.",
        data: null,
      });
    }

    const cityIndex = Number(selectedCityIndex);

    const validation = validateSimulationInput(
      input,
      cityIndex,
      initialBudget,
      requiredFacilities,
      departureAirport
    );

    if (!validation.isValid) {
      return res.status(validation.error!.code).json({
        code: validation.error!.code,
        message: validation.error!.message,
        data: null,
      });
    }

    const actualSelectedCity = input.recommendedCities[cityIndex];

    const existingInputs = await prisma.simulationInput.findMany({
      where: {
        userId: req.user!.id,
        profileId: input.profileId,
        selectedCountry: input.selectedCountry,
        selectedCity: {
          not: null,
        },
        initialBudget: {
          not: null,
        },
        departureAirport: {
          not: null,
        },
      },
    });

    const sortedRequiredFacilities = [...requiredFacilities].sort().join(",");

    const existingInput = existingInputs.find((existing) => {
      const sortedExisting = [...(existing.requiredFacilities || [])]
        .sort()
        .join(",");

      return (
        existing.selectedCity === actualSelectedCity &&
        existing.initialBudget === toInitialBudgetEnum(initialBudget) &&
        existing.departureAirport === toDepartureAirportEnum(departureAirport) &&
        sortedExisting === sortedRequiredFacilities
      );
    });

    if (existingInput) {
      const existingSimulation = await prisma.simulationResult.findFirst({
        where: {
          inputId: existingInput.id,
          userId: req.user!.id,
        },
      });

      if (existingSimulation) {
        const flightLinks = createFlightLinks(
          departureAirport,
          existingInput.selectedCity as string
        );

        return res.status(200).json({
          code: 200,
          message: "이미 동일한 조건으로 시뮬레이션이 생성되어 있습니다.",
          data: {
            isExisting: true,
            inputId: existingInput.id,
            simulationId: existingSimulation.id,
            result: formatSimulationResult(existingSimulation),
            flightLinks,
          },
        });
      }
    }

    const updatedInput = await prisma.simulationInput.update({
      where: {
        id: input.id,
      },
      data: {
        selectedCity: actualSelectedCity,
        initialBudget: toInitialBudgetEnum(initialBudget),
        requiredFacilities,
        departureAirport: toDepartureAirportEnum(departureAirport),
      },
    });

    const gptResult = await generateSimulationResponse(updatedInput as any);
    const arrivalAirportCode =
      gptResult?.nearestAirport?.code || actualSelectedCity;

    const flightLinks = createFlightLinks(departureAirport, arrivalAirportCode);

    let facilityLocations = {};

    if (updatedInput.requiredFacilities.length > 0) {
      try {
        facilityLocations = await searchFacilities(
          actualSelectedCity,
          updatedInput.selectedCountry,
          updatedInput.requiredFacilities
        );
      } catch (error) {
        console.error("Google Maps API 호출 실패:", error);
      }
    }

    const saved = await prisma.simulationResult.create({
      data: {
        userId: req.user!.id,
        inputId: updatedInput.id,
        country: updatedInput.selectedCountry,
        ...createSimulationResultData(gptResult, facilityLocations),
      },
    });

    const userProfile = await prisma.userProfile.findFirst({
      where: {
        id: updatedInput.profileId,
        userId: req.user!.id,
      },
    });

    const jobCode = userProfile?.desiredJob
      ? toJobCode(userProfile.desiredJob)
      : "2";

    const jobField =
      JOB_FIELDS.find((field) => field.code === jobCode) || JOB_FIELDS[1];

    const desiredJob = jobField.nameKo;

    const isAlreadyExist = await prisma.simulationList.findFirst({
      where: {
        userId: req.user!.id,
        job: desiredJob,
        country: updatedInput.selectedCountry,
        city: actualSelectedCity,
      },
    });

    if (!isAlreadyExist) {
      await prisma.simulationList.create({
        data: {
          userId: req.user!.id,
          job: desiredJob,
          country: updatedInput.selectedCountry,
          city: actualSelectedCity,
        },
      });
    }

    return res.status(201).json({
      code: 201,
      message: "시뮬레이션 입력 및 생성 완료",
      data: {
        isExisting: false,
        inputId: updatedInput.id,
        simulationId: saved.id,
        result: formatSimulationResult(saved),
        flightLinks,
      },
    });
  } catch (error) {
    console.error("시뮬레이션 입력 및 생성 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "시뮬레이션 생성 실패",
      data: null,
    });
  }
};

export const recommendCities = async (req: AuthRequest, res: Response) => {
  const { recommendationId, profileId } = req.params;
  const { selectedCountryIndex } = req.body;

  try {
    const recommendation = await prisma.countryRecommendationResult.findFirst({
      where: {
        id: Number(recommendationId),
        userId: req.user!.id,
        profileId: Number(profileId),
      },
      include: {
        recommendations: {
          orderBy: {
            rank: "asc",
          },
        },
      },
    });

    if (!recommendation) {
      return res.status(404).json({
        code: 404,
        message: "추천 결과를 찾을 수 없습니다.",
        data: null,
      });
    }

    if (
      selectedCountryIndex < 0 ||
      selectedCountryIndex >= recommendation.recommendations.length
    ) {
      return res.status(400).json({
        code: 400,
        message: "유효하지 않은 국가 인덱스입니다.",
        data: null,
      });
    }

    const selectedCountry =
      recommendation.recommendations[selectedCountryIndex].country;

    const existingInput = await prisma.simulationInput.findFirst({
      where: {
        userId: req.user!.id,
        profileId: Number(profileId),
        selectedCountry,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingInput) {
      return res.status(409).json({
        code: 409,
        message: "이미 해당 국가에 대한 도시 추천을 받았습니다.",
        data: {
          isExisting: true,
          inputId: existingInput.id,
          selectedCountry: existingInput.selectedCountry,
          recommendedCities: existingInput.recommendedCities,
        },
      });
    }

    const profile = await prisma.userProfile.findFirst({
      where: {
        id: Number(profileId),
        userId: req.user!.id,
      },
    });

    if (!profile) {
      return res.status(404).json({
        code: 404,
        message: "프로필을 찾을 수 없습니다.",
        data: null,
      });
    }

    const jobCode = toJobCode(profile.desiredJob);
    const jobField =
      JOB_FIELDS.find((field) => field.code === jobCode) || JOB_FIELDS[1];

    const userJob = jobField.nameKo;
    const userLanguage = profile.language;

    const cityRecommendations = await getSimpleCityRecommendations(
      selectedCountry,
      userJob || undefined,
      userLanguage || undefined
    );

    const newInput = await prisma.simulationInput.create({
      data: {
        userId: req.user!.id,
        profileId: Number(profileId),
        selectedCountry,
        recommendedCities: cityRecommendations.map((city: any) => city.name),
        requiredFacilities: [],
      },
    });

    return res.status(200).json({
      code: 200,
      message: "도시 추천 성공",
      data: {
        isExisting: false,
        inputId: newInput.id,
        selectedCountry,
        recommendedCities: cityRecommendations,
      },
    });
  } catch (error) {
    console.error("도시 추천 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "GPT 호출 실패",
      data: null,
    });
  }
};

export const generateAndSaveSimulation = async (
  req: AuthRequest,
  res: Response
) => {
  const { id } = req.params;

  try {
    const input = await prisma.simulationInput.findFirst({
      where: {
        id: Number(id),
        userId: req.user!.id,
      },
    });

    if (!input || !Array.isArray(input.recommendedCities)) {
      return res.status(404).json({
        code: 404,
        message: "입력 정보 또는 추천 도시 목록을 찾을 수 없습니다.",
        data: null,
      });
    }

    const existing = await prisma.simulationResult.findFirst({
      where: {
        inputId: input.id,
        userId: req.user!.id,
      },
    });

    if (existing) {
      return res.status(200).json({
        code: 200,
        message: "이미 생성된 시뮬레이션입니다.",
        data: {
          simulationId: existing.id,
          result: formatSimulationResult(existing),
          flightLinks: createFlightLinks(
            input.departureAirport as string,
            input.selectedCity as string
          ),
        },
      });
    }

    if (!input.selectedCity || !input.initialBudget) {
      return res.status(400).json({
        code: 400,
        message: "선택 도시 또는 초기 예산 정보가 없습니다.",
        data: null,
      });
    }

    if (!input.requiredFacilities || input.requiredFacilities.length === 0) {
      return res.status(400).json({
        code: 400,
        message: "필요한 시설 정보가 없습니다.",
        data: null,
      });
    }

    if (!input.departureAirport) {
      return res.status(400).json({
        code: 400,
        message: "출발 공항 정보가 없습니다.",
        data: null,
      });
    }

    const selectedCity = input.selectedCity;

    const gptResult = await generateSimulationResponse(input as any);
    const arrivalAirportCode = gptResult?.nearestAirport?.code || selectedCity;

    const flightLinks = createFlightLinks(
      input.departureAirport as string,
      arrivalAirportCode
    );

    let facilityLocations = {};

    try {
      facilityLocations = await searchFacilities(
        selectedCity,
        input.selectedCountry,
        input.requiredFacilities
      );
    } catch (error) {
      console.error("Google Maps API 호출 실패:", error);
    }

    const saved = await prisma.simulationResult.create({
      data: {
        userId: req.user!.id,
        inputId: input.id,
        country: input.selectedCountry,
        ...createSimulationResultData(gptResult, facilityLocations),
      },
    });

    return res.status(201).json({
      code: 201,
      message: "시뮬레이션 생성 및 저장 완료",
      data: {
        simulationId: saved.id,
        result: formatSimulationResult(saved),
        flightLinks,
      },
    });
  } catch (error) {
    console.error("시뮬레이션 생성 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "GPT 호출 또는 저장 실패",
      data: null,
    });
  }
};

export const getSimulationFlightLinks = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const simulation = await prisma.simulationInput.findFirst({
      where: {
        id: Number(id),
        userId: req.user!.id,
      },
    });

    if (!simulation) {
      return res.status(404).json({
        code: 404,
        message: "시뮬레이션 입력 정보를 찾을 수 없습니다.",
        data: null,
      });
    }

    if (!simulation.departureAirport || !simulation.selectedCity) {
      return res.status(400).json({
        code: 400,
        message: "출발 공항 또는 선택 도시 정보가 없습니다.",
        data: null,
      });
    }

    const flightLinks = createFlightLinks(
      simulation.departureAirport,
      simulation.selectedCity
    );

    return res.status(200).json({
      code: 200,
      message: "항공권 링크 생성 완료",
      data: {
        simulation: {
          id: simulation.id,
          departureAirport: simulation.departureAirport,
          selectedCity: simulation.selectedCity,
        },
        flightLinks,
      },
    });
  } catch (error) {
    console.error("항공권 링크 생성 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "서버 오류",
      data: null,
    });
  }
};

export const getSimulationList = async (req: AuthRequest, res: Response) => {
  try {
    const simulations = await prisma.simulationList.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      code: 200,
      message: "시뮬레이션 요약 조회 성공",
      data: simulations,
    });
  } catch (error) {
    console.error("시뮬레이션 요약 조회 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "시뮬레이션 요약 조회 실패",
    });
  }
};

export const testGoogleMaps = async (req: Request, res: Response) => {
  try {
    const { city, country, facilities } = req.body;

    if (!city || !country || !facilities || !Array.isArray(facilities)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "city, country, facilities(배열)가 필요합니다.",
        data: null,
      });
    }

    const mapCenter = await getCityCenter(city, country);
    const facilityLocations = await searchFacilities(city, country, facilities);

    return res.status(200).json({
      success: true,
      code: 200,
      message: "Google Maps API 테스트 성공",
      data: {
        mapCenter,
        facilityLocations,
        summary: {
          city,
          country,
          facilitiesSearched: facilities.length,
          totalLocationsFound: Object.values(facilityLocations).reduce(
            (sum: number, arr: any) => sum + arr.length,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("❌ Google Maps API 테스트 실패:", error);
    return res.status(500).json({
      success: false,
      code: 500,
      message: "Google Maps API 호출 중 오류가 발생했습니다.",
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};