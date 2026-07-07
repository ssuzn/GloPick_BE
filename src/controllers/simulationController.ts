import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { prisma } from "../db";
import {
  generateSimulationResponse,
  getSimpleCityRecommendations,
} from "../services/gptsimulationService";
import { createFlightLinks } from "../utils/flightLinkGenerator";
import { JOB_FIELDS } from "../constants/dropdownOptions";
import { searchFacilities, getCityCenter } from "../services/googleMapsService";
import {
  createSimulationResultData,
  formatSimulationResult,
} from "../utils/simulationMapper";
import { toDepartureAirportEnum, toInitialBudgetEnum, validateSimulationInput } from "../utils/simulationValidator";
const toJobCode = (desiredJob: string) => desiredJob.replace("JOB_", "");

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